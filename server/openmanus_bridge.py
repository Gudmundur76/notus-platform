#!/usr/bin/env python3
"""
OpenManus Bridge Service
Provides HTTP API to interact with OpenManus Python agent from Node.js
"""

import sys
import os
import json
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn

# Add OpenManus to path
sys.path.insert(0, '/home/ubuntu/OpenManus')

# Import OpenManus components
try:
    from app.agent import ReActAgent
    from app.config import Config
except ImportError as e:
    print(f"Error importing OpenManus: {e}")
    print("Make sure OpenManus is installed and configured properly")
    sys.exit(1)

app = FastAPI(title="OpenManus Bridge", version="1.0.0")

# Initialize OpenManus agent
config = Config()
agent = None

class TaskRequest(BaseModel):
    task: str
    task_type: Optional[str] = "general"
    context: Optional[Dict[str, Any]] = {}

class TaskResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    files: Optional[list] = []

@app.on_event("startup")
async def startup_event():
    """Initialize OpenManus agent on startup"""
    global agent
    try:
        agent = ReActAgent(config)
        print("OpenManus ReActAgent initialized successfully")
    except Exception as e:
        print(f"Failed to initialize OpenManus agent: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent_ready": agent is not None
    }

@app.post("/execute", response_model=TaskResponse)
async def execute_task(request: TaskRequest):
    """
    Execute a task using OpenManus agent
    """
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        # Execute task with OpenManus
        result = await agent.run(request.task)
        
        # Extract result and files
        result_text = str(result) if result else "Task completed"
        files = []
        
        # Check for generated files in workspace
        workspace_path = "/home/ubuntu/OpenManus/workspace"
        if os.path.exists(workspace_path):
            for file in os.listdir(workspace_path):
                file_path = os.path.join(workspace_path, file)
                if os.path.isfile(file_path):
                    files.append(file_path)
        
        return TaskResponse(
            success=True,
            result=result_text,
            files=files
        )
    
    except Exception as e:
        return TaskResponse(
            success=False,
            error=str(e)
        )

@app.post("/chat")
async def chat(request: TaskRequest):
    """
    Chat with OpenManus agent (streaming not implemented yet)
    """
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        result = await agent.run(request.task)
        return {
            "success": True,
            "response": str(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run on port 8001 to avoid conflict with main app
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
