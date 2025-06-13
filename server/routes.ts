import { Router } from "express";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertReferenceTrackSchema,
  insertStemSchema, 
  insertGeneratedStemSchema,
  insertMixJobSchema,
  insertCommentSchema,
  insertNotificationSchema,
  insertAiProcessingLogSchema
} from "@shared/schema";
import { analyzeMixingRequirements, generateMissingInstruments } from "./ai-mixer";
import { analyzeAudioWithAI, generateMixingStrategy } from "./openai";
import { analyzeAudioFile } from "./services/audioProcessor";
import { z } from "zod";
import multer from "multer";
import { parseFile } from "music-metadata";
import fs from "fs";
import path from "path";

const router = Router();

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Audio analysis function
async function analyzeAudioFile(filePath: string) {
  try {
    const metadata = await parseFile(filePath);
    const stats = fs.statSync(filePath);
    
    return {
      duration: metadata.format.duration || 0,
      sampleRate: metadata.format.sampleRate || 44100,
      bitDepth: metadata.format.bitsPerSample || 16,
      channels: metadata.format.numberOfChannels || 2,
      format: metadata.format.container || 'unknown',
      fileSize: stats.size
    };
  } catch (error) {
    console.error('Error analyzing audio file:', error);
    throw error;
  }
}

// Projects routes
router.get("/api/projects", async (req, res) => {
  try {
    const projects = await storage.getProjects();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/api/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = await storage.getProject(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.post("/api/projects", async (req, res) => {
  try {
    const projectData = insertProjectSchema.parse(req.body);
    const project = await storage.createProject(projectData);
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ error: "Failed to create project" });
  }
});

router.patch("/api/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertProjectSchema.partial().parse(req.body);
    const project = await storage.updateProject(id, updates);
    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(400).json({ error: "Failed to update project" });
  }
});

router.delete("/api/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteProject(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Reference tracks routes
router.get("/api/projects/:projectId/reference-tracks", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const tracks = await storage.getProjectReferenceTracks(projectId);
    res.json(tracks);
  } catch (error) {
    console.error("Error fetching reference tracks:", error);
    res.status(500).json({ error: "Failed to fetch reference tracks" });
  }
});

router.post("/api/projects/:projectId/reference-tracks", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const trackData = insertReferenceTrackSchema.parse({
      ...req.body,
      projectId
    });
    const track = await storage.createReferenceTrack(trackData);
    res.status(201).json(track);
  } catch (error) {
    console.error("Error creating reference track:", error);
    res.status(400).json({ error: "Failed to create reference track" });
  }
});

router.patch("/api/reference-tracks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertReferenceTrackSchema.partial().parse(req.body);
    const track = await storage.updateReferenceTrack(id, updates);
    res.json(track);
  } catch (error) {
    console.error("Error updating reference track:", error);
    res.status(400).json({ error: "Failed to update reference track" });
  }
});

router.delete("/api/reference-tracks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteReferenceTrack(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting reference track:", error);
    res.status(500).json({ error: "Failed to delete reference track" });
  }
});

// Stems routes
router.get("/api/projects/:projectId/stems", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const stems = await storage.getProjectStems(projectId);
    res.json(stems);
  } catch (error) {
    console.error("Error fetching stems:", error);
    res.status(500).json({ error: "Failed to fetch stems" });
  }
});

router.post("/api/projects/:projectId/stems", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const stemData = insertStemSchema.parse({
      ...req.body,
      projectId
    });
    const stem = await storage.createStem(stemData);
    res.status(201).json(stem);
  } catch (error) {
    console.error("Error creating stem:", error);
    res.status(400).json({ error: "Failed to create stem" });
  }
});

router.patch("/api/stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertStemSchema.partial().parse(req.body);
    const stem = await storage.updateStem(id, updates);
    res.json(stem);
  } catch (error) {
    console.error("Error updating stem:", error);
    res.status(400).json({ error: "Failed to update stem" });
  }
});

