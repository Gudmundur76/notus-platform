import { seedAgents } from "../server/seed-agents";

async function main() {
  console.log("Starting agent seeding...");
  
  try {
    const result = await seedAgents();
    console.log("\n✅ Agent seeding completed successfully!");
    console.log(`\nCreated ${result.agents.length} agents`);
    console.log(`Generated ${result.knowledgeCount} knowledge entries`);
    
    console.log("\nAgent Summary:");
    result.agents.forEach((agent: any) => {
      console.log(`  - ${agent.name} (${agent.domain}, ${agent.type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Agent seeding failed:", error);
    process.exit(1);
  }
}

main();
