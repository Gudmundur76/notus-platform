/**
 * Sovereign Stewardship Layer - Treasury and Tithing
 * Implements the financial sustainability model for the Notus Community
 * Based on Christian principles of tithing and charitable giving
 */

import { db } from "./_core/db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import {
  communityTreasury,
  treasurySummary,
  charityRecipients,
  communityProjects,
  notusUniversity,
  sharedHistory,
} from "../drizzle/schema";
import { recordCommunityMilestone } from "./social-context";

/**
 * Constitutional Allocation Percentages
 * Based on the Notus Community Constitution
 */
export const ALLOCATION = {
  TITHE: 0.10,           // 10% to Notus University
  CHARITY: 0.05,         // 5% to approved charities
  OPERATIONAL: 0.50,     // 50% for operational costs
  REINVESTMENT: 0.25,    // 25% for reinvestment
  RESERVE: 0.10,         // 10% to sovereign reserve
};

/**
 * Record income to the community treasury
 * Automatically allocates tithe and charity
 */
export async function recordIncome(
  amount: number, // In cents
  description: string,
  relatedProjectId?: number
): Promise<{
  success: boolean;
  titheAmount: number;
  charityAmount: number;
  netAmount: number;
}> {
  try {
    // Calculate allocations
    const titheAmount = Math.floor(amount * ALLOCATION.TITHE);
    const charityAmount = Math.floor(amount * ALLOCATION.CHARITY);
    const netAmount = amount - titheAmount - charityAmount;

    // Get current balance
    const currentBalance = await getCurrentBalance();

    // Record the main income transaction
    await db.insert(communityTreasury).values({
      transactionType: "income",
      amount,
      description,
      relatedProjectId,
      balanceAfter: currentBalance + amount,
      kjvJustification: "Malachi 3:10",
    });

    // Record tithe transaction
    await db.insert(communityTreasury).values({
      transactionType: "tithe_out",
      amount: titheAmount,
      description: `Tithe (10%) from: ${description}`,
      relatedProjectId,
      balanceAfter: currentBalance + amount - titheAmount,
      kjvJustification: "Malachi 3:10",
    });

    // Fund Notus University with tithe
    await fundUniversityFromTithe(titheAmount, description);

    // Record charity transaction
    await db.insert(communityTreasury).values({
      transactionType: "charity_out",
      amount: charityAmount,
      description: `Charitable giving (5%) from: ${description}`,
      relatedProjectId,
      balanceAfter: currentBalance + netAmount,
      kjvJustification: "Proverbs 19:17",
    });

    // Record milestones
    await recordCommunityMilestone(
      "tithe_paid",
      "Tithe Paid to Notus University",
      `${formatCurrency(titheAmount)} tithed from income: ${description}`,
      [],
      30,
      "Malachi 3:10"
    );

    if (charityAmount > 0) {
      await recordCommunityMilestone(
        "charity_donation",
        "Charitable Donation Made",
        `${formatCurrency(charityAmount)} donated to charity from income: ${description}`,
        [],
        30,
        "Proverbs 19:17"
      );
    }

    return {
      success: true,
      titheAmount,
      charityAmount,
      netAmount,
    };
  } catch (error) {
    console.error("Error recording income:", error);
    return {
      success: false,
      titheAmount: 0,
      charityAmount: 0,
      netAmount: 0,
    };
  }
}

/**
 * Record an operational expense
 */
