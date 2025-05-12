export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-pink-600 to-purple-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}