# Notus Universe - Sovereign AI Worker

Custom Docker template for deploying NVIDIA Nemotron-3 Nano 30B-A3B-BF16 on RunPod Serverless.

## Overview

This template creates a production-ready container with the Nemotron-3 Nano model pre-baked for fast cold starts. The model is a hybrid Mamba-2 + Transformer MoE architecture optimized for efficient inference.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Notus Universe                           │
│                  Sovereign AI Worker                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │   RunPod        │    │     vLLM Engine                 ││
│  │   Handler       │───▶│  Nemotron-3 Nano 30B-A3B-BF16   ││
│  │   (handler.py)  │    │  (Pre-downloaded in /workspace) ││
│  └─────────────────┘    └─────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Base: runpod/pytorch:2.2.0-py3.10-cuda12.1.1-devel        │
│  GPU: NVIDIA A100/H100/A40 (80GB recommended)               │
│  Memory: 48GB+ GPU VRAM                                     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Option A: Use Pre-built Image (Recommended)

1. Go to RunPod Console → Serverless → Templates
2. Create new template with:
   - **Container Image**: `cybergiceland/notus-nemotron:v1.0.0`
   - **Container Disk**: 100 GB
   - **Volume Disk**: 0 GB (model is baked in)

### Option B: Build Your Own Image

```bash
# Set HuggingFace token (if model is gated)
export HF_TOKEN=your_token_here

# Build the image (takes 2-4 hours)
docker build -t notus-nemotron:v1.0.0 .

# Push to your registry
docker tag notus-nemotron:v1.0.0 your-registry/notus-nemotron:v1.0.0
docker push your-registry/notus-nemotron:v1.0.0
```

## API Reference

### Chat Completion

The handler accepts OpenAI-compatible chat completion requests:

```json
{
  "input": {
    "messages": [
      {"role": "system", "content": "You are a wise counselor guided by KJV scripture."},
      {"role": "user", "content": "What does the Bible say about wisdom?"}
    ],
    "temperature": 0.7,
    "max_tokens": 2048,
    "top_p": 0.9
  }
}
```

### Response Format

```json
{
  "id": "notus-abc123",
  "object": "chat.completion",
  "model": "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The Book of Proverbs speaks extensively about wisdom..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 128,
    "total_tokens": 173
  }
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| messages | array | required | Chat messages with role and content |
| temperature | float | 0.7 | Sampling temperature (0.0-2.0) |
| max_tokens | int | 2048 | Maximum tokens to generate |
| top_p | float | 0.9 | Nucleus sampling probability |
| top_k | int | 50 | Top-k sampling |
| stop | array | ["</s>"] | Stop sequences |
| presence_penalty | float | 0.0 | Presence penalty (-2.0 to 2.0) |
| frequency_penalty | float | 0.0 | Frequency penalty (-2.0 to 2.0) |

## GPU Requirements

| GPU | VRAM | Status |
|-----|------|--------|
| NVIDIA A100 80GB | 80GB | ✅ Recommended |
| NVIDIA H100 80GB | 80GB | ✅ Optimal |
| NVIDIA A40 | 48GB | ⚠️ May need quantization |
| NVIDIA A100 40GB | 40GB | ❌ Insufficient |

## Cold Start Performance

| Configuration | Cold Start Time |
|---------------|-----------------|
| Model pre-baked (this template) | ~2-3 minutes |
| Model downloaded at runtime | ~10-15 minutes |

## Compliance

This worker is designed for the Notus Universe platform and complies with:
- GDPR (General Data Protection Regulation)
- EU AI Act
- Iceland AI Action Plan 2025-2027
- KJV Biblical Ethics Framework

## Files

```
runpod-template/
├── Dockerfile          # Container definition with model pre-download
├── handler.py          # RunPod serverless handler
├── build-and-push.sh   # Build automation script
└── README.md           # This file
```

## Integration with Notus Universe

The worker integrates with the Notus Universe platform through the RunPod service:

```typescript
// server/runpod-service.ts
const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/runsync`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: {
      messages: [
        { role: 'system', content: agentPersona.systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2048
    }
  })
});
```

## License

Proprietary - Cyberg ehf (Iceland). All rights reserved.

## Support

For issues related to this template, contact the Notus Universe development team.
