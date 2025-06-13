
import { AudioProcessor } from './services/audioProcessor';
import { logger } from './utils/logger';
import { OPENAI_API_KEY } from './config';
import fs from 'fs';
import path from 'path';

export async function checkSystemRequirements(): Promise<void> {
  logger.info('Checking system requirements...');

  // Check OpenAI API key
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
  }
  logger.info('✓ OpenAI API key configured');

  // Check FFmpeg installation
  const ffmpegInstalled = await AudioProcessor.testFFmpegInstallation();
  if (!ffmpegInstalled) {
    throw new Error('FFmpeg/FFprobe not found. Please install FFmpeg.');
  }
  logger.info('✓ FFmpeg and FFprobe installed');

  // Check directories
  const dirs = ['uploads', 'downloads'];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`✓ Created directory: ${dir}`);
    } else {
      logger.info(`✓ Directory exists: ${dir}`);
    }
  }

  logger.info('✅ All system requirements satisfied');
}
