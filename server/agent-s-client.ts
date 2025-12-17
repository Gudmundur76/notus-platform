/**
 * Agent-S Client
 * TypeScript client for communicating with the Agent-S Python bridge service
 */

import axios, { AxiosInstance } from "axios";

const AGENT_S_BRIDGE_URL = process.env.AGENT_S_BRIDGE_URL || "http://localhost:8001";

export interface AgentSTaskRequest {
  task_id: string;
  description: string;
  max_steps?: number;
  enable_reflection?: boolean;
  enable_local_env?: boolean;
}

export interface AgentSTaskStatus {
  task_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  current_step: number;
  total_steps: number;
  message: string;
  screenshot?: string;
  trajectory: Array<{
    step: number;
    action: string;
    timestamp: string;
    screenshot?: string;
  }>;
}

export interface AgentSHealthResponse {
  status: string;
  version: string;
  agent_s_available: boolean;
  tesseract_available: boolean;
}

class AgentSClient {
  private client: AxiosInstance;

  constructor(baseURL: string = AGENT_S_BRIDGE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Check if Agent-S bridge is healthy and available
   */
  async checkHealth(): Promise<AgentSHealthResponse> {
    try {
      const response = await this.client.get<AgentSHealthResponse>("/health");
      return response.data;
    } catch (error) {
      console.error("[Agent-S] Health check failed:", error);
      throw new Error("Agent-S bridge is not available");
    }
  }

  /**
   * Execute a GUI automation task using Agent-S
   */
  async executeTask(request: AgentSTaskRequest): Promise<{ success: boolean; task_id: string; message: string }> {
    try {
      const response = await this.client.post("/api/agent-s/execute", request);
      return response.data;
    } catch (error) {
      console.error("[Agent-S] Task execution failed:", error);
      throw error;
    }
  }

  /**
   * Get the current status of a task
   */
  async getTaskStatus(taskId: string): Promise<AgentSTaskStatus> {
    try {
      const response = await this.client.get<AgentSTaskStatus>(`/api/agent-s/status/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("[Agent-S] Failed to get task status:", error);
      throw error;
    }
  }

  /**
   * Get current screenshot
   */
  async getScreenshot(): Promise<{ success: boolean; screenshot: string; timestamp: string }> {
    try {
      const response = await this.client.get("/api/agent-s/screenshot");
      return response.data;
    } catch (error) {
      console.error("[Agent-S] Failed to get screenshot:", error);
      throw error;
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.delete(`/api/agent-s/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("[Agent-S] Failed to cancel task:", error);
      throw error;
    }
  }

  /**
   * Poll task status until completion or failure
   */
  async waitForCompletion(
    taskId: string,
    options: {
      pollInterval?: number;
      maxWaitTime?: number;
      onProgress?: (status: AgentSTaskStatus) => void;
    } = {}
  ): Promise<AgentSTaskStatus> {
    const { pollInterval = 2000, maxWaitTime = 300000, onProgress } = options;
    const startTime = Date.now();

    while (true) {
      const status = await this.getTaskStatus(taskId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === "completed" || status.status === "failed" || status.status === "cancelled") {
        return status;
      }

      if (Date.now() - startTime > maxWaitTime) {
        throw new Error("Task execution timeout");
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
}

// Export singleton instance
export const agentSClient = new AgentSClient();

// Export class for custom instances
export { AgentSClient };
