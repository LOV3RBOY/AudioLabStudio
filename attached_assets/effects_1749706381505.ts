/**
 * Audio Effects Utilities
 * 
 * This file contains client-side audio effect processing functions.
 * These utilities can be implemented using the Web Audio API, Tone.js,
 * or other client-side audio processing libraries to apply various
 * effects to audio buffers or live audio streams.
 */

import { createAudioContext } from './analysis';

// Placeholder for a generic effect interface
export interface AudioEffect {
  id: string;
  name: string;
  type: EffectType;
  parameters: Record<string, any>;
  isActive: boolean;
  apply(audioBuffer: AudioBuffer): Promise<AudioBuffer>;
}

export type EffectType = 
  | 'eq' 
  | 'compressor' 
  | 'reverb' 
  | 'delay' 
  | 'distortion' 
  | 'filter' 
  | 'chorus' 
  | 'flanger' 
  | 'phaser'
  | 'gate'
  | 'limiter';

/**
 * EQ Effect Implementation
 */
export class EQEffect implements AudioEffect {
  id: string;
  name: string = 'Equalizer';
  type: EffectType = 'eq';
  isActive: boolean = true;
  
  parameters: {
    lowGain: number;    // -12 to +12 dB
    midGain: number;    // -12 to +12 dB
    highGain: number;   // -12 to +12 dB
    lowFreq: number;    // 20-500 Hz
    midFreq: number;    // 200-5000 Hz
    highFreq: number;   // 2000-20000 Hz
  };

  constructor(id: string, params?: Partial<typeof this.parameters>) {
    this.id = id;
    this.parameters = {
      lowGain: 0,
      midGain: 0,
      highGain: 0,
      lowFreq: 200,
      midFreq: 1000,
      highFreq: 5000,
      ...params
    };
  }

  async apply(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.isActive) return audioBuffer;
    
    const audioContext = createAudioContext();
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create EQ filters
    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = this.parameters.lowFreq;
    lowShelf.gain.value = this.parameters.lowGain;

    const midPeaking = audioContext.createBiquadFilter();
    midPeaking.type = 'peaking';
    midPeaking.frequency.value = this.parameters.midFreq;
    midPeaking.gain.value = this.parameters.midGain;
    midPeaking.Q.value = 1;

    const highShelf = audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = this.parameters.highFreq;
    highShelf.gain.value = this.parameters.highGain;

    // Process each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Apply EQ processing (simplified - real implementation would use proper filter processing)
      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] ?? 0; // Placeholder
      }
    }

    return outputBuffer;
  }
}

/**
 * Compressor Effect Implementation
 */
export class CompressorEffect implements AudioEffect {
  id: string;
  name: string = 'Compressor';
  type: EffectType = 'compressor';
  isActive: boolean = true;
  
  parameters: {
    threshold: number;   // -60 to 0 dB
    ratio: number;       // 1:1 to 20:1
    attack: number;      // 0-100 ms
    release: number;     // 10-1000 ms
    knee: number;        // 0-40 dB
    makeupGain: number;  // 0-20 dB
  };

  constructor(id: string, params?: Partial<typeof this.parameters>) {
    this.id = id;
    this.parameters = {
      threshold: -18,
      ratio: 4,
      attack: 10,
      release: 100,
      knee: 2,
      makeupGain: 0,
      ...params
    };
  }

  async apply(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.isActive) return audioBuffer;
    
    const audioContext = createAudioContext();
    const compressor = audioContext.createDynamicsCompressor();
    
    compressor.threshold.value = this.parameters.threshold;
    compressor.ratio.value = this.parameters.ratio;
    compressor.attack.value = this.parameters.attack / 1000;
    compressor.release.value = this.parameters.release / 1000;
    compressor.knee.value = this.parameters.knee;

    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    const comp = offlineContext.createDynamicsCompressor();
    const gain = offlineContext.createGain();

