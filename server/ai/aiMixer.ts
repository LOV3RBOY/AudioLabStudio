import fs from 'fs';
import path from 'path';
import { callOpenAI } from './openaiClient';
import { UPLOAD_DIR } from '../config';

export interface Analysis {
  tempo: number;
  key: string;
  sections: Array<{ name: string; start: number; end: number }>;
  missing: Array<{ instrument: string; length: number }>;
}

export async function analyzeMixRequirements(
  projectId: string,
  referencePath: string | null
): Promise<Analysis> {
  const payload: any = { task: 'analyze_reference', projectId };
  if (referencePath) payload.file = fs.createReadStream(referencePath);

  const response = await callOpenAI(payload);
  return response.data;
}

export async function generateMissingInstruments(projectId: string, analysis: Analysis) {
  const outDir = path.join(UPLOAD_DIR, projectId);
  fs.mkdirSync(outDir, { recursive: true });

  for (const gap of analysis.missing) {
    const prompt = `Generate a ${gap.length}s ${gap.instrument} at ${analysis.tempo} BPM in key ${analysis.key}.`;
    const { data: audioBuffer } = await callOpenAI({ task: 'generate_audio', prompt, projectId });
    const outPath = path.join(outDir, `${gap.instrument}.wav`);
    fs.writeFileSync(outPath, audioBuffer as Buffer);
  }
}

export async function generateMixSheet(projectId: string, analysis: Analysis) {
  const { data } = await callOpenAI({ task: 'generate_mix_sheet', projectId, data: analysis });
  return JSON.parse(data.choices[0].message.content);
}

interface MixingAnalysis {
  mixingStrategy: string;
  instrumentBalance: Record<string, number>;
  effectsChain: string[];
  masteringApproach: string;
  creativeSuggestions: string[];
  technicalParameters: {
    targetLoudness: number;
    stereoWidth: number;
    dynamicRange: string;
    frequencyBalance: Record<string, number>;
  };
}

export async function analyzeMixingRequirements(
  stems: any[],
  referenceTrack: any | null,
  prompt: string
): Promise<MixingAnalysis> {
  try {
    const stemAnalysis = stems.map(stem => ({
      name: stem.name,
      type: stem.type,
      analysis: {
        peakLevel: stem.analysis?.peakLevel || 0,
        loudness: stem.analysis?.loudness || -23,
        keyEstimate: stem.analysis?.keyEstimate || 'C',
        bpmEstimate: stem.analysis?.bpmEstimate || 120,
        spectralCentroid: stem.analysis?.spectralCentroid || 2000,
        harmonicContent: stem.analysis?.harmonicContent || []
      }
    }));

    const referenceAnalysis = referenceTrack ? {
      keyEstimate: referenceTrack.analysis?.keyEstimate || 'C',
      bpmEstimate: referenceTrack.analysis?.bpmEstimate || 120,
      loudness: referenceTrack.analysis?.loudness || -14,
      spectralCentroid: referenceTrack.analysis?.spectralCentroid || 2000,
      detectedInstruments: referenceTrack.analysis?.detectedInstruments || []
    } : null;

    const systemPrompt = `You are a world-class mixing and mastering engineer with expertise in all genres of music. Your job is to analyze audio stems and create professional mixing strategies.

You will receive:
1. Analysis data from uploaded stems
2. Optional reference track analysis
3. User's creative prompt

Provide a comprehensive mixing strategy as JSON with these exact fields:
- mixingStrategy: Overall approach and philosophy
- instrumentBalance: Object with stem names as keys and volume levels (0-1) as values
- effectsChain: Array of effects to apply in order
- masteringApproach: Final mastering strategy
- creativeSuggestions: Array of creative enhancement ideas
- technicalParameters: Object with targetLoudness, stereoWidth, dynamicRange, and frequencyBalance`;

    const userPrompt = `
STEMS ANALYSIS:
${JSON.stringify(stemAnalysis, null, 2)}

${referenceAnalysis ? `REFERENCE TRACK ANALYSIS:
${JSON.stringify(referenceAnalysis, null, 2)}` : 'No reference track provided.'}

USER PROMPT: "${prompt}"

Create a professional mixing strategy that achieves the user's vision while maintaining technical excellence. Consider the spectral content, dynamics, and harmonic relationships between stems.`;

    const response = await callOpenAI({
      task: 'generate_mix_sheet',
      data: { systemPrompt, userPrompt }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis as MixingAnalysis;
  } catch (error) {
    console.error('Error in AI mixing analysis:', error);
    throw new Error('Failed to analyze mixing requirements');
  }
}