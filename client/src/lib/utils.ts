import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function uploadMixRequest(
  projectId: string,
  stems: File[],
  reference?: File,
  prompt?: string
) {
  const formData = new FormData();

  // Add stems
  stems.forEach(stem => {
    formData.append('stems', stem);
  });

  // Add reference if provided
  if (reference) {
    formData.append('reference', reference);
  }

  // Add prompt if provided
  if (prompt) {
    formData.append('prompt', prompt);
  }

  const response = await fetch(`/api/projects/${projectId}/mix-with-reference`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Mix request failed');
  }

  return response.json();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'audio/wav',
    'audio/wave', 
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/flac',
    'audio/x-flac',
    'audio/aac',
    'audio/ogg'
  ];

  const allowedExtensions = ['.wav', '.mp3', '.flac', '.aac', '.ogg', '.m4a'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  // Check file size (100MB limit)
  if (file.size > 100 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be less than 100MB' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'Unsupported file format. Please use WAV, MP3, FLAC, AAC, or OGG files.' };
  }

  return { isValid: true };
}

import axios from 'axios';

export async function mixWithReference(projectId: string, addMissing = false): Promise<string> {
  const form = new FormData();
  document.querySelectorAll('input.stem').forEach((el: any) => el.files && form.append('stems', el.files[0]));
  const ref = document.querySelector('input.reference') as HTMLInputElement;
  if (ref.files?.[0]) form.append('reference', ref.files[0]);
  form.append('addMissing', String(addMissing));

  const { data } = await axios.post(`/api/projects/${projectId}/mix-with-reference`, form);
  return data.url;
}