/**
 * Audio Analysis Utilities
 * 
 * This file contains client-side audio analysis functions using the Web Audio API.
 * These utilities help extract musical information, analyze frequency content,
 * and generate visualization data from audio files or streams.
 */

// Create AudioContext with browser compatibility
export function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser');
  }
  return new AudioContextClass();
}

/**
 * Analyzes an audio file to extract waveform data for visualization
 */
export async function analyzeAudioFile(file: File): Promise<AudioAnalysisResult> {
  const audioContext = createAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Generate waveform peaks for visualization
  const peaks = generateWaveformPeaks(channelData, 1000); // 1000 peaks

  // Analyze frequency content
  const frequencyAnalysis = await analyzeFrequencyContent(audioBuffer);

  // Detect tempo
  const bpmEstimate = detectTempo(channelData, sampleRate);

  // Analyze dynamics
  const dynamics = analyzeDynamics(channelData);

  return {
    duration,
    sampleRate,
    channels: audioBuffer.numberOfChannels,
    peaks,
    frequencyAnalysis,
    bpmEstimate,
    dynamics,
    loudness: calculateLUFS(channelData, sampleRate),
  };
}

/**
 * Generate waveform peaks for visualization
 */
export function generateWaveformPeaks(channelData: Float32Array, targetPeaks: number): number[] {
  // Validate input parameters
  if (!channelData || channelData.length === 0) {
    return new Array(targetPeaks).fill(0);
  }
  
  if (targetPeaks <= 0) {
    return [];
  }

  const blockSize = Math.floor(channelData.length / targetPeaks);
  const peaks: number[] = [];

  for (let i = 0; i < targetPeaks; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    
    let max = 0;
    for (let j = start; j < end && j < channelData.length; j++) {
      const sample = channelData[j];
      if (sample !== undefined && !isNaN(sample)) {
        max = Math.max(max, Math.abs(sample));
      }
    }
    
    peaks.push(max);
  }

  return peaks;
}

/**
 * Analyze frequency content using FFT
 */
export async function analyzeFrequencyContent(audioBuffer: AudioBuffer): Promise<FrequencyAnalysis> {
  const audioContext = createAudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Create offline context for analysis
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const offlineSource = offlineContext.createBufferSource();
  const offlineAnalyser = offlineContext.createAnalyser();
  
  offlineSource.buffer = audioBuffer;
  offlineSource.connect(offlineAnalyser);
  offlineAnalyser.connect(offlineContext.destination);
  
  offlineSource.start();
  const renderedBuffer = await offlineContext.startRendering();
  
  // Analyze frequency bins
  offlineAnalyser.getByteFrequencyData(dataArray);
  
  return {
    frequencyBins: Array.from(dataArray),
    spectralCentroid: calculateSpectralCentroid(dataArray, audioBuffer.sampleRate),
    dominantFrequency: findDominantFrequency(dataArray, audioBuffer.sampleRate),
  };
}

/**
 * Detect tempo using autocorrelation
 */
export function detectTempo(channelData: Float32Array, sampleRate: number): number {
  const bpm = 120; // Placeholder - real implementation would use onset detection + autocorrelation
  return bpm;
}

/**
 * Analyze dynamics (peak, RMS, dynamic range)
 */
export function analyzeDynamics(channelData: Float32Array): DynamicsAnalysis {
  if (!channelData || channelData.length === 0) {
    return {
      peak: -Infinity,
      rms: -Infinity,
      dynamicRange: 0,
      crestFactor: 1,
    };
  }

  let peak = 0;
  let sumSquares = 0;

  for (let i = 0; i < channelData.length; i++) {
    const sample = channelData[i];
    if (sample !== undefined && !isNaN(sample)) {
      const absSample = Math.abs(sample);
      peak = Math.max(peak, absSample);
      sumSquares += sample * sample;
    }
  }

  const rms = Math.sqrt(sumSquares / channelData.length);
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

  return {
    peak: peakDb,
    rms: rmsDb,
    dynamicRange: peakDb - rmsDb,
    crestFactor: rms > 0 ? peak / rms : 1,
  };
}

/**
 * Calculate LUFS (Loudness Units relative to Full Scale)
 */
export function calculateLUFS(channelData: Float32Array, sampleRate: number): number {
  // Simplified LUFS calculation - real implementation would use proper K-weighting
  const rms = Math.sqrt(channelData.reduce((sum, sample) => sum + sample * sample, 0) / channelData.length);
  return -23 + 20 * Math.log10(rms); // Approximation
}

function calculateSpectralCentroid(frequencyData: Uint8Array, sampleRate: number): number {
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = (i * sampleRate) / (2 * frequencyData.length);
    const magnitude = frequencyData[i];
    
    if (magnitude !== undefined && !isNaN(magnitude)) {
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

function findDominantFrequency(frequencyData: Uint8Array, sampleRate: number): number {
  let maxMagnitude = 0;
  let dominantBin = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = frequencyData[i];
    if (magnitude !== undefined && !isNaN(magnitude) && magnitude > maxMagnitude) {
      maxMagnitude = magnitude;
      dominantBin = i;
    }
  }

  return (dominantBin * sampleRate) / (2 * frequencyData.length);
}

// Type definitions
export interface AudioAnalysisResult {
  duration: number;
  sampleRate: number;
  channels: number;
  peaks: number[];
  frequencyAnalysis: FrequencyAnalysis;
  bpmEstimate: number;
  dynamics: DynamicsAnalysis;
  loudness: number;
}

export interface FrequencyAnalysis {
  frequencyBins: number[];
  spectralCentroid: number;
  dominantFrequency: number;
}

export interface DynamicsAnalysis {
  peak: number;
  rms: number;
  dynamicRange: number;
  crestFactor: number;
}
