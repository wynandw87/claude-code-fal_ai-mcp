import { fal } from '@fal-ai/client';
import { Config, MODELS } from './config.js';

export interface FalResult {
  data: any;
  requestId: string;
}

export class FalClient {
  private timeout: number;

  constructor(config: Config) {
    fal.config({ credentials: config.apiKey });
    this.timeout = config.timeout;
  }

  private async run(model: string, input: Record<string, any>): Promise<FalResult> {
    const result = await Promise.race([
      fal.subscribe(model, {
        input,
        logs: false
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.timeout)
      )
    ]);
    return result as FalResult;
  }

  private async runLong(model: string, input: Record<string, any>): Promise<FalResult> {
    const result = await Promise.race([
      fal.subscribe(model, {
        input,
        logs: false
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.timeout * 5)
      )
    ]);
    return result as FalResult;
  }

  // ─── Image Generation ───

  async generateImage(input: {
    prompt: string;
    image_size?: string;
    num_images?: number;
    seed?: number;
    output_format?: string;
  }): Promise<FalResult> {
    return this.run(MODELS.TEXT_TO_IMAGE, input);
  }

  async editImage(input: {
    prompt: string;
    image_url: string;
    image_size?: string;
    seed?: number;
  }): Promise<FalResult> {
    return this.run(MODELS.EDIT_IMAGE, input);
  }

  async imageToImage(input: {
    prompt: string;
    image_url: string;
    strength?: number;
    image_size?: string;
    num_inference_steps?: number;
    seed?: number;
    num_images?: number;
    output_format?: string;
  }): Promise<FalResult> {
    return this.run(MODELS.IMAGE_TO_IMAGE, input);
  }

  async inpaint(input: {
    prompt: string;
    image_url: string;
    mask_url: string;
    image_size?: string;
    num_inference_steps?: number;
    seed?: number;
    output_format?: string;
  }): Promise<FalResult> {
    return this.run(MODELS.INPAINT, input);
  }

  async styleTransfer(input: {
    image_url: string;
    image_size?: string;
    num_inference_steps?: number;
    seed?: number;
    num_images?: number;
  }): Promise<FalResult> {
    return this.run(MODELS.STYLE_TRANSFER, input);
  }

  // ─── Video Generation ───

  async textToVideo(input: {
    prompt: string;
    duration?: string;
    aspect_ratio?: string;
    negative_prompt?: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.TEXT_TO_VIDEO, input);
  }

  async imageToVideo(input: {
    prompt: string;
    image_url: string;
    duration?: string;
    aspect_ratio?: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.IMAGE_TO_VIDEO, input);
  }

  async lipsync(input: {
    video_url: string;
    audio_url: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.LIPSYNC, input);
  }

  async avatarVideo(input: {
    image_url: string;
    audio_url: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.AVATAR_VIDEO, input);
  }

  // ─── Image Utilities ───

  async upscaleImage(input: {
    image_url: string;
    scale?: number;
  }): Promise<FalResult> {
    return this.run(MODELS.UPSCALE_IMAGE, input);
  }

  async upscaleVideo(input: {
    video_url: string;
    scale?: number;
  }): Promise<FalResult> {
    return this.runLong(MODELS.UPSCALE_VIDEO, input);
  }

  async removeBackground(input: {
    image_url: string;
  }): Promise<FalResult> {
    return this.run(MODELS.REMOVE_BACKGROUND, input);
  }

  async removeVideoBackground(input: {
    video_url: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.REMOVE_VIDEO_BACKGROUND, input);
  }

  async faceSwapImage(input: {
    base_image_url: string;
    swap_image_url: string;
  }): Promise<FalResult> {
    return this.run(MODELS.FACE_SWAP_IMAGE, input);
  }

  async faceSwapVideo(input: {
    base_video_url: string;
    swap_image_url: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.FACE_SWAP_VIDEO, input);
  }

  async segmentImage(input: {
    image_url: string;
    prompt?: string;
  }): Promise<FalResult> {
    return this.run(MODELS.SEGMENT_IMAGE, input);
  }

  async estimateDepth(input: {
    image_url: string;
  }): Promise<FalResult> {
    return this.run(MODELS.ESTIMATE_DEPTH, input);
  }

  // ─── Audio & Music ───

  async generateMusic(input: {
    prompt: string;
    duration?: number;
  }): Promise<FalResult> {
    return this.runLong(MODELS.GENERATE_MUSIC, input);
  }

  async textToSpeech(input: {
    text: string;
    voice_id?: string;
    speed?: number;
  }): Promise<FalResult> {
    return this.run(MODELS.TEXT_TO_SPEECH, input);
  }

  async generateSoundEffect(input: {
    prompt: string;
    duration_seconds?: number;
  }): Promise<FalResult> {
    return this.run(MODELS.SOUND_EFFECT, input);
  }

  // ─── 3D ───

  async imageTo3D(input: {
    image_url: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.IMAGE_TO_3D, input);
  }

  async retexture3D(input: {
    model_url: string;
    prompt: string;
    reference_image_url?: string;
  }): Promise<FalResult> {
    return this.runLong(MODELS.RETEXTURE_3D, input);
  }

  // ─── Error Handling ───

  handleError(error: any): Error {
    if (error.message === 'Request timeout') {
      return new Error('fal.ai request timed out. This model may take longer — try again or increase FAL_TIMEOUT.');
    }
    if (error.status === 401 || error.status === 403) {
      return new Error('Invalid fal.ai API key. Please check your FAL_KEY environment variable.');
    }
    if (error.status === 429) {
      return new Error('fal.ai rate limit exceeded. Please wait a moment and try again.');
    }
    if (error.status === 422) {
      return new Error(`fal.ai validation error: ${error.body?.detail || error.message}`);
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error(`Failed to connect to fal.ai API: ${error.message}`);
    }
    return new Error(`fal.ai API error: ${error.message || error}`);
  }
}

export function createFalClient(config: Config): FalClient {
  return new FalClient(config);
}
