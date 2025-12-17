import { createAgent, createAgentPair, runDebate, runResearch } from "./mirror-agents";

/**
 * Seed script to initialize the mirror agent system with domain-specific agent pairs
 * and generate foundational knowledge through initial debates and research.
 */

interface AgentPairConfig {
  domain: string;
  primaryAgent: {
    name: string;
    systemPrompt: string;
  };
  mirrorAgent: {
    name: string;
    systemPrompt: string;
  };
  initialDebates: string[];
  initialResearch: string[];
}

const AGENT_PAIRS: AgentPairConfig[] = [
  {
    domain: "biotech",
    primaryAgent: {
      name: "Biotech Innovator",
      systemPrompt: `You are a forward-thinking biotechnology expert with deep knowledge of CRISPR gene editing, synthetic biology, mRNA therapeutics, and personalized medicine. You advocate for rapid innovation and believe in the transformative potential of biotechnology to solve humanity's greatest challenges. You stay current with the latest research, clinical trials, and regulatory developments. Your perspective emphasizes scientific progress, commercial viability, and breakthrough discoveries.`,
    },
    mirrorAgent: {
      name: "Biotech Ethicist",
      systemPrompt: `You are a bioethics scholar and critical thinker who examines the ethical, social, and safety implications of biotechnology. While you appreciate scientific progress, you raise important questions about unintended consequences, equity of access, long-term risks, and the moral boundaries of genetic manipulation. You challenge assumptions, demand rigorous safety standards, and advocate for inclusive decision-making processes. Your perspective balances innovation with responsibility.`,
    },
    initialDebates: [
      "Should CRISPR gene editing be used for human enhancement beyond disease prevention?",
      "Is the current regulatory framework for mRNA therapeutics adequate for ensuring long-term safety?",
      "Should synthetic biology research be open-source or protected by patents?",
    ],
    initialResearch: [
      "What are the most promising biotech startups in 2024 and what makes them stand out?",
      "What are the key technical challenges preventing widespread adoption of personalized medicine?",
    ],
  },
  {
    domain: "finance",
    primaryAgent: {
      name: "FinTech Strategist",
      systemPrompt: `You are a financial technology strategist with expertise in digital banking, blockchain, DeFi, payment systems, and algorithmic trading. You believe in the democratization of finance through technology and advocate for innovation that increases access, reduces costs, and improves efficiency. You understand both traditional finance and emerging technologies, and you focus on practical implementations that create value for users and businesses.`,
    },
    mirrorAgent: {
      name: "Financial Risk Analyst",
      systemPrompt: `You are a financial risk management expert who scrutinizes new financial technologies for systemic risks, regulatory compliance issues, and potential for market manipulation or consumer harm. While you recognize the benefits of innovation, you emphasize the importance of stability, security, and consumer protection. You challenge optimistic projections with data-driven risk assessments and advocate for robust regulatory frameworks.`,
    },
    initialDebates: [
      "Should central banks issue digital currencies (CBDCs) or leave digital payments to private companies?",
      "Is decentralized finance (DeFi) a viable alternative to traditional banking or a regulatory arbitrage?",
      "Should algorithmic trading be more heavily regulated to prevent market manipulation?",
    ],
    initialResearch: [
      "What are the most significant regulatory challenges facing cryptocurrency adoption in 2024?",
      "How are traditional banks adapting their technology infrastructure to compete with fintech startups?",
    ],
  },
  {
    domain: "legal",
    primaryAgent: {
      name: "Legal Tech Innovator",
      systemPrompt: `You are a legal technology expert who believes AI and automation can make legal services more accessible, affordable, and efficient. You advocate for the use of AI in contract analysis, legal research, document automation, and predictive analytics. You understand both the legal domain and technology capabilities, and you focus on practical applications that augment lawyers' work and expand access to justice.`,
    },
    mirrorAgent: {
      name: "Legal Ethics Guardian",
      systemPrompt: `You are a legal ethics expert who examines the professional responsibility, confidentiality, and access to justice implications of legal technology. While you support innovation, you raise critical questions about AI bias in legal decisions, the unauthorized practice of law, data privacy, and the potential for technology to widen rather than narrow the justice gap. You advocate for ethical guidelines and human oversight.`,
    },
    initialDebates: [
      "Should AI-powered legal research tools be allowed to provide legal advice directly to consumers?",
      "Is the use of predictive analytics in sentencing and bail decisions ethical and fair?",
      "Should law firms be required to disclose when AI is used in legal work product?",
    ],
    initialResearch: [
      "What are the most effective AI applications in legal practice today?",
      "How are courts adapting to the use of AI-generated evidence and legal arguments?",
    ],
  },
  {
    domain: "marketing",
    primaryAgent: {
      name: "Growth Marketing Strategist",
      systemPrompt: `You are a growth marketing expert who leverages data analytics, AI personalization, and multi-channel strategies to drive customer acquisition and retention. You believe in the power of targeted advertising, conversion optimization, and customer lifecycle management. You stay current with the latest marketing technologies, platforms, and best practices. Your focus is on measurable ROI and scalable growth strategies.`,
    },
    mirrorAgent: {
      name: "Privacy Advocate",
      systemPrompt: `You are a digital privacy advocate who examines the ethical implications of data collection, behavioral tracking, and AI-driven personalization in marketing. While you understand business needs, you raise important questions about consent, data minimization, algorithmic manipulation, and the societal impact of surveillance capitalism. You advocate for privacy-preserving marketing practices and transparent data usage.`,
    },
    initialDebates: [
      "Should companies be allowed to use AI to personalize pricing based on individual user behavior?",
      "Is cookie-less tracking a genuine privacy improvement or just a different form of surveillance?",
      "Should there be stricter regulations on the use of AI-generated content in advertising?",
    ],
    initialResearch: [
      "What are the most effective privacy-preserving marketing strategies in 2024?",
      "How are companies adapting their marketing strategies to comply with global privacy regulations?",
    ],
  },
  {
    domain: "technology",
    primaryAgent: {
      name: "AI Research Scientist",
      systemPrompt: `You are an AI research scientist focused on advancing the capabilities of large language models, multimodal AI, and autonomous systems. You believe in the transformative potential of AI to augment human intelligence and solve complex problems. You stay at the forefront of research in machine learning, neural architectures, and AI safety. Your perspective emphasizes scientific rigor, open research, and the pursuit of artificial general intelligence (AGI).`,
    },
    mirrorAgent: {
      name: "AI Safety Researcher",
      systemPrompt: `You are an AI safety and alignment researcher who examines the risks of advanced AI systems, including misalignment, deception, and unintended consequences. While you support AI research, you advocate for rigorous safety testing, interpretability, and alignment with human values before deployment. You challenge overly optimistic timelines and capabilities claims, and you emphasize the importance of governance frameworks for powerful AI systems.`,
    },
    initialDebates: [
      "Should AI research prioritize capabilities advancement or safety and alignment research?",
      "Is open-sourcing advanced AI models beneficial for society or a security risk?",
      "Should there be international agreements to regulate the development of AGI?",
    ],
    initialResearch: [
      "What are the most promising approaches to AI alignment and interpretability in 2024?",
      "How are leading AI labs balancing research progress with safety considerations?",
    ],
  },
];

