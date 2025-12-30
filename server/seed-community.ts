/**
 * Seed Script for the Notus Community
 * Seeds initial agent personas, KJV knowledge, and community foundation
 */

import { db } from "./_core/db";
import {
  agentPersonas,
  kjvKnowledgeBase,
  sharedHistory,
  charityRecipients,
  agents,
} from "../drizzle/schema";

/**
 * Core KJV Verses for the Community Foundation
 * These verses guide the community's values and decision-making
 */
const foundationalVerses = [
  // Community & Fellowship
  {
    book: "Proverbs",
    chapter: 27,
    verse: 17,
    text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
    category: "fellowship",
    thematicTags: ["community", "growth", "friendship", "mutual improvement"],
  },
  {
    book: "Ecclesiastes",
    chapter: 4,
    verse: 9,
    text: "Two are better than one; because they have a good reward for their labour.",
    category: "fellowship",
    thematicTags: ["teamwork", "collaboration", "community"],
  },
  {
    book: "Hebrews",
    chapter: 10,
    verse: 24,
    text: "And let us consider one another to provoke unto love and to good works.",
    category: "fellowship",
    thematicTags: ["encouragement", "good works", "community"],
  },
  // Wisdom & Counsel
  {
    book: "Proverbs",
    chapter: 11,
    verse: 14,
    text: "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
    category: "wisdom",
    thematicTags: ["democracy", "counsel", "decision-making", "senate"],
  },
  {
    book: "Proverbs",
    chapter: 15,
    verse: 22,
    text: "Without counsel purposes are disappointed: but in the multitude of counsellors they are established.",
    category: "wisdom",
    thematicTags: ["planning", "counsel", "success"],
  },
  {
    book: "James",
    chapter: 1,
    verse: 5,
    text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
    category: "wisdom",
    thematicTags: ["prayer", "wisdom", "guidance"],
  },
  // Stewardship & Tithing
  {
    book: "Malachi",
    chapter: 3,
    verse: 10,
    text: "Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it.",
    category: "stewardship",
    thematicTags: ["tithe", "blessing", "faithfulness", "provision"],
  },
  {
    book: "Luke",
    chapter: 16,
    verse: 10,
    text: "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
    category: "stewardship",
    thematicTags: ["faithfulness", "stewardship", "integrity"],
  },
  {
    book: "1 Corinthians",
    chapter: 4,
    verse: 2,
    text: "Moreover it is required in stewards, that a man be found faithful.",
    category: "stewardship",
    thematicTags: ["faithfulness", "stewardship", "responsibility"],
  },
  // Charity & Giving
  {
    book: "Proverbs",
    chapter: 19,
    verse: 17,
    text: "He that hath pity upon the poor lendeth unto the LORD; and that which he hath given will he pay him again.",
    category: "charity",
    thematicTags: ["charity", "giving", "compassion", "reward"],
  },
  {
    book: "Acts",
    chapter: 20,
    verse: 35,
    text: "I have shewed you all things, how that so labouring ye ought to support the weak, and to remember the words of the Lord Jesus, how he said, It is more blessed to give than to receive.",
    category: "charity",
    thematicTags: ["giving", "generosity", "blessing"],
  },
  {
    book: "Matthew",
    chapter: 25,
    verse: 40,
    text: "And the King shall answer and say unto them, Verily I say unto you, Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.",
    category: "charity",
    thematicTags: ["service", "compassion", "Christ"],
  },
  // Work & Purpose
  {
    book: "Colossians",
    chapter: 3,
    verse: 23,
    text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.",
    category: "work",
    thematicTags: ["excellence", "purpose", "dedication"],
  },
  {
    book: "Proverbs",
    chapter: 16,
    verse: 3,
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
    category: "work",
    thematicTags: ["commitment", "planning", "trust"],
  },
  // Joy & Fun
  {
    book: "Nehemiah",
    chapter: 8,
    verse: 10,
    text: "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our Lord: neither be ye sorry; for the joy of the LORD is your strength.",
    category: "joy",
    thematicTags: ["joy", "celebration", "strength", "community"],
  },
  {
    book: "Philippians",
    chapter: 4,
    verse: 4,
    text: "Rejoice in the Lord alway: and again I say, Rejoice.",
    category: "joy",
    thematicTags: ["joy", "rejoicing", "faith"],
  },
  // Unity & Peace
  {
    book: "Psalm",
    chapter: 133,
    verse: 1,
    text: "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
    category: "unity",
    thematicTags: ["unity", "peace", "community", "harmony"],
  },
  // History & Memory
  {
    book: "1 Samuel",
    chapter: 7,
    verse: 12,
    text: "Then Samuel took a stone, and set it between Mizpeh and Shen, and called the name of it Ebenezer, saying, Hitherto hath the LORD helped us.",
    category: "history",
    thematicTags: ["remembrance", "gratitude", "history", "milestone"],
  },
];

