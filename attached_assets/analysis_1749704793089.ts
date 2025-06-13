export interface AudioAnalysisResult {
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: string;
  peaks: number[];
  rms: number;
  loudness: number;
  dynamicRange: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
}

export function createAudioContext() {
  // Mock audio context for server-side processing
  return {
    sampleRate: 44100,
    currentTime: 0,
    state: 'running' as const,
  };
}

export async function decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const duration = arrayBuffer.byteLength / (44100 * 2 * 2);
  return {
    duration,
    length: Math.ceil(duration * 44100),
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: () => new Float32Array(),
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer;
}

export async function analyzeAudioFile(
  buffer: ArrayBuffer,
  audioBuffer: AudioBuffer
): Promise<AudioAnalysisResult> {
  // Mock analysis for now - in production, this would use actual audio processing libraries
  const { duration, sampleRate, numberOfChannels } = audioBuffer;
  
  return {
    duration,
    sampleRate,
    channels: numberOfChannels,
    bitDepth: 16,
    format: 'wav',
    peaks: generateMockPeaks(100),
    rms: 0.5 + Math.random() * 0.3,
    loudness: -14 + Math.random() * 6,
    dynamicRange: 8 + Math.random() * 4,
    spectralCentroid: 2000 + Math.random() * 2000,
    zeroCrossingRate: 0.1 + Math.random() * 0.2,
  };
}

function generateMockPeaks(count: number): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    peaks.push(Math.random() * 0.8 + 0.2);
  }
  return peaks;
}
