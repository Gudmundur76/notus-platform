"""
Notus Universe - Sovereign AI Worker Handler
NVIDIA Nemotron-3 Nano 30B-A3B-BF16 on vLLM

This handler provides an OpenAI-compatible API for the Notus Universe
agent community, enabling democratic deliberation and KJV-guided responses.

Author: Cyberg ehf (Iceland)
License: Proprietary - All rights reserved
"""

import os
import runpod
from vllm import LLM, SamplingParams
from vllm.entrypoints.openai.serving_chat import OpenAIServingChat
from vllm.entrypoints.openai.protocol import ChatCompletionRequest
import json
import asyncio

# Model configuration
MODEL_PATH = "/workspace/model"
MODEL_NAME = os.environ.get("MODEL_NAME", "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16")

# Initialize the model globally for reuse across requests
print(f"[Notus Universe] Initializing Sovereign AI: {MODEL_NAME}")
print(f"[Notus Universe] Loading from: {MODEL_PATH}")

# vLLM engine configuration optimized for Nemotron-3 Nano
# The model uses hybrid Mamba-2 + Transformer MoE architecture
llm = LLM(
    model=MODEL_PATH,
    trust_remote_code=True,
    tensor_parallel_size=1,  # Adjust based on GPU count
    gpu_memory_utilization=0.90,
    max_model_len=8192,  # Nemotron-3 Nano supports up to 128K but we limit for memory
    dtype="bfloat16",
    enforce_eager=False,  # Enable CUDA graphs for performance
)

print("[Notus Universe] Sovereign AI initialized successfully!")


def generate_response(messages: list, params: dict) -> dict:
    """
    Generate a response using the Nemotron-3 Nano model.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        params: Generation parameters (temperature, max_tokens, etc.)
    
    Returns:
        OpenAI-compatible response dict
    """
    # Build the prompt from messages
    prompt_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "system":
            prompt_parts.append(f"<|system|>\n{content}</s>")
        elif role == "user":
            prompt_parts.append(f"<|user|>\n{content}</s>")
        elif role == "assistant":
            prompt_parts.append(f"<|assistant|>\n{content}</s>")
    
    # Add assistant prompt for generation
    prompt_parts.append("<|assistant|>\n")
    prompt = "".join(prompt_parts)
    
    # Configure sampling parameters
    sampling_params = SamplingParams(
        temperature=params.get("temperature", 0.7),
        top_p=params.get("top_p", 0.9),
        top_k=params.get("top_k", 50),
        max_tokens=params.get("max_tokens", 2048),
        stop=params.get("stop", ["</s>", "<|user|>", "<|system|>"]),
        presence_penalty=params.get("presence_penalty", 0.0),
        frequency_penalty=params.get("frequency_penalty", 0.0),
    )
    
    # Generate response
    outputs = llm.generate([prompt], sampling_params)
    generated_text = outputs[0].outputs[0].text.strip()
    
    # Calculate token usage
    prompt_tokens = len(outputs[0].prompt_token_ids)
    completion_tokens = len(outputs[0].outputs[0].token_ids)
    
    # Return OpenAI-compatible response
    return {
        "id": f"notus-{outputs[0].request_id}",
        "object": "chat.completion",
        "model": MODEL_NAME,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": generated_text
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    }


def handler(job: dict) -> dict:
    """
    RunPod serverless handler function.
    
    Accepts OpenAI-compatible chat completion requests.
    
    Input format:
    {
        "input": {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
            ],
            "temperature": 0.7,
            "max_tokens": 2048,
            "top_p": 0.9,
            "stop": ["</s>"]
        }
    }
    """
    job_input = job.get("input", {})
    
    # Extract messages (required)
    messages = job_input.get("messages", [])
    if not messages:
        return {"error": "No messages provided in request"}
    
    # Extract optional parameters
    params = {
        "temperature": job_input.get("temperature", 0.7),
        "max_tokens": job_input.get("max_tokens", 2048),
        "top_p": job_input.get("top_p", 0.9),
        "top_k": job_input.get("top_k", 50),
        "stop": job_input.get("stop", ["</s>", "<|user|>", "<|system|>"]),
        "presence_penalty": job_input.get("presence_penalty", 0.0),
        "frequency_penalty": job_input.get("frequency_penalty", 0.0),
    }
    
    try:
        response = generate_response(messages, params)
        return response
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }


# Health check endpoint
def health_check():
    """Return model status for health checks."""
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "model_path": MODEL_PATH,
        "platform": "Notus Universe - Sovereign AI",
        "jurisdiction": "Iceland",
        "compliance": ["GDPR", "EU AI Act", "Iceland AI Action Plan 2025-2027"]
    }


# Start the RunPod serverless worker
if __name__ == "__main__":
    print("[Notus Universe] Starting Sovereign AI Worker...")
    print("[Notus Universe] Ready to serve the agent community!")
    runpod.serverless.start({
        "handler": handler,
        "return_aggregate_stream": True
    })
