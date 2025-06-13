/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as functions_mixing from "../functions/mixing.js";
import type * as functions_projects from "../functions/projects.js";
import type * as functions_stems from "../functions/stems.js";
import type * as http from "../http.js";
import type * as jobs_analysis from "../jobs/analysis.js";
import type * as jobs_cleanup from "../jobs/cleanup.js";
import type * as jobs_processAudio from "../jobs/processAudio.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/mixing": typeof functions_mixing;
  "functions/projects": typeof functions_projects;
  "functions/stems": typeof functions_stems;
  http: typeof http;
  "jobs/analysis": typeof jobs_analysis;
  "jobs/cleanup": typeof jobs_cleanup;
  "jobs/processAudio": typeof jobs_processAudio;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
