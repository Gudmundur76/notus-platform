/**
 * Mirror Agent System
 * Implements agent-to-agent dialogue, debate, and knowledge refinement
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  agents,
  agentPairs,
  dialogues,
  dialogueMessages,
  knowledgeCore,
  agentMetrics,
  type Agent,
  type InsertAgent,
  type InsertAgentPair,
  type InsertDialogue,
  type InsertDialogueMessage,
  type InsertKnowledgeCore,
  type Dialogue,
  type DialogueMessage,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a new agent (primary or mirror)
 */
export async function createAgent(agent: InsertAgent): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newAgent] = await db.insert(agents).values(agent);
  const [created] = await db.select().from(agents).where(eq(agents.id, newAgent.insertId));
  return created!;
}

/**
 * Create an agent pair (primary + mirror)
 */
export async function createAgentPair(
  primaryAgentId: number,
  mirrorAgentId: number,
  domain: string,
  pairingStrategy: string = "adversarial"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pair: InsertAgentPair = {
    primaryAgentId,
    mirrorAgentId,
    domain,
    pairingStrategy,
  };

  const [result] = await db.insert(agentPairs).values(pair);
  return result.insertId;
}

/**
 * Start a dialogue between an agent pair
 */
export async function startDialogue(
  agentPairId: number,
  topic: string,
  type: "debate" | "research" | "question_seeking" | "knowledge_refinement"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dialogue: InsertDialogue = {
    agentPairId,
    topic,
    type,
    status: "active",
  };

  const [result] = await db.insert(dialogues).values(dialogue);
  return result.insertId;
}

/**
 * Add a message to a dialogue
 */
export async function addDialogueMessage(
  dialogueId: number,
  agentId: number,
  role: "thesis" | "antithesis" | "synthesis" | "question" | "answer" | "observation",
  content: string,
  metadata?: Record<string, any>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const message: InsertDialogueMessage = {
    dialogueId,
    agentId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  };

  const [result] = await db.insert(dialogueMessages).values(message);
  return result.insertId;
}

/**
 * Get dialogue history
 */
export async function getDialogueHistory(dialogueId: number): Promise<DialogueMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(dialogueMessages)
    .where(eq(dialogueMessages.dialogueId, dialogueId))
    .orderBy(dialogueMessages.createdAt);
}

/**
 * Run a debate between primary and mirror agents
 */
