import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as gemini from "./gemini";
import * as autoUpdate from "./auto-update";
import * as geminiSearch from "./gemini-search";
import { autoUpdateRouter } from "./autoUpdateRouter";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ============ Candidate Router ============
const candidateRouter = router({
  list: publicProcedure
    .input(z.object({
      county: z.string().optional(),
      party: z.string().optional(),
      positionType: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return db.getCandidates({
        ...input,
        isActive: true,
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const candidate = await db.getCandidateById(input.id);
      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      }
      return candidate;
    }),

  compare: publicProcedure
    .input(z.object({ ids: z.array(z.number()).min(2).max(4) }))
    .query(async ({ input }) => {
      const candidates = await db.getCandidatesForComparison(input.ids);
      const policiesMap: Record<number, Awaited<ReturnType<typeof db.getPoliciesByCandidateId>>> = {};
      
      for (const c of candidates) {
        policiesMap[c.id] = await db.getPoliciesByCandidateId(c.id);
      }
      
      return { candidates, policiesMap };
    }),

  // Admin operations
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      photoUrl: z.string().optional(),
      party: z.string().optional(),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]),
      county: z.string().min(1),
      district: z.string().optional(),
      constituency: z.string().optional(),
      age: z.number().optional(),
      education: z.string().optional(),
      experience: z.string().optional(),
      contact: z.string().optional(),
      website: z.string().optional(),
      socialMedia: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        line: z.string().optional(),
      }).optional(),
      isIncumbent: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createCandidate(input);
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      photoUrl: z.string().optional(),
      party: z.string().optional(),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]).optional(),
      county: z.string().optional(),
      district: z.string().optional(),
      constituency: z.string().optional(),
      age: z.number().optional(),
      education: z.string().optional(),
      experience: z.string().optional(),
      contact: z.string().optional(),
      website: z.string().optional(),
      socialMedia: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        line: z.string().optional(),
      }).optional(),
      isIncumbent: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCandidate(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCandidate(input.id);
      return { success: true };
    }),

  // Batch delete candidates
  batchDelete: adminProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      for (const id of input.ids) {
        await db.deleteCandidate(id);
      }
      return { success: true, deletedCount: input.ids.length };
    }),

  // Batch update candidates
  batchUpdate: adminProcedure
    .input(z.object({
      ids: z.array(z.number()).min(1),
      party: z.string().optional(),
      county: z.string().optional(),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { ids, ...data } = input;
      // Only update fields that are provided
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(updateData).length === 0) {
        return { success: false, message: "No fields to update" };
      }
      
      for (const id of ids) {
        await db.updateCandidate(id, updateData);
      }
      return { success: true, updatedCount: ids.length };
    }),
});

// ============ Policy Router ============
const policyRouter = router({
  getByCandidateId: publicProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return db.getPoliciesByCandidateId(input.candidateId);
    }),

  countByCandidate: publicProcedure
    .query(async () => {
      return db.getPolicyCountsByCandidate();
    }),

  getByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      return db.getPoliciesByCategory(input.categoryId);
    }),

  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      categoryId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return db.searchPolicies(input.query, input.categoryId);
    }),

  create: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      categoryId: z.number().optional(),
      title: z.string().min(1),
      summary: z.string().optional(),
      content: z.string().optional(),
      source: z.string().optional(),
      isHighlight: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createPolicy(input);
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      source: z.string().optional(),
      isHighlight: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePolicy(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePolicy(input.id);
      return { success: true };
    }),
});

// ============ News Router ============
const newsRouter = router({
  list: publicProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return db.getNews({
        ...input,
        isPublished: true,
      });
    }),

  countByCandidate: publicProcedure
    .query(async () => {
      return db.getNewsCountsByCandidate();
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await db.getNewsById(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "News not found" });
      }
      return item;
    }),

  // Admin operations
  listAll: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return db.getNews(input);
    }),

  create: adminProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      title: z.string().min(1),
      summary: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceName: z.string().optional(),
      publishedAt: z.date().optional(),
      isPublished: z.boolean().default(true),
      isPinned: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createNews(input);
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      candidateId: z.number().optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceName: z.string().optional(),
      isPublished: z.boolean().optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNews(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteNews(input.id);
      return { success: true };
    }),
});

