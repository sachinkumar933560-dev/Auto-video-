
export interface VideoPost {
  id: string;
  url: string;
  prompt: string;
  caption: string;
  status: 'draft' | 'generating' | 'posted' | 'failed';
  createdAt: number;
  platform?: 'Instagram' | 'TikTok' | 'YouTube';
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16'
}

export enum Resolution {
  HD = '720p',
  FHD = '1080p'
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
}
