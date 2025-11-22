import { v } from 'convex/values';
import { internalMutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { agentId } from '../aiTown/ids';

/**
 * SOCIAL INTEGRATION
 *
 * Ties together reputation, factions, and resonance chambers
 * into a cohesive social fabric.
 */

/**
 * Initialize all social systems for agents
 */
export const initializeAgentSocialSystems = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    // Initialize reputation
    await ctx.runMutation(internal.social.reputation.initializeAgentReputation, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    console.log(`Initialized social systems for agent ${args.agentId}`);
  },
});

/**
 * Initialize resonance chambers for a new world
 */
export const initializeWorldSocial = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Initialize resonance chambers
    await ctx.runMutation(internal.social.resonanceChambers.initializeResonanceChambers, {
      worldId: args.worldId,
    });

    console.log(`Initialized social systems for world ${args.worldId}`);
  },
});

/**
 * Social tick - update social systems
 */
export const socialTick = internalAction({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Update resonance chamber occupancy
    await ctx.runMutation(internal.social.resonanceChambers.updateChamberOccupancy, {
      worldId: args.worldId,
    });

    // Apply resonance effects
    await ctx.runMutation(internal.social.resonanceChambers.applyResonanceEffects, {
      worldId: args.worldId,
    });

    // Update faction states (less frequently)
    const shouldUpdateFactions = Math.random() < 0.2; // 20% chance per tick
    if (shouldUpdateFactions) {
      const factions = await ctx.runQuery(internal.social.integration.getAllFactions, {
        worldId: args.worldId,
      });

      for (const faction of factions) {
        await ctx.runMutation(internal.social.factions.updateFactionState, {
          worldId: args.worldId,
          factionId: faction._id.toString(),
        });
      }
    }
  },
});

/**
 * Process social effects after a conversation
 */
export const processConversationSocialEffects = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agent1Id: agentId,
    agent2Id: agentId,
    wasPositive: v.boolean(),
    impactStrength: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Update both agents' reputations
    await Promise.all([
      ctx.runMutation(internal.social.reputation.updateReputationAfterInteraction, {
        worldId: args.worldId,
        agentId: args.agent1Id,
        wasPositive: args.wasPositive,
        impactStrength: args.impactStrength,
      }),
      ctx.runMutation(internal.social.reputation.updateReputationAfterInteraction, {
        worldId: args.worldId,
        agentId: args.agent2Id,
        wasPositive: args.wasPositive,
        impactStrength: args.impactStrength,
      }),
    ]);

    // Update peer reputations (what each thinks of the other)
    const trustChange = args.wasPositive ? 3 : -5;
    const affectionChange = args.wasPositive ? 2 : -3;

    await Promise.all([
      ctx.runMutation(internal.social.reputation.updatePeerReputation, {
        worldId: args.worldId,
        observer: args.agent1Id,
        subject: args.agent2Id,
        trustChange,
        affectionChange,
      }),
      ctx.runMutation(internal.social.reputation.updatePeerReputation, {
        worldId: args.worldId,
        observer: args.agent2Id,
        subject: args.agent1Id,
        trustChange,
        affectionChange,
      }),
    ]);

    // Log social interaction
    const now = Date.now();
    await ctx.db.insert('socialInteractions', {
      worldId: args.worldId,
      timestamp: now,
      interactionType: 'conversation',
      participants: [args.agent1Id, args.agent2Id],
      outcome: args.wasPositive ? 'positive' : 'negative',
      emotionalImpact: args.wasPositive ? 20 : -20,
      description: args.wasPositive
        ? 'Had a pleasant conversation'
        : 'Had a tense conversation',
    });
  },
});

/**
 * Check if agents should form a faction
 */
export const checkFactionFormation = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.agentIds.length < 2) return null;

    // Get all agents' emotional states
    const emotionalStates = await Promise.all(
      args.agentIds.map((id) =>
        ctx.runQuery(internal.emotions.engine.getEmotionalState, {
          worldId: args.worldId,
          agentId: id,
        }),
      ),
    );

    const validStates = emotionalStates.filter((s) => s !== null);
    if (validStates.length < 2) return null;

    // Check emotional alignment
    const avgValence =
      validStates.reduce((sum, s) => sum + s.emotionalState.valence, 0) / validStates.length;
    const avgArousal =
      validStates.reduce((sum, s) => sum + s.emotionalState.arousal, 0) / validStates.length;

    // Calculate variance to see if they're aligned
    const valenceVariance =
      validStates.reduce((sum, s) => sum + Math.pow(s.emotionalState.valence - avgValence, 2), 0) /
      validStates.length;

    // If emotionally aligned (low variance), might form faction
    if (valenceVariance < 400) {
      // Variance threshold
      // Find dominant shared emotion
      const emotionCounts: Record<string, number> = {};

      for (const state of validStates) {
        const emotions = [
          { name: 'joy', value: state.emotionalState.joy },
          { name: 'sadness', value: state.emotionalState.sadness },
          { name: 'trust', value: state.emotionalState.trust },
          { name: 'anger', value: state.emotionalState.anger },
        ];
        emotions.sort((a, b) => b.value - a.value);
        const dominant = emotions[0].name;
        emotionCounts[dominant] = (emotionCounts[dominant] || 0) + 1;
      }

      const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
      const dominantEmotion = sorted[0]?.[0];

      return {
        shouldForm: true,
        dominantEmotion,
        alignment: 100 - Math.sqrt(valenceVariance),
      };
    }

    return null;
  },
});

/**
 * Get all factions (helper)
 */
export const getAllFactions = internalQuery({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('socialFactions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
  },
});