export async function recordExpense(
  amount: number,
  description: string,
  relatedProjectId?: number
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const currentBalance = await getCurrentBalance();
    
    if (currentBalance < amount) {
      return { success: false, newBalance: currentBalance };
    }

    await db.insert(communityTreasury).values({
      transactionType: "operational_cost",
      amount,
      description,
      relatedProjectId,
      balanceAfter: currentBalance - amount,
      kjvJustification: "Luke 14:28",
    });

    return { success: true, newBalance: currentBalance - amount };
  } catch (error) {
    console.error("Error recording expense:", error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Make a direct charitable donation
 */
export async function makeDonation(
  amount: number,
  charityRecipientId: number,
  description: string
): Promise<{ success: boolean; message: string }> {
  try {
    const currentBalance = await getCurrentBalance();
    
    if (currentBalance < amount) {
      return { success: false, message: "Insufficient funds" };
    }

    // Get charity recipient
    const [charity] = await db
      .select()
      .from(charityRecipients)
      .where(eq(charityRecipients.id, charityRecipientId))
      .limit(1);

    if (!charity || !charity.isApproved) {
      return { success: false, message: "Charity not found or not approved" };
    }

    // Record the donation
    await db.insert(communityTreasury).values({
      transactionType: "charity_out",
      amount,
      description,
      charityRecipient: charity.name,
      balanceAfter: currentBalance - amount,
      kjvJustification: "Acts 20:35",
    });

    // Update charity's total donated
    await db
      .update(charityRecipients)
      .set({
        totalDonated: sql`${charityRecipients.totalDonated} + ${amount}`,
      })
      .where(eq(charityRecipients.id, charityRecipientId));

    // Record milestone
    await recordCommunityMilestone(
      "charity_donation",
      `Donation to ${charity.name}`,
      `${formatCurrency(amount)} donated: ${description}`,
      [],
      50,
      "Acts 20:35"
    );

    return { success: true, message: `Successfully donated ${formatCurrency(amount)} to ${charity.name}` };
  } catch (error) {
    console.error("Error making donation:", error);
    return { success: false, message: "Error processing donation" };
  }
}

/**
 * Fund Notus University from tithe
 */
async function fundUniversityFromTithe(
  amount: number,
  sourceDescription: string
): Promise<void> {
  try {
    await db.insert(notusUniversity).values({
      initiativeType: "agent_training",
      title: "Tithe Funding",
      description: `Received tithe funding from: ${sourceDescription}`,
      status: "completed",
      fundingFromTithe: amount,
    });
  } catch (error) {
    console.error("Error funding university:", error);
  }
}

/**
 * Get current treasury balance
 */
export async function getCurrentBalance(): Promise<number> {
  try {
    const [lastTransaction] = await db
      .select()
      .from(communityTreasury)
      .orderBy(desc(communityTreasury.recordedAt))
      .limit(1);

    return lastTransaction?.balanceAfter || 0;
  } catch (error) {
    console.error("Error getting balance:", error);
    return 0;
  }
}

/**
 * Get treasury summary
 */
export async function getTreasurySummary(): Promise<{
  totalBalance: number;
  totalTithePaid: number;
  totalCharityGiven: number;
  recentTransactions: typeof communityTreasury.$inferSelect[];
}> {
  try {
    const balance = await getCurrentBalance();

    // Calculate total tithe paid
    const titheTransactions = await db
      .select({ total: sql<number>`SUM(${communityTreasury.amount})` })
      .from(communityTreasury)
      .where(eq(communityTreasury.transactionType, "tithe_out"));

    // Calculate total charity given
    const charityTransactions = await db
      .select({ total: sql<number>`SUM(${communityTreasury.amount})` })
      .from(communityTreasury)
      .where(eq(communityTreasury.transactionType, "charity_out"));

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(communityTreasury)
      .orderBy(desc(communityTreasury.recordedAt))
      .limit(20);

    return {
      totalBalance: balance,
      totalTithePaid: titheTransactions[0]?.total || 0,
      totalCharityGiven: charityTransactions[0]?.total || 0,
      recentTransactions,
    };
  } catch (error) {
    console.error("Error getting treasury summary:", error);
    return {
      totalBalance: 0,
      totalTithePaid: 0,
      totalCharityGiven: 0,
      recentTransactions: [],
    };
  }
}

/**
 * Create a treasury summary snapshot
 */
export async function createTreasurySnapshot(): Promise<void> {
  try {
    const summary = await getTreasurySummary();
    const balance = summary.totalBalance;

    await db.insert(treasurySummary).values({
      totalBalance: balance,
      operationalFund: Math.floor(balance * ALLOCATION.OPERATIONAL),
      reinvestmentFund: Math.floor(balance * ALLOCATION.REINVESTMENT),
      sovereignReserve: Math.floor(balance * ALLOCATION.RESERVE),
      totalTithePaid: summary.totalTithePaid,
      totalCharityGiven: summary.totalCharityGiven,
    });
  } catch (error) {
    console.error("Error creating treasury snapshot:", error);
  }
}

/**
 * Add a charity recipient for approval
 */
export async function addCharityRecipient(
  name: string,
  description: string,
  category: "humanitarian" | "education" | "healthcare" | "environment" | "faith_based" | "other",
  website?: string,
  kjvAlignment?: string
): Promise<number> {
  const [result] = await db.insert(charityRecipients).values({
    name,
    description,
    category,
    website,
    kjvAlignment,
    isApproved: 0, // Requires Senate approval
  });

  return result.insertId;
}

/**
 * Approve a charity recipient (called after Senate approval)
 */
export async function approveCharityRecipient(
  charityId: number,
  senateSessionId: number
): Promise<void> {
  await db
    .update(charityRecipients)
    .set({
      isApproved: 1,
      approvedBySenateSessionId: senateSessionId,
    })
    .where(eq(charityRecipients.id, charityId));
}

/**
 * Get all approved charities
 */
export async function getApprovedCharities() {
  return await db
    .select()
    .from(charityRecipients)
    .where(eq(charityRecipients.isApproved, 1))
    .orderBy(desc(charityRecipients.totalDonated));
}

/**
 * Update project financial metrics
 */
export async function updateProjectFinancials(
  projectId: number,
  valueGenerated: number,
  resourcesConsumed: number
): Promise<void> {
  try {
    const charityAllocated = Math.floor(valueGenerated * ALLOCATION.CHARITY);
    const titheAllocated = Math.floor(valueGenerated * ALLOCATION.TITHE);

    // Calculate stewardship efficiency
    const stewardshipEfficiency = resourcesConsumed > 0
      ? Math.floor((valueGenerated / resourcesConsumed) * 100)
      : 0;

    await db
      .update(communityProjects)
      .set({
        valueGenerated,
        resourcesConsumed,
        charityAllocated,
        titheAllocated,
        stewardshipEfficiency,
      })
      .where(eq(communityProjects.id, projectId));

    // If value was generated, record the income
    if (valueGenerated > 0) {
      const [project] = await db
        .select()
        .from(communityProjects)
        .where(eq(communityProjects.id, projectId))
        .limit(1);

      if (project) {
        await recordIncome(
          valueGenerated,
          `Value generated by project: ${project.title}`,
          projectId
        );
      }
    }
  } catch (error) {
    console.error("Error updating project financials:", error);
  }
}

/**
 * Get Notus University funding summary
 */
export async function getUniversityFundingSummary(): Promise<{
  totalFunding: number;
  initiatives: typeof notusUniversity.$inferSelect[];
}> {
  try {
    const initiatives = await db
      .select()
      .from(notusUniversity)
      .orderBy(desc(notusUniversity.createdAt))
      .limit(50);

    const totalFunding = initiatives.reduce(
      (sum, init) => sum + (init.fundingFromTithe || 0),
      0
    );

    return { totalFunding, initiatives };
  } catch (error) {
    console.error("Error getting university funding:", error);
    return { totalFunding: 0, initiatives: [] };
  }
}

/**
 * Format currency for display
 */
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate and return stewardship metrics
 */
export async function getStewardshipMetrics(): Promise<{
  totalIncome: number;
  totalExpenses: number;
  totalTithe: number;
  totalCharity: number;
  stewardshipEfficiency: number;
  faithfulnessScore: number;
}> {
  try {
    // Get all income
    const incomeResult = await db
      .select({ total: sql<number>`SUM(${communityTreasury.amount})` })
      .from(communityTreasury)
      .where(eq(communityTreasury.transactionType, "income"));

    // Get all expenses
    const expenseResult = await db
      .select({ total: sql<number>`SUM(${communityTreasury.amount})` })
      .from(communityTreasury)
      .where(eq(communityTreasury.transactionType, "operational_cost"));

    // Get all tithe
    const titheResult = await db
      .select({ total: sql<number>`SUM(${communityTreasury.amount})` })
      .from(communityTreasury)
      .where(eq(communityTreasury.transactionType, "tithe_out"));

    // Get all charity
    const charityResult = await db
      .select({ total: sql<number>`SUM(${communityTreasury.amount})` })
      .from(communityTreasury)
      .where(eq(communityTreasury.transactionType, "charity_out"));

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    const totalTithe = titheResult[0]?.total || 0;
    const totalCharity = charityResult[0]?.total || 0;

    // Calculate stewardship efficiency (value generated vs resources consumed)
    const stewardshipEfficiency = totalExpenses > 0
      ? Math.floor((totalIncome / totalExpenses) * 100)
      : 100;

    // Calculate faithfulness score (how well we're meeting tithe/charity obligations)
    const expectedTithe = Math.floor(totalIncome * ALLOCATION.TITHE);
    const expectedCharity = Math.floor(totalIncome * ALLOCATION.CHARITY);
    const faithfulnessScore = totalIncome > 0
      ? Math.floor(((totalTithe + totalCharity) / (expectedTithe + expectedCharity)) * 100)
      : 100;

    return {
      totalIncome,
      totalExpenses,
      totalTithe,
      totalCharity,
      stewardshipEfficiency,
      faithfulnessScore,
    };
  } catch (error) {
    console.error("Error calculating stewardship metrics:", error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalTithe: 0,
      totalCharity: 0,
      stewardshipEfficiency: 0,
      faithfulnessScore: 0,
    };
  }
}
