import { v } from "convex/values";
import { query, mutation, action } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

/**
 * Get all projects (no user filtering)
 */
export const getByUser = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("projects")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get a single project by ID
 */
export const getById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  },
});

/**
 * Get project with related stems and latest mix
 */
export const getProjectDetails = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get all stems for this project
    const stems = await ctx.db
      .query("stems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get generated stems
    const generatedStems = await ctx.db
      .query("generatedStems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get the latest mix job
    const mixJobs = await ctx.db
      .query("mixJobs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(1);

    const latestMix = mixJobs.length > 0 ? mixJobs[0] : null;

    return {
      project,
      stems,
      generatedStems,
      latestMix,
    };
  },
});

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    bpm: v.optional(v.number()),
    keySignature: v.optional(v.string()),
    settings: v.object({
      targetLoudness: v.number(),
      outputFormat: v.string(),
      sampleRate: v.number(),
      bitDepth: v.optional(v.number()),
    }),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate project settings
    validateProjectSettings(args.settings);

    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      genre: args.genre,
      bpm: args.bpm,
      keySignature: args.keySignature,
      settings: args.settings,
      tags: args.tags,
      isPublic: args.isPublic ?? true, // Default to public since we're not using auth
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Validate project settings
 */
function validateProjectSettings(settings: {
  targetLoudness: number;
  outputFormat: string;
  sampleRate: number;
  bitDepth?: number;
}) {
  // Validate target loudness (typical range for streaming is -14 to -16 LUFS)
  if (settings.targetLoudness < -30 || settings.targetLoudness > -6) {
    throw new Error(
      "Target loudness must be between -30 and -6 LUFS"
    );
  }

  // Validate output format
  const validFormats = ["wav", "mp3", "flac", "aiff", "ogg"];
  if (!validFormats.includes(settings.outputFormat.toLowerCase())) {
    throw new Error(
      `Invalid output format. Must be one of: ${validFormats.join(", ")}`
    );
  }

  // Validate sample rate
  const validSampleRates = [44100, 48000, 88200, 96000, 192000];
  if (!validSampleRates.includes(settings.sampleRate)) {
    throw new Error(
      `Invalid sample rate. Must be one of: ${validSampleRates.join(", ")}`
    );
  }

  // Validate bit depth if provided
  if (settings.bitDepth !== undefined) {
    const validBitDepths = [16, 24, 32];
    if (!validBitDepths.includes(settings.bitDepth)) {
      throw new Error(
        `Invalid bit depth. Must be one of: ${validBitDepths.join(", ")}`
      );
    }
  }
}

/**
 * Delete a project and all its related data
 */
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Delete all stems
    const stems = await ctx.db
      .query("stems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const stem of stems) {
      await ctx.db.delete(stem._id);
    }

    // Delete all generated stems
    const generatedStems = await ctx.db
      .query("generatedStems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const stem of generatedStems) {
      await ctx.db.delete(stem._id);
    }

    // Delete all mix jobs
    const mixJobs = await ctx.db
      .query("mixJobs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const job of mixJobs) {
      await ctx.db.delete(job._id);
    }

    // Delete all mix suggestions
    const suggestions = await ctx.db
      .query("mixSuggestions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const suggestion of suggestions) {
      await ctx.db.delete(suggestion._id);
    }

    // Finally, delete the project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});
