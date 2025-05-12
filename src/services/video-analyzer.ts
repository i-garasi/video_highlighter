/**
 * Video frame analysis service
 * Analyzes video frames to detect skin tone presence
 */

import { FrameAnalysis, SkinToneRegion } from '../types';

// Constants for skin tone detection
const MIN_SKIN_PIXELS = 10; // Minimum number of skin pixels to consider
const SKIN_ANALYZE_INTERVAL = 1; // Analyze every X seconds
const SKIN_CONFIDENCE_THRESHOLD = 0.5; // Minimum confidence to consider as skin

// Simplified skin tone detection based on RGB ranges
// This is a simplified implementation and not perfect
// In a real app, we'd use a more sophisticated image recognition model
const isSkinTone = (r: number, g: number, b: number): number => {
  // Simple skin tone detection based on common RGB ranges
  const isSkin = (
    // Various tone ranges
    (r > 95 && g > 40 && b > 20 && 
     r > g && r > b && 
     Math.abs(r - g) > 15 && 
     r - g > 15 && r - b > 15) ||
    // Lighter skin
    (r > 220 && g > 190 && b > 170) ||
    // Darker skin
    (r > 40 && r < 110 && g > 20 && g < 90 && b > 10 && b < 60 && 
     r > g && r > b)
  );
  
  if (isSkin) {
    // Calculate confidence based on how strongly it matches the criteria
    // This is a simplified approach
    const confidence = Math.min(1.0, 
      (Math.min(255, r) / 255) * 
      (0.5 + Math.abs(r - g) / 100) * 
      (0.5 + Math.abs(r - b) / 100)
    );
    return confidence;
  }
  
  return 0;
};

/**
 * Analyzes video frames for skin tone presence
 */
export const analyzeVideoFrames = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  videoDuration: number,
  onProgress: (progress: number) => void
): Promise<FrameAnalysis[]> => {
  const ctx = canvasElement.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  const results: FrameAnalysis[] = [];
  const totalFrames = Math.floor(videoDuration / SKIN_ANALYZE_INTERVAL);
  let processedFrames = 0;
  
  for (let time = 0; time < videoDuration; time += SKIN_ANALYZE_INTERVAL) {
    // Set video to specific time
    videoElement.currentTime = time;
    
    // Wait for seeking to complete
    await new Promise(resolve => {
      videoElement.onseeked = resolve;
    });
    
    // Draw current frame to canvas
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const data = imageData.data;
    
    // Variables for skin detection
    let skinPixelCount = 0;
    let totalConfidence = 0;
    
    // Analyze every NxN block of pixels instead of each pixel for performance
    const blockSize = 4;
    
    // For demonstration, we'll divide the image into regions
    const regionsX = 4;
    const regionsY = 3;
    const regionWidth = canvasElement.width / regionsX;
    const regionHeight = canvasElement.height / regionsY;
    
    const regions: SkinToneRegion[] = [];
    
    // Initialize region data
    for (let ry = 0; ry < regionsY; ry++) {
      for (let rx = 0; rx < regionsX; rx++) {
        regions.push({
          x: rx * regionWidth,
          y: ry * regionHeight,
          width: regionWidth,
          height: regionHeight,
          confidence: 0
        });
      }
    }
    
    // Process pixels by block
    for (let y = 0; y < canvasElement.height; y += blockSize) {
      for (let x = 0; x < canvasElement.width; x += blockSize) {
        const i = (y * canvasElement.width + x) * 4;
        
        // Skip if out of bounds
        if (i >= data.length) continue;
        
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const confidence = isSkinTone(r, g, b);
        
        if (confidence > SKIN_CONFIDENCE_THRESHOLD) {
          skinPixelCount++;
          totalConfidence += confidence;
          
          // Update region confidence
          const regionX = Math.floor(x / regionWidth);
          const regionY = Math.floor(y / regionHeight);
          const regionIdx = regionY * regionsX + regionX;
          
          if (regions[regionIdx]) {
            regions[regionIdx].confidence += confidence;
          }
        }
      }
    }
    
    // Normalize region confidence
    regions.forEach(region => {
      region.confidence = region.confidence / (regionWidth * regionHeight / (blockSize * blockSize));
      if (region.confidence > 1) region.confidence = 1;
    });
    
    // Calculate overall skin confidence for this frame
    const pixelCount = (canvasElement.width * canvasElement.height) / (blockSize * blockSize);
    const skinRatio = skinPixelCount / pixelCount;
    const avgConfidence = totalConfidence / (skinPixelCount || 1);
    const skinConfidence = skinRatio * avgConfidence;
    
    results.push({
      time,
      skinConfidence,
      audioIntensity: 0, // Will be filled in later
      skinRegions: regions.filter(r => r.confidence > SKIN_CONFIDENCE_THRESHOLD)
    });
    
    processedFrames++;
    onProgress(processedFrames / totalFrames);
  }
  
  return results;
};