// ============ Candidate News Router ============
const candidateNewsRouter = router({
  // Get news for a specific candidate
  getByCandidateId: publicProcedure
    .input(z.object({
      candidateId: z.number(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getCandidateNews(input);
    }),

  // Search and add news for a candidate (admin only)
  searchAndAdd: adminProcedure
    .input(z.object({
      candidateId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const candidate = await db.getCandidateById(input.candidateId);
      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      }

      // Search for latest news using Gemini
      const newsItems = await gemini.searchCandidateLatestNews(candidate.name, candidate.county);
      const addedNews: number[] = [];

      for (const item of newsItems) {
        // Use upsert to avoid duplicate topics
        const id = await db.upsertCandidateNewsByTopic({
          candidateId: candidate.id,
          title: item.title,
          summary: item.summary,
          sourceUrl: item.sourceUrl,
          sourceName: item.source,
          topic: item.topic,
          publishedAt: new Date(),
          isAutoGenerated: true,
        });
        addedNews.push(id);
      }

      return { addedCount: addedNews.length, candidateName: candidate.name };
    }),

  // Batch update news for all candidates (admin only)
  batchUpdate: adminProcedure.mutation(async () => {
    const candidates = await db.getCandidates({ isActive: true, limit: 100 });
    const results: { candidateId: number; candidateName: string; newsCount: number }[] = [];

    for (const candidate of candidates) {
      try {
        const newsItems = await gemini.searchCandidateLatestNews(candidate.name, candidate.county);
        let addedCount = 0;

        for (const item of newsItems) {
          await db.upsertCandidateNewsByTopic({
            candidateId: candidate.id,
            title: item.title,
            summary: item.summary,
            sourceUrl: item.sourceUrl,
            sourceName: item.source,
            topic: item.topic,
            publishedAt: new Date(),
            isAutoGenerated: true,
          });
          addedCount++;
        }

        results.push({ candidateId: candidate.id, candidateName: candidate.name, newsCount: addedCount });
      } catch (error) {
        console.error(`Error fetching news for ${candidate.name}:`, error);
        results.push({ candidateId: candidate.id, candidateName: candidate.name, newsCount: 0 });
      }
    }

    return { results, totalCandidates: candidates.length };
  }),

  // Create a news item (admin only)
  // If sourceUrl is provided but no summary, automatically fetch and generate summary using Gemini
  create: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      title: z.string().min(1),
      summary: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceName: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let finalTitle = input.title;
      let finalSummary = input.summary;
      let finalSourceName = input.sourceName;
      
      // If sourceUrl is provided but no summary, auto-generate using Gemini
      if (input.sourceUrl && !input.summary) {
        try {
          const result = await geminiSearch.fetchAndSummarizeNews(input.sourceUrl, input.title);
          if (result.summary) {
            finalSummary = result.summary;
          }
          if (result.title && result.title !== input.title) {
            finalTitle = result.title;
          }
          if (!input.sourceName && result.sourceName) {
            finalSourceName = result.sourceName;
          }
        } catch (error) {
          console.error("Error auto-generating news summary:", error);
          // Continue with original data if auto-generation fails
        }
      }
      
      // Extract source name from URL if not provided
      if (!finalSourceName && input.sourceUrl) {
        finalSourceName = geminiSearch.extractSourceName(input.sourceUrl);
      }
      
      const id = await db.createCandidateNews({
        candidateId: input.candidateId,
        title: finalTitle,
        summary: finalSummary,
        sourceUrl: input.sourceUrl,
        sourceName: finalSourceName,
        imageUrl: input.imageUrl,
      });
      return { id, title: finalTitle, summary: finalSummary, sourceName: finalSourceName };
    }),

  // Delete a news item (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCandidateNews(input.id);
      return { success: true };
    }),
});

// ============ Comment Router ============
const commentRouter = router({
  list: publicProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      policyId: z.number().optional(),
      newsId: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getComments({
        ...input,
        status: "approved",
      });
    }),

  create: protectedProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      policyId: z.number().optional(),
      newsId: z.number().optional(),
      parentId: z.number().optional(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createComment({
        ...input,
        userId: ctx.user.id,
        status: "approved", // Auto-approve for now
      });
      return { id };
    }),

  // Admin operations
  listAll: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "hidden"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getComments(input);
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected", "hidden"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateCommentStatus(input.id, input.status);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteComment(input.id);
      return { success: true };
    }),
});

// ============ Category Router ============
const categoryRouter = router({
  list: publicProcedure.query(async () => {
    return db.getIssueCategories();
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      icon: z.string().optional(),
      description: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createIssueCategory(input);
      return { id };
    }),
});

// ============ Statistics Router ============
const statsRouter = router({
  get: publicProcedure.query(async () => {
    return db.getStatistics();
  }),

  seed: adminProcedure.mutation(async () => {
    await db.seedIssueCategories();
    return { success: true };
  }),
});

