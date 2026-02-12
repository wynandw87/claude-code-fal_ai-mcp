# fal.ai MCP Server Setup Script for Windows
# Usage: .\setup.ps1 -ApiKey "YOUR_FAL_KEY"
# Installs with 'user' scope (available in all your projects)

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$ErrorActionPreference = "Stop"

Write-Host "fal.ai MCP Server Setup" -ForegroundColor Blue
Write-Host ""

# Check Node.js version
Write-Host "Checking requirements..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>&1
    if ($nodeVersion -match "v(\d+)") {
        $major = [int]$Matches[1]
        if ($major -lt 18) {
            Write-Host "Node.js 18+ is required. Found: $nodeVersion" -ForegroundColor Red
            exit 1
        }
        Write-Host "Node.js $nodeVersion found" -ForegroundColor Green
    }
} catch {
    Write-Host "Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Download it at: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    npm --version | Out-Null
    Write-Host "npm found" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check Claude Code CLI
try {
    claude --version 2>&1 | Out-Null
    Write-Host "Claude Code CLI found" -ForegroundColor Green
} catch {
    Write-Host "Claude Code CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
    exit 1
}

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $scriptDir "dist" "index.js"

# Install dependencies and build
Write-Host ""
Write-Host "Installing dependencies and building..." -ForegroundColor Yellow
Push-Location $scriptDir
npm install --quiet

# Verify build output exists
if (-not (Test-Path $serverPath)) {
    Write-Host "Building server..." -ForegroundColor Yellow
    npm run build
}

Pop-Location

if (-not (Test-Path $serverPath)) {
    Write-Host "Build failed - dist/index.js not found" -ForegroundColor Red
    exit 1
}
Write-Host "Server built successfully" -ForegroundColor Green

# Remove any existing MCP configuration
Write-Host ""
Write-Host "Configuring Claude Code..." -ForegroundColor Yellow
try {
    claude mcp remove fal_ai 2>$null
} catch {
    # Ignore if not exists
}

# Add MCP server with user scope and API key as environment variable
claude mcp add -s user fal_ai -e "FAL_KEY=$ApiKey" -- node $serverPath

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use fal.ai in Claude Code from any directory!" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Restart Claude Code for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "Available tools (22):" -ForegroundColor White
Write-Host "  Image Generation:" -ForegroundColor White
Write-Host "  - generate_image       - Text-to-image (Flux Pro Kontext Max)" -ForegroundColor Gray
Write-Host "  - edit_image           - Edit image with text instructions" -ForegroundColor Gray
Write-Host "  - image_to_image       - Transform image with prompt" -ForegroundColor Gray
Write-Host "  - inpaint              - Fill masked image areas" -ForegroundColor Gray
Write-Host "  - style_transfer       - Apply style from reference image" -ForegroundColor Gray
Write-Host ""
Write-Host "  Video Generation:" -ForegroundColor White
Write-Host "  - text_to_video        - Text-to-video (Kling v3 Pro)" -ForegroundColor Gray
Write-Host "  - image_to_video       - Animate image to video" -ForegroundColor Gray
Write-Host "  - lipsync              - Sync lips to audio" -ForegroundColor Gray
Write-Host "  - avatar_video         - Talking avatar from image + audio" -ForegroundColor Gray
Write-Host ""
Write-Host "  Image/Video Utilities:" -ForegroundColor White
Write-Host "  - upscale_image        - Enhance image resolution (Topaz)" -ForegroundColor Gray
Write-Host "  - upscale_video        - Enhance video resolution (Topaz)" -ForegroundColor Gray
Write-Host "  - remove_background    - Remove image background (Bria)" -ForegroundColor Gray
Write-Host "  - remove_video_background - Remove video background" -ForegroundColor Gray
Write-Host "  - face_swap_image      - Swap face in image" -ForegroundColor Gray
Write-Host "  - face_swap_video      - Swap face in video" -ForegroundColor Gray
Write-Host "  - segment_image        - Object segmentation (SAM 3)" -ForegroundColor Gray
Write-Host "  - estimate_depth       - Depth map estimation" -ForegroundColor Gray
Write-Host ""
Write-Host "  Audio & Music:" -ForegroundColor White
Write-Host "  - generate_music       - Royalty-free music (Beatoven)" -ForegroundColor Gray
Write-Host "  - text_to_speech       - Text to speech (MiniMax)" -ForegroundColor Gray
Write-Host "  - generate_sound_effect - Sound effects (Stable Audio)" -ForegroundColor Gray
Write-Host ""
Write-Host "  3D:" -ForegroundColor White
Write-Host "  - image_to_3d          - Image to 3D model (Tripo3D)" -ForegroundColor Gray
Write-Host "  - retexture_3d         - Retexture 3D model (Meshy-5)" -ForegroundColor Gray
