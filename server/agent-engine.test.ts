import { describe, expect, it, vi, beforeEach } from "vitest";
import { ManusAgentEngine, executeAgentTask, type AgentTask } from "./agent-engine";
import * as llm from "./_core/llm";
import * as imageGen from "./_core/imageGeneration";
import * as storage from "./storage";

// Mock dependencies
vi.mock("./_core/llm");
vi.mock("./_core/imageGeneration");
vi.mock("./storage");

describe("ManusAgentEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("General Task Execution", () => {
    it("should execute a general task successfully", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: "This is a helpful response to your question.",
            },
          },
        ],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const task: AgentTask = {
        taskId: "test-1",
        instruction: "What is the capital of France?",
        taskType: "general",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(result.result).toContain("helpful response");
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0]?.thought).toContain("Analyzing task");
    });

    it("should handle LLM errors gracefully", async () => {
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error("LLM API failed"));

      const task: AgentTask = {
        taskId: "test-error",
        instruction: "Test error handling",
        taskType: "general",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain("LLM API failed");
    });
  });

  describe("Image Generation Tasks", () => {
    it("should generate images for design tasks", async () => {
      const mockPlanResponse = {
        choices: [
          {
            message: {
              content: "Create a modern logo with blue and white colors",
            },
          },
        ],
      };

      const mockImageResponse = {
        url: "https://storage.example.com/image-123.png",
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockPlanResponse as any);
      vi.mocked(imageGen.generateImage).mockResolvedValue(mockImageResponse as any);

      const task: AgentTask = {
        taskId: "test-design",
        instruction: "Create a logo for my startup",
        taskType: "design",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files?.length).toBe(1);
      expect(result.files?.[0]?.url).toContain("storage.example.com");
      expect(result.files?.[0]?.type).toBe("image/png");
    });

    it("should handle image generation for slides", async () => {
      const mockPlanResponse = {
        choices: [{ message: { content: "Create presentation slides" } }],
      };

      const mockImageResponse = {
        url: "https://storage.example.com/slides-456.png",
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockPlanResponse as any);
      vi.mocked(imageGen.generateImage).mockResolvedValue(mockImageResponse as any);

      const task: AgentTask = {
        taskId: "test-slides",
        instruction: "Create slides about AI",
        taskType: "slides",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(result.files?.length).toBe(1);
      expect(imageGen.generateImage).toHaveBeenCalledWith({
        prompt: task.instruction,
      });
    });
  });

  describe("Code Generation Tasks", () => {
    it("should generate code for website tasks", async () => {
      const mockPlanResponse = {
        choices: [{ message: { content: "Build a landing page" } }],
      };

      const mockCodeResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                "index.html": "<html><body>Hello World</body></html>",
                "style.css": "body { margin: 0; }",
              }),
            },
          },
        ],
      };

      const mockStorageResponse = {
        url: "https://storage.example.com/file.html",
      };

      vi.mocked(llm.invokeLLM)
        .mockResolvedValueOnce(mockPlanResponse as any)
        .mockResolvedValueOnce(mockCodeResponse as any);

      vi.mocked(storage.storagePut).mockResolvedValue(mockStorageResponse as any);

      const task: AgentTask = {
        taskId: "test-website",
        instruction: "Build a simple landing page",
        taskType: "website",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files?.length).toBe(2);
      expect(storage.storagePut).toHaveBeenCalledTimes(2);
    });

    it("should handle non-JSON code responses", async () => {
      const mockPlanResponse = {
        choices: [{ message: { content: "Create an app" } }],
      };

      const mockCodeResponse = {
        choices: [
          {
            message: {
              content: "<html><body>Simple HTML</body></html>",
            },
          },
        ],
      };

      const mockStorageResponse = {
        url: "https://storage.example.com/index.html",
      };

      vi.mocked(llm.invokeLLM)
        .mockResolvedValueOnce(mockPlanResponse as any)
        .mockResolvedValueOnce(mockCodeResponse as any);

      vi.mocked(storage.storagePut).mockResolvedValue(mockStorageResponse as any);

      const task: AgentTask = {
        taskId: "test-app",
        instruction: "Create a simple app",
        taskType: "app",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(result.files?.length).toBe(1);
      expect(result.files?.[0]?.name).toBe("index.html");
    });
  });

  describe("Task Planning", () => {
    it("should create execution plans for tasks", async () => {
      const mockPlanResponse = {
        choices: [
          {
            message: {
              content: "Step 1: Research. Step 2: Execute. Step 3: Verify.",
            },
          },
        ],
      };

      const mockGeneralResponse = {
        choices: [{ message: { content: "Task completed" } }],
      };

      vi.mocked(llm.invokeLLM)
        .mockResolvedValueOnce(mockPlanResponse as any)
        .mockResolvedValueOnce(mockGeneralResponse as any);

      const task: AgentTask = {
        taskId: "test-plan",
        instruction: "Analyze market trends",
        taskType: "general",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(2);
      expect(result.steps[0]?.action).toBe("plan");
      expect(result.steps[0]?.observation).toContain("Research");
    });
  });

  describe("Error Handling", () => {
    it("should handle storage upload failures", async () => {
      const mockPlanResponse = {
        choices: [{ message: { content: "Build website" } }],
      };

      const mockCodeResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ "index.html": "<html></html>" }),
            },
          },
        ],
      };

      vi.mocked(llm.invokeLLM)
        .mockResolvedValueOnce(mockPlanResponse as any)
        .mockResolvedValueOnce(mockCodeResponse as any);

      vi.mocked(storage.storagePut).mockRejectedValue(new Error("Storage failed"));

      const task: AgentTask = {
        taskId: "test-storage-error",
        instruction: "Build a website",
        taskType: "website",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Storage failed");
    });

    it("should handle image generation failures", async () => {
      const mockPlanResponse = {
        choices: [{ message: { content: "Generate design" } }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockPlanResponse as any);
      vi.mocked(imageGen.generateImage).mockRejectedValue(
        new Error("Image generation failed")
      );

      const task: AgentTask = {
        taskId: "test-image-error",
        instruction: "Create a design",
        taskType: "design",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Image generation failed");
    });
  });

  describe("Content Type Detection", () => {
    it("should correctly identify file content types", async () => {
      const mockPlanResponse = {
        choices: [{ message: { content: "Generate files" } }],
      };

      const mockCodeResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                "index.html": "<html></html>",
                "style.css": "body {}",
                "script.js": "console.log('test');",
                "data.json": "{}",
              }),
            },
          },
        ],
      };

      const mockStorageResponse = {
        url: "https://storage.example.com/file",
      };

      vi.mocked(llm.invokeLLM)
        .mockResolvedValueOnce(mockPlanResponse as any)
        .mockResolvedValueOnce(mockCodeResponse as any);

      vi.mocked(storage.storagePut).mockResolvedValue(mockStorageResponse as any);

      const task: AgentTask = {
        taskId: "test-content-types",
        instruction: "Generate project files",
        taskType: "website",
      };

      const result = await executeAgentTask(task);

      expect(result.success).toBe(true);
      expect(storage.storagePut).toHaveBeenCalledWith(
        expect.stringContaining("index.html"),
        expect.any(String),
        "text/html"
      );
      expect(storage.storagePut).toHaveBeenCalledWith(
        expect.stringContaining("style.css"),
        expect.any(String),
        "text/css"
      );
      expect(storage.storagePut).toHaveBeenCalledWith(
        expect.stringContaining("script.js"),
        expect.any(String),
        "application/javascript"
      );
    });
  });
});
