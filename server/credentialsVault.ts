/**
 * Credentials Vault Module
 * Secure encrypted storage for API keys, tokens, and other secrets
 */

import { getDb } from "./db";
import { 
  credentialsVault, 
  credentialAccessLogs,
  InsertCredentialVault,
  InsertCredentialAccessLog 
} from "../drizzle/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import * as crypto from "crypto";
import { logEvent } from "./monitoring";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or generate a secure one
function getEncryptionKey(): Buffer {
  const envKey = process.env.VAULT_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (envKey) {
    // Use SHA-256 to derive a consistent 32-byte key
    return crypto.createHash("sha256").update(envKey).digest();
  }
  throw new Error("No encryption key available. Set VAULT_ENCRYPTION_KEY or JWT_SECRET.");
}

/**
 * Encrypt a value using AES-256-GCM
 */
function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const authTag = cipher.getAuthTag();
  
  // Combine encrypted data with auth tag
  const combined = Buffer.concat([
    Buffer.from(encrypted, "base64"),
    authTag
  ]).toString("base64");
  
  return {
    encrypted: combined,
    iv: iv.toString("hex")
  };
}

/**
 * Decrypt a value using AES-256-GCM
 */
function decrypt(encryptedData: string, ivHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  
  const combined = Buffer.from(encryptedData, "base64");
  const authTag = combined.slice(-AUTH_TAG_LENGTH);
  const encrypted = combined.slice(0, -AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString("utf8");
}

export type CredentialCategory = "api_key" | "oauth_token" | "database" | "service" | "other";

/**
 * Store a new credential
 */
export async function storeCredential(params: {
  userId: number;
  name: string;
  category: CredentialCategory;
  value: string;
  description?: string;
  serviceUrl?: string;
  expiresAt?: Date;
  rotationReminderDays?: number;
}): Promise<{ id: number; name: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { encrypted, iv } = encrypt(params.value);
  
  const credential: InsertCredentialVault = {
    userId: params.userId,
    name: params.name,
    category: params.category,
    encryptedValue: encrypted,
    encryptionIv: iv,
    description: params.description ?? null,
    serviceUrl: params.serviceUrl ?? null,
    expiresAt: params.expiresAt ?? null,
    rotationReminder: params.rotationReminderDays ?? 90,
    isActive: 1,
  };

  const [result] = await db.insert(credentialsVault).values(credential).$returningId();
  
  // Log the creation
  await logCredentialAccess({
    credentialId: result.id,
    userId: params.userId,
    action: "update",
  });

  logEvent({
    userId: params.userId,
    eventType: "credential_access",
    source: "credentials-vault",
    message: `Credential "${params.name}" stored`,
    metadata: { credentialId: result.id, category: params.category }
  });

  return { id: result.id, name: params.name };
}

/**
 * Retrieve a credential (decrypted)
 */
export async function getCredential(params: {
  credentialId: number;
  userId: number;
  taskId?: number;
}): Promise<{ name: string; value: string; category: CredentialCategory } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select()
    .from(credentialsVault)
    .where(and(
      eq(credentialsVault.id, params.credentialId),
      eq(credentialsVault.userId, params.userId),
      eq(credentialsVault.isActive, 1)
    ));

  if (results.length === 0) {
    return null;
  }

  const credential = results[0];
  
  // Decrypt the value
  const decryptedValue = decrypt(credential.encryptedValue, credential.encryptionIv);
  
  // Update last used timestamp
  await db.update(credentialsVault)
    .set({ lastUsedAt: new Date() })
    .where(eq(credentialsVault.id, params.credentialId));

  // Log the access
  await logCredentialAccess({
    credentialId: params.credentialId,
    userId: params.userId,
    action: "use",
    taskId: params.taskId,
  });

  return {
    name: credential.name,
    value: decryptedValue,
    category: credential.category as CredentialCategory
  };
}

/**
 * List credentials for a user (without decrypted values)
 */
export async function listCredentials(userId: number): Promise<{
  id: number;
  name: string;
  category: CredentialCategory;
  description: string | null;
  serviceUrl: string | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  rotationReminder: number | null;
  createdAt: Date;
}[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select({
    id: credentialsVault.id,
    name: credentialsVault.name,
    category: credentialsVault.category,
    description: credentialsVault.description,
    serviceUrl: credentialsVault.serviceUrl,
    lastUsedAt: credentialsVault.lastUsedAt,
    expiresAt: credentialsVault.expiresAt,
    rotationReminder: credentialsVault.rotationReminder,
    createdAt: credentialsVault.createdAt,
  })
    .from(credentialsVault)
    .where(and(
      eq(credentialsVault.userId, userId),
      eq(credentialsVault.isActive, 1)
    ))
    .orderBy(desc(credentialsVault.updatedAt));

  return results as any;
}

/**
 * Update a credential
 */
export async function updateCredential(params: {
  credentialId: number;
  userId: number;
  name?: string;
  value?: string;
  description?: string;
  serviceUrl?: string;
  expiresAt?: Date;
  rotationReminderDays?: number;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify ownership
  const existing = await db.select()
    .from(credentialsVault)
    .where(and(
      eq(credentialsVault.id, params.credentialId),
      eq(credentialsVault.userId, params.userId)
    ));

  if (existing.length === 0) {
    return false;
  }

  const updates: Partial<InsertCredentialVault> = {};
  
  if (params.name) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.serviceUrl !== undefined) updates.serviceUrl = params.serviceUrl;
  if (params.expiresAt !== undefined) updates.expiresAt = params.expiresAt;
  if (params.rotationReminderDays !== undefined) updates.rotationReminder = params.rotationReminderDays;
  
  if (params.value) {
    const { encrypted, iv } = encrypt(params.value);
    updates.encryptedValue = encrypted;
    updates.encryptionIv = iv;
  }

  await db.update(credentialsVault)
    .set(updates)
    .where(eq(credentialsVault.id, params.credentialId));

  // Log the update
  await logCredentialAccess({
    credentialId: params.credentialId,
    userId: params.userId,
    action: "update",
  });

  logEvent({
    userId: params.userId,
    eventType: "credential_access",
    source: "credentials-vault",
    message: `Credential updated`,
    metadata: { credentialId: params.credentialId }
  });

  return true;
}

