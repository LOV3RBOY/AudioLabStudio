import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const schema = defineSchema({
  // User accounts - keeping this table but it will be simplified
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    subscription: v.string(), // "free" | "pro" | "enterprise"
    preferences: v.optional(v.object({
      defaultOutputFormat: v.optional(v.string()),
      defaultSampleRate: v.optional(v.number()),
      defaultTargetLoudness: v.optional(v.number()),
      uiTheme: v.optional(v.string()), // "dark" | "light" | "system"
    })),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // Audio projects - removed userId field and by_user index
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    bpm: v.optional(v.number()),
    keySignature: v.optional(v.string()),
    settings: v.object({
      targetLoudness: v.number(), // LUFS target
      outputFormat: v.string(), // "wav" | "mp3" | "flac" | etc.
      sampleRate: v.number(), // 44100, 48000, etc.
      bitDepth: v.optional(v.number()), // 16, 24, 32
    }),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    thumbnailFileId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // User-uploaded audio stems - removed userId field and by_user index
  stems: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    type: v.string(), // "drums" | "bass" | "vocals" | "guitar" | etc.
    fileId: v.id("_storage"),
    waveformDataFileId: v.optional(v.id("_storage")), // Pre-computed waveform data
    metadata: v.object({
      duration: v.number(),
      sampleRate: v.number(),
      bitDepth: v.number(),
      channels: v.number(),
      format: v.string(),
      fileSize: v.number(),
    }),
    analysis: v.optional(v.object({
      peakLevel: v.optional(v.number()),
      averageLevel: v.optional(v.number()),
      loudness: v.optional(v.number()), // LUFS
      dynamicRange: v.optional(v.number()),
      spectralCentroid: v.optional(v.number()),
      keyEstimate: v.optional(v.string()),
      bpmEstimate: v.optional(v.number()),
      transients: v.optional(v.array(v.number())),
    })),
    isActive: v.boolean(), // Whether this stem is active in the current mix
    volume: v.optional(v.number()), // Volume level in dB
    pan: v.optional(v.number()), // Pan position (-1 to 1)
    soloEnabled: v.optional(v.boolean()),
    muteEnabled: v.optional(v.boolean()),
    uploadedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_type", ["projectId", "type"]),

  // AI-generated instruments and stems  
  generatedStems: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    type: v.string(), // "drums" | "bass" | "synth" | etc.
    description: v.string(),
    fileId: v.id("_storage"),
    waveformDataFileId: v.optional(v.id("_storage")),
    sourceJobId: v.id("mixJobs"), // Which job generated this stem
    generationPrompt: v.string(), // The prompt used to generate this stem
    metadata: v.object({
      duration: v.number(),
      sampleRate: v.number(),
      bitDepth: v.number(),
      channels: v.number(),
      format: v.string(),
      fileSize: v.number(),
    }),
    isActive: v.boolean(),
    volume: v.optional(v.number()),
    pan: v.optional(v.number()),
    soloEnabled: v.optional(v.boolean()),
    muteEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_job", ["sourceJobId"]),

  // Effects applied to stems
  effects: defineTable({
    stemId: v.union(v.id("stems"), v.id("generatedStems")),
    type: v.string(), // "eq" | "compressor" | "reverb" | "delay" | etc.
    name: v.string(),
    isActive: v.boolean(),
    parameters: v.object({
      // Dynamic parameters based on effect type
      settings: v.any(),
    }),
    order: v.number(), // Position in the effects chain
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_stem", ["stemId"]),

  // Effect presets for reuse - removed userId field and by_user index
  effectPresets: defineTable({
    name: v.string(),
    type: v.string(), // "eq" | "compressor" | "reverb" | "delay" | etc.
    isPublic: v.optional(v.boolean()),
    parameters: v.object({
      settings: v.any(),
    }),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  // AI mixing jobs - removed userId field and by_user index
  mixJobs: defineTable({
    projectId: v.id("projects"),
    prompt: v.string(), // Natural language mixing instructions
    status: v.string(), // "queued" | "processing" | "completed" | "failed"
    config: v.object({
      engine: v.string(), // "roex" | "custom_ml" | "style_transfer" | etc.
      parameters: v.any(), // Engine-specific parameters
      includeStems: v.array(v.id("stems")), // Which stems to include
      generateInstruments: v.optional(v.array(v.string())), // Instruments to generate
      referenceTrackId: v.optional(v.id("_storage")), // Optional reference track
      targetGenre: v.optional(v.string()),
      targetStyle: v.optional(v.string()),
      targetEmotion: v.optional(v.string()),
    }),
    progress: v.number(), // 0-100
    phases: v.array(v.object({
      name: v.string(),
      status: v.string(), // "pending" | "processing" | "completed" | "failed"
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      progress: v.optional(v.number()),
      message: v.optional(v.string()),
    })),
    resultFileId: v.optional(v.id("_storage")), // Final mixed audio file
    waveformDataFileId: v.optional(v.id("_storage")), // Waveform visualization data
    version: v.number(), // Version number of this mix
    parentVersionId: v.optional(v.id("mixJobs")), // Previous version this was based on
    aiAnalysis: v.optional(v.object({
      quality: v.optional(v.number()), // 0-100 quality score
      clarity: v.optional(v.number()),
      balance: v.optional(v.number()),
      dynamics: v.optional(v.number()),
      stereoWidth: v.optional(v.number()),
      feedback: v.optional(v.string()), // AI feedback on the mix
    })),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_version", ["projectId", "version"]),

  // Comments on specific parts of a mix - removed userId field and by_user index
  mixComments: defineTable({
    mixJobId: v.id("mixJobs"),
    timestamp: v.number(), // Position in the audio (seconds)
    text: v.string(),
    resolved: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_mix", ["mixJobId"]),

  // AI-generated mixing suggestions
  mixSuggestions: defineTable({
    projectId: v.id("projects"),
    mixJobId: v.optional(v.id("mixJobs")),
    type: v.string(), // "eq" | "compression" | "arrangement" | "instrument" | etc.
    description: v.string(),
    parameters: v.any(), // Suggested parameters
    applied: v.boolean(), // Whether this suggestion was applied
    createdAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_mix", ["mixJobId"]),

  // User feedback on mixes for AI training - removed userId field and by_user index
  mixFeedback: defineTable({
    mixJobId: v.id("mixJobs"),
    rating: v.number(), // 1-5 star rating
    feedback: v.optional(v.string()),
    aspects: v.optional(v.object({
      clarity: v.optional(v.number()),
      balance: v.optional(v.number()),
      creativity: v.optional(v.number()),
      fidelity: v.optional(v.number()),
    })),
    createdAt: v.number(),
  }).index("by_mix", ["mixJobId"]),

  // Notifications - removed userId field and by_user/by_unread indexes
  notifications: defineTable({
    type: v.string(), // "mix_complete" | "comment" | "suggestion" | etc.
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    relatedId: v.optional(v.union(
      v.id("projects"),
      v.id("mixJobs"),
      v.id("mixComments"),
    )),
    createdAt: v.number(),
  }),
});

export default schema;
