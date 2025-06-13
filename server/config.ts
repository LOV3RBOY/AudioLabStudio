import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const SERVER_PORT = process.env.PORT || 5000;
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
export const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || 'downloads';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
export const FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe';
export const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';