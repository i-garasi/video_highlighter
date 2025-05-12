import { useEffect, useState, useRef } from 'react';
import { RotateCw, Download, RefreshCw, Check, Clock } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { VideoSource, AnalysisProgress, DetectedScene, FrameAnalysis } from '../types';
import { ProgressBar } from './ProgressBar';
import { ClipPreview } from './ClipPreview';
import { analyzeVideoFrames } from '../services/video-analyzer';
import { analyzeAudio } from '../services/audio-analyzer';

interface VideoProcessorProps {
  videoSource: VideoSource;
  sceneDuration: number;
  clipCount: number;
  onReset: () => void;
}

export function VideoProcessor({ 
  videoSource, 
  sceneDuration, 
  clipCount, 
  onReset 
}: VideoProcessorProps) {
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'preparing',
    percent: 0,
    currentTask: 'Loading FFmpeg...'
  });
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [detectedScenes, setDetectedScenes] = useState<DetectedScene[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const baseURL = import.meta.env.MODE === 'development' 
          ? '/node_modules/@ffmpeg/core/dist'
          : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist';

        const ffmpegInstance = new FFmpeg();
        
        ffmpegInstance.on('log', ({ message }) => {
          console.log('FFmpeg log:', message);
        });
        
        ffmpegInstance.on('progress', ({ progress }) => {
          if (progress * 100 > 0) {
            setProgress(prev => ({
              ...prev,
              percent: Math.floor(progress * 100)
            }));
          }
        });
        
        // Load FFmpeg core
        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFFmpeg(ffmpegInstance);
        setProgress(prev => ({ 
          ...prev, 
          percent: 10,
          currentTask: 'FFmpeg loaded. Preparing video...'
        }));
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setErrorMessage('Failed to load video processing tools. Please try again.');
      }
    };
    
    loadFFmpeg();
    
    return () => {
      if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
      }
    };
  }, []);

  // Load and prepare video
  useEffect(() => {
    if (!ffmpeg) return;
    
    const prepareVideo = async () => {
      try {
        setProgress({
          stage: 'preparing',
          percent: 20,
          currentTask: 'Loading video...'
        });
        
        let videoBlob: Blob;
        let filename: string;
        
        if (videoSource.type === 'url') {
          setProgress({
            stage: 'preparing',
            percent: 25,
            currentTask: 'Downloading video from URL...'
          });
          
          const response = await fetch(videoSource.source as string);
          if (!response.ok) {
            throw new Error('Failed to fetch video from URL');
          }
          
          videoBlob = await response.blob();
          filename = 'input.mp4';
        } else {
          videoBlob = videoSource.source as File;
          filename = (videoSource.source as File).name;
        }
        
        // Create object URL for video preview
        const objectUrl = URL.createObjectURL(videoBlob);
        setVideoObjectUrl(objectUrl);
        
        // Write video file to FFmpeg virtual file system
        const videoData = await fetchFile(videoBlob);
        await ffmpeg.writeFile(filename, videoData);
        
        setProgress({
          stage: 'analyzing',
          percent: 30,
          currentTask: 'Analyzing video content...'
        });
        
        // Start analysis process
        startVideoAnalysis(objectUrl, filename);
        
      } catch (error) {
        console.error('Error preparing video:', error);
        setErrorMessage('Failed to load video. Please check your video source and try again.');
      }
    };
    
    prepareVideo();
  }, [ffmpeg, videoSource]);

  const startVideoAnalysis = async (videoUrl: string, filename: string) => {
    try {
      if (!videoRef.current || !canvasRef.current) return;
      
      // Load video for analysis
      videoRef.current.src = videoUrl;
      await new Promise(resolve => {
        videoRef.current!.onloadeddata = resolve;
      });
      
      const videoDuration = videoRef.current.duration;
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Set canvas dimensions
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      setProgress({
        stage: 'analyzing',
        percent: 35,
        currentTask: 'Analyzing video frames for skin tone...'
      });
      
      // Analyze video frames for skin tone
      const frameAnalyses = await analyzeVideoFrames(
        videoRef.current,
        canvasRef.current,
        videoDuration,
        (progress) => {
          setProgress({
            stage: 'analyzing',
            percent: 35 + Math.floor(progress * 25),
            currentTask: 'Analyzing video frames...'
          });
        }
      );
      
      setProgress({
        stage: 'analyzing',
        percent: 60,
        currentTask: 'Analyzing audio peaks...'
      });
      
      // Analyze audio
      const audioAnalysis = await analyzeAudio(
        videoUrl,
        (progress) => {
          setProgress({
            stage: 'analyzing',
            percent: 60 + Math.floor(progress * 20),
            currentTask: 'Analyzing audio...'
          });
        }
      );
      
      // Combine analyses to find best scenes
      const combinedAnalysis: FrameAnalysis[] = frameAnalyses.map(frame => {
        const matchingAudio = audioAnalysis.find(a => Math.abs(a.time - frame.time) < 0.1);
        return {
          ...frame,
          audioIntensity: matchingAudio?.intensity || 0
        };
      });
      
      // Score each potential scene
      const scoredScenes: { startTime: number, score: number }[] = [];
      
      for (let i = 0; i < combinedAnalysis.length - Math.floor(sceneDuration); i++) {
        const sceneStartTime = combinedAnalysis[i].time;
        const sceneEndIdx = combinedAnalysis.findIndex(f => f.time >= sceneStartTime + sceneDuration);
        
        if (sceneEndIdx === -1) break;
        
        const sceneFrames = combinedAnalysis.slice(i, sceneEndIdx);
        
        // Calculate combined score (skin detection + audio peaks)
        const skinScore = sceneFrames.reduce((sum, frame) => sum + frame.skinConfidence, 0) / sceneFrames.length;
        const audioScore = sceneFrames.reduce((sum, frame) => sum + frame.audioIntensity, 0) / sceneFrames.length;
        
        // Combined score - weighted 70% skin, 30% audio
        const combinedScore = (skinScore * 0.7) + (audioScore * 0.3);
        
        scoredScenes.push({
          startTime: sceneStartTime,
          score: combinedScore
        });
      }
      
      // Sort by score and get top N scenes
      const topScenes = scoredScenes
        .sort((a, b) => b.score - a.score)
        .slice(0, clipCount)
        .sort((a, b) => a.startTime - b.startTime); // Sort by time for extraction
      
      // Create clips using FFMPEG
      setProgress({
        stage: 'extracting',
        percent: 80,
        currentTask: 'Extracting highlight clips...'
      });
      
      const scenes: DetectedScene[] = await Promise.all(
        topScenes.map(async (scene, index) => {
          const startTime = scene.startTime;
          const endTime = Math.min(startTime + sceneDuration, videoDuration);
          
          // Create thumbnail
          videoRef.current!.currentTime = startTime + 1; // 1 second into the scene
          await new Promise(resolve => {
            videoRef.current!.onseeked = resolve;
          });
          
          const ctx = canvasRef.current!.getContext('2d')!;
          ctx.drawImage(videoRef.current!, 0, 0, videoWidth, videoHeight);
          const thumbnailUrl = canvasRef.current!.toDataURL('image/jpeg', 0.7);
          
          // Extract clip
          const outputFilename = `clip_${index + 1}.mp4`;
          
          await ffmpeg.exec([
            '-ss', startTime.toString(),
            '-i', filename,
            '-t', sceneDuration.toString(),
            '-c:v', 'copy',
            '-c:a', 'copy',
            outputFilename
          ]);
          
          // Read the generated clip
          const data = await ffmpeg.readFile(outputFilename);
          const clipBlob = new Blob([data], { type: 'video/mp4' });
          const clipUrl = URL.createObjectURL(clipBlob);
          
          setProgress(prev => ({
            ...prev,
            percent: 80 + Math.floor((index + 1) / topScenes.length * 15),
            currentTask: `Extracted clip ${index + 1} of ${topScenes.length}`
          }));
          
          return {
            startTime,
            endTime,
            thumbnail: thumbnailUrl,
            clipUrl,
            score: scene.score
          };
        })
      );
      
      setDetectedScenes(scenes);
      
      setProgress({
        stage: 'complete',
        percent: 100,
        currentTask: 'All clips extracted successfully!'
      });
      
    } catch (error) {
      console.error('Error during video analysis:', error);
      setErrorMessage('Error analyzing video. Please try a different video or check your browser compatibility.');
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      {errorMessage ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{errorMessage}</div>
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-lg flex items-center gap-2">
                {progress.stage === 'complete' ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                )}
                <span>
                  {progress.stage === 'preparing' && 'Preparing'}
                  {progress.stage === 'analyzing' && 'Analyzing Video'}
                  {progress.stage === 'extracting' && 'Extracting Clips'}
                  {progress.stage === 'complete' && 'Processing Complete'}
                </span>
              </h3>
              
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Duration: {sceneDuration}s × {clipCount} clips</span>
              </div>
            </div>
            
            <ProgressBar progress={progress.percent} />
            
            {progress.currentTask && (
              <p className="text-sm text-slate-400 mt-1">{progress.currentTask}</p>
            )}
          </div>
          
          {progress.stage === 'complete' && detectedScenes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-4">Extracted Highlight Clips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {detectedScenes.map((scene, index) => (
                  <ClipPreview 
                    key={index}
                    scene={scene} 
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
            >
              <RotateCw className="h-4 w-4" />
              Start Over
            </button>
            
            {progress.stage === 'complete' && (
              <button
                onClick={() => {
                  // Create zip file with all clips
                  // For MVP we're just downloading the first clip
                  if (detectedScenes.length > 0 && detectedScenes[0].clipUrl) {
                    const a = document.createElement('a');
                    a.href = detectedScenes[0].clipUrl;
                    a.download = `highlight_clip_1.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium rounded-md hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg"
              >
                <Download className="h-4 w-4" />
                Download All Clips
              </button>
            )}
          </div>
        </>
      )}
      
      {/* Hidden video and canvas elements for analysis */}
      <div className="hidden">
        <video ref={videoRef} controls={false} crossOrigin="anonymous" />
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}