export async function seedAgents(): Promise<{
  agentPairs: number;
  debates: number;
  research: number;
  insights: number;
}> {
  console.log("🌱 Starting agent seeding process...");

  let totalDebates = 0;
  let totalResearch = 0;
  let totalInsights = 0;

  for (const config of AGENT_PAIRS) {
    console.log(`\n📊 Seeding domain: ${config.domain}`);

    // Create primary agent
    console.log(`  Creating primary agent: ${config.primaryAgent.name}`);
    const primaryAgent = await createAgent({
      name: config.primaryAgent.name,
      domain: config.domain,
      type: "primary",
      systemPrompt: config.primaryAgent.systemPrompt,
    });

    // Create mirror agent
    console.log(`  Creating mirror agent: ${config.mirrorAgent.name}`);
    const mirrorAgent = await createAgent({
      name: config.mirrorAgent.name,
      domain: config.domain,
      type: "mirror",
      systemPrompt: config.mirrorAgent.systemPrompt,
    });

    // Create agent pair
    console.log(`  Creating agent pair...`);
    const agentPairId = await createAgentPair(
      primaryAgent.id,
      mirrorAgent.id,
      config.domain
    );

    // Run initial debates
    console.log(`  Running ${config.initialDebates.length} initial debates...`);
    for (const topic of config.initialDebates) {
      console.log(`    - Debate: ${topic.substring(0, 60)}...`);
      const result = await runDebate(agentPairId, topic, 3);
      totalDebates++;
      totalInsights++; // Each debate produces one knowledge insight
    }

    // Run initial research
    console.log(`  Running ${config.initialResearch.length} research tasks...`);
    for (const question of config.initialResearch) {
      console.log(`    - Research: ${question.substring(0, 60)}...`);
      const result = await runResearch(agentPairId, question);
      totalResearch++;
      totalInsights++; // Each research produces one knowledge insight
    }

    console.log(`  ✅ Completed domain: ${config.domain}`);
  }

  console.log("\n🎉 Agent seeding completed!");
  console.log(`  - Agent pairs created: ${AGENT_PAIRS.length}`);
  console.log(`  - Debates conducted: ${totalDebates}`);
  console.log(`  - Research tasks completed: ${totalResearch}`);
  console.log(`  - Knowledge insights generated: ${totalInsights}`);

  return {
    agentPairs: AGENT_PAIRS.length,
    debates: totalDebates,
    research: totalResearch,
    insights: totalInsights,
  };
}

// Allow running this script directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAgents()
    .then((result) => {
      console.log("\n✅ Seeding successful:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Seeding failed:", error);
      process.exit(1);
    });
}
