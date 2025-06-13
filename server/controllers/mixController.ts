import { Request, Response, NextFunction } from 'express';
import { analyzeMixRequirements, generateMissingInstruments, generateMixSheet } from '../ai/aiMixer';
import { renderMix } from '../services/dspRenderer';
import { UPLOAD_DIR, DOWNLOAD_DIR } from '../config';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

export async function mixWithReference(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId;
    const stems = (req.files as any).stems as Express.Multer.File[];
    const reference = (req.files as any).reference?.[0] || null;
    const addMissing = req.body.addMissing === 'true';

    logger.info({ projectId, stems: stems?.length || 0, hasReference: Boolean(reference) }, 'Starting mix');

    if (!stems || stems.length === 0) {
      return res.status(400).json({ error: 'At least one stem file is required' });
    }

    const analysis = await analyzeMixRequirements(projectId, reference?.path || null);
    if (addMissing) {
      await generateMissingInstruments(projectId, analysis);
    }
    const mixSheet = await generateMixSheet(projectId, analysis);
    const mixResult = await renderMix(projectId, mixSheet);

    res.status(200).json({
      success: true,
      mixResult,
      analysis,
      mixSheet
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Mix with reference failed');
    res.status(500).json({ 
      error: 'Failed to process mix request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function downloadMix(req: Request, res: Response) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Download failed');
    res.status(500).json({ error: 'Failed to download file' });
  }
}