#!/bin/bash
# fal.ai MCP Server Setup Script
# Usage: ./setup.sh YOUR_FAL_KEY
# Installs with 'user' scope (available in all your projects)

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${BLUE}fal.ai MCP Server Setup${NC}"
echo ""

# Check if API key was provided
API_KEY="$1"
if [ -z "$API_KEY" ]; then
    echo -e "${RED}Please provide your fal.ai API key${NC}"
    echo "Usage: ./setup.sh YOUR_FAL_KEY"
    echo ""
    echo "Get an API key at: https://fal.ai/dashboard/keys"
    exit 1
fi

# Check Node.js version
echo "Checking requirements..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not installed.${NC}"
    echo "Download it at: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$MAJOR" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ is required. Found: v$NODE_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js v$NODE_VERSION found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is required but not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found${NC}"

# Check Claude Code
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Claude Code CLI not found. Please install it first:${NC}"
    echo "npm install -g @anthropic-ai/claude-code"
    exit 1
fi
echo -e "${GREEN}✓ Claude Code CLI found${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install dependencies and build
echo ""
echo "Installing dependencies and building..."
cd "$SCRIPT_DIR"
npm install --quiet

# Verify build output exists
if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "Building server..."
    npm run build
fi

if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo -e "${RED}Build failed — dist/index.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server built successfully${NC}"

# Remove any existing MCP configuration
echo ""
echo "Configuring Claude Code..."
claude mcp remove fal_ai 2>/dev/null || true

# Add MCP server with user scope and API key as environment variable
claude mcp add -s user fal_ai -e "FAL_KEY=$API_KEY" -- node "$SCRIPT_DIR/dist/index.js"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "You can now use fal.ai in Claude Code from any directory!"
echo ""
echo -e "${YELLOW}IMPORTANT: Restart Claude Code for changes to take effect.${NC}"
echo ""
echo -e "${WHITE}Available tools (22):${NC}"
echo ""
echo -e "${WHITE}  Image Generation:${NC}"
echo -e "${GRAY}  • generate_image       - Text-to-image (Flux Pro Kontext Max)${NC}"
echo -e "${GRAY}  • edit_image           - Edit image with text instructions${NC}"
echo -e "${GRAY}  • image_to_image       - Transform image with prompt${NC}"
echo -e "${GRAY}  • inpaint              - Fill masked image areas${NC}"
echo -e "${GRAY}  • style_transfer       - Apply style from reference image${NC}"
echo ""
echo -e "${WHITE}  Video Generation:${NC}"
echo -e "${GRAY}  • text_to_video        - Text-to-video (Kling v3 Pro)${NC}"
echo -e "${GRAY}  • image_to_video       - Animate image to video${NC}"
echo -e "${GRAY}  • lipsync              - Sync lips to audio${NC}"
echo -e "${GRAY}  • avatar_video         - Talking avatar from image + audio${NC}"
echo ""
echo -e "${WHITE}  Image/Video Utilities:${NC}"
echo -e "${GRAY}  • upscale_image        - Enhance image resolution (Topaz)${NC}"
echo -e "${GRAY}  • upscale_video        - Enhance video resolution (Topaz)${NC}"
echo -e "${GRAY}  • remove_background    - Remove image background (Bria)${NC}"
echo -e "${GRAY}  • remove_video_background - Remove video background${NC}"
echo -e "${GRAY}  • face_swap_image      - Swap face in image${NC}"
echo -e "${GRAY}  • face_swap_video      - Swap face in video${NC}"
echo -e "${GRAY}  • segment_image        - Object segmentation (SAM 3)${NC}"
echo -e "${GRAY}  • estimate_depth       - Depth map estimation${NC}"
echo ""
echo -e "${WHITE}  Audio & Music:${NC}"
echo -e "${GRAY}  • generate_music       - Royalty-free music (Beatoven)${NC}"
echo -e "${GRAY}  • text_to_speech       - Text to speech (MiniMax)${NC}"
echo -e "${GRAY}  • generate_sound_effect - Sound effects (Stable Audio)${NC}"
echo ""
echo -e "${WHITE}  3D:${NC}"
echo -e "${GRAY}  • image_to_3d          - Image to 3D model (Tripo3D)${NC}"
echo -e "${GRAY}  • retexture_3d         - Retexture 3D model (Meshy-5)${NC}"
