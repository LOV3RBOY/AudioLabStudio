import { pgTable, serial, text, timestamp, integer, real, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  genre: text("genre"),
  bpm: integer("bpm"),
  keySignature: text("key_signature"),
  settings: json("settings").$type<{
    targetLoudness: number;
    outputFormat: string;
    sampleRate: number;
    bitDepth?: number;
  }>().notNull().default({
    targetLoudness: -14,
    outputFormat: "wav",
    sampleRate: 44100,
    bitDepth: 24
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  collaborators: json("collaborators").$type<string[]>().default([]),
  tags: json("tags").$type<string[]>().default([]),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").default("active"),
});

// Reference tracks table (for AI analysis and matching)
export const referenceTracks = pgTable("reference_tracks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  waveformDataUrl: text("waveform_data_url"),
  metadata: json("metadata").$type<{
    duration: number;
    sampleRate: number;
    bitDepth: number;
    channels: number;
    format: string;
    fileSize: number;
  }>().notNull(),
  analysis: json("analysis").$type<{
    // Basic audio analysis
    peakLevel: number;
    averageLevel: number;
    loudness: number;
    dynamicRange: number;
    // Musical analysis
    keyEstimate: string;
    bpmEstimate: number;
    timeSignature?: string;
    // Spectral analysis
    spectralCentroid: number;
    spectralRolloff?: number;
    spectralBandwidth?: number;
    mfcc?: number[];
    // Frequency analysis
    frequencySpectrum?: number[];
    dominantFrequencies?: number[];
    // Arrangement analysis
    structure?: Array<{
      section: string; // "intro", "verse", "chorus", "bridge", "outro"
      startTime: number;
      endTime: number;
      energy: number;
    }>;
    // Mix characteristics
    stereoWidth?: number;
    bassContent?: number;
    midContent?: number;
    highContent?: number;
    compression?: number;
    reverb?: number;
    // Instrument detection
    detectedInstruments?: Array<{
      instrument: string;
      confidence: number;
      timeRange?: [number, number];
      frequency?: [number, number];
    }>;
    // Effects detection
    detectedEffects?: Array<{
      effect: string;
      confidence: number;
      parameters?: Record<string, number>;
    }>;
  }>().notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Stems table (uploaded audio files)
export const stems = pgTable("stems", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "drums", "bass", "vocals", "guitar", "keys", "synth", "strings", "brass", "fx", "other"
  fileUrl: text("file_url").notNull(),
  waveformDataUrl: text("waveform_data_url"),
  metadata: json("metadata").$type<{
    duration: number;
    sampleRate: number;
    bitDepth: number;
    channels: number;
    format: string;
    fileSize: number;
  }>().notNull(),
  analysis: json("analysis").$type<{
    // Basic analysis
    peakLevel: number;
    averageLevel: number;
    loudness: number;
    dynamicRange: number;
    spectralCentroid: number;
    keyEstimate: string;
    bpmEstimate: number;
    transients: number[];
    // Advanced stem analysis
    harmonicContent: number;
    noiseLevel?: number;
    noiseContent?: number;
    percussiveness?: number;
    tonality?: number;
    brightness?: number;
    roughness?: number;
    inharmonicity?: number;
    spectralComplexity?: number;
    spectralVariation?: number;
    spectralSkewness?: number;
    warmth?: number;
    clarity?: number;
    presence?: number;
    punch?: number;
    fullness?: number;
    stereoWidth?: number;
    fundamentalFrequency?: number;
    spectralRolloff?: number;
    zeroCrossingRate?: number;
    spectralFlux?: number;
    mfcc?: number[];
    chromaVector?: number[];
    tempo?: number;
    timeSignature?: string;
    frequencySpectrum?: number[];
    detectedEffects?: Array<{
      type: string;
      confidence: number;
      parameters?: Record<string, any>;
    }>;
    // Classification confidence
    typeConfidence: number;
    suitability: number; // How well it fits the reference
  }>().notNull(),
  effects: json("effects").$type<Array<{
    id: string;
    type: string;
    parameters: Record<string, any>;
    isActive: boolean;
  }>>().default([]),
  volume: real("volume").default(1.0),
  pan: real("pan").default(0.0),
  soloEnabled: boolean("solo_enabled").default(false),
  muteEnabled: boolean("mute_enabled").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Generated stems table (AI-created stems and instruments)
export const generatedStems = pgTable("generated_stems", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  subtype: text("subtype"), // "kick", "snare", "hihat", "bass_synth", "lead_vocal", etc.
  fileUrl: text("file_url").notNull(),
  waveformDataUrl: text("waveform_data_url"),
  metadata: json("metadata").$type<{
    duration: number;
    sampleRate: number;
    bitDepth: number;
    channels: number;
    format: string;
    fileSize: number;
  }>().notNull(),
  analysis: json("analysis").$type<{
    peakLevel: number;
    averageLevel: number;
    loudness: number;
    dynamicRange: number;
    spectralCentroid: number;
    keyEstimate: string;
    bpmEstimate: number;
    transients: number[];
    harmonicContent: number;
    stereoWidth?: number;
    fundamentalFrequency?: number;
    spectralRolloff?: number;
    zeroCrossingRate?: number;
    spectralFlux?: number;
    mfcc?: number[];
    chromaVector?: number[];
    tempo?: number;
    suitability?: number;
    frequencySpectrum?: number[];
    noiseContent?: number;
    percussiveness?: number;
    tonality?: number;
    brightness?: number;
    roughness?: number;
    inharmonicity?: number;
    spectralComplexity?: number;
    spectralVariation?: number;
    spectralSkewness?: number;
    typeConfidence: number;
  }>().notNull(),
  effects: json("effects").$type<Array<{
    id: string;
    type: string;
    parameters: Record<string, any>;
    isActive: boolean;
  }>>().default([]),
  volume: real("volume").default(1.0),
  pan: real("pan").default(0.0),
  soloEnabled: boolean("solo_enabled").default(false),
  muteEnabled: boolean("mute_enabled").default(false),
  generationPrompt: text("generation_prompt").notNull(),
  generationSettings: json("generation_settings").$type<{
    style: string;
    intensity: number;
    length: number;
    key: string;
    bpm: number;
    referenceMatch: boolean; // Generated to match reference track
    sourceType: "generated" | "sourced"; // AI generated vs sourced from library
    sourceLibrary?: string;
    model?: string;
    prompt?: string;
    referenceId?: number;
    parameters?: Record<string, any>;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// Mix jobs table
export const mixJobs = pgTable("mix_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  referenceTrackId: integer("reference_track_id").references(() => referenceTracks.id),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "analyzing", "generating", "mixing", "mastering", "completed", "failed"
  progress: real("progress").default(0),
  currentPhase: text("current_phase"), // "analysis", "reference_matching", "stem_generation", "arrangement", "mixing", "mastering", "rendering"
  phaseDetails: json("phase_details").$type<{
    currentStep: string;
    totalSteps: number;
    stepProgress: number;
    estimatedTimeRemaining: number;
  }>(),
  settings: json("settings").$type<{
    style: string;
    mood: string;
    intensity: number;
    targetLoudness: number;
    stereoWidth: number;
    dynamicRange: string; // "natural", "compressed", "punchy"
    mixStyle: string; // "modern", "vintage", "lo-fi", "clinical"
    matchReference: boolean;
    generateMissing: boolean; // Generate missing instruments/sounds
    professionalMaster: boolean;
    key?: string;
    bpm?: number;
  }>().notNull(),
  analysisResults: json("analysis_results").$type<{
    referenceAnalysis?: any;
    stemMatching: Array<{
      stemId: number;
      matchScore: number;
      recommendations: string[];
    }>;
    missingElements: Array<{
      element: string;
      importance: number;
      suggestions: string[];
    }>;
    arrangementPlan: Array<{
      section: string;
      startTime: number;
      endTime: number;
      stems: number[];
      effects: any[];
    }>;
  }>(),
  resultFileUrl: text("result_file_url"),
  intermediateFiles: json("intermediate_files").$type<{
    dryMix?: string;
    wetMix?: string;
    stems?: string[];
    master?: string;
  }>(),
  feedback: text("feedback"),
  version: integer("version").default(1),
  parentJobId: integer("parent_job_id"),
  estimatedDuration: integer("estimated_duration"), // seconds
  actualDuration: integer("actual_duration"), // seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  resultAnalysis: json("result_analysis").$type<{
    finalLoudness: number;
    peakLevel: number;
    dynamicRange: number;
    stereoWidth: number;
    frequencyBalance: Record<string, number>;
    phaseCorrelation: number;
    qualityScore: number;
  }>(),
  generatedStemIds: json("generated_stem_ids").$type<number[]>().default([]),
  startedAt: timestamp("started_at"),
  estimatedCompletionTime: timestamp("estimated_completion_time"),
  phaseDetails: json("phase_details").$type<Record<string, any>>().default({}),
  analysisResults: json("analysis_results").$type<Record<string, any>>().default({}),
});

// AI Processing logs for transparency and debugging
export const aiProcessingLogs = pgTable("ai_processing_logs", {
  id: serial("id").primaryKey(),
  mixJobId: integer("mix_job_id").references(() => mixJobs.id).notNull(),
  phase: text("phase").notNull(),
  step: text("step").notNull(),
  details: json("details").$type<{
    input: any;
    output: any;
    parameters: any;
    performance: {
      duration: number;
      memory: number;
      cpu: number;
    };
  }>().notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Comments table (mix feedback and collaboration)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  mixJobId: integer("mix_job_id").references(() => mixJobs.id).notNull(),
  text: text("text").notNull(),
  timestamp: real("timestamp").notNull(), // seconds in the mix
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "mix_completed", "collaboration_invite", "system_update", "reference_analyzed"
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  relatedId: integer("related_id"), // ID of related entity (project, mix job, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferenceTrackSchema = createInsertSchema(referenceTracks).omit({
  id: true,
  uploadedAt: true,
});

export const insertStemSchema = createInsertSchema(stems).omit({
  id: true,
  uploadedAt: true,
});

export const insertGeneratedStemSchema = createInsertSchema(generatedStems).omit({
  id: true,
  createdAt: true,
});

export const insertMixJobSchema = createInsertSchema(mixJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAiProcessingLogSchema = createInsertSchema(aiProcessingLogs).omit({
  id: true,
  timestamp: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Export types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ReferenceTrack = typeof referenceTracks.$inferSelect;
export type InsertReferenceTrack = z.infer<typeof insertReferenceTrackSchema>;

export type Stem = typeof stems.$inferSelect;
export type InsertStem = z.infer<typeof insertStemSchema>;

export type GeneratedStem = typeof generatedStems.$inferSelect;
export type InsertGeneratedStem = z.infer<typeof insertGeneratedStemSchema>;

export type MixJob = typeof mixJobs.$inferSelect;
export type InsertMixJob = z.infer<typeof insertMixJobSchema>;

export type AiProcessingLog = typeof aiProcessingLogs.$inferSelect;
export type InsertAiProcessingLog = z.infer<typeof insertAiProcessingLogSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;