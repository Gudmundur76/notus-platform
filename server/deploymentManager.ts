/**
 * Deployment Manager Module
 * Handles deployment configurations and exports for external platforms
 */

import { getDb } from "./db";
import { deploymentConfigs, InsertDeploymentConfig } from "../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";
import { logEvent } from "./monitoring";

export type DeploymentPlatform = "vercel" | "railway" | "render" | "docker" | "aws" | "gcp" | "custom";
export type DeploymentStatus = "draft" | "ready" | "deployed" | "failed";

interface VercelConfig {
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  nodeVersion: string;
}

interface RailwayConfig {
  buildCommand: string;
  startCommand: string;
  healthcheckPath: string;
  restartPolicyType: string;
}

interface RenderConfig {
  buildCommand: string;
  startCommand: string;
  healthCheckPath: string;
  envVarsFromGroups: string[];
}

interface DockerConfig {
  baseImage: string;
  exposePort: number;
  buildArgs: Record<string, string>;
  healthCheck: string;
}

interface AWSConfig {
  service: "ecs" | "lambda" | "ec2" | "lightsail";
  region: string;
  instanceType?: string;
  memorySize?: number;
}

interface GCPConfig {
  service: "cloud-run" | "app-engine" | "compute";
  region: string;
  memory?: string;
  cpu?: string;
}

type PlatformConfig = VercelConfig | RailwayConfig | RenderConfig | DockerConfig | AWSConfig | GCPConfig | Record<string, unknown>;

/**
 * Create a new deployment configuration
 */
export async function createDeploymentConfig(params: {
  userId: number;
  name: string;
  platform: DeploymentPlatform;
  config: PlatformConfig;
  envVars?: Record<string, string>;
}): Promise<typeof deploymentConfigs.$inferSelect> {
  const deployment: InsertDeploymentConfig = {
    userId: params.userId,
    name: params.name,
    platform: params.platform,
    config: JSON.stringify(params.config),
    envVars: params.envVars ? JSON.stringify(params.envVars) : null,
    status: "draft",
  };

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(deploymentConfigs).values(deployment).$returningId();
  
  logEvent({
    userId: params.userId,
    eventType: "task_started",
    source: "deployment-manager",
    message: `Deployment config "${params.name}" created for ${params.platform}`,
    metadata: { deploymentId: result.id, platform: params.platform }
  });

  return (await db.select().from(deploymentConfigs).where(eq(deploymentConfigs.id, result.id)))[0];
}

/**
 * Get deployment configurations for a user
 */
export async function getUserDeployments(userId: number): Promise<typeof deploymentConfigs.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(deploymentConfigs)
    .where(eq(deploymentConfigs.userId, userId))
    .orderBy(desc(deploymentConfigs.updatedAt));
}

/**
 * Get a specific deployment configuration
 */
export async function getDeploymentConfig(params: {
  deploymentId: number;
  userId: number;
}): Promise<typeof deploymentConfigs.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select()
    .from(deploymentConfigs)
    .where(and(
      eq(deploymentConfigs.id, params.deploymentId),
      eq(deploymentConfigs.userId, params.userId)
    ));
  
  return results[0] ?? null;
}

/**
 * Update deployment configuration
 */
