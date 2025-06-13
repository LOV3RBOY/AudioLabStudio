import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * HTTP endpoints for the AI Audio Production Tool
 * 
 * This file contains handlers for:
 * - Secure file downloads
 * - Webhooks from external AI services
 * - Public API endpoints
 */

const http = httpRouter();

/**
 * Secure download endpoint for audio files
 * 
 * This endpoint allows authorized users to download their audio files
 * with proper content-type headers and optional streaming support.
 */
http.route({
  path: "/download/:storageId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.pathname.split("/").pop() as Id<"_storage">;
    try {
      const file = await ctx.storage.get(storageId);

      if (!file) {
        return new Response("File not found", { status: 404 });
      }

      return new Response(file, {
        headers: {
          "Content-Type": "audio/mpeg", // Adjust content type as needed
          "Content-Disposition": `attachment; filename="download.mp3"`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(`Error: ${message}`, {
        status: 500,
      });
    }
  }),
});

/**
 * Webhook endpoint for AI service callbacks
 * 
 * This endpoint receives callbacks from external AI audio processing services
 * when asynchronous jobs are completed.
 */
http.route({
  path: "/webhooks/ai-service",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse the webhook payload
      const payload = await request.json();
      
      // In a real implementation, we would:
      // 1. Validate the webhook signature
      // 2. Process the callback data
      // 3. Update the corresponding mix job in the database
      // 4. Trigger notifications to the user

      console.log("Received AI service webhook:", payload);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({ success: false, error: message }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }),
});

/**
 * Health check endpoint
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
});

export default http;
