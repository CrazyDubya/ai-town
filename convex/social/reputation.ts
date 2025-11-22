import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { agentId } from '../aiTown/ids';

/**
 * REPUTATION SYSTEM
 *
 * Tracks what agents think of each other and their standing in the community.
 * Reputation affects who agents seek out, trust, and listen to.
 */

/**
 * Initialize agent reputation
 */
export const initializeAgentReputation = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('agentReputation')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();

    const reputation = await ctx.db.insert('agentReputation', {
      worldId: args.worldId,
      agentId: args.agentId,
      likeability: 50,
      trustworthiness: 50,
      influence: 25,
      reliability: 50,
      totalInteractions: 0,
      positiveInteractions: 0,
      negativeInteractions: 0,
      recentTrend: 'stable',
      lastUpdated: now,
    });

    return reputation;
  },
});

/**
 * Update reputation after interaction
 */
export const updateReputationAfterInteraction = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    wasPositive: v.boolean(),
    impactStrength: v.optional(v.number()), // 0-1
  },
  handler: async (ctx, args) => {
    const reputation = await ctx.db
      .query('agentReputation')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!reputation) {
      return await ctx.runMutation(internal.social.reputation.initializeAgentReputation, {
        worldId: args.worldId,
        agentId: args.agentId,
      });
    }

    const impact = args.impactStrength || 0.5;
    const change = args.wasPositive ? 2 * impact : -2 * impact;

    const now = Date.now();

    // Update scores
    const newLikeability = Math.max(0, Math.min(100, reputation.likeability + change * 1.5));
    const newTrustworthiness = Math.max(
      0,
      Math.min(100, reputation.trustworthiness + change * 1.0),
    );
    const newReliability = Math.max(0, Math.min(100, reputation.reliability + change * 0.8));

    // Influence grows with positive interactions
    const newInfluence = Math.max(
      0,
      Math.min(
        100,
        reputation.influence +
          (args.wasPositive ? 0.5 * impact : -0.3 * impact),
      ),
    );

    const newPositive = args.wasPositive
      ? reputation.positiveInteractions + 1
      : reputation.positiveInteractions;
    const newNegative = !args.wasPositive
      ? reputation.negativeInteractions + 1
      : reputation.negativeInteractions;

    // Calculate trend
    const recentRatio =
      newPositive / (newPositive + newNegative + 1);
    let trend = 'stable';
    if (recentRatio > 0.65) trend = 'rising';
    else if (recentRatio < 0.35) trend = 'falling';

    await ctx.db.patch(reputation._id, {
      likeability: newLikeability,
      trustworthiness: newTrustworthiness,
      influence: newInfluence,
      reliability: newReliability,
      totalInteractions: reputation.totalInteractions + 1,
      positiveInteractions: newPositive,
      negativeInteractions: newNegative,
      recentTrend: trend,
      lastUpdated: now,
    });

    return {
      likeability: newLikeability,
      trustworthiness: newTrustworthiness,
      influence: newInfluence,
      trend,
    };
  },
});

/**
 * Update peer reputation (what A thinks of B)
 */
export const updatePeerReputation = internalMutation({
  args: {
    worldId: v.id('worlds'),
    observer: agentId,
    subject: agentId,
    trustChange: v.optional(v.number()),
    respectChange: v.optional(v.number()),
    affectionChange: v.optional(v.number()),
    admirationChange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find or create peer reputation
    let peerRep = await ctx.db
      .query('peerReputations')
      .withIndex('relationship', (q) =>
        q.eq('worldId', args.worldId).eq('observer', args.observer).eq('subject', args.subject),
      )
      .first();

    const now = Date.now();

    if (!peerRep) {
      // Create new peer reputation
      const peerRepId = await ctx.db.insert('peerReputations', {
        worldId: args.worldId,
        observer: args.observer,
        subject: args.subject,
        trust: 50,
        respect: 50,
        affection: 50,
        admiration: 50,
        overallOpinion: 'neutral',
        lastInteraction: now,
        interactionCount: 1,
        firstImpression: 0,
        reputationInfluence: 50,
        updatedAt: now,
      });

      peerRep = (await ctx.db.get(peerRepId))!;
    }

    // Apply changes
    const clamp = (val: number) => Math.max(0, Math.min(100, val));

    const newTrust = clamp(peerRep.trust + (args.trustChange || 0));
    const newRespect = clamp(peerRep.respect + (args.respectChange || 0));
    const newAffection = clamp(peerRep.affection + (args.affectionChange || 0));
    const newAdmiration = clamp(peerRep.admiration + (args.admirationChange || 0));

    // Determine overall opinion
    const avgPositive = (newTrust + newRespect + newAffection + newAdmiration) / 4;
    let opinion = 'neutral';

    if (avgPositive > 75) {
      opinion = newAffection > 70 ? 'friend' : 'ally';
    } else if (avgPositive > 60) {
      opinion = 'favorable';
    } else if (avgPositive < 30) {
      opinion = newAffection < 20 ? 'enemy' : 'rival';
    } else if (avgPositive < 45) {
      opinion = 'unfavorable';
    }

    await ctx.db.patch(peerRep._id, {
      trust: newTrust,
      respect: newRespect,
      affection: newAffection,
      admiration: newAdmiration,
      overallOpinion: opinion,
      lastInteraction: now,
      interactionCount: peerRep.interactionCount + 1,
      updatedAt: now,
    });

    return {
      trust: newTrust,
      respect: newRespect,
      affection: newAffection,
      admiration: newAdmiration,
      opinion,
    };
  },
});

/**
 * Get agent's reputation summary
 */
export const getAgentReputation = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const reputation = await ctx.db
      .query('agentReputation')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    return reputation;
  },
});

/**
 * Get what an agent thinks of another
 */
export const getPeerReputation = internalQuery({
  args: {
    worldId: v.id('worlds'),
    observer: agentId,
    subject: agentId,
  },
  handler: async (ctx, args) => {
    const peerRep = await ctx.db
      .query('peerReputations')
      .withIndex('relationship', (q) =>
        q.eq('worldId', args.worldId).eq('observer', args.observer).eq('subject', args.subject),
      )
      .first();

    return peerRep;
  },
});

/**
 * Get top influential agents
 */
export const getInfluentialAgents = internalQuery({
  args: {
    worldId: v.id('worlds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    const reputations = await ctx.db
      .query('agentReputation')
      .withIndex('influence', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(limit);

    return reputations;
  },
});

import { internal } from '../_generated/api';
