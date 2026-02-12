export interface Config {
  apiKey: string;
  timeout: number;
  outputDir: string;
}

// Best-in-class model for each capability
export const MODELS = {
  // Image generation
  TEXT_TO_IMAGE: 'fal-ai/flux-pro/kontext/max/text-to-image',
  EDIT_IMAGE: 'fal-ai/flux-pro/kontext/max',
  IMAGE_TO_IMAGE: 'fal-ai/flux-general',
  INPAINT: 'fal-ai/flux-general/inpainting',
  STYLE_TRANSFER: 'fal-ai/flux/schnell/redux',

  // Video generation
  TEXT_TO_VIDEO: 'fal-ai/kling-video/v3/pro/text-to-video',
  IMAGE_TO_VIDEO: 'fal-ai/kling-video/v3/pro/image-to-video',
  LIPSYNC: 'fal-ai/sync-lipsync/v2',
  AVATAR_VIDEO: 'fal-ai/bytedance/omnihuman/v1.5',

  // Image utilities
  UPSCALE_IMAGE: 'fal-ai/topaz/upscale/image',
  UPSCALE_VIDEO: 'fal-ai/topaz/upscale/video',
  REMOVE_BACKGROUND: 'fal-ai/bria/background/remove',
  REMOVE_VIDEO_BACKGROUND: 'fal-ai/bria/video/background-removal',
  FACE_SWAP_IMAGE: 'fal-ai/face-swap',
  FACE_SWAP_VIDEO: 'fal-ai/face-swap/video',
  SEGMENT_IMAGE: 'fal-ai/sam3',
  ESTIMATE_DEPTH: 'fal-ai/marigold-depth-estimation',

  // Audio & music
  GENERATE_MUSIC: 'fal-ai/beatoven/music-generation',
  TEXT_TO_SPEECH: 'fal-ai/minimax-speech/text-to-speech-02-hd',
  SOUND_EFFECT: 'fal-ai/stable-audio',

  // 3D
  IMAGE_TO_3D: 'fal-ai/tripo3d/v2',
  RETEXTURE_3D: 'fal-ai/meshy/retexture',
} as const;

export function loadConfig(): Config {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error(
      'fal.ai API key not configured. Please set the FAL_KEY environment variable.'
    );
  }

  const outputDir = process.env.FAL_OUTPUT_DIR || './generated-media';

  const timeoutStr = process.env.FAL_TIMEOUT;
  const timeout = timeoutStr ? parseInt(timeoutStr, 10) : 120000;

  if (timeout <= 0) {
    throw new Error('FAL_TIMEOUT must be a positive number');
  }

  return {
    apiKey,
    timeout,
    outputDir
  };
}
