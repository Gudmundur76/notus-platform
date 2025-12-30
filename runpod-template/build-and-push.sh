#!/bin/bash
# Notus Universe - Build and Push Docker Image to RunPod Registry
#
# This script builds the Nemotron-3 Nano container and pushes it to
# RunPod's container registry for serverless deployment.
#
# Prerequisites:
# 1. Docker installed and running
# 2. RunPod account with registry access
# 3. HuggingFace token (for model download during build)
#
# Usage:
#   ./build-and-push.sh
#
# Note: Building this image requires significant resources:
# - ~100GB disk space (model is ~60GB)
# - ~32GB RAM recommended
# - 2-4 hours build time (model download + layer creation)

set -e

# Configuration
IMAGE_NAME="notus-universe-nemotron"
IMAGE_TAG="v1.0.0"
REGISTRY="docker.io"  # Or your preferred registry

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Notus Universe - Sovereign AI Container Builder        ║${NC}"
echo -e "${GREEN}║     NVIDIA Nemotron-3 Nano 30B-A3B-BF16 on vLLM            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for HuggingFace token
if [ -z "$HF_TOKEN" ]; then
    echo -e "${YELLOW}Warning: HF_TOKEN not set. Model download may fail for gated models.${NC}"
    echo "Set it with: export HF_TOKEN=your_token_here"
fi

# Build the Docker image
echo -e "${GREEN}[1/3] Building Docker image...${NC}"
echo "This will download the Nemotron-3 Nano model (~60GB) during build."
echo "Estimated time: 2-4 hours depending on network speed."
echo ""

docker build \
    --build-arg HF_TOKEN=${HF_TOKEN:-""} \
    -t ${IMAGE_NAME}:${IMAGE_TAG} \
    -t ${IMAGE_NAME}:latest \
    .

echo -e "${GREEN}[2/3] Build complete!${NC}"
echo ""

# Tag for registry
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${FULL_IMAGE_NAME}

echo -e "${GREEN}[3/3] Pushing to registry...${NC}"
echo "Pushing ${FULL_IMAGE_NAME}"
echo "This may take a while due to image size (~70GB)."
echo ""

# Uncomment to push (requires docker login first)
# docker push ${FULL_IMAGE_NAME}
# docker push ${REGISTRY}/${IMAGE_NAME}:latest

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Push to registry: docker push ${FULL_IMAGE_NAME}"
echo "2. Create RunPod template with this image"
echo "3. Deploy serverless endpoint"
echo ""
echo "Image details:"
echo "  Name: ${IMAGE_NAME}"
echo "  Tag: ${IMAGE_TAG}"
echo "  Full: ${FULL_IMAGE_NAME}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
