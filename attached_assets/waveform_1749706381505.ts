/**
 * Waveform Generation and Processing Utilities
 * 
 * Handles waveform visualization data generation, peak detection,
 * and real-time waveform updates for the audio editor interface.
 */

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
  channels: number;
  resolution: number;
}

export interface WaveformOptions {
  width: number;
  height: number;
  peaksPerPixel: number;
  normalize: boolean;
  smoothing: boolean;
  waveColor: string;
  progressColor: string;
  backgroundColor: string;
}

/**
 * Generate waveform data from audio buffer
 */
export function generateWaveformData(
  audioBuffer: AudioBuffer,
  resolution = 1000
): WaveformData {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / resolution);
  const peaks: number[] = [];

  for (let i = 0; i < resolution; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    
    let min = 0;
    let max = 0;
    
    for (let j = start; j < end; j++) {
      const sample = channelData[j];
      if (sample !== undefined) {
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
    }
    
    peaks.push(Math.max(Math.abs(min), Math.abs(max)));
  }

  return {
    peaks,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    resolution,
  };
}

/**
 * Render waveform to canvas
 */
export function renderWaveform(
  canvas: HTMLCanvasElement,
  waveformData: WaveformData,
  options: Partial<WaveformOptions> = {}
): void {
  const ctx = canvas.getContext('2d')!;
  const opts: WaveformOptions = {
    width: canvas.width,
    height: canvas.height,
    peaksPerPixel: 1,
    normalize: true,
    smoothing: true,
    waveColor: '#4F46E5',
    progressColor: '#10B981',
    backgroundColor: 'transparent',
    ...options,
  };

  ctx.clearRect(0, 0, opts.width, opts.height);
  
  const peaks = opts.normalize ? normalizePeaks(waveformData.peaks) : waveformData.peaks;
  const pixelRatio = peaks.length / opts.width;
  
  ctx.beginPath();
  ctx.strokeStyle = opts.waveColor;
  ctx.lineWidth = 1;
  
  for (let x = 0; x < opts.width; x++) {
    const peakIndex = Math.floor(x * pixelRatio);
    const peak = peaks[peakIndex] || 0;
    const y = opts.height / 2;
    const amplitude = (peak * opts.height) / 2;
    
    if (x === 0) {
      ctx.moveTo(x, y - amplitude);
    } else {
      ctx.lineTo(x, y - amplitude);
    }
  }
  
  ctx.stroke();
  
  // Draw bottom half (mirror)
  ctx.beginPath();
  for (let x = 0; x < opts.width; x++) {
    const peakIndex = Math.floor(x * pixelRatio);
    const peak = peaks[peakIndex] || 0;
    const y = opts.height / 2;
    const amplitude = (peak * opts.height) / 2;
    
    if (x === 0) {
      ctx.moveTo(x, y + amplitude);
    } else {
      ctx.lineTo(x, y + amplitude);
    }
  }
  
  ctx.stroke();
}

/**
 * Render waveform progress
 */
export function renderWaveformProgress(
  canvas: HTMLCanvasElement,
  waveformData: WaveformData,
  progress: number,
  options: Partial<WaveformOptions> = {}
): void {
  const ctx = canvas.getContext('2d')!;
  const opts: WaveformOptions = {
    width: canvas.width,
    height: canvas.height,
    peaksPerPixel: 1,
    normalize: true,
    smoothing: true,
    waveColor: '#6B7280',
    progressColor: '#10B981',
    backgroundColor: 'transparent',
    ...options,
  };

  // Clear canvas
  ctx.clearRect(0, 0, opts.width, opts.height);
  
  const peaks = opts.normalize ? normalizePeaks(waveformData.peaks) : waveformData.peaks;
  const pixelRatio = peaks.length / opts.width;
  const progressX = Math.floor(progress * opts.width);
  
  // Draw unplayed portion
  ctx.beginPath();
  ctx.strokeStyle = opts.waveColor;
  ctx.lineWidth = 1;
  
  for (let x = progressX; x < opts.width; x++) {
    const peakIndex = Math.floor(x * pixelRatio);
    const peak = peaks[peakIndex] || 0;
    const y = opts.height / 2;
    const amplitude = (peak * opts.height) / 2;
    
    ctx.moveTo(x, y - amplitude);
    ctx.lineTo(x, y + amplitude);
  }
  
  ctx.stroke();
  
  // Draw played portion
  ctx.beginPath();
  ctx.strokeStyle = opts.progressColor;
  ctx.lineWidth = 1;
  
  for (let x = 0; x < progressX; x++) {
    const peakIndex = Math.floor(x * pixelRatio);
    const peak = peaks[peakIndex] || 0;
    const y = opts.height / 2;
    const amplitude = (peak * opts.height) / 2;
    
    ctx.moveTo(x, y - amplitude);
    ctx.lineTo(x, y + amplitude);
  }
  
  ctx.stroke();
}

/**
 * Generate multi-resolution waveform data for zoom levels
 */
export function generateMultiResolutionWaveform(
  audioBuffer: AudioBuffer,
  resolutions: number[] = [500, 1000, 2000, 4000]
): Record<number, WaveformData> {
  const multiRes: Record<number, WaveformData> = {};
  
  resolutions.forEach(resolution => {
    multiRes[resolution] = generateWaveformData(audioBuffer, resolution);
  });
  
  return multiRes;
}

/**
 * Normalize peaks to 0-1 range
 */
function normalizePeaks(peaks: number[]): number[] {
  const maxPeak = Math.max(...peaks);
  if (maxPeak === 0) return peaks;
  
  return peaks.map(peak => peak / maxPeak);
}

/**
 * Apply smoothing to waveform peaks
 */
export function smoothWaveform(peaks: number[], smoothingFactor = 0.1): number[] {
  const smoothed = [...peaks];
  
  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1];
    const curr = smoothed[i];
    const next = smoothed[i + 1];
    
    if (curr !== undefined && prev !== undefined && next !== undefined) {
      smoothed[i] = curr * (1 - smoothingFactor) + 
                    (prev + next) * smoothingFactor / 2;
    }
  }
  
  return smoothed;
}

/**
 * Convert time to pixel position
 */
export function timeToPixel(
  time: number,
  duration: number,
  width: number
): number {
  return Math.floor((time / duration) * width);
}

/**
 * Convert pixel position to time
 */
export function pixelToTime(
  pixel: number,
  duration: number,
  width: number
): number {
  return (pixel / width) * duration;
}

/**
 * Generate waveform thumbnail for project cards
 */
export function generateWaveformThumbnail(
  audioBuffer: AudioBuffer,
  width = 200,
  height = 60
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const waveformData = generateWaveformData(audioBuffer, width);
  
  renderWaveform(canvas, waveformData, {
    width,
    height,
    waveColor: '#4F46E5',
    normalize: true,
  });
  
  return canvas.toDataURL();
}

/**
 * Real-time waveform analyzer for live audio
 */
export class RealTimeWaveformAnalyzer {
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private canvas: HTMLCanvasElement;
  private animationId?: number;

  constructor(audioContext: AudioContext, canvas: HTMLCanvasElement) {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.canvas = canvas;
  }

  connect(source: AudioNode): void {
    source.connect(this.analyser);
  }

  start(): void {
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    const ctx = this.canvas.getContext('2d')!;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    
    const sliceWidth = width / this.dataArray.length;
    let x = 0;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      const v = (this.dataArray[i] ?? 0) / 128.0;
      const y = (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  }
}