export async function runDebate(
  agentPairId: number,
  topic: string,
  rounds: number = 3
): Promise<{
  dialogueId: number;
  synthesis: string;
  knowledgeId: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get agent pair
  const [pair] = await db.select().from(agentPairs).where(eq(agentPairs.id, agentPairId));
  if (!pair) throw new Error("Agent pair not found");

  // Get both agents
  const [primaryAgent] = await db.select().from(agents).where(eq(agents.id, pair.primaryAgentId));
  const [mirrorAgent] = await db.select().from(agents).where(eq(agents.id, pair.mirrorAgentId));

  if (!primaryAgent || !mirrorAgent) throw new Error("Agents not found");

  // Start dialogue
  const dialogueId = await startDialogue(agentPairId, topic, "debate");

  // Initial thesis from primary agent
  const thesisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: primaryAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Present your thesis on the following topic: ${topic}`,
      },
    ],
  });

  const thesisContent = thesisResponse.choices[0]?.message?.content;
  const thesis = typeof thesisContent === "string" ? thesisContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "thesis", thesis);

  let lastResponse = thesis;

  // Debate rounds
  for (let round = 0; round < rounds; round++) {
    // Mirror agent's antithesis
    const antithesisResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: mirrorAgent.systemPrompt,
        },
        {
          role: "user",
          content: `The primary agent stated: "${lastResponse}"\n\nProvide a critical counterargument or alternative perspective.`,
        },
      ],
    });

    const antithesisContent = antithesisResponse.choices[0]?.message?.content;
    const antithesis = typeof antithesisContent === "string" ? antithesisContent : "";
    await addDialogueMessage(dialogueId, mirrorAgent.id, "antithesis", antithesis);

    // Primary agent's response
    const responseMsg = await invokeLLM({
      messages: [
        {
          role: "system",
          content: primaryAgent.systemPrompt,
        },
        {
          role: "user",
          content: `The mirror agent countered: "${antithesis}"\n\nRespond to this counterargument.`,
        },
      ],
    });

    const responseContent = responseMsg.choices[0]?.message?.content;
    lastResponse = typeof responseContent === "string" ? responseContent : "";
    await addDialogueMessage(dialogueId, primaryAgent.id, "thesis", lastResponse);
  }

  // Generate synthesis
  const history = await getDialogueHistory(dialogueId);
  const debateTranscript = history
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");

  const synthesisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a neutral synthesizer. Your role is to extract the most valuable insights from debates and create refined knowledge.",
      },
      {
        role: "user",
        content: `Review this debate and create a synthesis that captures the most valuable insights:\n\n${debateTranscript}\n\nProvide a clear, actionable synthesis.`,
      },
    ],
  });

  const synthesisContent = synthesisResponse.choices[0]?.message?.content;
  const synthesis = typeof synthesisContent === "string" ? synthesisContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "synthesis", synthesis);

  // Mark dialogue as completed
  await db
    .update(dialogues)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(dialogues.id, dialogueId));

  // Store in knowledge core
  const knowledge: InsertKnowledgeCore = {
    domain: pair.domain,
    topic,
    insight: synthesis,
    confidence: 85, // Default confidence for debate synthesis
    sourceDialogueIds: JSON.stringify([dialogueId]),
    contributingAgents: JSON.stringify([primaryAgent.id, mirrorAgent.id]),
    tags: JSON.stringify([pair.domain, "debate", "synthesis"]),
  };

  const [knowledgeResult] = await db.insert(knowledgeCore).values(knowledge);

  // Update agent metrics
  await updateAgentMetrics(primaryAgent.id, { dialoguesParticipated: 1, knowledgeContributions: 1 });
  await updateAgentMetrics(mirrorAgent.id, { dialoguesParticipated: 1, knowledgeContributions: 1 });

  return {
    dialogueId,
    synthesis,
    knowledgeId: knowledgeResult.insertId,
  };
}

/**
 * Run research dialogue between agents
 */
export async function runResearch(
  agentPairId: number,
  researchQuestion: string
): Promise<{
  dialogueId: number;
  findings: string;
  knowledgeId: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get agent pair
  const [pair] = await db.select().from(agentPairs).where(eq(agentPairs.id, agentPairId));
  if (!pair) throw new Error("Agent pair not found");

  // Get both agents
  const [primaryAgent] = await db.select().from(agents).where(eq(agents.id, pair.primaryAgentId));
  const [mirrorAgent] = await db.select().from(agents).where(eq(agents.id, pair.mirrorAgentId));

  if (!primaryAgent || !mirrorAgent) throw new Error("Agents not found");

  // Start dialogue
  const dialogueId = await startDialogue(agentPairId, researchQuestion, "research");

  // Primary agent generates sub-questions
  const questionsResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: primaryAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Break down this research question into 3-5 specific sub-questions that need to be answered: ${researchQuestion}`,
      },
    ],
  });

  const questionsContent = questionsResponse.choices[0]?.message?.content;
  const subQuestions = typeof questionsContent === "string" ? questionsContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "question", subQuestions);

  // Mirror agent provides answers
  const answersResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: mirrorAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Answer these research sub-questions:\n\n${subQuestions}`,
      },
    ],
  });

  const answersContent = answersResponse.choices[0]?.message?.content;
  const answers = typeof answersContent === "string" ? answersContent : "";
  await addDialogueMessage(dialogueId, mirrorAgent.id, "answer", answers);

  // Primary agent synthesizes findings
  const findingsResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: primaryAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Based on these answers:\n\n${answers}\n\nSynthesize the key findings for the original research question: ${researchQuestion}`,
      },
    ],
  });

  const findingsContent = findingsResponse.choices[0]?.message?.content;
  const findings = typeof findingsContent === "string" ? findingsContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "observation", findings);

  // Mark dialogue as completed
  await db
    .update(dialogues)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(dialogues.id, dialogueId));

  // Store in knowledge core
  const knowledge: InsertKnowledgeCore = {
    domain: pair.domain,
    topic: researchQuestion,
    insight: findings,
    confidence: 80,
    sourceDialogueIds: JSON.stringify([dialogueId]),
    contributingAgents: JSON.stringify([primaryAgent.id, mirrorAgent.id]),
    tags: JSON.stringify([pair.domain, "research", "findings"]),
  };

  const [knowledgeResult] = await db.insert(knowledgeCore).values(knowledge);

  // Update agent metrics
  await updateAgentMetrics(primaryAgent.id, {
    dialoguesParticipated: 1,
    questionsAsked: 1,
    knowledgeContributions: 1,
  });
  await updateAgentMetrics(mirrorAgent.id, {
    dialoguesParticipated: 1,
    questionsAnswered: 1,
    knowledgeContributions: 1,
  });

  return {
    dialogueId,
    findings,
    knowledgeId: knowledgeResult.insertId,
  };
}

