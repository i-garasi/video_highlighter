import { Sliders, Play } from 'lucide-react';

interface AnalysisSettingsProps {
  sceneDuration: number;
  onSceneDurationChange: (duration: number) => void;
  clipCount: number;
  onClipCountChange: (count: number) => void;
  isVideoSelected: boolean;
  onStartProcessing: () => void;
}

export function AnalysisSettings({
  sceneDuration,
  onSceneDurationChange,
  clipCount,
  onClipCountChange,
  isVideoSelected,
  onStartProcessing
}: AnalysisSettingsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="h-5 w-5 text-pink-400" />
        <h2 className="text-xl font-medium">Extraction Settings</h2>
      </div>
      
      <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sceneDuration" className="block mb-2 text-slate-300">
              Scene Duration: <span className="font-medium">{sceneDuration} seconds</span>
            </label>
            
            <input
              id="sceneDuration"
              type="range"
              min="5"
              max="30"
              step="1"
              value={sceneDuration}
              onChange={(e) => onSceneDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>5s</span>
              <span>30s</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="clipCount" className="block mb-2 text-slate-300">
              Number of Clips: <span className="font-medium">{clipCount}</span>
            </label>
            
            <input
              id="clipCount"
              type="range"
              min="1"
              max="5"
              step="1"
              value={clipCount}
              onChange={(e) => onClipCountChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onStartProcessing}
            disabled={!isVideoSelected}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-pink-600/30"
          >
            <Play className="h-5 w-5" />
            Extract Highlights
          </button>
        </div>
      </div>
    </div>
  );
}