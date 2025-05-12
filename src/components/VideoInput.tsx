import { useState, useRef, DragEvent } from 'react';
import { Upload, Link, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { VideoSource } from '../types';

interface VideoInputProps {
  videoSource: VideoSource | null;
  onVideoSourceChange: (source: VideoSource | null) => void;
}

export function VideoInput({ videoSource, onVideoSourceChange }: VideoInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      onVideoSourceChange({
        type: 'file',
        source: files[0]
      });
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onVideoSourceChange({
        type: 'file',
        source: e.target.files[0]
      });
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError('URL is required');
      return false;
    }
    
    try {
      new URL(url);
      
      if (!url.match(/\.(mp4|mov|webm)($|\?)/i)) {
        setUrlError('URL must point to a video file (.mp4, .mov, .webm)');
        return false;
      }
      
      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateUrl(urlInput)) {
      onVideoSourceChange({
        type: 'url',
        source: urlInput
      });
    }
  };

  const handleRemoveSource = () => {
    onVideoSourceChange(null);
    setUrlInput('');
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-medium mb-4">Video Source</h2>
      
      {!videoSource ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all",
              isDragging 
                ? "border-pink-400 bg-pink-500/10" 
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <Upload className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-center text-slate-300 mb-1">
              Drag & drop a video file or click to browse
            </p>
            <p className="text-center text-slate-500 text-sm">
              Supports .mp4, .mov, .webm
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/mp4,video/webm,video/quicktime" 
              onChange={handleFileChange}
            />
          </div>
          
          <div className="border border-slate-700 rounded-lg p-6">
            <form onSubmit={handleUrlSubmit}>
              <label className="flex items-center gap-2 mb-2 text-slate-300">
                <Link className="h-4 w-4" />
                <span>Video URL</span>
              </label>
              
              <div className="flex">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://example.com/sample.mp4"
                  className={cn(
                    "flex-grow bg-slate-800/80 border px-3 py-2 rounded-l-md focus:outline-none focus:ring-1",
                    urlError 
                      ? "border-red-500/50 focus:ring-red-500/30 text-red-200" 
                      : "border-slate-600 focus:ring-pink-500/30 focus:border-pink-500/50"
                  )}
                />
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded-r-md transition-colors text-white font-medium"
                >
                  Load
                </button>
              </div>
              
              {urlError && (
                <p className="mt-2 text-sm text-red-400">{urlError}</p>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-slate-400">
                {videoSource.type === 'file' 
                  ? `File: ${(videoSource.source as File).name}`
                  : `URL: ${String(videoSource.source)}`
                }
              </span>
            </div>
            
            <button
              onClick={handleRemoveSource}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}