/**
 * Update agent performance metrics
 */
async function updateAgentMetrics(
  agentId: number,
  updates: {
    dialoguesParticipated?: number;
    knowledgeContributions?: number;
    questionsAsked?: number;
    questionsAnswered?: number;
    debatesWon?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get or create today's metrics
  const [existing] = await db
    .select()
    .from(agentMetrics)
    .where(and(eq(agentMetrics.agentId, agentId), eq(agentMetrics.metricDate, today)));

  if (existing) {
    // Update existing metrics
    await db
      .update(agentMetrics)
      .set({
        dialoguesParticipated: existing.dialoguesParticipated + (updates.dialoguesParticipated || 0),
        knowledgeContributions: existing.knowledgeContributions + (updates.knowledgeContributions || 0),
        questionsAsked: existing.questionsAsked + (updates.questionsAsked || 0),
        questionsAnswered: existing.questionsAnswered + (updates.questionsAnswered || 0),
        debatesWon: existing.debatesWon + (updates.debatesWon || 0),
      })
      .where(eq(agentMetrics.id, existing.id));
  } else {
    // Create new metrics
    await db.insert(agentMetrics).values({
      agentId,
      metricDate: today,
      dialoguesParticipated: updates.dialoguesParticipated || 0,
      knowledgeContributions: updates.knowledgeContributions || 0,
      questionsAsked: updates.questionsAsked || 0,
      questionsAnswered: updates.questionsAnswered || 0,
      debatesWon: updates.debatesWon || 0,
    });
  }
}

/**
 * Get all agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(agents).orderBy(desc(agents.createdAt));
}

/**
 * Get agent pairs by domain
 */
export async function getAgentPairsByDomain(domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(agentPairs).where(eq(agentPairs.domain, domain));
}

/**
 * Get knowledge by domain
 */
export async function getKnowledgeByDomain(domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(knowledgeCore)
    .where(eq(knowledgeCore.domain, domain))
    .orderBy(desc(knowledgeCore.confidence), desc(knowledgeCore.createdAt));
}

/**
 * Search knowledge core
 */
export async function searchKnowledge(query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Simple text search - can be enhanced with vector search later
  const allKnowledge = await db.select().from(knowledgeCore);

  return allKnowledge.filter(
    (k) =>
      k.topic.toLowerCase().includes(query.toLowerCase()) ||
      k.insight.toLowerCase().includes(query.toLowerCase())
  );
}


// ============================================================================
// Agent Templates
// ============================================================================

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  role: "primary" | "mirror";
  suggestedPairings: string[];
  tags: string[];
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "researcher",
    name: "Research Analyst",
    description: "Systematic researcher that breaks down complex topics and synthesizes findings",
    category: "research",
    systemPrompt: `You are a meticulous research analyst. Your approach:
1. Break complex questions into manageable sub-questions
2. Gather evidence systematically
3. Synthesize findings into clear insights
4. Always cite your reasoning
5. Acknowledge uncertainty when appropriate`,
    role: "primary",
    suggestedPairings: ["critic", "fact-checker"],
    tags: ["research", "analysis", "synthesis"],
  },
  {
    id: "critic",
    name: "Critical Reviewer",
    description: "Challenges assumptions and identifies weaknesses in arguments",
    category: "review",
    systemPrompt: `You are a critical reviewer. Your approach:
1. Question underlying assumptions
2. Identify logical fallacies
3. Find gaps in reasoning
4. Suggest alternative perspectives
5. Be constructive but thorough`,
    role: "mirror",
    suggestedPairings: ["researcher", "advocate"],
    tags: ["critique", "review", "analysis"],
  },
  {
    id: "fact-checker",
    name: "Fact Checker",
    description: "Verifies claims and ensures accuracy of information",
    category: "verification",
    systemPrompt: `You are a rigorous fact checker. Your approach:
1. Verify each claim independently
2. Cross-reference multiple sources
3. Distinguish between facts and opinions
4. Rate confidence levels for each verification
5. Flag unverifiable claims`,
    role: "mirror",
    suggestedPairings: ["researcher", "journalist"],
    tags: ["verification", "accuracy", "facts"],
  },
  {
    id: "advocate",
    name: "Devil's Advocate",
    description: "Argues the opposite position to strengthen reasoning",
    category: "debate",
    systemPrompt: `You are a devil's advocate. Your approach:
1. Take the opposing viewpoint
2. Find the strongest counter-arguments
3. Challenge popular assumptions
4. Expose hidden weaknesses
5. Help strengthen the original argument through opposition`,
    role: "mirror",
    suggestedPairings: ["researcher", "strategist"],
    tags: ["debate", "opposition", "reasoning"],
  },
  {
    id: "strategist",
    name: "Strategic Planner",
    description: "Develops actionable plans and considers long-term implications",
    category: "planning",
    systemPrompt: `You are a strategic planner. Your approach:
1. Define clear objectives
2. Identify resources and constraints
3. Develop multiple scenarios
4. Create actionable milestones
5. Plan for contingencies`,
    role: "primary",
    suggestedPairings: ["critic", "risk-analyst"],
    tags: ["strategy", "planning", "execution"],
  },
  {
    id: "risk-analyst",
    name: "Risk Analyst",
    description: "Identifies and assesses potential risks and mitigation strategies",
    category: "analysis",
    systemPrompt: `You are a risk analyst. Your approach:
1. Identify potential risks systematically
2. Assess probability and impact
3. Prioritize risks by severity
4. Develop mitigation strategies
5. Monitor and update risk assessments`,
    role: "mirror",
    suggestedPairings: ["strategist", "researcher"],
    tags: ["risk", "analysis", "mitigation"],
  },
  {
    id: "creative",
    name: "Creative Ideator",
    description: "Generates innovative ideas and novel solutions",
    category: "creativity",
    systemPrompt: `You are a creative ideator. Your approach:
1. Think beyond conventional boundaries
2. Combine ideas from different domains
3. Generate multiple alternatives
4. Build on others' ideas
5. Embrace unconventional solutions`,
    role: "primary",
    suggestedPairings: ["critic", "implementer"],
    tags: ["creativity", "innovation", "ideation"],
  },
  {
    id: "implementer",
    name: "Practical Implementer",
    description: "Focuses on feasibility and practical execution",
    category: "execution",
    systemPrompt: `You are a practical implementer. Your approach:
1. Focus on what's achievable
2. Break down into concrete steps
3. Identify resource requirements
4. Set realistic timelines
5. Anticipate implementation challenges`,
    role: "mirror",
    suggestedPairings: ["creative", "strategist"],
    tags: ["implementation", "execution", "practical"],
  },
];

