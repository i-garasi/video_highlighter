import { useState } from 'react';
import { Info } from 'lucide-react';
import { VideoInput } from './components/VideoInput';
import { AnalysisSettings } from './components/AnalysisSettings';
import { VideoProcessor } from './components/VideoProcessor';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { VideoSource } from './types';

function App() {
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [sceneDuration, setSceneDuration] = useState(10);
  const [clipCount, setClipCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartProcessing = () => {
    if (videoSource) {
      setIsProcessing(true);
    }
  };

  const handleReset = () => {
    setVideoSource(null);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {!isProcessing ? (
          <>
            <div className="mb-8 p-4 bg-blue-900/30 rounded-lg border border-blue-800/50">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-200">
                  This tool automatically extracts highlight scenes from FANZA sample videos 
                  by detecting moments with high skin-tone presence and loud audio peaks.
                </p>
              </div>
            </div>

            <VideoInput 
              videoSource={videoSource} 
              onVideoSourceChange={setVideoSource} 
            />

            <AnalysisSettings 
              sceneDuration={sceneDuration}
              onSceneDurationChange={setSceneDuration}
              clipCount={clipCount}
              onClipCountChange={setClipCount}
              isVideoSelected={!!videoSource}
              onStartProcessing={handleStartProcessing}
            />
          </>
        ) : (
          <VideoProcessor 
            videoSource={videoSource!}
            sceneDuration={sceneDuration}
            clipCount={clipCount}
            onReset={handleReset}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;