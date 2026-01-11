
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, Resolution } from "../types";

export class VideoService {
  private static async getAI() {
    // Re-instantiate to ensure latest API key from global context
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateVideo(
    prompt: string,
    aspectRatio: AspectRatio,
    resolution: Resolution,
    onStatusUpdate?: (status: string) => void
  ): Promise<string> {
    const ai = await this.getAI();
    
    onStatusUpdate?.("Initializing request...");
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution,
          aspectRatio: aspectRatio
        }
      });

      onStatusUpdate?.("Video generation started. This may take a few minutes...");

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Random encouraging messages to improve UX during wait
        const messages = [
          "Synthesizing high-quality frames...",
          "Applying neural textures...",
          "Rendering lighting and shadows...",
          "Polishing final sequence...",
          "Optimizing video compression..."
        ];
        onStatusUpdate?.(messages[Math.floor(Math.random() * messages.length)]);
        
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("No video URL returned from API");

      // We append the key to authorize the media fetch
      return `${downloadLink}&key=${process.env.API_KEY}`;
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        // Trigger re-selection if key is invalid/expired
        if (window.aistudio?.openSelectKey) {
          await window.aistudio.openSelectKey();
        }
      }
      throw error;
    }
  }
}