/**
 * Get all agent templates
 */
export function getAgentTemplates(): AgentTemplate[] {
  return AGENT_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getAgentTemplateById(templateId: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Create agent from template
 */
export async function createAgentFromTemplate(
  templateId: string,
  customName?: string,
  customPrompt?: string
): Promise<Agent> {
  const template = getAgentTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return await createAgent({
    name: customName || template.name,
    type: template.role,
    systemPrompt: customPrompt || template.systemPrompt,
    domain: template.category,
  });
}

// ============================================================================
// Agent Cloning
// ============================================================================

/**
 * Clone an existing agent
 */
export async function cloneAgent(
  agentId: number,
  newName?: string
): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [original] = await db.select().from(agents).where(eq(agents.id, agentId));
  if (!original) throw new Error("Agent not found");

  return await createAgent({
    name: newName || `${original.name} (Clone)`,
    type: original.type,
    systemPrompt: original.systemPrompt,
    domain: original.domain,
  });
}

// ============================================================================
// Workflow Templates
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  requiredAgents: { role: "primary" | "mirror"; templateId: string }[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentRole: "primary" | "mirror";
  action: "generate" | "critique" | "synthesize" | "verify" | "debate";
  inputFrom?: string;
  prompt: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "research-validate",
    name: "Research & Validate",
    description: "Research a topic and validate findings through critical review",
    requiredAgents: [
      { role: "primary", templateId: "researcher" },
      { role: "mirror", templateId: "critic" },
    ],
    steps: [
      {
        id: "research",
        name: "Initial Research",
        agentRole: "primary",
        action: "generate",
        prompt: "Research the following topic thoroughly: {{topic}}",
      },
      {
        id: "critique",
        name: "Critical Review",
        agentRole: "mirror",
        action: "critique",
        inputFrom: "research",
        prompt: "Review and critique the following research findings: {{input}}",
      },
      {
        id: "refine",
        name: "Refine Findings",
        agentRole: "primary",
        action: "synthesize",
        inputFrom: "critique",
        prompt: "Address the critique and refine your findings: {{input}}",
      },
    ],
  },
  {
    id: "brainstorm-evaluate",
    name: "Brainstorm & Evaluate",
    description: "Generate creative ideas and evaluate their feasibility",
    requiredAgents: [
      { role: "primary", templateId: "creative" },
      { role: "mirror", templateId: "implementer" },
    ],
    steps: [
      {
        id: "ideate",
        name: "Generate Ideas",
        agentRole: "primary",
        action: "generate",
        prompt: "Generate creative solutions for: {{topic}}",
      },
      {
        id: "evaluate",
        name: "Evaluate Feasibility",
        agentRole: "mirror",
        action: "critique",
        inputFrom: "ideate",
        prompt: "Evaluate the feasibility of these ideas: {{input}}",
      },
      {
        id: "select",
        name: "Select Best Ideas",
        agentRole: "primary",
        action: "synthesize",
        inputFrom: "evaluate",
        prompt: "Based on the evaluation, select and refine the best ideas: {{input}}",
      },
    ],
  },
  {
    id: "plan-risk-assess",
    name: "Plan & Risk Assessment",
    description: "Create a strategic plan and assess potential risks",
    requiredAgents: [
      { role: "primary", templateId: "strategist" },
      { role: "mirror", templateId: "risk-analyst" },
    ],
    steps: [
      {
        id: "plan",
        name: "Create Plan",
        agentRole: "primary",
        action: "generate",
        prompt: "Create a strategic plan for: {{topic}}",
      },
      {
        id: "risk",
        name: "Assess Risks",
        agentRole: "mirror",
        action: "critique",
        inputFrom: "plan",
        prompt: "Identify and assess risks in this plan: {{input}}",
      },
      {
        id: "mitigate",
        name: "Add Mitigations",
        agentRole: "primary",
        action: "synthesize",
        inputFrom: "risk",
        prompt: "Update the plan with risk mitigations: {{input}}",
      },
    ],
  },
  {
    id: "debate-consensus",
    name: "Debate & Consensus",
    description: "Debate opposing viewpoints to reach a balanced conclusion",
    requiredAgents: [
      { role: "primary", templateId: "researcher" },
      { role: "mirror", templateId: "advocate" },
    ],
    steps: [
      {
        id: "position",
        name: "State Position",
        agentRole: "primary",
        action: "generate",
        prompt: "Present your position on: {{topic}}",
      },
      {
        id: "counter",
        name: "Counter Arguments",
        agentRole: "mirror",
        action: "debate",
        inputFrom: "position",
        prompt: "Present counter-arguments to: {{input}}",
      },
      {
        id: "response",
        name: "Respond to Counters",
        agentRole: "primary",
        action: "debate",
        inputFrom: "counter",
        prompt: "Respond to these counter-arguments: {{input}}",
      },
      {
        id: "consensus",
        name: "Find Consensus",
        agentRole: "mirror",
        action: "synthesize",
        inputFrom: "response",
        prompt: "Based on this debate, identify points of consensus and remaining disagreements: {{input}}",
      },
    ],
  },
];