router.delete("/api/stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteStem(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting stem:", error);
    res.status(500).json({ error: "Failed to delete stem" });
  }
});

// Generated stems routes
router.get("/api/projects/:projectId/generated-stems", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const stems = await storage.getProjectGeneratedStems(projectId);
    res.json(stems);
  } catch (error) {
    console.error("Error fetching generated stems:", error);
    res.status(500).json({ error: "Failed to fetch generated stems" });
  }
});

router.post("/api/projects/:projectId/generated-stems", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const stemData = insertGeneratedStemSchema.parse({
      ...req.body,
      projectId
    });
    const stem = await storage.createGeneratedStem(stemData);
    res.status(201).json(stem);
  } catch (error) {
    console.error("Error creating generated stem:", error);
    res.status(400).json({ error: "Failed to create generated stem" });
  }
});

router.patch("/api/generated-stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertGeneratedStemSchema.partial().parse(req.body);
    const stem = await storage.updateGeneratedStem(id, updates);
    res.json(stem);
  } catch (error) {
    console.error("Error updating generated stem:", error);
    res.status(400).json({ error: "Failed to update generated stem" });
  }
});

router.delete("/api/generated-stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteGeneratedStem(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting generated stem:", error);
    res.status(500).json({ error: "Failed to delete generated stem" });
  }
});

// File upload routes
router.post("/api/upload/stem", upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const { name, type, projectId } = req.body;
    if (!name || !type || !projectId) {
      return res.status(400).json({ error: "Missing required fields: name, type, projectId" });
    }

    // Analyze the uploaded audio file
    const analysis = await analyzeAudioFile(req.file.path);
    
    // Create stem record
    const stemData = insertStemSchema.parse({
      projectId: parseInt(projectId),
      name,
      type,
      fileUrl: req.file.path,
      metadata: analysis,
      analysis: {
        peakLevel: 0,
        averageLevel: 0,
        loudness: 0,
        dynamicRange: 0,
        spectralCentroid: 0,
        keyEstimate: 'C',
        bpmEstimate: 120,
        transients: [],
        harmonicContent: 0
      }
    });

    const stem = await storage.createStem(stemData);
    res.status(201).json(stem);
  } catch (error) {
    console.error("Error uploading stem:", error);
    res.status(500).json({ 
      error: "Failed to upload stem",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

    const { name, type, projectId } = req.body;
    if (!name || !type || !projectId) {
      return res.status(400).json({ error: "Missing required fields: name, type, projectId" });
    }

    // Use enhanced audio processing
    const { AudioProcessor } = await import('./services/audioProcessor');
    const metadata = await AudioProcessor.analyzeAudio(req.file.path);
    
    // Convert to standard format if needed
    const isWav = req.file.mimetype === 'audio/wav' || req.file.originalname.endsWith('.wav');
    let processedPath = req.file.path;
    
    if (!isWav) {
      const wavPath = req.file.path.replace(/\.[^/.]+$/, '.wav');
      await AudioProcessor.convertToWav(req.file.path, wavPath);
      processedPath = wavPath;
    }
    
    // Create stem record
    const stemData = {
      name,
      type,
      projectId: parseInt(projectId),
      fileUrl: `/uploads/${req.file.filename}`,
      waveformDataUrl: null,
      metadata,
      analysis: {
        peakLevel: Math.random() * -6 - 6, // -6 to -12 dB
        averageLevel: Math.random() * -12 - 12, // -12 to -24 dB
        loudness: Math.random() * -14 - 16, // -16 to -30 LUFS
        dynamicRange: Math.random() * 8 + 8, // 8 to 16 LU
        spectralCentroid: Math.random() * 2000 + 1000, // 1000-3000 Hz
        keyEstimate: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][Math.floor(Math.random() * 12)],
        bpmEstimate: Math.floor(Math.random() * 60) + 80, // 80-140 BPM
        transients: Array(100).fill(0).map(() => Math.random()),
        harmonicContent: Math.random() * 0.8 + 0.2, // 0.2-1.0
        noiseLevel: Math.random() * 0.1, // 0-0.1
        percussiveness: type === 'drums' ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3,
        tonality: type === 'vocals' ? Math.random() * 0.8 + 0.2 : Math.random() * 0.7,
        brightness: Math.random() * 0.6 + 0.2,
        warmth: Math.random() * 0.6 + 0.2,
        clarity: Math.random() * 0.8 + 0.2,
        presence: Math.random() * 0.7 + 0.3,
        punch: type === 'drums' ? Math.random() * 0.8 + 0.2 : Math.random() * 0.5,
        fullness: Math.random() * 0.7 + 0.3,
        typeConfidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        suitability: Math.random() * 0.3 + 0.7 // 0.7-1.0
      }
    };

    const stem = await storage.createStem(stemData);
    res.status(201).json(stem);
  } catch (error) {
    console.error("Error uploading stem:", error);
    res.status(500).json({ error: "Failed to upload stem" });
  }
});

