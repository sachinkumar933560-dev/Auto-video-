
import React, { useState, useEffect, useCallback } from 'react';
import { VideoPost, AspectRatio, Resolution, GenerationConfig } from './types';
import { VideoService } from './services/geminiService';
import VideoCard from './components/VideoCard';

// Define the interface to match the environment's AIStudio type and avoid type mismatches
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    // Using the named interface AIStudio as required by the environment's existing definitions
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<Resolution>(Resolution.HD);

  useEffect(() => {
    checkApiKey();
    const saved = localStorage.getItem('velostream_videos');
    if (saved) setVideos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('velostream_videos', JSON.stringify(videos));
  }, [videos]);

  const checkApiKey = async () => {
    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } catch (e) {
      setHasApiKey(false);
    }
  };

  const handleOpenKeySelector = async () => {
    await window.aistudio.openSelectKey();
    setHasApiKey(true); // Assume success as per guidelines to avoid race conditions
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    if (!hasApiKey) {
      await handleOpenKeySelector();
    }

    const tempId = Math.random().toString(36).substring(7);
    const newPost: VideoPost = {
      id: tempId,
      url: '',
      prompt,
      caption,
      status: 'generating',
      createdAt: Date.now()
    };

    setVideos(prev => [newPost, ...prev]);
    setIsGenerating(true);
    setError(null);
    setStatusMessage('Connecting to Gemini Veo...');

    try {
      const videoUrl = await VideoService.generateVideo(
        prompt, 
        aspectRatio, 
        resolution,
        (msg) => setStatusMessage(msg)
      );

      setVideos(prev => prev.map(v => 
        v.id === tempId ? { ...v, url: videoUrl, status: 'draft' } : v
      ));
      
      setPrompt('');
      setCaption('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video");
      setVideos(prev => prev.map(v => 
        v.id === tempId ? { ...v, status: 'failed' } : v
      ));
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handlePost = (id: string) => {
    setVideos(prev => prev.map(v => 
      v.id === id ? { ...v, status: 'posted' } : v
    ));
    alert("Simulated: Video has been 'posted' to your linked accounts!");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this video?")) {
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight gradient-text mb-2">VeloStream</h1>
          <p className="text-slate-400 font-medium">Auto-generate and post AI cinematic content.</p>
        </div>
        
        {!hasApiKey && (
          <button 
            onClick={handleOpenKeySelector}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full border border-white/10 transition-all text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>Connect Paid API Key</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-[#1a1a1e] rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Creator Studio
            </h2>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your cinematic masterpiece..."
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Social Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="The text for your post..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Format</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all"
                    disabled={isGenerating}
                  >
                    <option value={AspectRatio.LANDSCAPE}>Landscape (16:9)</option>
                    <option value={AspectRatio.PORTRAIT}>Portrait (9:16)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quality</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as Resolution)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all"
                    disabled={isGenerating}
                  >
                    <option value={Resolution.HD}>720p HD</option>
                    <option value={Resolution.FHD}>1080p FHD</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !prompt}
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg ${
                  isGenerating || !prompt 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:scale-[1.02] text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Generate Video</span>
                  </>
                )}
              </button>
              
              {statusMessage && (
                <p className="text-center text-xs text-indigo-400 animate-pulse mt-2">{statusMessage}</p>
              )}
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-xs text-red-400 text-center">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center space-x-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
                <span>Linked Platforms</span>
              </div>
              <div className="flex space-x-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">IG</div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">TT</div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">YT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Your Studio Pipeline</h2>
            <div className="flex space-x-2">
              <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                {videos.length} clips
              </span>
            </div>
          </div>

          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-white/5 rounded-3xl text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">The studio is empty</h3>
              <p className="text-sm text-slate-500 max-w-xs">Start by describing a scene on the left. Our AI will handle the rest.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map(post => (
                <VideoCard 
                  key={post.id} 
                  post={post} 
                  onPost={handlePost} 
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <footer className="mt-20 py-8 border-t border-white/5 text-center text-slate-600 text-xs">
        <p>&copy; 2024 VeloStream AI Studio. Powered by Gemini 3.1 Veo Engine.</p>
        <p className="mt-2">High-quality video generation requires a billing-enabled Google Cloud account. <a href="https://ai.google.dev/gemini-api/docs/billing" className="text-indigo-400 hover:underline">Learn more</a>.</p>
      </footer>
    </div>
  );
};

export default App;