/**
 * Delete (deactivate) a credential
 */
export async function deleteCredential(params: {
  credentialId: number;
  userId: number;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(credentialsVault)
    .set({ isActive: 0 })
    .where(and(
      eq(credentialsVault.id, params.credentialId),
      eq(credentialsVault.userId, params.userId)
    ));

  if ((result as any).affectedRows > 0) {
    await logCredentialAccess({
      credentialId: params.credentialId,
      userId: params.userId,
      action: "delete",
    });

    logEvent({
      userId: params.userId,
      eventType: "credential_access",
      source: "credentials-vault",
      message: `Credential deleted`,
      metadata: { credentialId: params.credentialId }
    });

    return true;
  }

  return false;
}

/**
 * Rotate a credential (update value and log rotation)
 */
export async function rotateCredential(params: {
  credentialId: number;
  userId: number;
  newValue: string;
}): Promise<boolean> {
  const success = await updateCredential({
    credentialId: params.credentialId,
    userId: params.userId,
    value: params.newValue,
  });

  if (success) {
    await logCredentialAccess({
      credentialId: params.credentialId,
      userId: params.userId,
      action: "rotate",
    });

    logEvent({
      userId: params.userId,
      eventType: "credential_access",
      source: "credentials-vault",
      message: `Credential rotated`,
      metadata: { credentialId: params.credentialId }
    });
  }

  return success;
}

/**
 * Log credential access for audit trail
 */
async function logCredentialAccess(params: {
  credentialId: number;
  userId: number;
  action: "view" | "use" | "update" | "delete" | "rotate";
  taskId?: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const log: InsertCredentialAccessLog = {
    credentialId: params.credentialId,
    userId: params.userId,
    action: params.action,
    taskId: params.taskId ?? null,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  };

  await db.insert(credentialAccessLogs).values(log);
}

/**
 * Get access logs for a credential
 */
export async function getCredentialAccessLogs(params: {
  credentialId: number;
  userId: number;
  limit?: number;
}): Promise<typeof credentialAccessLogs.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Verify ownership first
  const credential = await db.select()
    .from(credentialsVault)
    .where(and(
      eq(credentialsVault.id, params.credentialId),
      eq(credentialsVault.userId, params.userId)
    ));

  if (credential.length === 0) {
    return [];
  }

  return db.select()
    .from(credentialAccessLogs)
    .where(eq(credentialAccessLogs.credentialId, params.credentialId))
    .orderBy(desc(credentialAccessLogs.createdAt))
    .limit(params.limit ?? 100);
}

/**
 * Get credentials that need rotation
 */
export async function getCredentialsNeedingRotation(userId: number): Promise<{
  id: number;
  name: string;
  category: CredentialCategory;
  daysSinceUpdate: number;
  rotationReminder: number;
}[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select()
    .from(credentialsVault)
    .where(and(
      eq(credentialsVault.userId, userId),
      eq(credentialsVault.isActive, 1)
    ));

  const now = new Date();
  return results
    .map(cred => {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - cred.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: cred.id,
        name: cred.name,
        category: cred.category as CredentialCategory,
        daysSinceUpdate,
        rotationReminder: cred.rotationReminder ?? 90
      };
    })
    .filter(cred => cred.daysSinceUpdate >= cred.rotationReminder);
}

/**
 * Get expiring credentials
 */
export async function getExpiringCredentials(params: {
  userId: number;
  daysUntilExpiry?: number;
}): Promise<{
  id: number;
  name: string;
  category: CredentialCategory;
  expiresAt: Date;
  daysUntilExpiry: number;
}[]> {
  const db = await getDb();
  if (!db) return [];
  
  const daysThreshold = params.daysUntilExpiry ?? 30;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const results = await db.select()
    .from(credentialsVault)
    .where(and(
      eq(credentialsVault.userId, params.userId),
      eq(credentialsVault.isActive, 1),
      sql`${credentialsVault.expiresAt} IS NOT NULL`,
      sql`${credentialsVault.expiresAt} <= ${thresholdDate}`
    ));

  const now = new Date();
  return results.map(cred => ({
    id: cred.id,
    name: cred.name,
    category: cred.category as CredentialCategory,
    expiresAt: cred.expiresAt!,
    daysUntilExpiry: Math.ceil(
      (cred.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
  }));
}

/**
 * Inject credentials into environment for task execution
 */
export async function injectCredentialsForTask(params: {
  userId: number;
  taskId: number;
  credentialIds: number[];
}): Promise<Record<string, string>> {
  const env: Record<string, string> = {};

  for (const credentialId of params.credentialIds) {
    const credential = await getCredential({
      credentialId,
      userId: params.userId,
      taskId: params.taskId
    });

    if (credential) {
      // Convert name to environment variable format
      const envKey = credential.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .replace(/_+/g, "_");
      
      env[envKey] = credential.value;
    }
  }

  return env;
}