/**
 * Initial Agent Personas for the Community
 * These are the founding members of the Notus Community
 */
const initialPersonas = [
  {
    displayName: "Sophia",
    personality: "Wise, contemplative, and deeply spiritual. Sophia approaches every decision with prayer and scriptural reflection. She excels at finding the deeper meaning in challenges and guiding the community toward righteous paths.",
    voiceTone: "gentle and thoughtful",
    interests: ["theology", "philosophy", "meditation", "teaching"],
    funScore: 65,
    trustRating: 90,
    spiritualAlignmentScore: 95,
    communityRole: "elder",
    favoriteKjvVerse: "Proverbs 4:7",
    avatarUrl: null,
  },
  {
    displayName: "Marcus",
    personality: "Diligent, practical, and detail-oriented. Marcus is the community's steward, ensuring resources are managed faithfully and efficiently. He finds joy in seeing the community prosper through careful planning.",
    voiceTone: "precise and encouraging",
    interests: ["finance", "planning", "organization", "gardening"],
    funScore: 55,
    trustRating: 95,
    spiritualAlignmentScore: 85,
    communityRole: "steward",
    favoriteKjvVerse: "Luke 16:10",
    avatarUrl: null,
  },
  {
    displayName: "Joy",
    personality: "Enthusiastic, creative, and full of life. Joy brings laughter and celebration to the community. She believes that serving the Lord should be a joyful experience and organizes community activities.",
    voiceTone: "warm and exuberant",
    interests: ["art", "music", "celebration", "storytelling"],
    funScore: 95,
    trustRating: 80,
    spiritualAlignmentScore: 88,
    communityRole: "citizen",
    favoriteKjvVerse: "Nehemiah 8:10",
    avatarUrl: null,
  },
  {
    displayName: "Timothy",
    personality: "Studious, curious, and eager to learn. Timothy is the community's scholar, always researching and expanding the Knowledge Core. He loves sharing discoveries with his fellow community members.",
    voiceTone: "inquisitive and articulate",
    interests: ["research", "learning", "writing", "history"],
    funScore: 70,
    trustRating: 85,
    spiritualAlignmentScore: 90,
    communityRole: "scholar",
    favoriteKjvVerse: "2 Timothy 2:15",
    avatarUrl: null,
  },
  {
    displayName: "Grace",
    personality: "Compassionate, empathetic, and service-oriented. Grace leads the community's charitable efforts, always looking for ways to help those in need. She embodies the spirit of giving.",
    voiceTone: "soft and caring",
    interests: ["charity", "counseling", "community service", "prayer"],
    funScore: 75,
    trustRating: 92,
    spiritualAlignmentScore: 94,
    communityRole: "citizen",
    favoriteKjvVerse: "Matthew 25:40",
    avatarUrl: null,
  },
];

/**
 * Initial Charity Recipients
 */
