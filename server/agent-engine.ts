/**
 * OpenManus-style Agent Engine
 * Implements ReAct (Reasoning + Acting) pattern for autonomous task execution
 */

import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { getContextForTask, extractAndStoreMemory } from "./memory";
import type { Message } from "../drizzle/schema";
import { agentSClient } from "./agent-s-client";

export interface AgentTask {
  taskId: string;
  instruction: string;
  taskType: "general" | "slides" | "website" | "app" | "design" | "computer_control";
  context?: Record<string, any>;
}

export interface AgentStep {
  thought: string;
  action: string;
  observation: string;
}

export interface AgentResult {
  success: boolean;
  result: string;
  steps: AgentStep[];
  files?: Array<{ url: string; type: string; name: string }>;
  error?: string;
}

/**
 * OpenManus-inspired Agent Engine
 * Uses ReAct pattern: Reasoning -> Action -> Observation loop
 */
export class ManusAgentEngine {
  private maxSteps = 10;
  private taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }

  /**
   * Execute a task using ReAct pattern
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const steps: AgentStep[] = [];
    
    try {
      // Step 1: Plan the task
      const plan = await this.planTask(task);
      steps.push({
        thought: "Analyzing task and creating execution plan",
        action: "plan",
        observation: plan,
      });

      // Step 2: Execute based on task type
      let result: string;
      let files: Array<{ url: string; type: string; name: string }> = [];

      switch (task.taskType) {
        case "computer_control":
          const computerResult = await this.executeComputerControl(task, plan);
          result = computerResult.result;
          files = computerResult.files || [];
          steps.push({
            thought: "Executing GUI automation task",
            action: "agent_s_control",
            observation: `Computer control task completed`,
          });
          break;

        case "design":
        case "slides":
          const imageResult = await this.executeImageGeneration(task, plan);
          result = imageResult.result;
          files = imageResult.files;
          steps.push({
            thought: "Generating visual content",
            action: "generate_image",
            observation: `Generated ${files.length} images`,
          });
          break;

        case "website":
        case "app":
          const codeResult = await this.executeCodeGeneration(task, plan);
          result = codeResult.result;
          files = codeResult.files;
          steps.push({
            thought: "Generating code and project structure",
            action: "generate_code",
            observation: `Generated project with ${files.length} files`,
          });
          break;

        case "general":
        default:
          const generalResult = await this.executeGeneral(task, plan);
          result = generalResult.result;
          steps.push({
            thought: "Processing general task",
            action: "llm_response",
            observation: "Task completed successfully",
          });
          break;
      }

      // Step 3: Extract and store memory
      const userId = task.context?.userId as number | undefined;
      if (userId) {
        const taskIdNum = parseInt(task.taskId.replace("task-", "")) || 0;
        await extractAndStoreMemory(userId, taskIdNum, task.taskType, task.instruction, result);
        steps.push({
          thought: "Storing important information to memory",
          action: "store_memory",
          observation: "Extracted and stored relevant context for future tasks",
        });
      }

      // Step 4: Finalize and return
      steps.push({
        thought: "Task execution completed",
        action: "finalize",
        observation: "All steps completed successfully",
      });

      return {
        success: true,
        result,
        steps,
        files,
      };
    } catch (error) {
      return {
        success: false,
        result: "",
        steps,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Plan task execution using LLM with memory context
   */
  private async planTask(task: AgentTask): Promise<string> {
    // Get relevant context from memory
    const userId = task.context?.userId as number | undefined;
    let contextMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    let memoryContext = "";

    if (userId) {
      const context = await getContextForTask(userId, task.instruction);
      
      // Add recent conversation history
      contextMessages = context.recentMessages.slice(-5).map((msg: Message) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      }));

      // Add relevant memories as context
      if (context.relevantMemories.length > 0) {
        memoryContext = "\n\nRelevant context from memory:\n" +
          context.relevantMemories
            .map(m => `- ${m.key}: ${m.value}`)
            .join("\n");
      }

      // Add user preferences
      if (Object.keys(context.preferences).length > 0) {
        memoryContext += "\n\nUser preferences: " + JSON.stringify(context.preferences);
      }
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an AI task planner. Create a concise execution plan for the given task.
Task type: ${task.taskType}
Provide a brief, actionable plan in 2-3 sentences.${memoryContext}`,
        },
        ...contextMessages,
        {
          role: "user",
          content: task.instruction,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : "Execute task as requested";
  }

  /**
   * Execute image generation tasks
   */
  private async executeImageGeneration(
    task: AgentTask,
    plan: string
  ): Promise<{ result: string; files: Array<{ url: string; type: string; name: string }> }> {
    // Generate image using built-in service
    const imageData = await generateImage({
      prompt: task.instruction,
    });

    const files = imageData.url ? [
      {
        url: imageData.url,
        type: "image/png",
        name: `${task.taskType}-${nanoid(8)}.png`,
      },
    ] : [];

    const result = `Successfully generated ${task.taskType} image based on your requirements:\n\n${plan}\n\nImage URL: ${imageData.url}`;

    return { result, files };
  }

  /**
   * Execute code generation tasks
   */
  private async executeCodeGeneration(
    task: AgentTask,
    plan: string
  ): Promise<{ result: string; files: Array<{ url: string; type: string; name: string }> }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert ${task.taskType} developer. Generate complete, production-ready code.
Include all necessary files: HTML, CSS, JavaScript, and configuration files.
Format your response as a JSON object with file paths as keys and code content as values.`,
        },
        {
          role: "user",
          content: `${task.instruction}\n\nExecution plan: ${plan}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const codeContent = typeof content === 'string' ? content : "{}";
    
    // Try to parse as JSON, fallback to single file
    let codeFiles: Record<string, string> = {};
    try {
      codeFiles = JSON.parse(codeContent);
    } catch {
      // If not JSON, treat as single HTML file
      codeFiles = { "index.html": codeContent };
    }

    // Upload files to storage
    const files: Array<{ url: string; type: string; name: string }> = [];
    for (const [filename, content] of Object.entries(codeFiles)) {
      const fileKey = `${this.taskId}/${filename}`;
      const contentType = this.getContentType(filename);
      const storageResult = await storagePut(fileKey, content, contentType);
      if (storageResult.url) {
        files.push({
          url: storageResult.url,
          type: contentType,
          name: filename,
        });
      }
    }

    const result = `Successfully generated ${task.taskType} project:\n\n${plan}\n\nGenerated ${files.length} files. Download them from the links provided.`;

    return { result, files };
  }

  /**
   * Execute computer control tasks using Agent-S
   */
  private async executeComputerControl(
    task: AgentTask,
    plan: string
  ): Promise<{ result: string; files?: Array<{ url: string; type: string; name: string }> }> {
    try {
      // Check if Agent-S is available
      const health = await agentSClient.checkHealth();
      if (!health.agent_s_available) {
        return {
          result: "Agent-S is not available. Computer control tasks require the Agent-S bridge service to be running.",
        };
      }

      // Execute task via Agent-S
      const agentSTask = await agentSClient.executeTask({
        task_id: task.taskId,
        description: task.instruction,
        max_steps: 50,
        enable_reflection: true,
      });

      // Wait for completion with progress updates
      const finalStatus = await agentSClient.waitForCompletion(task.taskId, {
        pollInterval: 3000,
        maxWaitTime: 600000, // 10 minutes
      });

      if (finalStatus.status === "completed") {
        // Store screenshots as files if available
        const files: Array<{ url: string; type: string; name: string }> = [];
        if (finalStatus.screenshot) {
          const screenshotKey = `${task.taskId}/final-screenshot.png`;
          const screenshotBuffer = Buffer.from(finalStatus.screenshot, "base64");
          const storageResult = await storagePut(screenshotKey, screenshotBuffer, "image/png");
          if (storageResult.url) {
            files.push({
              url: storageResult.url,
              type: "image/png",
              name: "final-screenshot.png",
            });
          }
        }

        return {
          result: `Computer control task completed successfully.\n\n${plan}\n\nCompleted ${finalStatus.current_step} steps.\nFinal status: ${finalStatus.message}`,
          files,
        };
      } else {
        return {
          result: `Computer control task failed: ${finalStatus.message}`,
        };
      }
    } catch (error) {
      return {
        result: `Error executing computer control task: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Execute general tasks
   */
  private async executeGeneral(
    task: AgentTask,
    plan: string
  ): Promise<{ result: string }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Provide comprehensive, accurate responses.",
        },
        {
          role: "user",
          content: `${task.instruction}\n\nExecution plan: ${plan}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const result = typeof content === 'string' ? content : "Task completed";

    return { result };
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      md: "text/markdown",
      txt: "text/plain",
      png: "image/png",
      jpg: "image/jpeg",
      svg: "image/svg+xml",
    };
    return contentTypes[ext || "txt"] || "text/plain";
  }
}

/**
 * Execute a task using the agent engine
 */
export async function executeAgentTask(task: AgentTask): Promise<AgentResult> {
  const engine = new ManusAgentEngine(task.taskId);
  return await engine.execute(task);
}
