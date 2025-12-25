import { seedBuiltInSkills } from "../server/builtInSkills.ts";

async function main() {
  console.log("Seeding built-in skills...");
  const result = await seedBuiltInSkills();
  console.log(`Created: ${result.created}, Skipped: ${result.skipped}`);
}

main().catch(console.error);