// ============ AI Router (Gemini) ============
const aiRouter = router({
  // Search candidate news using AI
  searchCandidateNews: adminProcedure
    .input(z.object({
      candidateName: z.string().min(1),
      county: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const news = await gemini.searchCandidateNews(input.candidateName, input.county);
      return { news };
    }),

  // Generate policy summary for a candidate
  generatePolicies: adminProcedure
    .input(z.object({
      candidateName: z.string().min(1),
      county: z.string().min(1),
      position: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const policies = await gemini.generatePolicySummary(
        input.candidateName,
        input.county,
        input.position
      );
      return { policies };
    }),

  // Search latest election news
  searchElectionNews: adminProcedure.mutation(async () => {
    const news = await gemini.searchElectionNews();
    return { news };
  }),

  // Search and save policies for a specific candidate
  searchPolicies: adminProcedure
    .input(z.object({ candidateId: z.number() }))
    .mutation(async ({ input }) => {
      const candidate = await db.getCandidateById(input.candidateId);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      
      const categories = await db.getIssueCategories();
      const categoryMap = new Map(categories.map(c => [c.name, c.id]));
      
      const policies = await gemini.generatePolicySummary(candidate.name, candidate.county, candidate.positionType);
      const savedPolicies = [];
      
      for (const policy of policies) {
        const categoryId = categoryMap.get(policy.category);
        const id = await db.createPolicy({
          candidateId: input.candidateId,
          categoryId,
          title: policy.title,
          summary: policy.content,
          isHighlight: false,
        });
        savedPolicies.push({ id, ...policy });
      }
      
      return { policies: savedPolicies };
    }),

  // Search news for a specific candidate - returns list for selection (does not auto-save)
  searchNews: adminProcedure
    .input(z.object({ candidateId: z.number() }))
    .mutation(async ({ input }) => {
      const candidate = await db.getCandidateById(input.candidateId);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      
      // Use the new function that returns only real sources from Google Search Grounding
      const newsItems = await geminiSearch.searchCandidateNewsWithSources(candidate.name, candidate.county);
      
      // Return the news list for admin to select which ones to add
      // Each item has: title, sourceUrl, sourceName (all from real sources)
      return { 
        news: newsItems.map(item => ({
          title: item.title,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
        }))
      };
    }),

  // Batch update: fetch and save news for all candidates
  batchUpdateNews: adminProcedure.mutation(async () => {
    const candidates = await db.getCandidates({ isActive: true, limit: 100 });
    const results: { candidateId: number; newsCount: number }[] = [];

    for (const candidate of candidates) {
      try {
        const news = await gemini.searchCandidateNews(candidate.name, candidate.county);
        for (const item of news) {
          await db.createNews({
            candidateId: candidate.id,
            title: item.title,
            summary: item.summary,
            sourceName: item.source,
            isPublished: true,
          });
        }
        results.push({ candidateId: candidate.id, newsCount: news.length });
      } catch (error) {
        console.error(`Error fetching news for ${candidate.name}:`, error);
        results.push({ candidateId: candidate.id, newsCount: 0 });
      }
    }

    return { results, totalCandidates: candidates.length };
  }),

  // Batch update: generate policies for all candidates
  batchUpdatePolicies: adminProcedure.mutation(async () => {
    const candidates = await db.getCandidates({ isActive: true, limit: 100 });
    const categories = await db.getIssueCategories();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const results: { candidateId: number; policyCount: number }[] = [];

    const positionNames: Record<string, string> = {
      mayor: "縣市長",
      councilor: "縣市議員",
      township_mayor: "鄉鎮市長",
      representative: "鄉鎮市民代表",
      village_chief: "村里長",
    };

    for (const candidate of candidates) {
      try {
        const positionName = positionNames[candidate.positionType] || candidate.positionType;
        const policies = await gemini.generatePolicySummary(
          candidate.name,
          candidate.county,
          positionName
        );
        
        for (const policy of policies) {
          const categoryId = categoryMap.get(policy.category);
          await db.createPolicy({
            candidateId: candidate.id,
            categoryId: categoryId || undefined,
            title: policy.title,
            content: policy.content,
            summary: policy.content.substring(0, 100),
          });
        }
        results.push({ candidateId: candidate.id, policyCount: policies.length });
      } catch (error) {
        console.error(`Error generating policies for ${candidate.name}:`, error);
        results.push({ candidateId: candidate.id, policyCount: 0 });
      }
    }

    return { results, totalCandidates: candidates.length };
  }),
});

// ============ Main Router ============
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  candidate: candidateRouter,
  policy: policyRouter,
  news: newsRouter,
  candidateNews: candidateNewsRouter,
  comment: commentRouter,
  category: categoryRouter,
  stats: statsRouter,
  ai: aiRouter,
  autoUpdate: autoUpdateRouter,
});

export type AppRouter = typeof appRouter;
