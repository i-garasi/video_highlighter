/**
 * Audio analysis service
 * Analyzes audio to detect loud moments
 */

import { AudioPeak } from '../types';

// Analyze audio for peaks and volume levels
export const analyzeAudio = async (
  videoUrl: string,
  onProgress: (progress: number) => void
): Promise<AudioPeak[]> => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Fetch the audio data
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Parameters for analysis
    const analyzeInterval = 0.5; // Analyze every half second
    const sampleWindow = Math.floor(sampleRate * analyzeInterval);
    const totalChunks = Math.floor(duration / analyzeInterval);
    
    const results: AudioPeak[] = [];
    
    // Process audio in chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startSample = chunkIndex * sampleWindow;
      const endSample = Math.min(startSample + sampleWindow, channelData.length);
      
      // Calculate RMS (Root Mean Square) as volume measurement
      let sum = 0;
      for (let i = startSample; i < endSample; i++) {
        sum += channelData[i] * channelData[i];
      }
      
      const rms = Math.sqrt(sum / (endSample - startSample));
      
      // Find peak in chunk
      let peakIntensity = 0;
      for (let i = startSample; i < endSample; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > peakIntensity) {
          peakIntensity = absValue;
        }
      }
      
      // Combine RMS and peak for overall intensity (weighted)
      const intensity = (rms * 0.7) + (peakIntensity * 0.3);
      
      results.push({
        time: chunkIndex * analyzeInterval,
        intensity
      });
      
      onProgress(chunkIndex / totalChunks);
    }
    
    // Normalize intensity values to range 0-1
    const maxIntensity = Math.max(...results.map(r => r.intensity));
    results.forEach(result => {
      result.intensity = result.intensity / maxIntensity;
    });
    
    return results;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    return [];
  }
};