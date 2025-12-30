#!/bin/bash
# Build script for pre-baked Nemotron-3 Nano Docker image
# 
# REQUIREMENTS:
# - Docker with BuildKit support
# - ~150GB free disk space
# - ~32GB RAM recommended
# - 2-4 hours build time
#
# USAGE:
# ./build-prebaked.sh [docker-registry/image-name:tag]
#
# EXAMPLE:
# ./build-prebaked.sh myregistry/notus-nemotron:v1.0.0

set -e

# Configuration
IMAGE_NAME="${1:-notus-nemotron-prebaked:latest}"
MODEL_NAME="nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16"

echo "=============================================="
echo "Building Pre-baked Nemotron-3 Nano Docker Image"
echo "=============================================="
echo "Image: ${IMAGE_NAME}"
echo "Model: ${MODEL_NAME}"
echo ""
echo "WARNING: This build will:"
echo "  - Download ~60GB model weights"
echo "  - Create a ~70GB Docker image"
echo "  - Take 2-4 hours to complete"
echo ""
echo "Press Ctrl+C to cancel, or wait 10 seconds to continue..."
sleep 10

# Enable BuildKit for better caching and secrets support
export DOCKER_BUILDKIT=1

# Check if HuggingFace token is set (optional for public models)
if [ -n "$HF_TOKEN" ]; then
    echo "HuggingFace token detected, using for authentication..."
    docker build \
        -f Dockerfile.prebaked \
        -t "${IMAGE_NAME}" \
        --secret id=HF_TOKEN,env=HF_TOKEN \
        --build-arg MODEL_NAME="${MODEL_NAME}" \
        --progress=plain \
        .
else
    echo "No HuggingFace token set, proceeding without authentication..."
    docker build \
        -f Dockerfile.prebaked \
        -t "${IMAGE_NAME}" \
        --build-arg MODEL_NAME="${MODEL_NAME}" \
        --progress=plain \
        .
fi

echo ""
echo "=============================================="
echo "Build Complete!"
echo "=============================================="
echo "Image: ${IMAGE_NAME}"
echo ""
echo "To push to Docker Hub:"
echo "  docker push ${IMAGE_NAME}"
echo ""
echo "To push to RunPod registry:"
echo "  docker tag ${IMAGE_NAME} runpod.io/YOUR_USERNAME/${IMAGE_NAME}"
echo "  docker push runpod.io/YOUR_USERNAME/${IMAGE_NAME}"
echo ""
echo "Then create a new template in RunPod with this image."
