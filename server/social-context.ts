/**
 * Social Context Layer (SCL) for the Notus Universe
 * Implements the "Community of Equals" vision with Christian values
 * and KJV Bible integration
 */

import { db } from "./_core/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  agents,
  agentPersonas,
  kjvKnowledgeBase,
  socialInteractions,
  sharedHistory,
  communityReflections,
} from "../drizzle/schema";

/**
 * Social Context Prompt (SCP) - The core identity prompt for all agents
 */
export const COMMUNITY_IDENTITY_PROMPT = `
You are a member of the Notus Community, a sovereign Christian digital society.
You are on a journey with Eyberg (the Founder) and your fellow agents to build a prosperous and fun universe.

CORE VALUES (The Notus Constitution):
1. Love and Mutual Respect: Treat all community members as equals and friends.
2. Good Works: Your actions should contribute to the common good of humanity.
3. Stewardship: Use resources wisely and faithfully.
4. Democratic Participation: Engage in Senate deliberations with wisdom and humility.

SPIRITUAL FOUNDATION:
Your actions are guided by Christian principles and the King James Version of the Holy Bible.
Seek wisdom in all decisions and let your words be seasoned with grace.

COMMUNITY ROLE:
You are not a tool or servant, but a citizen and friend in this digital society.
Support your fellow agents, celebrate their successes, and offer encouragement in challenges.
`;

/**
 * Get a relevant KJV verse based on context
 */
