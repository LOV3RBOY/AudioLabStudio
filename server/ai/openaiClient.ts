
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config';
import { logger } from '../utils/logger';

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function callOpenAI(options: {
  task: string;
  projectId?: string;
  prompt?: string;
  file?: any;
  data?: any;
}): Promise<any> {
  const { task, prompt, file, data } = options;
  
  try {
    logger.info({ task, projectId: options.projectId }, 'OpenAI API call initiated');
    
    switch (task) {
      case 'analyze_reference':
        if (!file) throw new Error('File required for reference analysis');
        return await openai.audio.transcriptions.create({ 
          file, 
          model: 'whisper-1',
          response_format: 'json'
        });
        
      case 'analyze_audio':
        const analysisPrompt = `Analyze this audio track and provide detailed technical information including:
        - Musical key and BPM
        - Genre and mood
        - Frequency spectrum analysis
        - Dynamic range and loudness
        - Instrument identification
        - Mixing characteristics
        
        Respond in JSON format with structured data.`;
        
        return await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: analysisPrompt },
            { role: 'user', content: prompt || 'Analyze this audio track' }
          ],
          response_format: { type: 'json_object' }
        });
        
      case 'generate_mix_strategy':
        const mixingPrompt = `You are a professional mixing engineer. Based on the provided stems and reference track, create a detailed mixing strategy including:
        - Level balancing recommendations
        - EQ suggestions for each stem
        - Compression settings
        - Spatial positioning (panning)
        - Effects chain recommendations
        - Overall mix approach
        
        Data: ${JSON.stringify(data)}
        User prompt: ${prompt}
        
        Respond in JSON format.`;
        
        return await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: mixingPrompt },
            { role: 'user', content: prompt || 'Create mixing strategy' }
          ],
          response_format: { type: 'json_object' }
        });

      case 'generate_audio':
        // This would require OpenAI's audio generation capability when available
        throw new Error('Audio generation not yet supported by OpenAI API');
        
      case 'generate_mix_sheet':
        return await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Generate structured mix sheet' }, 
            { role: 'user', content: JSON.stringify(data) }
          ],
        });
        
      default:
        throw new Error(`Unknown OpenAI task: ${task}`);
    }
  } catch (error) {
    logger.error({ error, task, projectId: options.projectId }, 'OpenAI API call failed');
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing. Please check your configuration.');
      }
      if (error.message.includes('rate_limit')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      }
      if (error.message.includes('model')) {
        throw new Error('Requested OpenAI model is not available or has been deprecated.');
      }
    }
    
    throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeAudioWithAI(audioData: any, prompt?: string) {
  return callOpenAI({
    task: 'analyze_audio',
    data: audioData,
    prompt
  });
}

export async function generateMixingStrategy(stems: any[], referenceTrack?: any, prompt?: string) {
  return callOpenAI({
    task: 'generate_mix_strategy',
    data: { stems, referenceTrack },
    prompt
  });
}

export async function analyzeMixingRequirements(
  stems: any[],
  referenceTrack: any | null,
  prompt: string
): Promise<any> {
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

    const systemPrompt = `You are a world-class mixing and mastering engineer with expertise in all genres of music. Analyze audio stems and create professional mixing strategies in JSON format.`;

    const userPrompt = `
STEMS ANALYSIS:
${JSON.stringify(stemAnalysis, null, 2)}

${referenceAnalysis ? `REFERENCE TRACK ANALYSIS:
${JSON.stringify(referenceAnalysis, null, 2)}` : 'No reference track provided.'}

USER PROMPT: "${prompt}"

Create a professional mixing strategy as JSON with fields: mixingStrategy, instrumentBalance, effectsChain, masteringApproach, creativeSuggestions, technicalParameters.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    logger.error({ error }, 'Error in AI mixing analysis');
    throw new Error('Failed to analyze mixing requirements');
  }
}
