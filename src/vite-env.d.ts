/// <reference types="vite/client" />

// Add global type definitions for Web Audio API if needed
interface Window {
  webkitAudioContext: typeof AudioContext;
}