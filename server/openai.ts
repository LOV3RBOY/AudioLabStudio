import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AudioAnalysisResult {
  musicality: {
    genre: string;
    subgenre: string;
    mood: string;
    energy: number; // 0-1
    valence: number; // 0-1
    danceability: number; // 0-1
  };
  technical: {
    keySignature: string;
    timeSignature: string;
    bpm: number;
    structure: string[];
    loudness: number;
    dynamicRange: number;
  };
  mixing: {
    stereoWidth: number;
    frequencyBalance: {
      bass: number;
      midrange: number;
      treble: number;
    };
    compression: number;
    reverb: number;
    saturation: number;
  };
  instruments: Array<{
    name: string;
    confidence: number;
    prominence: number;
    frequency_range: [number, number];
    stereo_position: number;
  }>;
  recommendations: {
    mixing_approach: string;
    suggested_processing: string[];
    compatibility_notes: string;
  };
}

export async function analyzeAudioWithAI(
  audioMetadata: any,
  analysisData: any,
  trackType: 'stem' | 'reference'
): Promise<AudioAnalysisResult> {
  try {
    const prompt = `You are a professional audio engineer and producer with decades of experience. Analyze this ${trackType} audio track based on the provided technical data and return a comprehensive professional analysis.

Audio Metadata:
- Duration: ${audioMetadata.duration}s
- Sample Rate: ${audioMetadata.sampleRate}Hz
- Bit Depth: ${audioMetadata.bitDepth}bit
- Channels: ${audioMetadata.channels}
- Format: ${audioMetadata.format}

Technical Analysis Data:
- Peak Level: ${analysisData.peakLevel}dB
- Average Level: ${analysisData.averageLevel}dB
- Loudness: ${analysisData.loudness}LUFS
- Dynamic Range: ${analysisData.dynamicRange}LU
- Spectral Centroid: ${analysisData.spectralCentroid}Hz
- BPM Estimate: ${analysisData.bpmEstimate}

Provide a professional analysis in JSON format with the following structure:
{
  "musicality": {
    "genre": "primary genre",
    "subgenre": "specific subgenre",
    "mood": "emotional descriptor",
    "energy": number between 0-1,
    "valence": number between 0-1,
    "danceability": number between 0-1
  },
  "technical": {
    "keySignature": "musical key",
    "timeSignature": "time signature",
    "bpm": accurate BPM number,
    "structure": ["intro", "verse", "chorus", etc.],
    "loudness": LUFS value,
    "dynamicRange": LU value
  },
  "mixing": {
    "stereoWidth": number between 0-1,
    "frequencyBalance": {
      "bass": number between 0-1,
      "midrange": number between 0-1,
      "treble": number between 0-1
    },
    "compression": number between 0-1,
    "reverb": number between 0-1,
    "saturation": number between 0-1
  },
  "instruments": [
    {
      "name": "instrument name",
      "confidence": number between 0-1,
      "prominence": number between 0-1,
      "frequency_range": [low_hz, high_hz],
      "stereo_position": number between -1 (left) and 1 (right)
    }
  ],
  "recommendations": {
    "mixing_approach": "detailed mixing strategy",
    "suggested_processing": ["specific processing suggestions"],
    "compatibility_notes": "notes about how this would work with other elements"
  }
}

Base your analysis on professional audio engineering principles and industry standards.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a world-class audio engineer and producer. Provide detailed, professional audio analysis based on technical data. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as AudioAnalysisResult;
  } catch (error) {
    console.error('Error in AI audio analysis:', error);
    throw new Error('Failed to analyze audio with AI');
  }
}

export async function generateMixingStrategy(
  stems: any[],
  referenceTrack: any,
  userPrompt: string
): Promise<{
  strategy: string;
  stemProcessing: Array<{
    stemId: number;
    processing: string[];
    levels: {
      volume: number;
      pan: number;
    };
    effects: Array<{
      type: string;
      settings: Record<string, any>;
    }>;
  }>;
  masterProcessing: string[];
  explanation: string;
}> {
  try {
    const prompt = `You are a professional mixing engineer. Create a detailed mixing strategy based on:

User Request: "${userPrompt}"

Available Stems:
${stems.map(stem => `- ${stem.name} (${stem.type}): ${stem.analysis.keyEstimate}, ${stem.analysis.bpmEstimate}BPM`).join('\n')}

Reference Track Analysis:
${referenceTrack ? `- Key: ${referenceTrack.analysis.keyEstimate}, BPM: ${referenceTrack.analysis.bpmEstimate}, Style: Professional mix` : 'No reference track provided'}

Create a professional mixing strategy that:
1. Balances all stems appropriately
2. Matches the reference track style (if provided)
3. Achieves the user's creative vision
4. Follows professional mixing standards

Respond in JSON format:
{
  "strategy": "overall mixing approach and philosophy",
  "stemProcessing": [
    {
      "stemId": stem_id_number,
      "processing": ["list of processing steps"],
      "levels": {
        "volume": number_between_0_and_1,
        "pan": number_between_-1_and_1
      },
      "effects": [
        {
          "type": "effect_name",
          "settings": {"parameter": "value"}
        }
      ]
    }
  ],
  "masterProcessing": ["master chain processing steps"],
  "explanation": "detailed explanation of the mixing decisions"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Grammy-winning mixing engineer. Create professional mixing strategies that sound industry-standard. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error generating mixing strategy:', error);
    throw new Error('Failed to generate mixing strategy');
  }
}

export async function generateMissingInstruments(
  existingStems: any[],
  referenceTrack: any,
  targetStyle: string
): Promise<Array<{
  instrument: string;
  type: string;
  reasoning: string;
  priority: number;
  characteristics: {
    key: string;
    bpm: number;
    style: string;
    intensity: number;
  };
}>> {
  try {
    const prompt = `You are a professional music producer. Analyze the provided stems and suggest missing instruments to complete the track.

Existing Stems:
${existingStems.map(stem => `- ${stem.name} (${stem.type})`).join('\n')}

Reference Style: ${targetStyle}
${referenceTrack ? `Reference Track Key: ${referenceTrack.analysis.keyEstimate}, BPM: ${referenceTrack.analysis.bpmEstimate}` : ''}

Suggest missing instruments that would enhance this track based on professional production standards.

Respond in JSON format:
{
  "suggestions": [
    {
      "instrument": "instrument name",
      "type": "instrument category",
      "reasoning": "why this instrument is needed",
      "priority": number_between_1_and_10,
      "characteristics": {
        "key": "musical key",
        "bpm": bpm_number,
        "style": "playing style",
        "intensity": number_between_0_and_1
      }
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional music producer with expertise in arrangement. Suggest realistic, professional instrument additions. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.suggestions || [];
  } catch (error) {
    console.error('Error generating missing instruments:', error);
    throw new Error('Failed to generate missing instruments');
  }
}