export async function updateDeploymentConfig(params: {
  deploymentId: number;
  userId: number;
  name?: string;
  config?: PlatformConfig;
  envVars?: Record<string, string>;
  status?: DeploymentStatus;
  deploymentUrl?: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: Partial<InsertDeploymentConfig> = {};
  
  if (params.name) updates.name = params.name;
  if (params.config) updates.config = JSON.stringify(params.config);
  if (params.envVars) updates.envVars = JSON.stringify(params.envVars);
  if (params.status) updates.status = params.status;
  if (params.deploymentUrl) updates.deploymentUrl = params.deploymentUrl;
  if (params.status === "deployed") {
    updates.lastDeployedAt = new Date();
  }

  const result = await db.update(deploymentConfigs)
    .set(updates)
    .where(and(
      eq(deploymentConfigs.id, params.deploymentId),
      eq(deploymentConfigs.userId, params.userId)
    ));

  return (result as any).affectedRows > 0;
}

/**
 * Delete deployment configuration
 */
export async function deleteDeploymentConfig(params: {
  deploymentId: number;
  userId: number;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(deploymentConfigs)
    .where(and(
      eq(deploymentConfigs.id, params.deploymentId),
      eq(deploymentConfigs.userId, params.userId)
    ));

  return (result as any).affectedRows > 0;
}

/**
 * Generate Vercel configuration
 */
export function generateVercelConfig(projectPath: string): { vercelJson: string; readme: string } {
  const config = {
    version: 2,
    builds: [
      {
        src: "package.json",
        use: "@vercel/node"
      }
    ],
    routes: [
      {
        src: "/api/(.*)",
        dest: "/api/$1"
      },
      {
        src: "/(.*)",
        dest: "/index.html"
      }
    ],
    env: {
      NODE_ENV: "production"
    }
  };

  const readme = `# Vercel Deployment

## Steps to Deploy

1. Install Vercel CLI:
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. Login to Vercel:
   \`\`\`bash
   vercel login
   \`\`\`

3. Deploy:
   \`\`\`bash
   cd ${projectPath}
   vercel --prod
   \`\`\`

## Environment Variables

Set these in Vercel Dashboard > Project Settings > Environment Variables:
- DATABASE_URL
- JWT_SECRET
- Any API keys your project uses

## Custom Domain

1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
`;

  return {
    vercelJson: JSON.stringify(config, null, 2),
    readme
  };
}

/**
 * Generate Railway configuration
 */
export function generateRailwayConfig(): { railwayJson: string; readme: string } {
  const config = {
    build: {
      builder: "NIXPACKS",
      buildCommand: "pnpm build"
    },
    deploy: {
      startCommand: "node dist/index.js",
      healthcheckPath: "/api/health",
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10
    }
  };

  const readme = `# Railway Deployment

## Steps to Deploy

1. Create a Railway account at https://railway.app

2. Install Railway CLI:
   \`\`\`bash
   npm i -g @railway/cli
   \`\`\`

3. Login:
   \`\`\`bash
   railway login
   \`\`\`

4. Initialize project:
   \`\`\`bash
   railway init
   \`\`\`

5. Add a database:
   \`\`\`bash
   railway add
   \`\`\`
   Select MySQL or PostgreSQL

6. Deploy:
   \`\`\`bash
   railway up
   \`\`\`

## Environment Variables

Railway auto-injects DATABASE_URL for linked databases.
Add other variables in Railway Dashboard > Variables.
`;

  return {
    railwayJson: JSON.stringify(config, null, 2),
    readme
  };
}

/**
 * Generate Render configuration
 */
export function generateRenderConfig(): { renderYaml: string; readme: string } {
  const config = {
    services: [
      {
        type: "web",
        name: "notus-platform",
        env: "node",
        buildCommand: "pnpm install && pnpm build",
        startCommand: "node dist/index.js",
        healthCheckPath: "/api/health",
        envVars: [
          { key: "NODE_ENV", value: "production" }
        ]
      }
    ],
    databases: [
      {
        name: "notus-db",
        databaseName: "notus",
        user: "notus"
      }
    ]
  };

  const readme = `# Render Deployment

## Steps to Deploy

1. Create a Render account at https://render.com

2. Connect your GitHub repository

3. Create a new Web Service:
   - Select your repository
   - Choose "Node" environment
   - Build Command: \`pnpm install && pnpm build\`
   - Start Command: \`node dist/index.js\`

4. Add a PostgreSQL database:
   - Create new PostgreSQL
   - Copy the Internal Database URL

5. Set Environment Variables:
   - DATABASE_URL (from step 4)
   - JWT_SECRET
   - Other API keys

6. Deploy automatically on push to main branch
`;

  return {
    renderYaml: JSON.stringify(config, null, 2),
    readme
  };
}

/**
 * Generate Dockerfile
 */
export function generateDockerConfig(params: {
  nodeVersion?: string;
  port?: number;
}): { dockerfile: string; dockerCompose: string; readme: string } {
  const nodeVersion = params.nodeVersion ?? "22";
  const port = params.port ?? 3000;

  const dockerfile = `# Build stage
FROM node:${nodeVersion}-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:${nodeVersion}-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set environment
ENV NODE_ENV=production
ENV PORT=${port}

# Expose port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${port}/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
`;

  const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - JWT_SECRET=\${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=\${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=notus
      - MYSQL_USER=notus
      - MYSQL_PASSWORD=\${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db_data:
`;

  const readme = `# Docker Deployment

## Build and Run Locally

1. Build the image:
   \`\`\`bash
   docker build -t notus-platform .
   \`\`\`

2. Run with Docker Compose:
   \`\`\`bash
   # Create .env file with your secrets
   echo "DATABASE_URL=mysql://..." > .env
   echo "JWT_SECRET=your-secret" >> .env
   
   docker-compose up -d
   \`\`\`

## Deploy to Container Registry

1. Tag the image:
   \`\`\`bash
   docker tag notus-platform your-registry/notus-platform:latest
   \`\`\`

2. Push to registry:
   \`\`\`bash
   docker push your-registry/notus-platform:latest
   \`\`\`

## Deploy to Cloud

### AWS ECS
\`\`\`bash
aws ecs create-service --cluster your-cluster --service-name notus --task-definition notus-task
\`\`\`

### Google Cloud Run
\`\`\`bash
gcloud run deploy notus --image your-registry/notus-platform:latest --platform managed
\`\`\`

### Azure Container Instances
\`\`\`bash
az container create --resource-group myResourceGroup --name notus --image your-registry/notus-platform:latest
\`\`\`
`;

  return { dockerfile, dockerCompose, readme };
}

/**
 * Generate complete deployment package
 */
export async function generateDeploymentPackage(params: {
  userId: number;
  deploymentId: number;
}): Promise<{
  platform: DeploymentPlatform;
  files: { name: string; content: string }[];
  instructions: string;
} | null> {
  const deployment = await getDeploymentConfig(params);
  if (!deployment) return null;

  const files: { name: string; content: string }[] = [];
  let instructions = "";

  switch (deployment.platform) {
    case "vercel": {
      const { vercelJson, readme } = generateVercelConfig("/app");
      files.push({ name: "vercel.json", content: vercelJson });
      instructions = readme;
      break;
    }
    case "railway": {
      const { railwayJson, readme } = generateRailwayConfig();
      files.push({ name: "railway.json", content: railwayJson });
      instructions = readme;
      break;
    }
    case "render": {
      const { renderYaml, readme } = generateRenderConfig();
      files.push({ name: "render.yaml", content: renderYaml });
      instructions = readme;
      break;
    }
    case "docker": {
      const config = JSON.parse(deployment.config);
      const { dockerfile, dockerCompose, readme } = generateDockerConfig({
        nodeVersion: config.nodeVersion,
        port: config.port
      });
      files.push({ name: "Dockerfile", content: dockerfile });
      files.push({ name: "docker-compose.yml", content: dockerCompose });
      instructions = readme;
      break;
    }
    default:
      instructions = "Custom deployment configuration. Please refer to your platform's documentation.";
  }

  // Update status to ready
  await updateDeploymentConfig({
    deploymentId: params.deploymentId,
    userId: params.userId,
    status: "ready"
  });

  logEvent({
    userId: params.userId,
    eventType: "task_completed",
    source: "deployment-manager",
    message: `Deployment package generated for ${deployment.platform}`,
    metadata: { deploymentId: params.deploymentId, fileCount: files.length }
  });

  return {
    platform: deployment.platform as DeploymentPlatform,
    files,
    instructions
  };
}

/**
 * Get deployment templates for quick setup
 */
export function getDeploymentTemplates(): {
  platform: DeploymentPlatform;
  name: string;
  description: string;
  defaultConfig: PlatformConfig;
}[] {
  return [
    {
      platform: "vercel",
      name: "Vercel (Recommended)",
      description: "Zero-config deployments with automatic HTTPS and global CDN",
      defaultConfig: {
        framework: "vite",
        buildCommand: "pnpm build",
        outputDirectory: "dist",
        installCommand: "pnpm install",
        nodeVersion: "22.x"
      }
    },
    {
      platform: "railway",
      name: "Railway",
      description: "Simple deployments with built-in databases and easy scaling",
      defaultConfig: {
        buildCommand: "pnpm build",
        startCommand: "node dist/index.js",
        healthcheckPath: "/api/health",
        restartPolicyType: "ON_FAILURE"
      }
    },
    {
      platform: "render",
      name: "Render",
      description: "Unified cloud for web services, databases, and cron jobs",
      defaultConfig: {
        buildCommand: "pnpm install && pnpm build",
        startCommand: "node dist/index.js",
        healthCheckPath: "/api/health",
        envVarsFromGroups: []
      }
    },
    {
      platform: "docker",
      name: "Docker",
      description: "Containerized deployment for any cloud or on-premise infrastructure",
      defaultConfig: {
        baseImage: "node:22-alpine",
        exposePort: 3000,
        buildArgs: {},
        healthCheck: "/api/health"
      }
    },
    {
      platform: "aws",
      name: "AWS",
      description: "Deploy to Amazon Web Services (ECS, Lambda, or EC2)",
      defaultConfig: {
        service: "ecs",
        region: "us-east-1",
        instanceType: "t3.micro"
      }
    },
    {
      platform: "gcp",
      name: "Google Cloud",
      description: "Deploy to Google Cloud Platform (Cloud Run or App Engine)",
      defaultConfig: {
        service: "cloud-run",
        region: "us-central1",
        memory: "512Mi",
        cpu: "1"
      }
    }
  ];
}
