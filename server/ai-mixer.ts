import OpenAI from "openai";
import type { Stem, ReferenceTrack, MixJob } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  stems: Stem[],
  referenceTrack: ReferenceTrack | null,
  prompt: string
): Promise<MixingAnalysis> {
  try {
    const stemAnalysis = stems.map(stem => ({
      name: stem.name,
      type: stem.type,
      analysis: {
        peakLevel: stem.analysis.peakLevel,
        loudness: stem.analysis.loudness,
        keyEstimate: stem.analysis.keyEstimate,
        bpmEstimate: stem.analysis.bpmEstimate,
        spectralCentroid: stem.analysis.spectralCentroid,
        harmonicContent: stem.analysis.harmonicContent
      }
    }));

    const referenceAnalysis = referenceTrack ? {
      keyEstimate: referenceTrack.analysis.keyEstimate,
      bpmEstimate: referenceTrack.analysis.bpmEstimate,
      loudness: referenceTrack.analysis.loudness,
      spectralCentroid: referenceTrack.analysis.spectralCentroid,
      detectedInstruments: referenceTrack.analysis.detectedInstruments
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis as MixingAnalysis;

  } catch (error) {
    console.error("AI mixing analysis failed:", error);
    // Fallback strategy
    return {
      mixingStrategy: "Professional balanced mix with emphasis on clarity and punch",
      instrumentBalance: stems.reduce((acc, stem) => ({ ...acc, [stem.name]: 0.8 }), {}),
      effectsChain: ["EQ", "Compression", "Reverb", "Limiter"],
      masteringApproach: "Modern loud master with preserved dynamics",
      creativeSuggestions: ["Add subtle stereo widening", "Enhance low-end presence"],
      technicalParameters: {
        targetLoudness: -14,
        stereoWidth: 0.8,
        dynamicRange: "medium",
        frequencyBalance: { low: 0.8, mid: 0.9, high: 0.85 }
      }
    };
  }
}

export async function generateMissingInstruments(
  existingStems: Stem[],
  referenceTrack: ReferenceTrack | null,
  prompt: string
): Promise<Array<{ name: string; type: string; description: string; necessity: number }>> {
  try {
    const existingTypes = existingStems.map(s => s.type);
    const referenceInstruments = referenceTrack?.analysis.detectedInstruments || [];

    const systemPrompt = `You are an expert music arranger and producer. Analyze existing stems and suggest missing instruments that would enhance the track.

Respond with JSON array of objects with these exact fields:
- name: Instrument name
- type: Instrument category (drums, bass, vocals, guitar, keys, synth, strings, brass, fx, other)
- description: What this instrument would add to the mix
- necessity: How important this addition is (0-1, where 1 is essential)

Only suggest instruments that would genuinely improve the track. Consider genre conventions and sonic balance.`;

    const userPrompt = `
EXISTING STEMS: ${existingTypes.join(', ')}
${referenceInstruments.length ? `REFERENCE INSTRUMENTS: ${referenceInstruments.map(i => i.instrument).join(', ')}` : ''}
USER PROMPT: "${prompt}"

What instruments should be added to complete this track?`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.instruments || [];

  } catch (error) {
    console.error("AI instrument generation failed:", error);
    return [];
  }
}

export async function analyzeMixingProgress(
  currentPhase: string,
  progress: number
): Promise<{ description: string; nextSteps: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `As a professional audio engineer, describe what's happening during the "${currentPhase}" phase at ${progress}% completion. Provide a brief technical description and list the next 2-3 steps. Respond in JSON format with "description" and "nextSteps" array fields.`
      }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 300
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      description: `Processing ${currentPhase} phase`,
      nextSteps: ["Continue processing", "Apply effects", "Finalize mix"]
    };
  }
}