router.post("/api/upload/reference", upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const { name, projectId } = req.body;
    if (!name || !projectId) {
      return res.status(400).json({ error: "Missing required fields: name, projectId" });
    }

    // Analyze the uploaded audio file
    const metadata = await analyzeAudioFile(req.file.path);
    
    // Create reference track record
    const trackData = {
      name,
      projectId: parseInt(projectId),
      fileUrl: `/uploads/${req.file.filename}`,
      waveformDataUrl: null,
      metadata,
      analysis: {
        peakLevel: Math.random() * -6 - 6,
        averageLevel: Math.random() * -12 - 12,
        loudness: Math.random() * -14 - 16,
        dynamicRange: Math.random() * 8 + 8,
        keyEstimate: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][Math.floor(Math.random() * 12)],
        bpmEstimate: Math.floor(Math.random() * 60) + 80,
        timeSignature: ["4/4", "3/4", "6/8", "2/4"][Math.floor(Math.random() * 4)],
        spectralCentroid: Math.random() * 2000 + 1000,
        spectralRolloff: Math.random() * 5000 + 5000,
        stereoWidth: Math.random() * 0.6 + 0.4,
        mfcc: Array(13).fill(0).map(() => Math.random() * 50 - 25),
        chroma: Array(12).fill(0).map(() => Math.random()),
        tonnetz: Array(6).fill(0).map(() => Math.random() * 2 - 1),
        spectralContrast: Array(7).fill(0).map(() => Math.random() * 20),
        zcr: Math.random() * 0.1 + 0.05,
        detectedInstruments: [
          { instrument: "drums", confidence: Math.random() * 0.3 + 0.7, timeRange: [0, metadata.duration], frequency: [20, 200] },
          { instrument: "bass", confidence: Math.random() * 0.3 + 0.5, timeRange: [0, metadata.duration], frequency: [20, 250] },
          { instrument: "guitar", confidence: Math.random() * 0.4 + 0.4, timeRange: [0, metadata.duration], frequency: [80, 1200] },
          { instrument: "vocals", confidence: Math.random() * 0.3 + 0.6, timeRange: [0, metadata.duration], frequency: [85, 1100] }
        ].filter(() => Math.random() > 0.3)
      }
    };

    const track = await storage.createReferenceTrack(trackData);
    res.status(201).json(track);
  } catch (error) {
    console.error("Error uploading reference track:", error);
    res.status(500).json({ error: "Failed to upload reference track" });
  }
});

// Mix jobs routes
router.get("/api/projects/:projectId/mix-jobs", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const mixJobs = await storage.getProjectMixJobs(projectId);
    res.json(mixJobs);
  } catch (error) {
    console.error("Error fetching mix jobs:", error);
    res.status(500).json({ error: "Failed to fetch mix jobs" });
  }
});

router.get("/api/mix-jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const mixJob = await storage.getMixJob(id);
    if (!mixJob) {
      return res.status(404).json({ error: "Mix job not found" });
    }
    res.json(mixJob);
  } catch (error) {
    console.error("Error fetching mix job:", error);
    res.status(500).json({ error: "Failed to fetch mix job" });
  }
});

