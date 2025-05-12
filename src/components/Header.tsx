import { Video } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700/50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-4xl">
        <div className="flex items-center gap-2">
          <Video className="h-6 w-6 text-pink-500" />
          <h1 className="text-xl font-medium text-white tracking-tight">
            <span className="font-bold">FANZA</span> Video Highlighter
          </h1>
        </div>
        
        <div className="hidden sm:block">
          <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded-full border border-pink-500/30">
            Browser-Based Tool
          </span>
        </div>
      </div>
    </header>
  );
}