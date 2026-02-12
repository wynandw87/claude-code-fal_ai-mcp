# fal.ai MCP Server

MCP server that brings fal.ai to Claude Code — 22 tools for image generation, video generation, image/video utilities, audio/music creation, and 3D model generation. Powered by best-in-class models: Flux Pro Kontext, Kling v3, Topaz, Bria, SAM 3, Beatoven, Tripo3D, and more.

## Quick Start

### Step 1: Get Your API Key

1. Go to [fal.ai Dashboard](https://fal.ai/dashboard/keys)
2. Create an account or sign in
3. Generate an API key
4. Copy the key (you'll need it in Step 3)

### Step 2: Install Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Claude Code CLI** - [Installation guide](https://docs.anthropic.com/claude-code)

### Step 3: Install the MCP Server

#### 3.1 Clone the repository

```text
git clone https://github.com/wynandw87/claude-code-fal_ai-mcp.git
cd claude-code-fal_ai-mcp
```

#### 3.2 Install dependencies

**macOS / Linux / Windows:**
```text
npm install
```

> **Note:** Dependencies are installed and the server is built automatically in one step.

#### 3.3 Register with Claude Code

Choose your install scope:

| Scope | Flag | Who can use it |
|-------|------|----------------|
| **User** (recommended) | `-s user` | You, in any project |
| **Project** | `-s project` | Anyone who clones this repo |
| **Local** | `-s local` | Only in current directory |

Replace `YOUR_API_KEY` with your actual fal.ai API key, and use the full path to `dist/index.js`.

> **Tip:** To get the full path, run this from the cloned directory:
> - macOS/Linux: `echo "$(pwd)/dist/index.js"`
> - Windows: `echo %cd%\dist\index.js`

**macOS / Linux:**
```text
claude mcp add -s user fal_ai -e FAL_KEY=YOUR_API_KEY -- node /full/path/to/dist/index.js
```

**Windows (CMD):**
```text
claude mcp add -s user fal_ai -e "FAL_KEY=YOUR_API_KEY" -- node "C:\full\path\to\dist\index.js"
```

**Windows (PowerShell):**
```text
claude mcp add -s user fal_ai -e "FAL_KEY=YOUR_API_KEY" '--' node "C:\full\path\to\dist\index.js"
```

#### Alternative: Use Setup Scripts

The setup scripts handle dependency installation, building, and registration automatically.

**macOS / Linux:**
```text
chmod +x setup.sh
./setup.sh YOUR_API_KEY
```

**Windows (PowerShell):**
```text
.\setup.ps1 -ApiKey YOUR_API_KEY
```

**Or use the npm helper (if API key is set in environment):**
```text
export FAL_KEY=YOUR_API_KEY
npm run install:claude
```

### Step 4: Restart Claude Code

Close and reopen Claude Code for the changes to take effect.

### Step 5: Verify Installation

```text
claude mcp list
```

You should see `fal_ai` listed with a Connected status.

---

## Features

### Image Generation
- **Text-to-Image** (`generate_image`) - Generate images from text using Flux Pro Kontext Max
- **Edit Image** (`edit_image`) - Edit images with natural language instructions using Flux Pro Kontext Max
- **Image-to-Image** (`image_to_image`) - Transform images with text-guided style/content changes using Flux General
- **Inpainting** (`inpaint`) - Fill masked areas of an image using Flux General Inpainting
- **Style Transfer** (`style_transfer`) - Apply styles from reference images using Flux Schnell Redux

### Video Generation
- **Text-to-Video** (`text_to_video`) - Generate video from text descriptions using Kling v3 Pro
- **Image-to-Video** (`image_to_video`) - Animate still images into video using Kling v3 Pro
- **Lipsync** (`lipsync`) - Synchronize video lips to audio using Sync LipSync v2
- **Avatar Video** (`avatar_video`) - Generate talking avatar from portrait + audio using OmniHuman v1.5

### Image & Video Utilities
- **Upscale Image** (`upscale_image`) - Enhance image resolution using Topaz AI
- **Upscale Video** (`upscale_video`) - Enhance video resolution up to 8K using Topaz AI
- **Remove Background** (`remove_background`) - Remove image background using Bria RMBG 2.0
- **Remove Video Background** (`remove_video_background`) - Remove video background using Bria
- **Face Swap Image** (`face_swap_image`) - Swap faces in photos
- **Face Swap Video** (`face_swap_video`) - Swap faces in video clips
- **Segment Image** (`segment_image`) - Detect and segment objects using SAM 3
- **Estimate Depth** (`estimate_depth`) - Generate depth maps using Marigold

### Audio & Music
- **Generate Music** (`generate_music`) - Create royalty-free music using Beatoven
- **Text-to-Speech** (`text_to_speech`) - Convert text to speech using MiniMax Speech-02 HD
- **Sound Effects** (`generate_sound_effect`) - Generate SFX from text using Stable Audio

### 3D
- **Image-to-3D** (`image_to_3d`) - Convert images to 3D models using Tripo3D
- **Retexture 3D** (`retexture_3d`) - Apply new textures to 3D models using Meshy-5

---

## Usage

Once installed, use trigger phrases to invoke fal.ai tools:

| Trigger | Tool | Example |
|---------|------|---------|
| `fal generate image` | generate_image | "fal generate image of a sunset over mountains" |
| `fal edit image` | edit_image | "fal edit image: make the sky purple" |
| `fal image to image` | image_to_image | "fal image to image: convert to watercolor style" |
| `fal inpaint` | inpaint | "fal inpaint: fill the masked area with a cat" |
| `fal style transfer` | style_transfer | "fal style transfer using this reference image" |
| `fal text to video` | text_to_video | "fal text to video: a dragon flying over a castle" |
| `fal image to video` | image_to_video | "fal image to video: animate this landscape" |
| `fal lipsync` | lipsync | "fal lipsync this video to this audio" |
| `fal avatar video` | avatar_video | "fal avatar video from this headshot and audio" |
| `fal upscale image` | upscale_image | "fal upscale image 4x" |
| `fal upscale video` | upscale_video | "fal upscale video 2x" |
| `fal remove background` | remove_background | "fal remove background from this image" |
| `fal face swap` | face_swap_image | "fal face swap these two images" |
| `fal segment` | segment_image | "fal segment the car in this image" |
| `fal depth` | estimate_depth | "fal depth map of this photo" |
| `fal generate music` | generate_music | "fal generate music: upbeat jazz, 30 seconds" |
| `fal text to speech` | text_to_speech | "fal text to speech: Hello world" |
| `fal sound effect` | generate_sound_effect | "fal sound effect: thunder in a canyon" |
| `fal image to 3d` | image_to_3d | "fal image to 3d from this product photo" |
| `fal retexture` | retexture_3d | "fal retexture this 3d model with wood grain" |

Or ask naturally:

- *"Use fal to generate an image of a cyberpunk city at night"*
- *"Create a video from this image using fal"*
- *"Upscale this image with fal"*
- *"Remove the background from this photo using fal"*
- *"Generate 30 seconds of chill lo-fi music with fal"*
- *"Convert this product photo to a 3D model using fal"*

---

## Tool Reference

### generate_image

Generate images from text prompts using Flux Pro Kontext Max.

**Parameters:**
- `prompt` (string, required) - Text prompt describing the image
- `image_size` (string, optional) - `"square_hd"`, `"square"`, `"portrait_4_3"`, `"portrait_16_9"`, `"landscape_4_3"`, `"landscape_16_9"`
- `num_images` (integer, optional) - Number of images (1-4)
- `seed` (integer, optional) - Seed for reproducibility
- `output_format` (string, optional) - `"png"` or `"jpeg"`
- `save_path` (string, optional) - File path to save the image

### edit_image

Edit an existing image with text instructions using Flux Pro Kontext Max.

**Parameters:**
- `prompt` (string, required) - Edit instructions
- `image_url` (string, required) - URL of the source image
- `image_size` (string, optional) - Output size preset
- `seed` (integer, optional) - Seed for reproducibility
- `save_path` (string, optional) - File path to save

### image_to_image

Transform an image with a text prompt using Flux General.

**Parameters:**
- `prompt` (string, required) - Text prompt to guide transformation
- `image_url` (string, required) - URL of the source image
- `strength` (number, optional) - Prompt influence (0.0-1.0, lower preserves original)
- `image_size` (string, optional) - Output size preset
- `num_inference_steps` (integer, optional) - Steps (1-50)
- `seed` (integer, optional) - Seed for reproducibility
- `num_images` (integer, optional) - Number of images (1-4)
- `output_format` (string, optional) - `"png"` or `"jpeg"`
- `save_path` (string, optional) - File path to save

### inpaint

Fill masked areas of an image using Flux General Inpainting.

**Parameters:**
- `prompt` (string, required) - What to generate in the masked area
- `image_url` (string, required) - URL of the source image
- `mask_url` (string, required) - URL of the mask (white = areas to fill)
- `image_size` (string, optional) - Output size preset
- `num_inference_steps` (integer, optional) - Steps (1-50)
- `seed` (integer, optional) - Seed for reproducibility
- `output_format` (string, optional) - `"png"` or `"jpeg"`
- `save_path` (string, optional) - File path to save

### style_transfer

Apply style from a reference image using Flux Schnell Redux.

**Parameters:**
- `image_url` (string, required) - URL of the style reference image
- `image_size` (string, optional) - Output size preset
- `num_inference_steps` (integer, optional) - Steps (1-4)
- `seed` (integer, optional) - Seed for reproducibility
- `num_images` (integer, optional) - Number of images (1-4)
- `save_path` (string, optional) - File path to save

### text_to_video

Generate video from text using Kling v3 Pro.

**Parameters:**
- `prompt` (string, required) - Text description of the video
- `duration` (string, optional) - `"5"` or `"10"` seconds
- `aspect_ratio` (string, optional) - `"16:9"`, `"9:16"`, `"1:1"`
- `negative_prompt` (string, optional) - What to avoid
- `save_path` (string, optional) - File path to save

### image_to_video

Animate an image into video using Kling v3 Pro.

**Parameters:**
- `prompt` (string, required) - Text describing desired motion
- `image_url` (string, required) - URL of the input image
- `duration` (string, optional) - `"5"` or `"10"` seconds
- `aspect_ratio` (string, optional) - `"16:9"`, `"9:16"`, `"1:1"`
- `save_path` (string, optional) - File path to save

### lipsync

Sync video lips to audio using Sync LipSync v2.

**Parameters:**
- `video_url` (string, required) - URL of the video with face
- `audio_url` (string, required) - URL of the audio to sync
- `save_path` (string, optional) - File path to save

### avatar_video

Generate talking avatar from portrait + audio using OmniHuman v1.5.

**Parameters:**
- `image_url` (string, required) - URL of portrait/headshot image
- `audio_url` (string, required) - URL of audio for the avatar to speak
- `save_path` (string, optional) - File path to save

### upscale_image

Enhance image resolution using Topaz AI.

**Parameters:**
- `image_url` (string, required) - URL of the image
- `scale` (number, optional) - Upscale factor (1-8)
- `save_path` (string, optional) - File path to save

### upscale_video

Enhance video resolution using Topaz AI.

**Parameters:**
- `video_url` (string, required) - URL of the video
- `scale` (number, optional) - Upscale factor (1-4)
- `save_path` (string, optional) - File path to save

### remove_background

Remove image background using Bria RMBG 2.0.

**Parameters:**
- `image_url` (string, required) - URL of the image
- `save_path` (string, optional) - File path to save (PNG with transparency)

### remove_video_background

Remove video background using Bria.

**Parameters:**
- `video_url` (string, required) - URL of the video
- `save_path` (string, optional) - File path to save

### face_swap_image

Swap a face in an image.

**Parameters:**
- `base_image_url` (string, required) - URL of target image (face to replace)
- `swap_image_url` (string, required) - URL of source face image
- `save_path` (string, optional) - File path to save

### face_swap_video

Swap a face throughout a video.

**Parameters:**
- `base_video_url` (string, required) - URL of target video
- `swap_image_url` (string, required) - URL of source face image
- `save_path` (string, optional) - File path to save

### segment_image

Detect and segment objects using SAM 3.

**Parameters:**
- `image_url` (string, required) - URL of the image
- `prompt` (string, optional) - Text to guide which objects to segment
- `save_path` (string, optional) - File path to save mask

### estimate_depth

Generate a depth map using Marigold.

**Parameters:**
- `image_url` (string, required) - URL of the image
- `save_path` (string, optional) - File path to save depth map

### generate_music

Generate royalty-free music using Beatoven.

**Parameters:**
- `prompt` (string, required) - Description of genre, mood, tempo, instruments
- `duration` (number, optional) - Duration in seconds
- `save_path` (string, optional) - File path to save

### text_to_speech

Convert text to speech using MiniMax Speech-02 HD.

**Parameters:**
- `text` (string, required) - Text to convert
- `voice_id` (string, optional) - Voice ID
- `speed` (number, optional) - Speed multiplier (0.5-2.0)
- `save_path` (string, optional) - File path to save

### generate_sound_effect

Generate sound effects using Stable Audio.

**Parameters:**
- `prompt` (string, required) - Description of the sound effect
- `duration_seconds` (number, optional) - Duration in seconds
- `save_path` (string, optional) - File path to save

### image_to_3d

Convert an image to a 3D model using Tripo3D.

**Parameters:**
- `image_url` (string, required) - URL of the image
- `save_path` (string, optional) - File path to save (GLB format)

### retexture_3d

Apply new textures to a 3D model using Meshy-5.

**Parameters:**
- `model_url` (string, required) - URL of the 3D model (GLB/OBJ)
- `prompt` (string, required) - Description of desired texture
- `reference_image_url` (string, optional) - Reference image for texture style
- `save_path` (string, optional) - File path to save

---

## Models Used

| Tool | Model | Provider |
|------|-------|----------|
| generate_image, edit_image | Flux Pro Kontext Max | Black Forest Labs |
| image_to_image | Flux General | Black Forest Labs |
| inpaint | Flux General Inpainting | Black Forest Labs |
| style_transfer | Flux Schnell Redux | Black Forest Labs |
| text_to_video, image_to_video | Kling v3 Pro | Kuaishou |
| lipsync | Sync LipSync v2 | Sync Labs |
| avatar_video | OmniHuman v1.5 | ByteDance |
| upscale_image, upscale_video | Topaz AI | Topaz Labs |
| remove_background | Bria RMBG 2.0 | Bria AI |
| remove_video_background | Bria Video BG Removal | Bria AI |
| face_swap_image, face_swap_video | AI-FaceSwap | fal.ai |
| segment_image | SAM 3 | Meta |
| estimate_depth | Marigold Depth | ETH Zurich |
| generate_music | Beatoven | Beatoven AI |
| text_to_speech | MiniMax Speech-02 HD | MiniMax |
| generate_sound_effect | Stable Audio | Stability AI |
| image_to_3d | Tripo3D v2 | Tripo |
| retexture_3d | Meshy-5 Retexture | Meshy |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FAL_KEY` | Yes | — | fal.ai API key |
| `FAL_TIMEOUT` | No | `120000` | API timeout in ms |
| `FAL_OUTPUT_DIR` | No | `./generated-media` | Directory for auto-saved files |

---

## How It Works

This MCP server uses the official `@fal-ai/client` SDK to communicate with fal.ai's model endpoints. It connects to Claude Code via stdio transport. All generated media (images, videos, audio, 3D models) is automatically downloaded and saved locally.

---

## Troubleshooting

### Fix API Key

If you entered the wrong API key, remove and reinstall:

```text
claude mcp remove fal_ai
```

Then reinstall using the command from Step 3.3 above (use the same scope you originally installed with).

### MCP Server Not Showing Up

Check if the server is installed:

```text
claude mcp list
```

If not listed, follow Step 3 to install it.

### Server Won't Start

1. **Verify your API key** is valid at [fal.ai Dashboard](https://fal.ai/dashboard/keys)

2. **Check Node.js version** (needs 18+):
   ```text
   node --version
   ```

3. **Ensure the server was built** — if `dist/index.js` is missing, run `npm install` again

### Connection Errors

1. **Check that `dist/index.js` exists** — if not, run `npm install`
2. **Verify the path is absolute** in your `claude mcp add` command
3. **Restart Claude Code** after any configuration changes

### Timeout Errors

- Video, audio, and 3D tools use extended timeouts (up to 5x base)
- Increase `FAL_TIMEOUT` environment variable for slow connections or large tasks

### View Current Configuration

```text
claude mcp list
```

---

## Contributing

Pull requests welcome! Please keep it simple and beginner-friendly.

## License

MIT

---

Made for the Claude Code community
