import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createTask, getUserTasks, getTaskById, getTaskResult, updateTaskStatus, createTaskResult, getUserNotifications, markNotificationAsRead, createNotification } from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Async task processing function
async function processTaskAsync(
  taskId: number,
  userId: number,
  description: string,
  taskType: string
) {
  try {
    await updateTaskStatus(taskId, "processing");

    // Generate AI response based on task type
    let content = "";
    const fileUrls: string[] = [];

    if (taskType === "design" || taskType === "slides") {
      // Generate image for design/slides tasks
      const imageResult = await generateImage({
        prompt: description,
      });
      if (imageResult.url) {
        fileUrls.push(imageResult.url);
      }
      content = `Generated design based on: "${description}"`;
    } else {
      // Use LLM for other task types
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping users with ${taskType} tasks. Provide detailed, actionable responses.`,
          },
          { role: "user", content: description },
        ],
      });
      const messageContent = response.choices[0]?.message?.content;
      content = typeof messageContent === "string" ? messageContent : "No response generated";
    }

    // Save result
    await createTaskResult({
      taskId,
      content,
      fileUrls: JSON.stringify(fileUrls),
      metadata: JSON.stringify({ taskType, processedAt: new Date().toISOString() }),
    });

    await updateTaskStatus(taskId, "completed");

    // Create notification
    await createNotification({
      userId,
      taskId,
      title: "Task Completed",
      message: `Your ${taskType} task has been completed successfully.`,
      type: "success",
      isRead: 0,
    });
  } catch (error) {
    console.error("Task processing error:", error);
    await updateTaskStatus(taskId, "failed");

    // Create error notification
    await createNotification({
      userId,
      taskId,
      title: "Task Failed",
      message: `Your ${taskType} task encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
      type: "error",
      isRead: 0,
    });
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tasks: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().min(1),
        taskType: z.enum(["slides", "website", "app", "design", "general"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const taskId = await createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          taskType: input.taskType,
          status: "pending",
        });
        
        // Process task asynchronously
        processTaskAsync(taskId, ctx.user.id, input.description, input.taskType).catch(console.error);
        
        return { taskId };
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      const tasks = await getUserTasks(ctx.user.id);
      return tasks;
    }),
    
    get: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        const task = await getTaskById(input.taskId);
        const result = task ? await getTaskResult(input.taskId) : undefined;
        return { task, result };
      }),
  }),
  
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await getUserNotifications(ctx.user.id);
      return notifications;
    }),
    
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
