import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { agentId } from '../aiTown/ids';

/**
 * SOCIAL FACTIONS SYSTEM
 *
 * Agents naturally form groups around shared emotions, values, and experiences.
 * Factions provide identity, influence social dynamics, and create emergent politics.
 */

/**
 * Create a new faction
 */
export const createFaction = internalMutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    description: v.string(),
    factionType: v.string(),
    founder: agentId,
    initialMembers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const members = [args.founder, ...(args.initialMembers || [])];

    // Determine dominant emotion from founder
    const founderPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.founder))
      .first();

    let dominantEmotion = 'trust';
    if (founderPsych) {
      const emotions = [
        { name: 'joy', value: founderPsych.emotionalState.joy },
        { name: 'sadness', value: founderPsych.emotionalState.sadness },
        { name: 'trust', value: founderPsych.emotionalState.trust },
        { name: 'anger', value: founderPsych.emotionalState.anger },
        { name: 'fear', value: founderPsych.emotionalState.fear },
        { name: 'anticipation', value: founderPsych.emotionalState.anticipation },
      ];
      emotions.sort((a, b) => b.value - a.value);
      dominantEmotion = emotions[0].name;
    }

    const factionId = await ctx.db.insert('socialFactions', {
      worldId: args.worldId,
      name: args.name,
      description: args.description,
      factionType: args.factionType,
      dominantEmotion,
      members,
      leader: args.founder,
      cohesion: 75, // Start with decent cohesion
      influence: 20, // Start with low influence
      activity: 80, // Start active
      averageValence: 0,
      averageArousal: 50,
      allies: [],
      rivals: [],
      createdAt: now,
      lastActivity: now,
    });

    // Create faction memberships
    for (const member of members) {
      await ctx.db.insert('factionMemberships', {
        worldId: args.worldId,
        factionId: factionId.toString(),
        agentId: member,
        joinedAt: now,
        role: member === args.founder ? 'leader' : 'member',
        commitment: 70,
      });
    }

    console.log(`Created faction: ${args.name} (${factionId}) with ${members.length} members`);
    return factionId;
  },
});

/**
 * Agent joins a faction
 */
export const joinFaction = internalMutation({
  args: {
    worldId: v.id('worlds'),
    factionId: v.string(),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const faction = await ctx.db
      .query('socialFactions')
      .filter((q) =>
        q.and(q.eq(q.field('worldId'), args.worldId), q.eq(q.field('_id'), args.factionId)),
      )
      .first();

    if (!faction) {
      throw new Error(`Faction ${args.factionId} not found`);
    }

    // Check if already a member
    const existing = await ctx.db
      .query('factionMemberships')
      .withIndex('agent', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .filter((q) => q.eq(q.field('factionId'), args.factionId))
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();

    // Add to members
    await ctx.db.patch(faction._id, {
      members: [...faction.members, args.agentId],
      lastActivity: now,
    });

    // Create membership
    const membership = await ctx.db.insert('factionMemberships', {
      worldId: args.worldId,
      factionId: args.factionId,
      agentId: args.agentId,
      joinedAt: now,
      role: 'initiate',
      commitment: 50,
    });

    return membership;
  },
});

/**
 * Update faction cohesion and mood
 */
export const updateFactionState = internalMutation({
  args: {
    worldId: v.id('worlds'),
    factionId: v.string(),
  },
  handler: async (ctx, args) => {
    const faction = await ctx.db
      .query('socialFactions')
      .filter((q) =>
        q.and(q.eq(q.field('worldId'), args.worldId), q.eq(q.field('_id'), args.factionId)),
      )
      .first();

    if (!faction) return;

    // Get all members' emotional states
    const memberEmotions = await Promise.all(
      faction.members.map((agentId) =>
        ctx.runQuery(internal.emotions.engine.getEmotionalState, {
          worldId: args.worldId,
          agentId,
        }),
      ),
    );

    const validEmotions = memberEmotions.filter((e) => e !== null);
    if (validEmotions.length === 0) return;

    // Calculate average emotional state
    let totalValence = 0;
    let totalArousal = 0;

    for (const emotionData of validEmotions) {
      totalValence += emotionData.emotionalState.valence;
      totalArousal += emotionData.emotionalState.arousal;
    }

    const avgValence = totalValence / validEmotions.length;
    const avgArousal = totalArousal / validEmotions.length;

    // Calculate cohesion based on emotional alignment
    const emotionVectors = validEmotions.map((e) => [
      e.emotionalState.joy,
      e.emotionalState.sadness,
      e.emotionalState.trust,
      e.emotionalState.anger,
    ]);

    // Simple cohesion metric: inverse of emotional variance
    const variances = [0, 1, 2, 3].map((i) => {
      const values = emotionVectors.map((v) => v[i]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return variance;
    });

    const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    const cohesion = Math.max(0, Math.min(100, 100 - avgVariance));

    // Influence grows with cohesion and activity
    const newInfluence = Math.min(
      100,
      faction.influence + (cohesion > 70 ? 0.5 : -0.3),
    );

    const now = Date.now();

    await ctx.db.patch(faction._id, {
      cohesion,
      influence: newInfluence,
      averageValence: avgValence,
      averageArousal: avgArousal,
      lastActivity: now,
    });

    return { cohesion, influence: newInfluence, avgValence, avgArousal };
  },
});

/**
 * Find factions an agent might want to join
 */
export const findCompatibleFactions = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const agentPsych = await ctx.runQuery(internal.emotions.engine.getEmotionalState, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (!agentPsych) return [];

    const factions = await ctx.db
      .query('socialFactions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    // Score factions by compatibility
    const scoredFactions = factions.map((faction) => {
      let score = 0;

      // Emotional alignment
      const valenceDiff = Math.abs(agentPsych.emotionalState.valence - faction.averageValence);
      const arousalDiff = Math.abs(agentPsych.emotionalState.arousal - faction.averageArousal);

      score += Math.max(0, 50 - valenceDiff);
      score += Math.max(0, 25 - arousalDiff / 2);

      // Cohesion attracts
      score += faction.cohesion * 0.3;

      // Influence attracts
      score += faction.influence * 0.2;

      return { faction, score };
    });

    scoredFactions.sort((a, b) => b.score - a.score);
    return scoredFactions.slice(0, 3);
  },
});

/**
 * Check if agent is in any faction
 */
export const getAgentFactions = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query('factionMemberships')
      .withIndex('agent', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .collect();

    return memberships;
  },
});

import { internal } from '../_generated/api';