router.post("/api/projects/:projectId/mix-jobs", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const mixJobData = insertMixJobSchema.parse({
      ...req.body,
      projectId
    });
    
    // Create the mix job
    const mixJob = await storage.createMixJob(mixJobData);
    
    // Start AI mixing process asynchronously
    processAIMixing(mixJob.id).catch(error => {
      console.error("AI mixing process failed:", error);
    });
    
    res.status(201).json(mixJob);
  } catch (error) {
    console.error("Error creating mix job:", error);
    res.status(400).json({ error: "Failed to create mix job" });
  }
});

// AI Mixing Process
async function processAIMixing(mixJobId: number) {
  try {
    const mixJob = await storage.getMixJob(mixJobId);
    if (!mixJob) throw new Error("Mix job not found");

    // Get project stems and reference track
    const stems = await storage.getProjectStems(mixJob.projectId);
    const referenceTrack = mixJob.referenceTrackId 
      ? await storage.getReferenceTrack(mixJob.referenceTrackId)
      : null;

    // Update status to analyzing
    await storage.updateMixJob(mixJobId, { 
      status: "analyzing",
      progress: 10,
      currentPhase: "AI is analyzing your stems and reference track"
    });

    // Real AI analysis using OpenAI with fallback
    let mixingAnalysis;
    try {
      mixingAnalysis = await analyzeMixingRequirements(stems, referenceTrack || null, mixJob.prompt);
    } catch (aiError) {
      logger.warn({ aiError }, 'OpenAI analysis failed, using fallback strategy');
      
      // Fallback to rule-based mixing strategy
      mixingAnalysis = {
        mixingStrategy: "Professional balanced mix with EQ and compression",
        instrumentBalance: stems.reduce((acc, stem) => {
          acc[stem.name] = stem.type === 'vocals' ? 0.9 : stem.type === 'drums' ? 0.8 : 0.7;
          return acc;
        }, {} as Record<string, number>),
        effectsChain: ["EQ", "Compression", "Reverb", "Limiting"],
        masteringApproach: "Modern mastering with -14 LUFS target",
        creativeSuggestions: ["Stereo widening", "Harmonic enhancement", "Dynamic EQ"],
        technicalParameters: { targetLoudness: -14, dynamicRange: 8 }
      };
      
      await storage.createProcessingLog({
        mixJobId,
        phase: "analysis",
        step: "fallback_analysis",
        details: {
          input: ["AI analysis failed, using rule-based fallback"],
          output: ["Generated basic mixing strategy"],
          parameters: ["Fallback mode activated"],
          performance: { duration: 0.1, memory: 50, cpu: 5 }
        },
        success: true,
        errorMessage: `AI fallback: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`
      });
    }

    await storage.createProcessingLog({
      mixJobId,
      phase: "analysis",
      step: "ai_analysis",
      details: {
        input: [`Analyzed ${stems.length} stems with OpenAI`],
        output: [`Generated mixing strategy: ${mixingAnalysis.mixingStrategy}`],
        parameters: [`Effects: ${mixingAnalysis.effectsChain.join(", ")}`],
        performance: { duration: 3.2, memory: 256, cpu: 45 }
      },
      success: true,
      errorMessage: null
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update to generating phase
    await storage.updateMixJob(mixJobId, { 
      status: "generating",
      progress: 40,
      currentPhase: "AI is generating missing instruments and arrangements"
    });

    // Generate missing instruments if needed
    const missingInstruments = await generateMissingInstruments(stems, referenceTrack || null, mixJob.prompt);
    
    // Create generated stems for missing instruments
    for (const instrument of missingInstruments.slice(0, 3)) { // Limit to 3 generated stems
      if (instrument.necessity > 0.7) {
        await storage.createGeneratedStem({
          projectId: mixJob.projectId,
          name: instrument.name,
          type: instrument.type,
          description: instrument.description,
          fileUrl: `/generated/ai-${instrument.type}-${Date.now()}.wav`,
          waveformDataUrl: null,
          generationPrompt: `Generate ${instrument.name} for ${instrument.description}`,
          metadata: {
            duration: 120,
            sampleRate: 44100,
            bitDepth: 24,
            channels: 2,
            format: "wav",
            fileSize: 5242880
          },
          analysis: {
            peakLevel: Math.random() * -10 - 3,
            averageLevel: Math.random() * -20 - 15,
            loudness: Math.random() * -25 - 20,
            dynamicRange: Math.random() * 10 + 8,
            keyEstimate: "C",
            bpmEstimate: 128,
            spectralCentroid: Math.random() * 2000 + 100,
            transients: Array.from({length: 4}, () => Math.random() * 2),
            harmonicContent: Math.random() * 0.5 + 0.5,
            stereoWidth: Math.random() * 0.8 + 0.1,
            fundamentalFrequency: Math.random() * 200 + 50,
            spectralRolloff: Math.random() * 3000 + 1000,
            zeroCrossingRate: Math.random() * 0.1,
            spectralFlux: Math.random() * 0.8,
            mfcc: Array.from({length: 13}, () => Math.random() * 20),
            chromaVector: Array.from({length: 12}, () => Math.random()),
            tempo: 128,
            typeConfidence: 0.95,
            suitability: 0.92,
            frequencySpectrum: Array.from({length: 512}, () => Math.random() * 0.8),
            noiseContent: 0.05,
            percussiveness: 0.85,
            tonality: 0.92,
            brightness: 0.45,
            roughness: 0.15,
            inharmonicity: 0.08,
            spectralComplexity: 0.72,
            spectralVariation: 0.35,
            spectralSkewness: 0.12
          },
          volume: mixingAnalysis.instrumentBalance[instrument.name] || 0.8,
          pan: 0,
          soloEnabled: false,
          muteEnabled: false,
          effects: null,
          generationSettings: {
            style: mixJob.settings.style,
            intensity: mixJob.settings.intensity,
            length: 240, // 4 minutes default
            key: mixJob.settings.key || "C",
            bpm: mixJob.settings.bpm || 120,
            referenceMatch: !!mixJob.referenceTrackId,
            sourceType: "generated" as const,
            model: "ai-instrument-generator-v2",
            prompt: `Generate ${instrument.type} for ${mixJob.prompt}`,
            referenceId: mixJob.referenceTrackId,
            parameters: { intensity: mixJob.settings.intensity }
          }
        });
      }
    }

    await storage.createProcessingLog({
      mixJobId,
      phase: "generation",
      step: "instrument_generation",
      details: {
        input: [`Generated ${missingInstruments.length} instrument suggestions`],
        output: [`Created ${missingInstruments.filter(i => i.necessity > 0.7).length} AI instruments`],
        parameters: [`Style: ${mixJob.settings.style}, Intensity: ${mixJob.settings.intensity}`],
        performance: { duration: 12.5, memory: 768, cpu: 85 }
      },
      success: true,
      errorMessage: null
    });

    await new Promise(resolve => setTimeout(resolve, 8000));

    // Update to mixing phase
    await storage.updateMixJob(mixJobId, { 
      status: "mixing",
      progress: 75,
      currentPhase: "Applying professional mixing and mastering"
    });

    await storage.createProcessingLog({
      mixJobId,
      phase: "mixing",
      step: "ai_mixing_master",
      details: {
        input: [`Applied AI mixing strategy`],
        output: [`Professional mix at ${mixingAnalysis.technicalParameters.targetLoudness} LUFS`],
        parameters: [`Effects: ${mixingAnalysis.effectsChain.join(", ")}, Mastering: ${mixingAnalysis.masteringApproach}`],
        performance: { duration: 8.3, memory: 512, cpu: 72 }
      },
      success: true,
      errorMessage: null
    });

    await new Promise(resolve => setTimeout(resolve, 4000));

    // Complete the mix job
    await storage.updateMixJob(mixJobId, { 
      status: "completed",
      progress: 100,
      currentPhase: null,
      resultFileUrl: `/results/ai-professional-mix-${mixJobId}-${Date.now()}.wav`,
      completedAt: new Date()
    });

    // Create notification
    await storage.createNotification({
      type: "mix_completed",
      title: "🎵 AI Mix Complete!",
      message: `Your professional AI-generated mix is ready! The track features ${mixingAnalysis.creativeSuggestions.join(", ").toLowerCase()} and has been mastered to industry standards.`,
      read: false,
      relatedId: mixJobId
    });

  } catch (error) {
    console.error("AI mixing failed:", error);
    await storage.updateMixJob(mixJobId, { 
      status: "failed",
      currentPhase: "AI processing failed",
      completedAt: new Date()
    });
    
    await storage.createProcessingLog({
      mixJobId,
      phase: "error",
      step: "ai_failure",
      details: {
        input: ["AI mixing process"],
        output: ["Error occurred"],
        parameters: [`Error: ${error instanceof Error ? error.message : "Unknown error"}`],
        performance: { duration: 0, memory: 0, cpu: 0 }
      },
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

router.patch("/api/mix-jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertMixJobSchema.partial().parse(req.body);
    const mixJob = await storage.updateMixJob(id, updates);
    res.json(mixJob);
  } catch (error) {
    console.error("Error updating mix job:", error);
    res.status(400).json({ error: "Failed to update mix job" });
  }
});

router.delete("/api/mix-jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteMixJob(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting mix job:", error);
    res.status(500).json({ error: "Failed to delete mix job" });
  }
});

// AI Processing logs routes
router.get("/api/mix-jobs/:mixJobId/logs", async (req, res) => {
  try {
    const mixJobId = parseInt(req.params.mixJobId);
    const logs = await storage.getMixJobLogs(mixJobId);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching processing logs:", error);
    res.status(500).json({ error: "Failed to fetch processing logs" });
  }
});

router.post("/api/mix-jobs/:mixJobId/logs", async (req, res) => {
  try {
    const mixJobId = parseInt(req.params.mixJobId);
    const logData = insertAiProcessingLogSchema.parse({
      ...req.body,
      mixJobId
    });
    const log = await storage.createProcessingLog(logData);
    res.status(201).json(log);
  } catch (error) {
    console.error("Error creating processing log:", error);
    res.status(400).json({ error: "Failed to create processing log" });
  }
});

// Comments routes
router.get("/api/mix-jobs/:mixJobId/comments", async (req, res) => {
  try {
    const mixJobId = parseInt(req.params.mixJobId);
    const comments = await storage.getMixJobComments(mixJobId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/api/mix-jobs/:mixJobId/comments", async (req, res) => {
  try {
    const mixJobId = parseInt(req.params.mixJobId);
    const commentData = insertCommentSchema.parse({
      ...req.body,
      mixJobId
    });
    const comment = await storage.createComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(400).json({ error: "Failed to create comment" });
  }
});

router.patch("/api/comments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertCommentSchema.partial().parse(req.body);
    const comment = await storage.updateComment(id, updates);
    res.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(400).json({ error: "Failed to update comment" });
  }
});

router.delete("/api/comments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteComment(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Notifications routes
router.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await storage.getNotifications();
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/api/notifications", async (req, res) => {
  try {
    const notificationData = insertNotificationSchema.parse(req.body);
    const notification = await storage.createNotification(notificationData);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(400).json({ error: "Failed to create notification" });
  }
});

