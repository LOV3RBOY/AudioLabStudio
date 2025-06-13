/**
 * Audio Processing Utilities
 * Handles audio file processing, format conversion, and audio buffer operations
 * for the AI audio production tool.
 */

import {
  createAudioContext,
  AudioAnalysisResult,
  decodeAudioData,
  analyzeAudioFile,
} from "./analysis";

export interface ProcessingOptions {
  normalize: boolean;
  trim: boolean;
  fadeIn: number;  // seconds
  fadeOut: number; // seconds
  gain: number;    // dB
}

export interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  bitDepth?: number;
}

/**
 * Process uploaded audio file
 */
export async function processAudioFile(
  file: File,
  options: Partial<ProcessingOptions> = {}
): Promise<{ audioBuffer: AudioBuffer; info: AudioFileInfo; analysis: AudioAnalysisResult }> {
  const opts: ProcessingOptions = {
    normalize: true,
    trim: false,
    fadeIn: 0,
    fadeOut: 0,
    gain: 0,
    ...options,
  };

  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();

  let audioBuffer = await decodeAudioData(arrayBuffer);

  // Apply processing options
  if (opts.normalize || opts.trim || opts.fadeIn > 0 || opts.fadeOut > 0 || opts.gain !== 0) {
    audioBuffer = await applyProcessing(audioBuffer, opts);
  }

  // Generate file info
  const info: AudioFileInfo = {
    name: file.name,
    size: file.size,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    format: getFileFormat(file.name),
    bitDepth: estimateBitDepth(file.size, audioBuffer.duration, audioBuffer.sampleRate, audioBuffer.numberOfChannels),
  };

  // Analyze audio
  const analysis = await analyzeAudioFile(arrayBuffer, audioBuffer);

  return { audioBuffer, info, analysis };
}

/**
 * Apply audio processing to buffer
 */
async function applyProcessing(
  audioBuffer: AudioBuffer,
  options: ProcessingOptions
): Promise<AudioBuffer> {
  const audioContext = createAudioContext();
  const outputBuffer = new AudioBuffer({
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
    sampleRate: audioBuffer.sampleRate
  });

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    // Copy input to output
    outputData.set(inputData);
    
    // Apply gain
    if (options.gain !== 0) {
      const gainLinear = Math.pow(10, options.gain / 20);
      for (let i = 0; i < outputData.length; i++) {
        outputData[i] *= gainLinear;
      }
    }
    
    // Apply fade in
    if (options.fadeIn > 0) {
      const fadeInSamples = Math.floor(options.fadeIn * audioBuffer.sampleRate);
      for (let i = 0; i < Math.min(fadeInSamples, outputData.length); i++) {
        const fadeGain = i / fadeInSamples;
        outputData[i] *= fadeGain;
      }
    }

    // Apply fade out
    if (options.fadeOut > 0) {
      const fadeOutSamples = Math.floor(options.fadeOut * audioBuffer.sampleRate);
      const startSample = Math.max(0, outputData.length - fadeOutSamples);
      for (let i = startSample; i < outputData.length; i++) {
        const fadeGain = (outputData.length - i) / fadeOutSamples;
        outputData[i] *= fadeGain;
      }
    }

    // Normalize
    if (options.normalize) {
      const maxValue = Math.max(...outputData.map(Math.abs));
      if (maxValue > 0) {
        const normalizeGain = 0.95 / maxValue; // Leave some headroom
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] *= normalizeGain;
        }
      }
    }
  }

  return outputBuffer;
}

/**
 * Convert audio buffer to different sample rate
 */
export async function resampleAudioBuffer(
  audioBuffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  if (audioBuffer.sampleRate === targetSampleRate) {
    return audioBuffer;
  }

  const audioContext = createAudioContext();
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.length * (targetSampleRate / audioBuffer.sampleRate)),
    targetSampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();

  return await offlineContext.startRendering();
}

/**
 * Mix multiple audio buffers into one
 */
export function mixAudioBuffers(
  buffers: AudioBuffer[],
  gains: number[] = []
): AudioBuffer {
  if (buffers.length === 0) {
    throw new Error('No audio buffers provided');
  }

  const audioContext = createAudioContext();
  const firstBuffer = buffers[0];
  const maxLength = Math.max(...buffers.map(b => b.length));
  const outputBuffer = new OfflineAudioContext(
    firstBuffer.numberOfChannels,
    maxLength,
    firstBuffer.sampleRate
  ).createBuffer(
    firstBuffer.numberOfChannels,
    maxLength,
    firstBuffer.sampleRate
  );

  for (let channel = 0; channel < firstBuffer.numberOfChannels; channel++) {
    const outputData = outputBuffer.getChannelData(channel);

    buffers.forEach((buffer, bufferIndex) => {
      const gain = gains[bufferIndex] || 1;
      const inputData = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));

      for (let i = 0; i < Math.min(inputData.length, outputData.length); i++) {
        outputData[i] += inputData[i] * gain;
      }
    });
  }

  return outputBuffer;
}

/**
 * Extract a portion of audio buffer
 */
export function extractAudioRegion(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer {
  const audioContext = createAudioContext();
  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const endSample = Math.floor(endTime * audioBuffer.sampleRate);
  const length = endSample - startSample;

  // Create a new offline audio context for buffer creation
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    length,
    audioBuffer.sampleRate
  );

  const outputBuffer = offlineContext.createBuffer(
    audioBuffer.numberOfChannels,
    length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    for (let i = 0; i < length; i++) {
      const sourceIndex = startSample + i;
      if (sourceIndex < inputData.length) {
        outputData[i] = inputData[sourceIndex];
      }
    }
  }

  return outputBuffer;
}

/**
 * Convert audio buffer to blob for download
 */
export async function audioBufferToBlob(
  audioBuffer: AudioBuffer,
  format: 'wav' | 'mp3' = 'wav'
): Promise<Blob> {
  if (format === 'wav') {
    return audioBufferToWAV(audioBuffer);
  } else {
    throw new Error('MP3 encoding not implemented');
  }
}

/**
 * Convert audio buffer to WAV blob
 */
function audioBufferToWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const pcmSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      view.setInt16(offset, pcmSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Validate audio file format
 */
export function validateAudioFile(file: File): boolean {
  const supportedFormats = [
    'audio/wav', 'audio/x-wav',
    'audio/mp3', 'audio/mpeg',
    'audio/flac',
    'audio/aiff', 'audio/x-aiff',
    'audio/ogg'
  ];
  
  return supportedFormats.includes(file.type) || 
         getSupportedExtensions().some(ext => file.name.toLowerCase().endsWith(ext));
}

function getSupportedExtensions(): string[] {
  return ['.wav', '.mp3', '.flac', '.aiff', '.aif', '.ogg'];
}

function getFileFormat(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'wav': return 'WAV';
    case 'mp3': return 'MP3';
    case 'flac': return 'FLAC';
    case 'aiff':
    case 'aif': return 'AIFF';
    case 'ogg': return 'OGG';
    default: return 'Unknown';
  }
}

function estimateBitDepth(fileSize: number, duration: number, sampleRate: number, channels: number): number {
  const totalSamples = duration * sampleRate * channels;
  const bytesPerSample = fileSize / totalSamples;
  
  if (bytesPerSample >= 3) return 24;
  if (bytesPerSample >= 2) return 16;
  return 8;
}
