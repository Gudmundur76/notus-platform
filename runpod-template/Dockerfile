# Notus Universe - Sovereign AI Worker
# Nemotron-3 Nano 30B-A3B-BF16 on vLLM for RunPod Serverless
# 
# This Dockerfile creates a production-ready container with the model
# pre-downloaded for fast cold starts (~2-3 min vs 10-15 min)

FROM runpod/pytorch:2.2.0-py3.10-cuda12.1.1-devel-ubuntu22.04

LABEL maintainer="Notus Universe - Cyberg ehf"
LABEL description="Sovereign AI Worker with NVIDIA Nemotron-3 Nano for Christian digital society"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    MODEL_NAME="nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16" \
    HF_HOME=/workspace/huggingface \
    TRANSFORMERS_CACHE=/workspace/huggingface/transformers \
    HF_HUB_ENABLE_HF_TRANSFER=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    vllm>=0.6.0 \
    runpod>=1.6.0 \
    huggingface_hub[hf_transfer] \
    transformers \
    accelerate \
    torch \
    sentencepiece \
    protobuf

# Create workspace directory
WORKDIR /workspace

# Pre-download the model during build (this is the key optimization)
# This bakes the model into the image for fast cold starts
RUN python3 -c "from huggingface_hub import snapshot_download; \
    snapshot_download( \
        repo_id='nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16', \
        cache_dir='/workspace/huggingface', \
        local_dir='/workspace/model', \
        local_dir_use_symlinks=False \
    )"

# Copy the handler script
COPY handler.py /workspace/handler.py

# Set the entrypoint
CMD ["python3", "-u", "/workspace/handler.py"]
