import { useState } from 'react';
import { Download, Play, Pause } from 'lucide-react';
import { DetectedScene } from '../types';

interface ClipPreviewProps {
  scene: DetectedScene;
  index: number;
}

export function ClipPreview({ scene, index }: ClipPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scene.clipUrl) {
      const a = document.createElement('a');
      a.href = scene.clipUrl;
      a.download = `highlight_clip_${index + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:border-pink-500/30 transition-all group">
      <div className="relative">
        {scene.thumbnail && (
          <img 
            src={scene.thumbnail} 
            alt={`Clip ${index + 1} thumbnail`}
            className="w-full aspect-video object-cover"
          />
        )}
        
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (scene.clipUrl) {
              window.open(scene.clipUrl, '_blank');
            }
          }}
        >
          <div className="h-12 w-12 rounded-full bg-pink-600/80 flex items-center justify-center">
            <Play className="h-6 w-6 text-white" />
          </div>
        </button>
        
        <div className="absolute top-2 right-2">
          <button
            onClick={handleDownload}
            className="h-8 w-8 rounded-full bg-slate-800/80 flex items-center justify-center hover:bg-pink-600/80 transition-colors"
          >
            <Download className="h-4 w-4 text-white" />
          </button>
        </div>
        
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs font-medium">
          {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Highlight Clip {index + 1}</h4>
          <div className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full">
            {Math.round(scene.score * 100)}% match
          </div>
        </div>
      </div>
    </div>
  );
}