/// <reference types="vite/client" />

// Environment variables
interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_PERFORMANCE_ENDPOINT?: string;
  readonly VITE_ROEX_AUTOMIX_API_KEY?: string;
  readonly VITE_NEURAL_MIX_API_KEY?: string;
  readonly VITE_STYLE_TRANSFER_API_KEY?: string;
  readonly VITE_INSTRUMENT_GEN_API_KEY?: string;
  readonly VITE_ENVIRONMENT?: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// File type declarations
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// Audio file declarations
declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.flac' {
  const src: string;
  export default src;
}

declare module '*.aiff' {
  const src: string;
  export default src;
}

// Font file declarations
declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

// Extend Window interface for audio-specific globals
interface Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
  mozAudioContext: typeof AudioContext;
  msAudioContext: typeof AudioContext;
  
  // For Web Audio API feature detection
  OfflineAudioContext: typeof OfflineAudioContext;
  webkitOfflineAudioContext: typeof OfflineAudioContext;
  
  // For audio worklets
  AudioWorkletNode?: any;
  
  // For SharedArrayBuffer support detection
  crossOriginIsolated?: boolean;
}