    // Set compressor parameters
    comp.threshold.value = this.parameters.threshold;
    comp.ratio.value = this.parameters.ratio;
    comp.attack.value = this.parameters.attack / 1000;
    comp.release.value = this.parameters.release / 1000;
    comp.knee.value = this.parameters.knee;

    // Set makeup gain
    gain.gain.value = Math.pow(10, this.parameters.makeupGain / 20);

    source.buffer = audioBuffer;
    source.connect(comp);
    comp.connect(gain);
    gain.connect(offlineContext.destination);

    source.start();
    return await offlineContext.startRendering();
  }
}

/**
 * Reverb Effect Implementation
 */
export class ReverbEffect implements AudioEffect {
  id: string;
  name: string = 'Reverb';
  type: EffectType = 'reverb';
  isActive: boolean = true;
  
  parameters: {
    roomSize: number;    // 0-1
    damping: number;     // 0-1
    wetLevel: number;    // 0-1
    dryLevel: number;    // 0-1
    preDelay: number;    // 0-200 ms
  };

  constructor(id: string, params?: Partial<typeof this.parameters>) {
    this.id = id;
    this.parameters = {
      roomSize: 0.5,
      damping: 0.5,
      wetLevel: 0.3,
      dryLevel: 0.7,
      preDelay: 20,
      ...params
    };
  }

  async apply(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.isActive) return audioBuffer;
    
    // Create impulse response for convolution reverb
    const impulseResponse = await this.createImpulseResponse(audioBuffer.sampleRate);
    
    const audioContext = createAudioContext();
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length + impulseResponse.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    const convolver = offlineContext.createConvolver();
    const wetGain = offlineContext.createGain();
    const dryGain = offlineContext.createGain();
    const merger = offlineContext.createChannelMerger(2);

    source.buffer = audioBuffer;
    convolver.buffer = impulseResponse;
    wetGain.gain.value = this.parameters.wetLevel;
    dryGain.gain.value = this.parameters.dryLevel;

    // Connect dry signal
    source.connect(dryGain);
    dryGain.connect(merger, 0, 0);

    // Connect wet signal
    source.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(merger, 0, 1);

    merger.connect(offlineContext.destination);
    source.start();

    return await offlineContext.startRendering();
  }

  private async createImpulseResponse(sampleRate: number): Promise<AudioBuffer> {
    const audioContext = createAudioContext();
    const length = sampleRate * 2; // 2 seconds
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - (i / length), this.parameters.roomSize * 10);
      const noise = Math.random() * 2 - 1;
      left[i] = noise * decay;
      right[i] = noise * decay;
    }
    
    return impulse;
  }
}

/**
 * Effect Chain Manager
 */
export class EffectChain {
  private effects: AudioEffect[] = [];

  addEffect(effect: AudioEffect): void {
    this.effects.push(effect);
  }

  removeEffect(effectId: string): void {
    this.effects = this.effects.filter(effect => effect.id !== effectId);
  }

  reorderEffects(effectIds: string[]): void {
    const reorderedEffects: AudioEffect[] = [];
    
    effectIds.forEach(id => {
      const effect = this.effects.find(e => e.id === id);
      if (effect) reorderedEffects.push(effect);
    });
    
    this.effects = reorderedEffects;
  }

  async processAudio(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    let processedBuffer = audioBuffer;
    
    for (const effect of this.effects) {
      if (effect.isActive) {
        processedBuffer = await effect.apply(processedBuffer);
      }
    }
    
    return processedBuffer;
  }

  getEffects(): AudioEffect[] {
    return [...this.effects];
  }
}

/**
 * Effect Factory
 */
export class EffectFactory {
  static createEffect(type: EffectType, id: string, parameters?: Record<string, any>): AudioEffect {
    switch (type) {
      case 'eq':
        return new EQEffect(id, parameters);
      case 'compressor':
        return new CompressorEffect(id, parameters);
      case 'reverb':
        return new ReverbEffect(id, parameters);
      default:
        throw new Error(`Effect type '${type}' not implemented`);
    }
  }
}
