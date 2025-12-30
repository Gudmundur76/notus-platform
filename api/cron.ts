import type { VercelRequest, VercelResponse } from "@vercel/node";
import { triggerJob as triggerLearningJob } from "../server/scheduled-learning";
import { triggerJob as triggerTrainingJob } from "../server/training-scheduler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify Vercel Cron Secret to ensure only Vercel can trigger these
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { pathname } = new URL(req.url || "", `http://${req.headers.host}`);

  try {
    switch (pathname) {
      case "/api/cron/daily-training":
        await triggerTrainingJob("daily_training");
        break;
      case "/api/cron/weekly-review":
        await triggerTrainingJob("weekly_review");
        break;
      case "/api/cron/daily-aggregation":
        await triggerLearningJob("daily_aggregation");
        break;
      case "/api/cron/weekly-learning":
        await triggerLearningJob("weekly_learning");
        break;
      default:
        return res.status(404).json({ error: "Not Found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Cron job failed: ${pathname}`, error);
    return res.status(500).json({ error: String(error) });
  }
}
