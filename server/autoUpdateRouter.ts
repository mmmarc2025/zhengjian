/**
 * Auto-Update Router
 * API endpoints for automatic candidate, news, and policy updates
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as autoUpdate from "./auto-update";
import * as geminiSearch from "./gemini-search";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const autoUpdateRouter = router({
  // Run full auto-update (admin only)
  runFull: adminProcedure
    .input(z.object({
      counties: z.array(z.string()).optional(),
      positionTypes: z.array(z.string()).optional(),
      skipNews: z.boolean().optional(),
      skipPolicies: z.boolean().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      const result = await autoUpdate.runFullAutoUpdate({
        counties: input?.counties,
        positionTypes: input?.positionTypes as any,
        skipNews: input?.skipNews,
        skipPolicies: input?.skipPolicies,
      });
      return result;
    }),

  // Quick search for candidates in a specific county
  quickSearch: adminProcedure
    .input(z.object({
      county: z.string().min(1),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]).default("councilor"),
    }))
    .mutation(async ({ input }) => {
      const result = await autoUpdate.quickCandidateSearch(input.county, input.positionType);
      return result;
    }),

  // Search for new candidates using Gemini with Google Search
  searchCandidates: adminProcedure
    .input(z.object({
      county: z.string().min(1),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]),
    }))
    .mutation(async ({ input }) => {
      const candidates = await geminiSearch.searchNewCandidates(input.county, input.positionType);
      return { candidates };
    }),

  // Search for candidate news with real sources
  searchNewsWithSources: adminProcedure
    .input(z.object({
      candidateName: z.string().min(1),
      county: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const news = await geminiSearch.searchCandidateNewsWithSources(input.candidateName, input.county);
      return { news };
    }),

  // Update news for all candidates
  updateAllNews: adminProcedure.mutation(async () => {
    const result = await autoUpdate.updateAllCandidateNews();
    return result;
  }),

  // Update policies for all candidates
  updateAllPolicies: adminProcedure.mutation(async () => {
    const result = await autoUpdate.updateAllCandidatePolicies();
    return result;
  }),

  // Get available counties and position types
  getOptions: publicProcedure.query(() => {
    return {
      counties: geminiSearch.TAIWAN_COUNTIES,
      positionTypes: geminiSearch.POSITION_TYPES,
      parties: geminiSearch.TAIWAN_PARTIES,
    };
  }),

  // Search for candidate photo
  searchPhoto: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      candidateName: z.string().min(1),
      party: z.string(),
      county: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await geminiSearch.searchCandidatePhoto(
        input.candidateName,
        input.party,
        input.county
      );
      return {
        candidateId: input.candidateId,
        candidateName: input.candidateName,
        ...result
      };
    }),

  // Batch search photos for multiple candidates
  batchSearchPhotos: adminProcedure
    .input(z.object({
      candidates: z.array(z.object({
        id: z.number(),
        name: z.string(),
        party: z.string(),
        county: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const results = await geminiSearch.batchSearchCandidatePhotos(input.candidates);
      return { results };
    }),

  // Update candidate photo URL
  updateCandidatePhoto: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      photoUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const { updateCandidate } = await import("./db");
      await updateCandidate(input.candidateId, { photoUrl: input.photoUrl });
      return { success: true, candidateId: input.candidateId };
    }),
});
