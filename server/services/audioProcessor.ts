import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { FFMPEG_PATH, FFPROBE_PATH, UPLOAD_DIR, DOWNLOAD_DIR } from '../config';
import { logger } from '../utils/logger';

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: string;
  fileSize: number;
  codec?: string;
}

export interface AudioProcessingOptions {
  normalize?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  trim?: { start: number; end: number };
  volume?: number;
  sampleRate?: number;
  bitDepth?: number;
}

export class AudioProcessor {

  static async analyzeAudio(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const ffprobe = spawn(FFPROBE_PATH, args);
      let output = '';
      let error = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        error += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          logger.error({ error, filePath }, 'FFprobe analysis failed');
          reject(new Error(`FFprobe failed: ${error}`));
          return;
        }

        try {
          const data = JSON.parse(output);
          const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

          if (!audioStream) {
            reject(new Error('No audio stream found in file'));
            return;
          }

          const stats = require('fs').statSync(filePath);

          resolve({
            duration: parseFloat(data.format.duration || '0'),
            sampleRate: parseInt(audioStream.sample_rate || '44100'),
            bitDepth: audioStream.bits_per_sample || 16,
            channels: audioStream.channels || 2,
            format: data.format.format_name || 'unknown',
            codec: audioStream.codec_name,
            fileSize: stats.size
          });
        } catch (parseError) {
          logger.error({ parseError: parseError.message, output }, 'Failed to parse FFprobe output');
          reject(new Error(`Failed to parse audio metadata: ${parseError.message}`));
        }
      });
    });
  }

  static async processAudio(
    inputPath: string, 
    outputPath: string, 
    options: AudioProcessingOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ['-i', inputPath];

      // Add audio filters
      const filters: string[] = [];

      if (options.normalize) {
        filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
      }

      if (options.fadeIn) {
        filters.push(`afade=t=in:d=${options.fadeIn}`);
      }

      if (options.fadeOut) {
        filters.push(`afade=t=out:d=${options.fadeOut}`);
      }

      if (options.volume && options.volume !== 1) {
        filters.push(`volume=${options.volume}`);
      }

      if (filters.length > 0) {
        args.push('-af', filters.join(','));
      }

      // Add encoding options
      if (options.sampleRate) {
        args.push('-ar', options.sampleRate.toString());
      }

      if (options.bitDepth) {
        args.push('-sample_fmt', options.bitDepth === 16 ? 's16' : 's32');
      }

      // Add trim options
      if (options.trim) {
        args.push('-ss', options.trim.start.toString());
        args.push('-to', options.trim.end.toString());
      }

      args.push('-y', outputPath);

      logger.info({ inputPath, outputPath, args }, 'Starting FFmpeg processing');

      const ffmpeg = spawn(FFMPEG_PATH, args);
      let error = '';

      ffmpeg.stderr.on('data', (data) => {
        error += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          logger.error({ error, inputPath, outputPath }, 'FFmpeg processing failed');
          reject(new Error(`FFmpeg failed: ${error}`));
          return;
        }

        logger.info({ inputPath, outputPath }, 'FFmpeg processing completed');
        resolve();
      });
    });
  }

  static async mixAudioFiles(
    stemPaths: string[],
    outputPath: string,
    volumes: number[] = []
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = [];

      // Add input files
      stemPaths.forEach(path => {
        args.push('-i', path);
      });

      // Create filter for mixing
      const inputs = stemPaths.map((_, i) => {
        const volume = volumes[i] || 1;
        return volume !== 1 ? `[${i}]volume=${volume}[v${i}]` : `[${i}]`;
      });

      const volumeFilters = inputs.filter(input => input.includes('volume')).join(';');
      const mixInputs = inputs.map((input, i) => 
        volumes[i] && volumes[i] !== 1 ? `[v${i}]` : `[${i}]`
      ).join('');

      const filterComplex = volumeFilters ? 
        `${volumeFilters};${mixInputs}amix=inputs=${stemPaths.length}:duration=longest[out]` :
        `${mixInputs}amix=inputs=${stemPaths.length}:duration=longest[out]`;

      args.push('-filter_complex', filterComplex);
      args.push('-map', '[out]');
      args.push('-y', outputPath);

      logger.info({ stemPaths, outputPath, volumes }, 'Starting audio mixing');

      const ffmpeg = spawn(FFMPEG_PATH, args);
      let error = '';

      ffmpeg.stderr.on('data', (data) => {
        error += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          logger.error({ error, stemPaths, outputPath }, 'Audio mixing failed');
          reject(new Error(`Audio mixing failed: ${error}`));
          return;
        }

        logger.info({ outputPath }, 'Audio mixing completed');
        resolve();
      });
    });
  }

  static async convertToWav(inputPath: string, outputPath: string): Promise<void> {
    return this.processAudio(inputPath, outputPath, {
      sampleRate: 44100,
      bitDepth: 16
    });
  }

  static async testFFmpegInstallation(): Promise<boolean> {
    try {
      await Promise.all([
        this.runCommand(FFMPEG_PATH, ['-version']),
        this.runCommand(FFPROBE_PATH, ['-version'])
      ]);
      logger.info('FFmpeg and FFprobe are properly installed');
      return true;
    } catch (error) {
      logger.error({ error }, 'FFmpeg/FFprobe test failed');
      return false;
    }
  }

  private static runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed with code ${code}`));
      });
      process.on('error', reject);
    });
  }
}