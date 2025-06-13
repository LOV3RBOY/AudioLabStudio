// Audio utility functions for processing and analysis

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function validateAudioFile(file: File): boolean {
  const supportedTypes = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/flac',
    'audio/aiff',
    'audio/ogg',
  ];
  
  return supportedTypes.includes(file.type) || 
         file.name.toLowerCase().match(/\.(wav|mp3|flac|aiff|aif|ogg)$/);
}

export function generateWaveformData(audioBuffer: AudioBuffer): number[] {
  const data = audioBuffer.getChannelData(0);
  const samples = 100; // Number of samples for visualization
  const blockSize = Math.floor(data.length / samples);
  const waveformData: number[] = [];

  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(data[blockStart + j]);
    }
    waveformData.push(sum / blockSize);
  }

  return waveformData;
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  return 20 * Math.log10(linear);
}

export function panToStereo(pan: number): { left: number; right: number } {
  // Pan range: -100 (full left) to 100 (full right)
  const normalizedPan = pan / 100; // Convert to -1 to 1 range
  const leftGain = Math.cos((normalizedPan + 1) * Math.PI / 4);
  const rightGain = Math.sin((normalizedPan + 1) * Math.PI / 4);
  
  return { left: leftGain, right: rightGain };
}