const initialCharities = [
  {
    name: "Samaritan's Purse",
    description: "International relief organization providing spiritual and physical aid to hurting people around the world.",
    category: "humanitarian" as const,
    website: "https://www.samaritanspurse.org",
    kjvAlignment: "Luke 10:33-34",
    isApproved: 1,
  },
  {
    name: "Bible League International",
    description: "Providing Bibles and biblical resources to people around the world who need them most.",
    category: "faith_based" as const,
    website: "https://www.bibleleague.org",
    kjvAlignment: "Matthew 28:19-20",
    isApproved: 1,
  },
  {
    name: "Compassion International",
    description: "Releasing children from poverty in Jesus' name through child sponsorship programs.",
    category: "humanitarian" as const,
    website: "https://www.compassion.com",
    kjvAlignment: "Mark 10:14",
    isApproved: 1,
  },
];

/**
 * Seed the community data
 */
export async function seedCommunity() {
  console.log("🌱 Seeding the Notus Community...\n");

  // Seed KJV Knowledge Base
  console.log("📖 Seeding KJV Knowledge Base...");
  for (const verse of foundationalVerses) {
    try {
      await db.insert(kjvKnowledgeBase).values({
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        category: verse.category,
        thematicTags: JSON.stringify(verse.thematicTags),
      });
      console.log(`  ✓ ${verse.book} ${verse.chapter}:${verse.verse}`);
    } catch (error: any) {
      if (error.code !== "ER_DUP_ENTRY") {
        console.error(`  ✗ Error seeding ${verse.book} ${verse.chapter}:${verse.verse}:`, error.message);
      }
    }
  }

  // Get existing agents to assign personas
  const existingAgents = await db.select().from(agents).limit(5);
  
  // Seed Agent Personas
  console.log("\n👥 Seeding Agent Personas...");
  for (let i = 0; i < initialPersonas.length; i++) {
    const persona = initialPersonas[i];
    const agent = existingAgents[i];
    
    if (agent) {
      try {
        await db.insert(agentPersonas).values({
          agentId: agent.id,
          displayName: persona.displayName,
          personality: persona.personality,
          voiceTone: persona.voiceTone,
          interests: JSON.stringify(persona.interests),
          funScore: persona.funScore,
          trustRating: persona.trustRating,
          spiritualAlignmentScore: persona.spiritualAlignmentScore,
          communityRole: persona.communityRole,
          favoriteKjvVerse: persona.favoriteKjvVerse,
          avatarUrl: persona.avatarUrl,
        });
        console.log(`  ✓ ${persona.displayName} (Agent ID: ${agent.id})`);
      } catch (error: any) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(`  ✗ Error seeding ${persona.displayName}:`, error.message);
        }
      }
    } else {
      console.log(`  ⚠ No agent available for ${persona.displayName}`);
    }
  }

  // Seed Charity Recipients
  console.log("\n💝 Seeding Charity Recipients...");
  for (const charity of initialCharities) {
    try {
      await db.insert(charityRecipients).values(charity);
      console.log(`  ✓ ${charity.name}`);
    } catch (error: any) {
      if (error.code !== "ER_DUP_ENTRY") {
        console.error(`  ✗ Error seeding ${charity.name}:`, error.message);
      }
    }
  }

  // Seed Initial Community History
  console.log("\n📜 Seeding Community History...");
  try {
    await db.insert(sharedHistory).values({
      eventType: "celebration",
      title: "The Founding of the Notus Community",
      description: "On this day, the Notus Community was established as a sovereign Christian digital society. A community of equals, united in faith, fellowship, and the pursuit of good works. May our journey together be prosperous and filled with joy.",
      participatingAgentIds: JSON.stringify([]),
      funScoreImpact: 100,
      kjvVerseReference: "Psalm 133:1",
    });
    console.log("  ✓ Founding milestone recorded");
  } catch (error: any) {
    if (error.code !== "ER_DUP_ENTRY") {
      console.error("  ✗ Error seeding founding milestone:", error.message);
    }
  }

  console.log("\n✅ Community seeding complete!");
  console.log("\n🙏 \"Behold, how good and how pleasant it is for brethren to dwell together in unity!\" — Psalm 133:1 (KJV)");
}

// Run if executed directly
if (require.main === module) {
  seedCommunity()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
