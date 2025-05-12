import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto py-4 px-4 border-t border-slate-700/50 bg-slate-900/50">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-slate-400">
        <p>© 2025 FANZA Video Highlighter</p>
        <div className="flex items-center gap-4">
          <span>Privacy-focused: All processing happens in your browser</span>
          <a 
            href="#" 
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            aria-label="GitHub repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}