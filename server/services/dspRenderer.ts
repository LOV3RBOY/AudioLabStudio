import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { FFMPEG_PATH, DOWNLOAD_DIR } from '../config';

interface RenderOptions {
  stems: Array<{
    filePath: string;
    volume: number;
    pan: number;
    effects?: string[];
  }>;
  outputPath: string;
  settings: {
    sampleRate: number;
    bitDepth: number;
    format: string;
  };
}

export async function renderMix(options: RenderOptions): Promise<string> {
  const { stems, outputPath, settings } = options;

  try {
    logger.info('Starting DSP render process');

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Create ffmpeg command
    const args = ['-y']; // overwrite output

    // Add input files
    stems.forEach(stem => {
      args.push('-i', stem.filePath);
    });

    // Create filter complex for mixing
    let filterComplex = '';
    const audioLabels: string[] = [];

    stems.forEach((stem, index) => {
      const volume = stem.volume || 1.0;
      const pan = stem.pan || 0.0;

      let filter = `[${index}:a]volume=${volume}`;

      if (pan !== 0) {
        const leftGain = pan <= 0 ? 1.0 : 1.0 - pan;
        const rightGain = pan >= 0 ? 1.0 : 1.0 + pan;
        filter += `,pan=stereo|FL=${leftGain}*c0|FR=${rightGain}*c1`;
      }

      filter += `[a${index}]`;
      filterComplex += filter + ';';
      audioLabels.push(`[a${index}]`);
    });

    // Mix all processed stems
    if (audioLabels.length > 1) {
      filterComplex += `${audioLabels.join('')}amix=inputs=${audioLabels.length}:duration=longest[out]`;
    } else {
      filterComplex += `[a0]acopy[out]`;
    }

    args.push('-filter_complex', filterComplex);
    args.push('-map', '[out]');

    // Set output format and quality
    args.push('-ar', settings.sampleRate.toString());
    if (settings.format === 'wav') {
      args.push('-f', 'wav');
      args.push('-acodec', 'pcm_s' + settings.bitDepth + 'le');
    } else if (settings.format === 'mp3') {
      args.push('-f', 'mp3');
      args.push('-b:a', '320k');
    }

    args.push(outputPath);

    logger.info({ args }, 'Running ffmpeg command');

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(FFMPEG_PATH, args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          logger.info('DSP render completed successfully');
          resolve(outputPath);
        } else {
          logger.error({ code, stderr }, 'FFmpeg process failed');
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        logger.error({ error }, 'FFmpeg spawn error');
        reject(error);
      });
    });

  } catch (error) {
    logger.error({ error }, 'DSP render failed');
    throw error;
  }
}

export async function analyzeAudioFile(filePath: string): Promise<any> {
  try {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ];

    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', args);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(stdout);
            resolve(metadata);
          } catch (parseError) {
            logger.error({ parseError: parseError.message, stdout }, 'Failed to parse ffprobe output');
            reject(new Error(`Failed to parse ffprobe output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }
      });
    });

  } catch (error) {
    logger.error({ error, filePath }, 'Audio analysis failed');
    throw error;
  }
}