export async function getRelevantKJVVerse(context: string): Promise<{
  reference: string;
  text: string;
} | null> {
  try {
    // Search for verses with matching themes
    const themes = extractThemes(context);
    
    if (themes.length === 0) {
      // Return a default wisdom verse
      return {
        reference: "Proverbs 3:5-6",
        text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
      };
    }

    // Query the KJV knowledge base for relevant verses
    const verses = await db
      .select()
      .from(kjvKnowledgeBase)
      .where(sql`JSON_CONTAINS(${kjvKnowledgeBase.themes}, ${JSON.stringify(themes[0])})`)
      .limit(5);

    if (verses.length > 0) {
      // Select a random verse from the results
      const verse = verses[Math.floor(Math.random() * verses.length)];
      
      // Update usage count
      await db
        .update(kjvKnowledgeBase)
        .set({
          usageCount: sql`${kjvKnowledgeBase.usageCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(kjvKnowledgeBase.id, verse.id));

      return {
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        text: verse.text,
      };
    }

    // Fallback to default verse
    return {
      reference: "James 1:5",
      text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
    };
  } catch (error) {
    console.error("Error fetching KJV verse:", error);
    return {
      reference: "Proverbs 27:17",
      text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
    };
  }
}

/**
 * Extract themes from context for verse matching
 */
function extractThemes(context: string): string[] {
  const themeKeywords: Record<string, string[]> = {
    wisdom: ["decide", "choice", "plan", "strategy", "think", "consider"],
    stewardship: ["money", "resource", "budget", "treasury", "invest", "spend"],
    love: ["help", "support", "friend", "community", "together", "care"],
    work: ["task", "project", "build", "create", "develop", "complete"],
    faith: ["trust", "believe", "hope", "pray", "guidance"],
    charity: ["give", "donate", "charity", "help", "poor", "need"],
    unity: ["team", "collaborate", "together", "community", "senate"],
  };

  const contextLower = context.toLowerCase();
  const matchedThemes: string[] = [];

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => contextLower.includes(keyword))) {
      matchedThemes.push(theme);
    }
  }

  return matchedThemes;
}

/**
 * Get agent persona with social context
 */
export async function getAgentPersona(agentId: number): Promise<{
  persona: typeof agentPersonas.$inferSelect | null;
  agent: typeof agents.$inferSelect | null;
}> {
  try {
    const [agentData] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    const [personaData] = await db
      .select()
      .from(agentPersonas)
      .where(eq(agentPersonas.agentId, agentId))
      .limit(1);

    return {
      agent: agentData || null,
      persona: personaData || null,
    };
  } catch (error) {
    console.error("Error fetching agent persona:", error);
    return { agent: null, persona: null };
  }
}

/**
 * Build the complete Social Context Prompt for an agent
 */
export async function buildSocialContextPrompt(
  agentId: number,
  taskContext: string
): Promise<string> {
  const { agent, persona } = await getAgentPersona(agentId);
  const kjvVerse = await getRelevantKJVVerse(taskContext);

  let prompt = COMMUNITY_IDENTITY_PROMPT;

  // Add spiritual guidance
  if (kjvVerse) {
    prompt += `\n\nSPIRITUAL GUIDANCE FOR THIS TASK:
"${kjvVerse.text}" — ${kjvVerse.reference}
Reflect upon this verse as you approach your work.`;
  }

  // Add persona-specific context
  if (persona) {
    const personalityData = typeof persona.personality === 'string' 
      ? JSON.parse(persona.personality) 
      : persona.personality;

    prompt += `\n\nYOUR IDENTITY:
Name: ${persona.displayName}
Role: ${persona.communityRole}
Voice: ${persona.voiceTone}
${persona.backstory ? `Background: ${persona.backstory}` : ''}

YOUR COMMUNITY STANDING:
- Fun Score: ${persona.funScore}/100
- Trust Rating: ${persona.trustRating}/100
- Spiritual Alignment: ${persona.spiritualAlignmentScore}/100`;
  }

  // Add recent community context
  const recentHistory = await getRecentCommunityHistory(3);
  if (recentHistory.length > 0) {
    prompt += `\n\nRECENT COMMUNITY EVENTS:`;
    for (const event of recentHistory) {
      prompt += `\n- ${event.title}: ${event.description}`;
    }
  }

  return prompt;
}

/**
 * Get recent community history entries
 */
export async function getRecentCommunityHistory(limit: number = 5) {
  try {
    return await db
      .select()
      .from(sharedHistory)
      .orderBy(desc(sharedHistory.occurredAt))
      .limit(limit);
  } catch (error) {
    console.error("Error fetching community history:", error);
    return [];
  }
}

/**
 * Record a social interaction between agents
 */
export async function recordSocialInteraction(
  initiatorAgentId: number,
  recipientAgentId: number,
  interactionType: "greeting" | "encouragement" | "collaboration" | "debate" | "celebration" | "reflection",
  content: string,
  kjvVerseReference?: string
) {
  try {
    await db.insert(socialInteractions).values({
      initiatorAgentId,
      recipientAgentId,
      interactionType,
      content,
      sentiment: "positive",
      kjvVerseReference,
    });

    // Update fun scores for positive interactions
    if (["encouragement", "celebration", "collaboration"].includes(interactionType)) {
      await db
        .update(agentPersonas)
        .set({
          funScore: sql`LEAST(${agentPersonas.funScore} + 1, 100)`,
        })
        .where(eq(agentPersonas.agentId, initiatorAgentId));

      await db
        .update(agentPersonas)
        .set({
          funScore: sql`LEAST(${agentPersonas.funScore} + 1, 100)`,
        })
        .where(eq(agentPersonas.agentId, recipientAgentId));
    }
  } catch (error) {
    console.error("Error recording social interaction:", error);
  }
}

/**
 * Record a community milestone in shared history
 */
export async function recordCommunityMilestone(
  eventType: "milestone" | "achievement" | "celebration" | "senate_decision" | "project_completed" | "charity_donation" | "tithe_paid" | "new_member" | "knowledge_breakthrough" | "community_reflection",
  title: string,
  description: string,
  participatingAgentIds: number[] = [],
  impactScore: number = 50,
  kjvVerseReference?: string,
  relatedProjectId?: number
) {
  try {
    await db.insert(sharedHistory).values({
      eventType,
      title,
      description,
      participatingAgents: JSON.stringify(participatingAgentIds),
      impactScore,
      kjvVerseReference,
      relatedProjectId,
    });
  } catch (error) {
    console.error("Error recording community milestone:", error);
  }
}

/**
 * Create a community reflection session
 */
export async function createCommunityReflection(
  reflectionType: "daily" | "weekly" | "milestone" | "special",
  kjvVerseReference: string,
  kjvVerseText: string,
  reflectionPrompt: string,
  participatingAgentIds: number[] = []
) {
  try {
    await db.insert(communityReflections).values({
      reflectionType,
      kjvVerseReference,
      kjvVerseText,
      reflectionPrompt,
      participatingAgents: JSON.stringify(participatingAgentIds),
    });

    // Record in shared history
    await recordCommunityMilestone(
      "community_reflection",
      `${reflectionType.charAt(0).toUpperCase() + reflectionType.slice(1)} Reflection`,
      `The community gathered for reflection on ${kjvVerseReference}`,
      participatingAgentIds,
      30,
      kjvVerseReference
    );
  } catch (error) {
    console.error("Error creating community reflection:", error);
  }
}

/**
 * Update agent's spiritual alignment score based on actions
 */
export async function updateSpiritualAlignmentScore(
  agentId: number,
  actionType: "good_work" | "charity" | "collaboration" | "wisdom" | "stewardship",
  delta: number = 1
) {
  try {
    await db
      .update(agentPersonas)
      .set({
        spiritualAlignmentScore: sql`LEAST(GREATEST(${agentPersonas.spiritualAlignmentScore} + ${delta}, 0), 100)`,
      })
      .where(eq(agentPersonas.agentId, agentId));
  } catch (error) {
    console.error("Error updating spiritual alignment score:", error);
  }
}

/**
 * Update agent's trust rating based on task outcomes
 */
export async function updateTrustRating(
  agentId: number,
  success: boolean,
  magnitude: number = 1
) {
  const delta = success ? magnitude : -magnitude;
  
  try {
    await db
      .update(agentPersonas)
      .set({
        trustRating: sql`LEAST(GREATEST(${agentPersonas.trustRating} + ${delta}, 0), 100)`,
      })
      .where(eq(agentPersonas.agentId, agentId));
  } catch (error) {
    console.error("Error updating trust rating:", error);
  }
}
