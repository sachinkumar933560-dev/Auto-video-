
import React from 'react';
import { VideoPost } from '../types';

interface VideoCardProps {
  post: VideoPost;
  onPost?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ post, onPost, onDelete }) => {
  return (
    <div className="bg-[#1a1a1e] rounded-xl overflow-hidden border border-white/10 group transition-all hover:border-indigo-500/50">
      <div className="relative aspect-video bg-black overflow-hidden">
        {post.status === 'generating' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-indigo-950/20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-indigo-300 font-medium animate-pulse uppercase tracking-widest">Generating AI Video</p>
          </div>
        ) : (
          <video 
            src={post.url} 
            className="w-full h-full object-cover" 
            controls 
            preload="metadata"
          />
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
            post.status === 'posted' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            {post.status}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 mb-1">
          {post.prompt}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 italic">
          "{post.caption || 'No caption provided'}"
        </p>

        <div className="flex space-x-2">
          {post.status !== 'posted' && post.status !== 'generating' && (
            <button
              onClick={() => onPost?.(post.id)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Post Now</span>
            </button>
          )}
          
          <button
            onClick={() => onDelete?.(post.id)}
            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
