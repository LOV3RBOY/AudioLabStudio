import { v } from "convex/values";
import { query, mutation, action, internalAction, internalQuery, internalMutation } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { api, internal } from "../_generated/api";

/**
 * Get mix jobs for a project
 */
export const getByProject = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("mixJobs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get a specific mix job by ID
 */
export const getById = query({
  args: { mixJobId: v.id("mixJobs") },
  handler: async (ctx, args) => {
    const mixJob = await ctx.db.get(args.mixJobId);
    if (!mixJob) {
      throw new Error("Mix job not found");
    }
    return mixJob;
  },
});

/**
 * Get all mix jobs for the current user (returns all since no auth)
 */
export const getByUser = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Since we don't have user auth, return all mix jobs
    return ctx.db
      .query("mixJobs")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get recent mix suggestions
 */
export const getRecentSuggestions = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Return all mix suggestions ordered by creation time
    return ctx.db
      .query("mixSuggestions")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Create a new mix job
 */
export const createMixJob = mutation({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    config: v.object({
      engine: v.string(),
      parameters: v.any(),
      includeStems: v.array(v.id("stems")),
      generateInstruments: v.optional(v.array(v.string())),
      referenceTrackId: v.optional(v.id("_storage")),
      targetGenre: v.optional(v.string()),
      targetStyle: v.optional(v.string()),
      targetEmotion: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get current version number (increment from latest)
    const latestMixJobs = await ctx.db
      .query("mixJobs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(1);

    const version = latestMixJobs.length > 0 ? latestMixJobs[0].version + 1 : 1;

    // Initialize processing phases
    const phases = [
      { name: "Analysis", status: "pending", progress: 0 },
      { name: "Stem Processing", status: "pending", progress: 0 },
      { name: "AI Mixing", status: "pending", progress: 0 },
      { name: "Mastering", status: "pending", progress: 0 },
      { name: "Export", status: "pending", progress: 0 },
    ];

    const mixJobId = await ctx.db.insert("mixJobs", {
      projectId: args.projectId,
      prompt: args.prompt,
      status: "queued",
      config: args.config,
      progress: 0,
      phases,
      version,
      createdAt: Date.now(),
    });

    // Schedule the actual processing
    await ctx.scheduler.runAfter(0, internal.functions.mixing.processMixJob, {
      mixJobId,
    });

    return mixJobId;
  },
});

/**
 * Internal query to get a mix job
 */
export const getMixJobInternal = internalQuery({
  args: { mixJobId: v.id("mixJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mixJobId);
  },
});

/**
 * Internal mutation to update mix job status
 */
export const updateMixJobInternal = internalMutation({
  args: {
    mixJobId: v.id("mixJobs"),
    updates: v.object({
      status: v.optional(v.string()),
      startedAt: v.optional(v.number()),
      progress: v.optional(v.number()),
      phases: v.optional(v.array(v.any())),
      resultFileId: v.optional(v.id("_storage")),
      completedAt: v.optional(v.number()),
      aiAnalysis: v.optional(v.any()),
      error: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mixJobId, args.updates);
  },
});

/**
 * Internal mutation to create notification
 */
export const createNotificationInternal = internalMutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    relatedId: v.optional(v.id("mixJobs")),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", args);
  },
});

/**
 * Process a mix job (AI mixing action)
 */
export const processMixJob = internalAction({
  args: {
    mixJobId: v.id("mixJobs"),
  },
  handler: async (ctx, args) => {
    const mixJob = await ctx.runQuery(internal.functions.mixing.getMixJobInternal, {
      mixJobId: args.mixJobId,
    });

    if (!mixJob) {
      throw new Error("Mix job not found");
    }

    try {
      // Update status to processing
      await ctx.runMutation(internal.functions.mixing.updateMixJobInternal, {
        mixJobId: args.mixJobId,
        updates: {
          status: "processing",
          startedAt: Date.now(),
        },
      });

      // Phase 1: Analysis
      await updatePhase(ctx, args.mixJobId, 0, "processing", "Analyzing stems...");
      await simulateProcessing(2000); // Simulate AI analysis
      await updatePhase(ctx, args.mixJobId, 0, "completed", "Analysis complete", 100);

      // Phase 2: Stem Processing
      await updatePhase(ctx, args.mixJobId, 1, "processing", "Processing stems...");
      await simulateProcessing(3000);
      await updatePhase(ctx, args.mixJobId, 1, "completed", "Stems processed", 100);

      // Phase 3: AI Mixing
      await updatePhase(ctx, args.mixJobId, 2, "processing", "AI mixing in progress...");
      await simulateAIMixing(ctx, mixJob);
      await updatePhase(ctx, args.mixJobId, 2, "completed", "Mixing complete", 100);

      // Phase 4: Mastering
      await updatePhase(ctx, args.mixJobId, 3, "processing", "Mastering track...");
      await simulateProcessing(2000);
      await updatePhase(ctx, args.mixJobId, 3, "completed", "Mastering complete", 100);

      // Phase 5: Export
      await updatePhase(ctx, args.mixJobId, 4, "processing", "Exporting final mix...");
      const resultFileId = await generateMockAudioFile(ctx);
      await updatePhase(ctx, args.mixJobId, 4, "completed", "Export complete", 100);

      // Update final status
      await ctx.runMutation(internal.functions.mixing.updateMixJobInternal, {
        mixJobId: args.mixJobId,
        updates: {
          status: "completed",
          progress: 100,
          resultFileId,
          completedAt: Date.now(),
          aiAnalysis: {
            quality: Math.floor(Math.random() * 20) + 80, // 80-100
            clarity: Math.floor(Math.random() * 15) + 85,
            balance: Math.floor(Math.random() * 25) + 75,
            dynamics: Math.floor(Math.random() * 30) + 70,
            stereoWidth: Math.floor(Math.random() * 20) + 80,
            feedback: generateAIFeedback(mixJob.prompt),
          },
        },
      });

      // Create notification
      await ctx.runMutation(internal.functions.mixing.createNotificationInternal, {
        type: "mix_complete",
        title: "Mix Complete",
        message: `Your mix "${mixJob.prompt.substring(0, 50)}..." is ready!`,
        read: false,
        relatedId: args.mixJobId,
        createdAt: Date.now(),
      });

    } catch (error) {
      // Handle error
      await ctx.runMutation(internal.functions.mixing.updateMixJobInternal, {
        mixJobId: args.mixJobId,
        updates: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error occurred",
          completedAt: Date.now(),
        },
      });

      await ctx.runMutation(internal.functions.mixing.createNotificationInternal, {
        type: "mix_failed",
        title: "Mix Failed",
        message: `There was an error processing your mix: ${error instanceof Error ? error.message : "Unknown error"}`,
        read: false,
        relatedId: args.mixJobId,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Create a new version of a mix
 */
export const createMixVersion = mutation({
  args: {
    parentMixJobId: v.id("mixJobs"),
    prompt: v.string(),
    config: v.object({
      engine: v.string(),
      parameters: v.any(),
      includeStems: v.array(v.id("stems")),
      generateInstruments: v.optional(v.array(v.string())),
      referenceTrackId: v.optional(v.id("_storage")),
      targetGenre: v.optional(v.string()),
      targetStyle: v.optional(v.string()),
      targetEmotion: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const parentMix = await ctx.db.get(args.parentMixJobId);
    if (!parentMix) {
      throw new Error("Parent mix job not found");
    }

    // Get next version number
    const latestMixJobs = await ctx.db
      .query("mixJobs")
      .withIndex("by_project", (q) => q.eq("projectId", parentMix.projectId))
      .order("desc")
      .take(1);

    const version = latestMixJobs.length > 0 ? latestMixJobs[0].version + 1 : 1;

    const phases = [
      { name: "Analysis", status: "pending", progress: 0 },
      { name: "Stem Processing", status: "pending", progress: 0 },
      { name: "AI Mixing", status: "pending", progress: 0 },
      { name: "Mastering", status: "pending", progress: 0 },
      { name: "Export", status: "pending", progress: 0 },
    ];

    const mixJobId = await ctx.db.insert("mixJobs", {
      projectId: parentMix.projectId,
      prompt: args.prompt,
      status: "queued",
      config: args.config,
      progress: 0,
      phases,
      version,
      parentVersionId: args.parentMixJobId,
      createdAt: Date.now(),
    });

    // Schedule processing
    await ctx.scheduler.runAfter(0, internal.functions.mixing.processMixJob, {
      mixJobId,
    });

    return mixJobId;
  },
});

/**
 * Apply an AI suggestion to create a new mix
 */
export const applySuggestion = mutation({
  args: {
    suggestionId: v.id("mixSuggestions"),
  },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.applied) {
      throw new Error("Suggestion has already been applied");
    }

    // Mark suggestion as applied
    await ctx.db.patch(args.suggestionId, {
      applied: true,
    });

    // If the suggestion has a mixJobId, create a new version based on it
    if (suggestion.mixJobId) {
      const baseMix = await ctx.db.get(suggestion.mixJobId);
      if (baseMix) {
        // Create new mix with suggestion applied
        const newConfig = { ...baseMix.config };
        // Apply suggestion parameters to config
        if (suggestion.parameters) {
          newConfig.parameters = { ...newConfig.parameters, ...suggestion.parameters };
        }

        const newPrompt = `${baseMix.prompt} + ${suggestion.description}`;

        return await ctx.db.insert("mixJobs", {
          projectId: baseMix.projectId,
          prompt: newPrompt,
          status: "queued",
          config: newConfig,
          progress: 0,
          phases: [
            { name: "Analysis", status: "pending", progress: 0 },
            { name: "Stem Processing", status: "pending", progress: 0 },
            { name: "AI Mixing", status: "pending", progress: 0 },
            { name: "Mastering", status: "pending", progress: 0 },
            { name: "Export", status: "pending", progress: 0 },
          ],
          version: baseMix.version + 1,
          parentVersionId: suggestion.mixJobId,
          createdAt: Date.now(),
        });
      }
    }

    return null;
  },
});

// Helper functions

async function updatePhase(
  ctx: any,
  mixJobId: Id<"mixJobs">,
  phaseIndex: number,
  status: string,
  message?: string,
  progress?: number
) {
  const mixJob = await ctx.runQuery(internal.functions.mixing.getMixJobInternal, {
    mixJobId,
  });
  if (!mixJob) return;

  const updatedPhases = [...mixJob.phases];
  updatedPhases[phaseIndex] = {
    ...updatedPhases[phaseIndex],
    status,
    message,
    progress: progress ?? updatedPhases[phaseIndex].progress,
    ...(status === "processing" && { startedAt: Date.now() }),
    ...(status === "completed" && { completedAt: Date.now() }),
  };

  // Calculate overall progress
  const overallProgress = Math.round(
    updatedPhases.reduce((sum, phase) => sum + (phase.progress || 0), 0) / updatedPhases.length
  );

  await ctx.runMutation(internal.functions.mixing.updateMixJobInternal, {
    mixJobId,
    updates: {
      phases: updatedPhases,
      progress: overallProgress,
    },
  });
}

async function simulateProcessing(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Internal mutation to create mix suggestion
export const createMixSuggestionInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    mixJobId: v.id("mixJobs"),
    type: v.string(),
    description: v.string(),
    parameters: v.any(),
    applied: v.boolean(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("mixSuggestions", args);
  },
});

async function simulateAIMixing(ctx: any, mixJob: Doc<"mixJobs">) {
  // Simulate different AI engines
  const engines = ["roex", "custom_ml", "style_transfer"];
  const selectedEngine = mixJob.config.engine || engines[Math.floor(Math.random() * engines.length)];

  // Simulate different processing times based on engine
  const processingTimes: Record<string, number> = {
    roex: 4000,
    custom_ml: 6000,
    style_transfer: 5000,
  };

  await simulateProcessing(processingTimes[selectedEngine] || 4000);

  // Generate some AI suggestions based on the mix
  if (Math.random() > 0.5) {
    await ctx.runMutation(internal.functions.mixing.createMixSuggestionInternal, {
      projectId: mixJob.projectId,
      mixJobId: mixJob._id,
      type: "eq",
      description: "Add high-frequency sparkle around 10-12 kHz for more air",
      parameters: {
        eq: {
          band: "high",
          frequency: 11000,
          gain: 2.5,
          q: 0.8,
        },
      },
      applied: false,
      createdAt: Date.now(),
    });
  }

  if (Math.random() > 0.7) {
    await ctx.runMutation(internal.functions.mixing.createMixSuggestionInternal, {
      projectId: mixJob.projectId,
      mixJobId: mixJob._id,
      type: "compression",
      description: "Gentle bus compression for cohesion",
      parameters: {
        compressor: {
          ratio: 1.5,
          attack: 10,
          release: 100,
          threshold: -18,
        },
      },
      applied: false,
      createdAt: Date.now(),
    });
  }
}

async function generateMockAudioFile(ctx: any): Promise<Id<"_storage">> {
  // For demo purposes, return a mock storage ID
  // In a real implementation, this would upload the actual mixed audio
  return "mock_audio_file_id" as Id<"_storage">;
}

function generateAIFeedback(prompt: string): string {
  const feedbackTemplates = [
    "Great balance between instruments. The mix has good stereo width and clarity.",
    "The dynamics are well-preserved while maintaining competitive loudness.",
    "Nice frequency separation - each element has its own space in the mix.",
    "The AI detected good use of reverb and spatial effects for depth.",
    "Solid low-end definition with clear midrange presence.",
  ];

  return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
}
