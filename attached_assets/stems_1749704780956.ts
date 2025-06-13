import { v } from "convex/values";
import { query, mutation, action } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { api, internal } from "../_generated/api";

/**
 * Get all stems for a project
 */
export const getByProject = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return ctx.db
      .query("stems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .paginate(args.paginationOpts);
  },
});

/**
 * Get all generated stems for a project
 */
export const getGeneratedByProject = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return ctx.db
      .query("generatedStems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .paginate(args.paginationOpts);
  },
});

/**
 * Get all stems by type for a project
 */
export const getByType = query({
  args: {
    projectId: v.id("projects"),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return ctx.db
      .query("stems")
      .withIndex("by_type", (q) => q.eq("projectId", args.projectId).eq("type", args.type))
      .collect();
  },
});

/**
 * Get a specific stem by ID
 */
export const getById = query({
  args: { stemId: v.id("stems") },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return stem;
  },
});

/**
 * Get a specific generated stem by ID
 */
export const getGeneratedById = query({
  args: { stemId: v.id("generatedStems") },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Generated stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return stem;
  },
});

/**
 * Get stem with its effects
 */
export const getStemWithEffects = query({
  args: {
    stemId: v.union(v.id("stems"), v.id("generatedStems")),
  },
  handler: async (ctx, args) => {
    let stem: Doc<"stems"> | Doc<"generatedStems"> | null = await ctx.db.get(args.stemId as Id<"stems">);
    if (!stem) {
      stem = await ctx.db.get(args.stemId as Id<"generatedStems">);
    }

    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get effects for this stem
    const effects = await ctx.db
      .query("effects")
      .withIndex("by_stem", (q) => q.eq("stemId", args.stemId as Id<"stems">))
      .order("asc")
      .collect();

    return {
      stem,
      effects,
    };
  },
});

/**
 * Generate a presigned upload URL for stem audio files
 */
export const generateUploadUrl = mutation({
  args: {
    projectId: v.id("projects"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Validate file type - normalize and check against valid types
    const normalizedFileType = args.fileType.toLowerCase().trim();
    const validAudioTypes = [
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/mp3",
      "audio/mpeg",
      "audio/mp4",
      "audio/m4a",
      "audio/flac",
      "audio/aiff",
      "audio/x-aiff",
      "audio/ogg",
      "audio/webm",
      "audio/3gpp",
      "audio/3gpp2"
    ];
    
    if (!validAudioTypes.includes(normalizedFileType)) {
      throw new Error(
        `Invalid audio file type: "${args.fileType}". Must be one of: ${validAudioTypes.join(", ")}`
      );
    }

    // Generate the upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();
    
    return { uploadUrl };
  },
});

/**
 * Create a new stem after file upload
 */
export const createStem = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    type: v.string(),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // For now, we'll use mock metadata since we can't directly access file contents in mutations
    // In production, this would be handled by a separate action that processes the audio
    const metadata = {
      duration: 180, // 3 minutes placeholder
      sampleRate: 44100,
      bitDepth: 16,
      channels: 2,
      format: "wav",
      fileSize: 10000000, // 10MB placeholder
    };
    
    // Waveform generation would be handled by a separate action
    const waveformDataId = undefined;

    // Create the stem record
    const stemId = await ctx.db.insert("stems", {
      projectId: args.projectId,
      name: args.name,
      type: args.type,
      fileId: args.fileId,
      waveformDataFileId: waveformDataId,
      metadata,
      isActive: true,
      volume: 0, // 0 dB (unity gain)
      pan: 0, // Center
      soloEnabled: false,
      muteEnabled: false,
      uploadedAt: Date.now(),
    });

    // Schedule stem analysis as a background task
    // For now, we'll skip scheduling since the internal reference isn't working
    // In production, this would be: await ctx.scheduler.runAfter(0, internal.functions.stems.analyzeStem, { stemId });

    return { stemId };
  },
});

/**
 * Analyze a stem to extract musical information
 */