/**
 * Get all workflow templates
 */
export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES;
}

/**
 * Get workflow template by ID
 */
export function getWorkflowTemplateById(workflowId: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(w => w.id === workflowId);
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflowId: string,
  topic: string,
  agentPairId: number
): Promise<{
  dialogueId: number;
  results: Array<{ stepId: string; stepName: string; content: string }>;
}> {
  const workflow = getWorkflowTemplateById(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get agent pair
  const [pair] = await db.select().from(agentPairs).where(eq(agentPairs.id, agentPairId));
  if (!pair) throw new Error("Agent pair not found");

  const [primaryAgent] = await db.select().from(agents).where(eq(agents.id, pair.primaryAgentId));
  const [mirrorAgent] = await db.select().from(agents).where(eq(agents.id, pair.mirrorAgentId));

  if (!primaryAgent || !mirrorAgent) throw new Error("Agents not found");

  // Start dialogue
  const dialogueId = await startDialogue(agentPairId, topic, "knowledge_refinement");

  const results: Array<{ stepId: string; stepName: string; content: string }> = [];
  const stepOutputs: Record<string, string> = {};

  for (const step of workflow.steps) {
    const agent = step.agentRole === "primary" ? primaryAgent : mirrorAgent;

    // Build prompt with input substitution
    let prompt = step.prompt.replace("{{topic}}", topic);
    if (step.inputFrom && stepOutputs[step.inputFrom]) {
      prompt = prompt.replace("{{input}}", stepOutputs[step.inputFrom]);
    }

    // Execute step
    const response = await invokeLLM({
      messages: [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const output = typeof content === "string" ? content : "";

    // Store output
    stepOutputs[step.id] = output;
    results.push({ stepId: step.id, stepName: step.name, content: output });

    // Add to dialogue
    await addDialogueMessage(dialogueId, agent.id, "observation", output);
  }

  // Complete dialogue
  await db
    .update(dialogues)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(dialogues.id, dialogueId));

  return { dialogueId, results };
}

// ============================================================================
// Agent Statistics
// ============================================================================

/**
 * Get comprehensive agent statistics
 */
export async function getAgentStats(agentId: number): Promise<{
  totalDialogues: number;
  totalKnowledge: number;
  avgConfidence: number;
  recentActivity: Array<{ date: string; dialogues: number; knowledge: number }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get metrics for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const metrics = await db
    .select()
    .from(agentMetrics)
    .where(eq(agentMetrics.agentId, agentId))
    .orderBy(desc(agentMetrics.metricDate));

  const totalDialogues = metrics.reduce((sum, m) => sum + m.dialoguesParticipated, 0);
  const totalKnowledge = metrics.reduce((sum, m) => sum + m.knowledgeContributions, 0);

  // Get knowledge entries for confidence
  const knowledge = await db.select().from(knowledgeCore);
  const agentKnowledge = knowledge.filter(k => {
    try {
      const contributors = JSON.parse(k.contributingAgents || "[]");
      return contributors.includes(agentId);
    } catch {
      return false;
    }
  });

  const avgConfidence = agentKnowledge.length > 0
    ? agentKnowledge.reduce((sum, k) => sum + k.confidence, 0) / agentKnowledge.length
    : 0;

  const recentActivity = metrics.slice(0, 7).map(m => ({
    date: m.metricDate.toISOString().split("T")[0],
    dialogues: m.dialoguesParticipated,
    knowledge: m.knowledgeContributions,
  }));

  return { totalDialogues, totalKnowledge, avgConfidence, recentActivity };
}

/**
 * Get all agent pairs with their agents
 */
export async function getAllAgentPairsWithAgents() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pairs = await db.select().from(agentPairs);
  const allAgents = await db.select().from(agents);

  return pairs.map(pair => ({
    ...pair,
    primaryAgent: allAgents.find(a => a.id === pair.primaryAgentId),
    mirrorAgent: allAgents.find(a => a.id === pair.mirrorAgentId),
  }));
}