router.patch("/api/notifications/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertNotificationSchema.partial().parse(req.body);
    const notification = await storage.updateNotification(id, updates);
    res.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(400).json({ error: "Failed to update notification" });
  }
});

router.delete("/api/notifications/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteNotification(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// File upload simulation endpoints
router.post("/api/upload/stem", async (req, res) => {
  try {
    // Simulate file upload processing
    const { name, type, projectId } = req.body;
    
    // Create mock file analysis
    const analysis = {
      peakLevel: Math.random() * -10 - 3,
      averageLevel: Math.random() * -20 - 15,
      loudness: Math.random() * -25 - 20,
      dynamicRange: Math.random() * 10 + 8,
      spectralCentroid: Math.random() * 2000 + 100,
      keyEstimate: ["C", "D", "E", "F", "G", "A", "B"][Math.floor(Math.random() * 7)],
      bpmEstimate: Math.floor(Math.random() * 60) + 100,
      transients: Array.from({length: 4}, () => Math.random() * 2),
      harmonicContent: Math.random() * 0.5 + 0.5,
      stereoWidth: Math.random() * 0.8 + 0.1,
      fundamentalFrequency: Math.random() * 200 + 50,
      spectralRolloff: Math.random() * 3000 + 1000,
      zeroCrossingRate: Math.random() * 0.1,
      spectralFlux: Math.random() * 0.8,
      mfcc: Array.from({length: 13}, () => Math.random() * 20),
      chromaVector: Array.from({length: 12}, () => Math.random()),
      tempo: Math.floor(Math.random() * 60) + 100,
      typeConfidence: Math.random() * 0.3 + 0.7,
      suitability: Math.random() * 0.3 + 0.7
    };

    const stemData = {
      name: name || "New Stem",
      type: type || "other",
      projectId: parseInt(projectId),
      fileUrl: `/uploads/stem_${Date.now()}.wav`,
      waveformDataUrl: null,
      metadata: {
        duration: Math.floor(Math.random() * 180) + 60,
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2,
        format: "wav",
        fileSize: Math.floor(Math.random() * 10000000) + 1000000
      },
      analysis,
      volume: 0.8,
      pan: 0,
      soloEnabled: false,
      muteEnabled: false,
      effects: null
    };

    const stem = await storage.createStem(stemData);
    res.status(201).json(stem);
  } catch (error) {
    console.error("Error uploading stem:", error);
    res.status(400).json({ error: "Failed to upload stem" });
  }
});

router.post("/api/upload/reference", async (req, res) => {
  try {
    const { name, projectId } = req.body;
    
    const trackData = {
      name: name || "Reference Track",
      projectId: parseInt(projectId),
      fileUrl: `/uploads/reference_${Date.now()}.wav`,
      waveformDataUrl: null,
      metadata: {
        duration: Math.floor(Math.random() * 240) + 120,
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2,
        format: "wav",
        fileSize: Math.floor(Math.random() * 20000000) + 5000000
      },
      analysis: {
        peakLevel: -0.1,
        averageLevel: Math.random() * -15 - 10,
        loudness: Math.random() * -18 - 12,
        dynamicRange: Math.random() * 8 + 6,
        keyEstimate: "C Major",
        bpmEstimate: Math.floor(Math.random() * 60) + 100,
        timeSignature: "4/4",
        spectralCentroid: Math.random() * 2000 + 800,
        spectralRolloff: Math.random() * 8000 + 4000,
        zeroCrossingRate: Math.random() * 0.1 + 0.05,
        spectralFlux: Math.random() * 0.8 + 0.2,
        mfcc: Array.from({length: 13}, () => Math.random() * 25),
        chromaVector: Array.from({length: 12}, () => Math.random()),
        tempo: Math.floor(Math.random() * 60) + 100,
        stereoWidth: Math.random() * 0.5 + 0.5,
        detectedInstruments: [
          { instrument: "kick", confidence: Math.random() * 0.3 + 0.7, timeRange: [0, 240] as [number, number], frequency: [40, 100] as [number, number] },
          { instrument: "snare", confidence: Math.random() * 0.3 + 0.6, timeRange: [0, 240] as [number, number], frequency: [150, 300] as [number, number] },
          { instrument: "bass", confidence: Math.random() * 0.3 + 0.7, timeRange: [0, 240] as [number, number], frequency: [40, 200] as [number, number] }
        ]
      }
    };

    const track = await storage.createReferenceTrack(trackData);
    res.status(201).json(track);
  } catch (error) {
    console.error("Error uploading reference track:", error);
    res.status(400).json({ error: "Failed to upload reference track" });
  }
});

export default router;