export const analyzeStem = mutation({
  args: {
    stemId: v.id("stems"),
  },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Stem not found");
    }

    // In production, audio analysis would be done by a separate service
    // For now, we'll skip the actual file access

    // In production, this would use audio analysis libraries or services
    // For now, we'll return mock analysis data
    const analysis = {
      peakLevel: -3 - Math.random() * 10, // Random peak level between -3 and -13 dB
      averageLevel: -18 - Math.random() * 6, // Random average level between -18 and -24 dB
      loudness: -14 - Math.random() * 10, // Random LUFS between -14 and -24
      dynamicRange: 6 + Math.random() * 8, // Random dynamic range between 6 and 14 dB
      spectralCentroid: 2000 + Math.random() * 6000, // Random spectral centroid
      keyEstimate: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][Math.floor(Math.random() * 12)] + 
                   ["maj", "min"][Math.floor(Math.random() * 2)],
      bpmEstimate: 80 + Math.floor(Math.random() * 80), // Random BPM between 80 and 160
      transients: Array.from({ length: 10 }, () => Math.random() * stem.metadata.duration), // Random transient positions
    };

    // Update the stem with analysis data
    await ctx.db.patch(args.stemId, {
      analysis,
    });

    return { success: true, analysis };
  },
});

/**
 * Update stem properties
 */
export const updateStem = mutation({
  args: {
    stemId: v.id("stems"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    volume: v.optional(v.number()),
    pan: v.optional(v.number()),
    soloEnabled: v.optional(v.boolean()),
    muteEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Validate volume and pan if provided
    if (args.volume !== undefined && (args.volume < -96 || args.volume > 12)) {
      throw new Error("Volume must be between -96 and +12 dB");
    }

    if (args.pan !== undefined && (args.pan < -1 || args.pan > 1)) {
      throw new Error("Pan must be between -1 (left) and +1 (right)");
    }

    const updates: Partial<Doc<"stems">> = {};

    // Add optional fields to updates if provided
    if (args.name !== undefined) updates.name = args.name;
    if (args.type !== undefined) updates.type = args.type;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.volume !== undefined) updates.volume = args.volume;
    if (args.pan !== undefined) updates.pan = args.pan;
    if (args.soloEnabled !== undefined) updates.soloEnabled = args.soloEnabled;
    if (args.muteEnabled !== undefined) updates.muteEnabled = args.muteEnabled;

    await ctx.db.patch(args.stemId, updates);

    return args.stemId;
  },
});

/**
 * Update generated stem properties
 */
export const updateGeneratedStem = mutation({
  args: {
    stemId: v.id("generatedStems"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    volume: v.optional(v.number()),
    pan: v.optional(v.number()),
    soloEnabled: v.optional(v.boolean()),
    muteEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Generated stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Validate volume and pan if provided
    if (args.volume !== undefined && (args.volume < -96 || args.volume > 12)) {
      throw new Error("Volume must be between -96 and +12 dB");
    }

    if (args.pan !== undefined && (args.pan < -1 || args.pan > 1)) {
      throw new Error("Pan must be between -1 (left) and +1 (right)");
    }

    const updates: Partial<Doc<"generatedStems">> = {};

    // Add optional fields to updates if provided
    if (args.name !== undefined) updates.name = args.name;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.volume !== undefined) updates.volume = args.volume;
    if (args.pan !== undefined) updates.pan = args.pan;
    if (args.soloEnabled !== undefined) updates.soloEnabled = args.soloEnabled;
    if (args.muteEnabled !== undefined) updates.muteEnabled = args.muteEnabled;

    await ctx.db.patch(args.stemId, updates);

    return args.stemId;
  },
});

/**
 * Delete a stem
 */
export const deleteStem = mutation({
  args: {
    stemId: v.id("stems"),
  },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Delete the audio file from storage
    if (stem.fileId) {
      await ctx.storage.delete(stem.fileId);
    }
    
    // Delete waveform data if exists
    if (stem.waveformDataFileId) {
      await ctx.storage.delete(stem.waveformDataFileId);
    }
    
    // Delete effects associated with this stem
    const effects = await ctx.db
      .query("effects")
      .withIndex("by_stem", (q) => q.eq("stemId", args.stemId))
      .collect();
    
    for (const effect of effects) {
      await ctx.db.delete(effect._id);
    }
    
    // Delete the stem record
    await ctx.db.delete(args.stemId);

    return { success: true };
  },
});

/**
 * Delete a generated stem
 */
