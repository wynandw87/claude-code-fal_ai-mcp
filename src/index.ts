#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './config.js';
import { createFalClient } from './fal-client.js';

async function main() {
  try {
    const config = loadConfig();
    const client = createFalClient(config);

    const server = new Server(
      { name: 'fal-ai-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Helper: download a URL to a local file
    async function downloadFile(url: string, savePath: string): Promise<string> {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(savePath, buffer);
      return savePath;
    }

    // Helper: auto save path
    function getAutoSavePath(prefix: string, ext: string): string {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${prefix}-${timestamp}.${ext}`;
      return path.resolve(config.outputDir, filename);
    }

    // Helper: extract image URLs from result
    function extractImageUrls(data: any): string[] {
      if (data.images && Array.isArray(data.images)) {
        return data.images.map((img: any) => img.url || img).filter(Boolean);
      }
      if (data.image?.url) return [data.image.url];
      if (data.image_url) return [data.image_url];
      if (data.output?.url) return [data.output.url];
      if (data.url) return [data.url];
      return [];
    }

    // Helper: extract video URL from result
    function extractVideoUrl(data: any): string | null {
      if (data.video?.url) return data.video.url;
      if (data.video_url) return data.video_url;
      if (data.output?.url) return data.output.url;
      if (data.url) return data.url;
      return null;
    }

    // Helper: extract audio URL from result
    function extractAudioUrl(data: any): string | null {
      if (data.audio?.url) return data.audio.url;
      if (data.audio_url) return data.audio_url;
      if (data.audio_file?.url) return data.audio_file.url;
      if (data.output?.url) return data.output.url;
      if (data.url) return data.url;
      return null;
    }

    // Helper: extract 3D model URL from result
    function extract3DUrl(data: any): string | null {
      if (data.model?.url) return data.model.url;
      if (data.model_url) return data.model_url;
      if (data.mesh?.url) return data.mesh.url;
      if (data.output?.url) return data.output.url;
      if (data.glb?.url) return data.glb.url;
      if (data.url) return data.url;
      return null;
    }

    // Register tools/list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // ─── Image Generation ───
          {
            name: 'generate_image',
            description: 'Generate images from text prompts using Flux Pro Kontext Max. Returns high-quality images with excellent prompt adherence and typography support.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Text prompt describing the image to generate' },
                image_size: { type: 'string', description: 'Image size preset: "square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
                num_images: { type: 'integer', description: 'Number of images to generate (1-4)', minimum: 1, maximum: 4 },
                seed: { type: 'integer', description: 'Seed for reproducible generation' },
                output_format: { type: 'string', description: 'Output format: "png" or "jpeg"', enum: ['png', 'jpeg'] },
                save_path: { type: 'string', description: 'File path to save the image. If not provided, auto-saves to output directory.' }
              },
              required: ['prompt']
            }
          },
          {
            name: 'edit_image',
            description: 'Edit an existing image using text instructions with Flux Pro Kontext Max. Supports local edits, style changes, object addition/removal, and scene transforms.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Edit instructions describing what changes to make' },
                image_url: { type: 'string', description: 'URL of the source image to edit' },
                image_size: { type: 'string', description: 'Output image size preset', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
                seed: { type: 'integer', description: 'Seed for reproducible generation' },
                save_path: { type: 'string', description: 'File path to save the edited image' }
              },
              required: ['prompt', 'image_url']
            }
          },
          {
            name: 'image_to_image',
            description: 'Transform an image using a text prompt with Flux General. Applies style, content, or structural changes guided by the prompt while preserving aspects of the original.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Text prompt to guide the transformation' },
                image_url: { type: 'string', description: 'URL of the source image' },
                strength: { type: 'number', description: 'Prompt influence strength (0.0-1.0). Lower preserves more of the original.', minimum: 0, maximum: 1 },
                image_size: { type: 'string', description: 'Output image size preset', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
                num_inference_steps: { type: 'integer', description: 'Number of inference steps (1-50)', minimum: 1, maximum: 50 },
                seed: { type: 'integer', description: 'Seed for reproducible generation' },
                num_images: { type: 'integer', description: 'Number of images to generate (1-4)', minimum: 1, maximum: 4 },
                output_format: { type: 'string', description: 'Output format', enum: ['png', 'jpeg'] },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['prompt', 'image_url']
            }
          },
          {
            name: 'inpaint',
            description: 'Fill in masked areas of an image using Flux General Inpainting. Provide an image, a mask (white = areas to fill), and a prompt describing what to generate in the masked region.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Text prompt describing what to generate in the masked area' },
                image_url: { type: 'string', description: 'URL of the source image' },
                mask_url: { type: 'string', description: 'URL of the mask image (white areas = regions to inpaint)' },
                image_size: { type: 'string', description: 'Output image size preset', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
                num_inference_steps: { type: 'integer', description: 'Number of inference steps', minimum: 1, maximum: 50 },
                seed: { type: 'integer', description: 'Seed for reproducible generation' },
                output_format: { type: 'string', description: 'Output format', enum: ['png', 'jpeg'] },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['prompt', 'image_url', 'mask_url']
            }
          },
          {
            name: 'style_transfer',
            description: 'Apply the style of a reference image to generate a new image using Flux Schnell Redux. Fast style transformation with high-quality output.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of the style reference image' },
                image_size: { type: 'string', description: 'Output image size preset', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
                num_inference_steps: { type: 'integer', description: 'Number of inference steps (1-4)', minimum: 1, maximum: 4 },
                seed: { type: 'integer', description: 'Seed for reproducible generation' },
                num_images: { type: 'integer', description: 'Number of images to generate', minimum: 1, maximum: 4 },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['image_url']
            }
          },

          // ─── Video Generation ───
          {
            name: 'text_to_video',
            description: 'Generate video from a text prompt using Kling v3 Pro. Top-tier cinematic quality with fluid motion, precise prompt adherence, and optional audio.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Text prompt describing the video content, scene, motion, and camera movement' },
                duration: { type: 'string', description: 'Video duration in seconds: "5" or "10"', enum: ['5', '10'] },
                aspect_ratio: { type: 'string', description: 'Aspect ratio: "16:9", "9:16", "1:1"', enum: ['16:9', '9:16', '1:1'] },
                negative_prompt: { type: 'string', description: 'What to avoid in the video' },
                save_path: { type: 'string', description: 'File path to save the video' }
              },
              required: ['prompt']
            }
          },
          {
            name: 'image_to_video',
            description: 'Animate a still image into video using Kling v3 Pro. Generates cinematic video with natural motion from an input image and text prompt.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Text prompt describing the desired motion and scene' },
                image_url: { type: 'string', description: 'URL of the input image to animate' },
                duration: { type: 'string', description: 'Video duration: "5" or "10"', enum: ['5', '10'] },
                aspect_ratio: { type: 'string', description: 'Aspect ratio: "16:9", "9:16", "1:1"', enum: ['16:9', '9:16', '1:1'] },
                save_path: { type: 'string', description: 'File path to save the video' }
              },
              required: ['prompt', 'image_url']
            }
          },
          {
            name: 'lipsync',
            description: 'Synchronize lips in a video to match an audio track using Sync LipSync v2. The video character will appear to speak the audio naturally.',
            inputSchema: {
              type: 'object',
              properties: {
                video_url: { type: 'string', description: 'URL of the video containing the face to lipsync' },
                audio_url: { type: 'string', description: 'URL of the audio to sync lips to' },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['video_url', 'audio_url']
            }
          },
          {
            name: 'avatar_video',
            description: 'Generate a realistic talking avatar video from a portrait image and audio using ByteDance OmniHuman v1.5. Creates natural head movement, gestures, and lip sync.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of a portrait/headshot image of the person' },
                audio_url: { type: 'string', description: 'URL of the audio the avatar should speak' },
                save_path: { type: 'string', description: 'File path to save the video' }
              },
              required: ['image_url', 'audio_url']
            }
          },

          // ─── Image Utilities ───
          {
            name: 'upscale_image',
            description: 'Upscale and enhance image resolution using Topaz AI. Increases quality and detail while preserving sharpness.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of the image to upscale' },
                scale: { type: 'number', description: 'Upscale factor (e.g., 2 for 2x, 4 for 4x)', minimum: 1, maximum: 8 },
                save_path: { type: 'string', description: 'File path to save the upscaled image' }
              },
              required: ['image_url']
            }
          },
          {
            name: 'upscale_video',
            description: 'Upscale and enhance video resolution using Topaz AI. Professional-grade video upscaling up to 8K with temporal consistency.',
            inputSchema: {
              type: 'object',
              properties: {
                video_url: { type: 'string', description: 'URL of the video to upscale' },
                scale: { type: 'number', description: 'Upscale factor', minimum: 1, maximum: 4 },
                save_path: { type: 'string', description: 'File path to save the upscaled video' }
              },
              required: ['video_url']
            }
          },
          {
            name: 'remove_background',
            description: 'Remove background from an image using Bria RMBG 2.0. Production-grade, commercially licensed background removal with clean edges.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of the image to remove the background from' },
                save_path: { type: 'string', description: 'File path to save the result (PNG with transparency)' }
              },
              required: ['image_url']
            }
          },
          {
            name: 'remove_video_background',
            description: 'Remove background from a video using Bria Video Background Removal. Smooth, consistent background removal across all frames.',
            inputSchema: {
              type: 'object',
              properties: {
                video_url: { type: 'string', description: 'URL of the video to remove the background from' },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['video_url']
            }
          },
          {
            name: 'face_swap_image',
            description: 'Swap a face in an image with another face. Realistically blends the swap face onto the base image while maintaining natural appearance.',
            inputSchema: {
              type: 'object',
              properties: {
                base_image_url: { type: 'string', description: 'URL of the target image (face to be replaced)' },
                swap_image_url: { type: 'string', description: 'URL of the source face image (face to use)' },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['base_image_url', 'swap_image_url']
            }
          },
          {
            name: 'face_swap_video',
            description: 'Swap a face throughout a video clip. Replaces the target face in every frame while maintaining natural movement and expressions.',
            inputSchema: {
              type: 'object',
              properties: {
                base_video_url: { type: 'string', description: 'URL of the target video (face to be replaced)' },
                swap_image_url: { type: 'string', description: 'URL of the source face image (face to use)' },
                save_path: { type: 'string', description: 'File path to save the result' }
              },
              required: ['base_video_url', 'swap_image_url']
            }
          },
          {
            name: 'segment_image',
            description: 'Detect and segment objects in an image using SAM 3. Returns segmentation masks for objects, optionally guided by a text prompt.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of the image to segment' },
                prompt: { type: 'string', description: 'Optional text prompt to guide which objects to segment (e.g., "the red car")' },
                save_path: { type: 'string', description: 'File path to save the segmentation result' }
              },
              required: ['image_url']
            }
          },
          {
            name: 'estimate_depth',
            description: 'Generate a depth map from an image using Marigold Depth Estimation. Outputs a grayscale depth map useful for 3D scene understanding and visualization.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of the image to estimate depth from' },
                save_path: { type: 'string', description: 'File path to save the depth map' }
              },
              required: ['image_url']
            }
          },

          // ─── Audio & Music ───
          {
            name: 'generate_music',
            description: 'Generate royalty-free instrumental music using Beatoven. Creates music from text descriptions of genre, mood, tempo, and instruments.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Description of the music: genre, mood, tempo, instruments, energy' },
                duration: { type: 'number', description: 'Duration in seconds' },
                save_path: { type: 'string', description: 'File path to save the audio file' }
              },
              required: ['prompt']
            }
          },
          {
            name: 'text_to_speech',
            description: 'Convert text to natural-sounding speech using MiniMax Speech-02 HD. High-quality voice synthesis with optional voice selection and speed control.',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'The text to convert to speech' },
                voice_id: { type: 'string', description: 'Voice ID to use (optional, uses default if not specified)' },
                speed: { type: 'number', description: 'Speech speed multiplier (0.5-2.0)', minimum: 0.5, maximum: 2.0 },
                save_path: { type: 'string', description: 'File path to save the audio file' }
              },
              required: ['text']
            }
          },
          {
            name: 'generate_sound_effect',
            description: 'Generate sound effects from text descriptions using Stable Audio. Create professional-grade SFX for any scenario.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Description of the sound effect (e.g., "thunder crack in a canyon", "footsteps on gravel")' },
                duration_seconds: { type: 'number', description: 'Duration in seconds' },
                save_path: { type: 'string', description: 'File path to save the audio file' }
              },
              required: ['prompt']
            }
          },

          // ─── 3D ───
          {
            name: 'image_to_3d',
            description: 'Convert a 2D image into a 3D model using Tripo3D. Generates a full 3D mesh with textures from a single image.',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL of the image to convert to 3D' },
                save_path: { type: 'string', description: 'File path to save the 3D model (GLB format)' }
              },
              required: ['image_url']
            }
          },
          {
            name: 'retexture_3d',
            description: 'Apply new textures to an existing 3D model using Meshy-5 Retexture. Generates high-quality PBR textures from text prompts or reference images.',
            inputSchema: {
              type: 'object',
              properties: {
                model_url: { type: 'string', description: 'URL of the 3D model file (GLB/OBJ) to retexture' },
                prompt: { type: 'string', description: 'Text description of the desired texture style' },
                reference_image_url: { type: 'string', description: 'Optional reference image URL for texture style' },
                save_path: { type: 'string', description: 'File path to save the retextured model' }
              },
              required: ['model_url', 'prompt']
            }
          }
        ]
      };
    });

    // Register tools/call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {

          // ─── Image Generation ───

          case 'generate_image': {
            const schema = z.object({
              prompt: z.string().min(1),
              image_size: z.string().optional(),
              num_images: z.number().int().min(1).max(4).optional(),
              seed: z.number().int().optional(),
              output_format: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.generateImage(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'No image was generated. Try rephrasing your prompt.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('generated', input.output_format || 'png');
            await downloadFile(urls[0], savePath);

            const textParts = [`Image generated and saved to: ${savePath}`];
            if (urls.length > 1) {
              textParts.push(`\nAdditional images: ${urls.slice(1).join(', ')}`);
            }
            if (result.data.seed !== undefined) textParts.push(`\nSeed: ${result.data.seed}`);

            return { content: [{ type: 'text', text: textParts.join('') }] };
          }

          case 'edit_image': {
            const schema = z.object({
              prompt: z.string().min(1),
              image_url: z.string().min(1),
              image_size: z.string().optional(),
              seed: z.number().int().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.editImage(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'No edited image was generated. Try rephrasing your prompt.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('edited', 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Edited image saved to: ${savePath}` }] };
          }

          case 'image_to_image': {
            const schema = z.object({
              prompt: z.string().min(1),
              image_url: z.string().min(1),
              strength: z.number().min(0).max(1).optional(),
              image_size: z.string().optional(),
              num_inference_steps: z.number().int().min(1).max(50).optional(),
              seed: z.number().int().optional(),
              num_images: z.number().int().min(1).max(4).optional(),
              output_format: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.imageToImage(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'No image was generated. Try rephrasing your prompt.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('img2img', input.output_format || 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Transformed image saved to: ${savePath}` }] };
          }

          case 'inpaint': {
            const schema = z.object({
              prompt: z.string().min(1),
              image_url: z.string().min(1),
              mask_url: z.string().min(1),
              image_size: z.string().optional(),
              num_inference_steps: z.number().int().min(1).max(50).optional(),
              seed: z.number().int().optional(),
              output_format: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.inpaint(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'Inpainting failed. Try a different prompt or mask.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('inpainted', input.output_format || 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Inpainted image saved to: ${savePath}` }] };
          }

          case 'style_transfer': {
            const schema = z.object({
              image_url: z.string().min(1),
              image_size: z.string().optional(),
              num_inference_steps: z.number().int().min(1).max(4).optional(),
              seed: z.number().int().optional(),
              num_images: z.number().int().min(1).max(4).optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.styleTransfer(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'Style transfer failed. Try a different reference image.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('style-transfer', 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Style transfer result saved to: ${savePath}` }] };
          }

          // ─── Video Generation ───

          case 'text_to_video': {
            const schema = z.object({
              prompt: z.string().min(1),
              duration: z.string().optional(),
              aspect_ratio: z.string().optional(),
              negative_prompt: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.textToVideo(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'No video was generated. Try rephrasing your prompt.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('text2video', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Video generated and saved to: ${savePath}` }] };
          }

          case 'image_to_video': {
            const schema = z.object({
              prompt: z.string().min(1),
              image_url: z.string().min(1),
              duration: z.string().optional(),
              aspect_ratio: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.imageToVideo(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'No video was generated. Try a different image or prompt.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('img2video', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Video generated and saved to: ${savePath}` }] };
          }

          case 'lipsync': {
            const schema = z.object({
              video_url: z.string().min(1),
              audio_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.lipsync(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'Lipsync failed. Check that the video contains a visible face and the audio is clear.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('lipsync', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Lipsync video saved to: ${savePath}` }] };
          }

          case 'avatar_video': {
            const schema = z.object({
              image_url: z.string().min(1),
              audio_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.avatarVideo(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'Avatar video generation failed. Ensure the image is a clear portrait/headshot.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('avatar', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Avatar video saved to: ${savePath}` }] };
          }

          // ─── Image Utilities ───

          case 'upscale_image': {
            const schema = z.object({
              image_url: z.string().min(1),
              scale: z.number().min(1).max(8).optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.upscaleImage(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'Upscaling failed.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('upscaled', 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Upscaled image saved to: ${savePath}` }] };
          }

          case 'upscale_video': {
            const schema = z.object({
              video_url: z.string().min(1),
              scale: z.number().min(1).max(4).optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.upscaleVideo(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'Video upscaling failed.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('upscaled', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Upscaled video saved to: ${savePath}` }] };
          }

          case 'remove_background': {
            const schema = z.object({
              image_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.removeBackground(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'Background removal failed.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('no-bg', 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Background removed. Saved to: ${savePath}` }] };
          }

          case 'remove_video_background': {
            const schema = z.object({
              video_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.removeVideoBackground(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'Video background removal failed.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('no-bg-video', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Video background removed. Saved to: ${savePath}` }] };
          }

          case 'face_swap_image': {
            const schema = z.object({
              base_image_url: z.string().min(1),
              swap_image_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.faceSwapImage(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: 'Face swap failed. Ensure both images contain clear, visible faces.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('face-swap', 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Face swap result saved to: ${savePath}` }] };
          }

          case 'face_swap_video': {
            const schema = z.object({
              base_video_url: z.string().min(1),
              swap_image_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.faceSwapVideo(apiInput);
            const url = extractVideoUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: 'Video face swap failed. Ensure the video has a clear face and the swap image is a good headshot.' }], isError: true };
            }

            const savePath = save_path || getAutoSavePath('face-swap-video', 'mp4');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Face swap video saved to: ${savePath}` }] };
          }

          case 'segment_image': {
            const schema = z.object({
              image_url: z.string().min(1),
              prompt: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.segmentImage(apiInput);

            let responseText = `Segmentation complete.\n\nRaw result:\n${JSON.stringify(result.data, null, 2)}`;

            // Try to save mask if available
            const urls = extractImageUrls(result.data);
            if (urls.length > 0 && save_path) {
              await downloadFile(urls[0], save_path);
              responseText += `\n\nMask saved to: ${save_path}`;
            }

            return { content: [{ type: 'text', text: responseText }] };
          }

          case 'estimate_depth': {
            const schema = z.object({
              image_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.estimateDepth(apiInput);
            const urls = extractImageUrls(result.data);

            if (urls.length === 0) {
              return { content: [{ type: 'text', text: `Depth estimation complete.\n\nRaw result:\n${JSON.stringify(result.data, null, 2)}` }] };
            }

            const savePath = save_path || getAutoSavePath('depth', 'png');
            await downloadFile(urls[0], savePath);

            return { content: [{ type: 'text', text: `Depth map saved to: ${savePath}` }] };
          }

          // ─── Audio & Music ───

          case 'generate_music': {
            const schema = z.object({
              prompt: z.string().min(1),
              duration: z.number().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.generateMusic(apiInput);
            const url = extractAudioUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: `Music generation result:\n${JSON.stringify(result.data, null, 2)}` }] };
            }

            const savePath = save_path || getAutoSavePath('music', 'mp3');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Music generated and saved to: ${savePath}` }] };
          }

          case 'text_to_speech': {
            const schema = z.object({
              text: z.string().min(1),
              voice_id: z.string().optional(),
              speed: z.number().min(0.5).max(2.0).optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.textToSpeech(apiInput);
            const url = extractAudioUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: `TTS result:\n${JSON.stringify(result.data, null, 2)}` }] };
            }

            const savePath = save_path || getAutoSavePath('speech', 'mp3');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Speech audio saved to: ${savePath}` }] };
          }

          case 'generate_sound_effect': {
            const schema = z.object({
              prompt: z.string().min(1),
              duration_seconds: z.number().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.generateSoundEffect(apiInput);
            const url = extractAudioUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: `Sound effect result:\n${JSON.stringify(result.data, null, 2)}` }] };
            }

            const savePath = save_path || getAutoSavePath('sfx', 'mp3');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Sound effect saved to: ${savePath}` }] };
          }

          // ─── 3D ───

          case 'image_to_3d': {
            const schema = z.object({
              image_url: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.imageTo3D(apiInput);
            const url = extract3DUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: `3D generation result:\n${JSON.stringify(result.data, null, 2)}` }] };
            }

            const savePath = save_path || getAutoSavePath('model', 'glb');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `3D model saved to: ${savePath}` }] };
          }

          case 'retexture_3d': {
            const schema = z.object({
              model_url: z.string().min(1),
              prompt: z.string().min(1),
              reference_image_url: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);
            const { save_path, ...apiInput } = input;
            const result = await client.retexture3D(apiInput);
            const url = extract3DUrl(result.data);

            if (!url) {
              return { content: [{ type: 'text', text: `Retexture result:\n${JSON.stringify(result.data, null, 2)}` }] };
            }

            const savePath = save_path || getAutoSavePath('retextured', 'glb');
            await downloadFile(url, savePath);

            return { content: [{ type: 'text', text: `Retextured 3D model saved to: ${savePath}` }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        const handled = client.handleError(error);
        return {
          content: [{ type: 'text', text: handled.message }],
          isError: true
        };
      }
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('fal.ai MCP Server v1.0.0 running');

    process.on('SIGINT', async () => {
      console.error('Shutting down fal.ai MCP Server...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Shutting down fal.ai MCP Server...');
      await server.close();
      process.exit(0);
    });
  } catch (error: any) {
    console.error('Failed to start fal.ai MCP Server:', error.message);
    process.exit(1);
  }
}

main();
