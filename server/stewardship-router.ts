/**
 * Stewardship Router
 * tRPC endpoints for the Sovereign Stewardship features
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./_core/db";
import {
  treasuryTransactions,
  charityRecipients,
  sharedHistory,
} from "../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export const stewardshipRouter = router({
  // Get treasury summary
  getSummary: publicProcedure.query(async () => {
    const transactions = await db.select().from(treasuryTransactions);
    
    let totalBalance = 0;
    let totalTithePaid = 0;
    let totalCharityGiven = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      if (tx.transactionType === "income") {
        totalIncome += tx.amountCents;
        totalBalance += tx.amountCents;
      } else if (tx.transactionType === "expense") {
        totalExpenses += tx.amountCents;
        totalBalance -= tx.amountCents;
      } else if (tx.transactionType === "tithe") {
        totalTithePaid += tx.amountCents;
        totalBalance -= tx.amountCents;
      } else if (tx.transactionType === "charity") {
        totalCharityGiven += tx.amountCents;
        totalBalance -= tx.amountCents;
      }
    }

    return {
      totalBalance,
      totalTithePaid,
      totalCharityGiven,
      totalIncome,
      totalExpenses,
    };
  }),

  // Get stewardship metrics
  getMetrics: publicProcedure.query(async () => {
    const transactions = await db.select().from(treasuryTransactions);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTithe = 0;
    let totalCharity = 0;

    for (const tx of transactions) {
      if (tx.transactionType === "income") {
        totalIncome += tx.amountCents;
      } else if (tx.transactionType === "expense") {
        totalExpenses += tx.amountCents;
      } else if (tx.transactionType === "tithe") {
        totalTithe += tx.amountCents;
      } else if (tx.transactionType === "charity") {
        totalCharity += tx.amountCents;
      }
    }

    // Calculate stewardship efficiency (lower expenses = higher efficiency)
    const stewardshipEfficiency = totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
      : 100;

    // Calculate faithfulness score based on tithe and charity compliance
    const expectedTithe = totalIncome * 0.10;
    const expectedCharity = totalIncome * 0.05;
    const titheCompliance = expectedTithe > 0 ? Math.min(totalTithe / expectedTithe, 1) : 1;
    const charityCompliance = expectedCharity > 0 ? Math.min(totalCharity / expectedCharity, 1) : 1;
    const faithfulnessScore = Math.round(((titheCompliance + charityCompliance) / 2) * 100);

    return {
      totalIncome,
      totalExpenses,
      totalTithe,
      totalCharity,
      stewardshipEfficiency,
      faithfulnessScore,
    };
  }),

  // Get treasury balance
  getTreasury: publicProcedure.query(async () => {
    const transactions = await db.select().from(treasuryTransactions);
    
    let totalBalance = 0;
    let totalTithePaid = 0;
    let totalCharityGiven = 0;

    for (const tx of transactions) {
      if (tx.transactionType === "income") {
        totalBalance += tx.amountCents;
      } else {
        totalBalance -= tx.amountCents;
      }
      
      if (tx.transactionType === "tithe") {
        totalTithePaid += tx.amountCents;
      } else if (tx.transactionType === "charity") {
        totalCharityGiven += tx.amountCents;
      }
    }

    return {
      totalBalance,
      totalTithePaid,
      totalCharityGiven,
    };
  }),

  // Get recent transactions
  getTransactions: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const transactions = await db
        .select()
        .from(treasuryTransactions)
        .orderBy(desc(treasuryTransactions.createdAt))
        .limit(input.limit);
      
      return transactions;
    }),

  // Record income
  recordIncome: protectedProcedure
    .input(z.object({
      amountCents: z.number().positive(),
      description: z.string().min(1),
      sourceProject: z.string().optional(),
      kjvVerseReference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Record the income
      await db.insert(treasuryTransactions).values({
        transactionType: "income",
        amountCents: input.amountCents,
        description: input.description,
        sourceProject: input.sourceProject,
        kjvVerseReference: input.kjvVerseReference,
      });

      // Auto-calculate and record tithe (10%)
      const titheAmount = Math.round(input.amountCents * 0.10);
      await db.insert(treasuryTransactions).values({
        transactionType: "tithe",
        amountCents: titheAmount,
        description: `Tithe from: ${input.description}`,
        destinationFund: "notus_university",
        kjvVerseReference: "Malachi 3:10",
      });

      // Auto-calculate and record charity (5%)
      const charityAmount = Math.round(input.amountCents * 0.05);
      await db.insert(treasuryTransactions).values({
        transactionType: "charity",
        amountCents: charityAmount,
        description: `Charitable giving from: ${input.description}`,
        destinationFund: "charity_pool",
        kjvVerseReference: "Proverbs 19:17",
      });

      // Record in shared history
      await db.insert(sharedHistory).values({
        eventType: "tithe_paid",
        title: "Tithe Paid to Notus University",
        description: `The community faithfully paid a tithe of $${(titheAmount / 100).toFixed(2)} from income: ${input.description}`,
        participatingAgentIds: JSON.stringify([]),
        funScoreImpact: 5,
        kjvVerseReference: "Malachi 3:10",
      });

      return {
        success: true,
        income: input.amountCents,
        tithe: titheAmount,
        charity: charityAmount,
      };
    }),

  // Get approved charities
  getCharities: publicProcedure.query(async () => {
    const charities = await db
      .select()
      .from(charityRecipients)
      .where(eq(charityRecipients.isApproved, 1));
    
    return charities;
  }),

  // Distribute charity funds
  distributeCharity: protectedProcedure
    .input(z.object({
      charityId: z.number(),
      amountCents: z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Get charity details
      const [charity] = await db
        .select()
        .from(charityRecipients)
        .where(eq(charityRecipients.id, input.charityId));
      
      if (!charity) {
        throw new Error("Charity not found");
      }

      // Record the distribution
      await db.insert(treasuryTransactions).values({
        transactionType: "charity",
        amountCents: input.amountCents,
        description: input.description || `Donation to ${charity.name}`,
        destinationFund: charity.name,
        charityRecipientId: charity.id,
        kjvVerseReference: charity.kjvAlignment,
      });

      // Update charity's total received
      await db
        .update(charityRecipients)
        .set({
          totalReceived: sql`${charityRecipients.totalReceived} + ${input.amountCents}`,
        })
        .where(eq(charityRecipients.id, charity.id));

      // Record in shared history
      await db.insert(sharedHistory).values({
        eventType: "charity_donation",
        title: `Charitable Donation to ${charity.name}`,
        description: `The community donated $${(input.amountCents / 100).toFixed(2)} to ${charity.name}. "${charity.description}"`,
        participatingAgentIds: JSON.stringify([]),
        funScoreImpact: 10,
        kjvVerseReference: charity.kjvAlignment,
      });

      return { success: true };
    }),
});