export const deleteGeneratedStem = mutation({
  args: {
    stemId: v.id("generatedStems"),
  },
  handler: async (ctx, args) => {
    const stem = await ctx.db.get(args.stemId);
    if (!stem) {
      throw new Error("Generated stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Delete the audio file from storage
    if (stem.fileId) {
      await ctx.storage.delete(stem.fileId);
    }
    
    // Delete waveform data if exists
    if (stem.waveformDataFileId) {
      await ctx.storage.delete(stem.waveformDataFileId);
    }
    
    // Delete effects associated with this generated stem
    const effects = await ctx.db
      .query("effects")
      .withIndex("by_stem", (q) => q.eq("stemId", args.stemId))
      .collect();
    
    for (const effect of effects) {
      await ctx.db.delete(effect._id);
    }
    
    // Delete the stem record
    await ctx.db.delete(args.stemId);

    return { success: true };
  },
});

/**
 * Add an effect to a stem
 */
export const addEffect = mutation({
  args: {
    stemId: v.union(v.id("stems"), v.id("generatedStems")),
    type: v.string(),
    name: v.string(),
    parameters: v.object({
      settings: v.any(),
    }),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if it's a user stem or generated stem
    let stem: Doc<"stems"> | Doc<"generatedStems"> | null = await ctx.db.get(args.stemId as Id<"stems">);
    if (!stem) {
      stem = await ctx.db.get(args.stemId as Id<"generatedStems">);
    }

    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Validate effect type
    const validEffectTypes = [
      "eq", "compressor", "reverb", "delay", "chorus",
      "flanger", "phaser", "distortion", "saturation", "limiter",
      "sidechain", "stereo_widener", "exciter", "de_esser"
    ];
    
    if (!validEffectTypes.includes(args.type)) {
      throw new Error(
        `Invalid effect type. Must be one of: ${validEffectTypes.join(", ")}`
      );
    }

    // Get the highest order number for this stem's effects
    const existingEffects = await ctx.db
      .query("effects")
      .withIndex("by_stem", (q) => q.eq("stemId", args.stemId as Id<"stems">))
      .collect();
    
    const highestOrder = existingEffects.length > 0
      ? Math.max(...existingEffects.map(e => e.order))
      : -1;
    
    // Use provided order or place at the end of the chain
    const order = args.order !== undefined ? args.order : highestOrder + 1;

    // Create the effect
    const effectId = await ctx.db.insert("effects", {
      stemId: args.stemId as Id<"stems">,
      type: args.type,
      name: args.name,
      isActive: true,
      parameters: args.parameters,
      order,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return effectId;
  },
});

/**
 * Update an effect
 */
export const updateEffect = mutation({
  args: {
    effectId: v.id("effects"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    parameters: v.optional(v.object({
      settings: v.any(),
    })),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const effect = await ctx.db.get(args.effectId);
    if (!effect) {
      throw new Error("Effect not found");
    }

    // Check if it's a user stem or generated stem
    let stem: Doc<"stems"> | Doc<"generatedStems"> | null = await ctx.db.get(effect.stemId as Id<"stems">);
    if (!stem) {
      stem = await ctx.db.get(effect.stemId as Id<"generatedStems">);
    }

    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const updates: Partial<Doc<"effects">> = {
      updatedAt: Date.now(),
    };

    // Add optional fields to updates if provided
    if (args.name !== undefined) updates.name = args.name;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.parameters !== undefined) updates.parameters = args.parameters;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.effectId, updates);

    return args.effectId;
  },
});

/**
 * Delete an effect
 */
export const deleteEffect = mutation({
  args: {
    effectId: v.id("effects"),
  },
  handler: async (ctx, args) => {
    const effect = await ctx.db.get(args.effectId);
    if (!effect) {
      throw new Error("Effect not found");
    }

    // Check if it's a user stem or generated stem
    let stem: Doc<"stems"> | Doc<"generatedStems"> | null = await ctx.db.get(effect.stemId as Id<"stems">);
    if (!stem) {
      stem = await ctx.db.get(effect.stemId as Id<"generatedStems">);
    }

    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.delete(args.effectId);

    return { success: true };
  },
});

/**
 * Reorder effects chain
 */
export const reorderEffects = mutation({
  args: {
    stemId: v.union(v.id("stems"), v.id("generatedStems")),
    effectIds: v.array(v.id("effects")),
  },
  handler: async (ctx, args) => {
    // Check if it's a user stem or generated stem
    let stem: Doc<"stems"> | Doc<"generatedStems"> | null = await ctx.db.get(args.stemId as Id<"stems">);
    if (!stem) {
      stem = await ctx.db.get(args.stemId as Id<"generatedStems">);
    }

    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get all effects for this stem
    const existingEffects = await ctx.db
      .query("effects")
      .withIndex("by_stem", (q) => q.eq("stemId", args.stemId as Id<"stems">))
      .collect();
    
    // Validate that all provided effect IDs belong to this stem
    const stemEffectIds = new Set(existingEffects.map(e => e._id.toString()));
    for (const effectId of args.effectIds) {
      if (!stemEffectIds.has(effectId.toString())) {
        throw new Error(`Effect ${effectId} does not belong to stem ${args.stemId}`);
      }
    }
    
    // Update the order of each effect
    for (let i = 0; i < args.effectIds.length; i++) {
      await ctx.db.patch(args.effectIds[i], {
        order: i,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Save an effect as a preset
 */
export const saveEffectPreset = mutation({
  args: {
    effectId: v.id("effects"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const effect = await ctx.db.get(args.effectId);
    if (!effect) {
      throw new Error("Effect not found");
    }

    // Create the effect preset
    const presetId = await ctx.db.insert("effectPresets", {
      name: args.name,
      type: effect.type,
      isPublic: args.isPublic ?? true, // Default to public since we're not using auth
      parameters: effect.parameters,
      description: args.description,
      tags: args.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return presetId;
  },
});

/**
 * Get effect presets
 */
export const getEffectPresets = query({
  args: {
    type: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Filter by type if provided
    if (args.type) {
      return ctx.db
        .query("effectPresets")
        .withIndex("by_type", (q) => q.eq("type", args.type as string))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    
    return ctx.db
      .query("effectPresets")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Apply an effect preset to a stem
 */
export const applyEffectPreset = mutation({
  args: {
    stemId: v.union(v.id("stems"), v.id("generatedStems")),
    presetId: v.id("effectPresets"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if it's a user stem or generated stem
    let stem: Doc<"stems"> | Doc<"generatedStems"> | null = await ctx.db.get(args.stemId as Id<"stems">);
    if (!stem) {
      stem = await ctx.db.get(args.stemId as Id<"generatedStems">);
    }

    if (!stem) {
      throw new Error("Stem not found");
    }

    const project = await ctx.db.get(stem.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get the preset
    const preset = await ctx.db.get(args.presetId);
    if (!preset) {
      throw new Error("Preset not found");
    }

    // Get the highest order number for this stem's effects
    const existingEffects = await ctx.db
      .query("effects")
      .withIndex("by_stem", (q) => q.eq("stemId", args.stemId as Id<"stems">))
      .collect();
    
    const highestOrder = existingEffects.length > 0
      ? Math.max(...existingEffects.map(e => e.order))
      : -1;

    // Create the effect from the preset
    const effectId = await ctx.db.insert("effects", {
      stemId: args.stemId as Id<"stems">,
      type: preset.type,
      name: args.name || `${preset.name} (Preset)`,
      isActive: true,
      parameters: preset.parameters,
      order: highestOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return effectId;
  },
});

/**
 * Extract metadata from an audio file
 * In production, this would use proper audio analysis libraries
 */
async function extractAudioMetadata(audioData: ArrayBuffer) {
  // This is a placeholder implementation
  // In production, you would use libraries like music-metadata or Web Audio API
  
  // Mock metadata extraction
  return {
    duration: 60 + Math.random() * 180, // Random duration between 1-4 minutes
    sampleRate: [44100, 48000, 96000][Math.floor(Math.random() * 3)],
    bitDepth: [16, 24][Math.floor(Math.random() * 2)],
    channels: [1, 2][Math.floor(Math.random() * 2)],
    format: ["wav", "mp3", "flac"][Math.floor(Math.random() * 3)],
    fileSize: audioData.byteLength,
  };
}

/**
 * Generate waveform data for visualization
 */
async function generateWaveformData(audioData: ArrayBuffer) {
  // In production, this would analyze the audio and extract amplitude values
  // For now, we'll generate random waveform data
  
  const waveformPoints = 1000;
  const waveformData = new Float32Array(waveformPoints);
  
  for (let i = 0; i < waveformPoints; i++) {
    // Generate a somewhat realistic waveform shape
    waveformData[i] = Math.sin(i * 0.01) * 0.5 + Math.random() * 0.5;
  }
  
  return waveformData;
}
