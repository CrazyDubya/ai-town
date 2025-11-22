/**
 * PHASE 6: PERSONALITY EVOLUTION ENGINE
 *
 * Personality traits drift based on experiences. Trauma makes you less trusting,
 * success builds confidence, repeated social interactions affect extraversion, etc.
 *
 * AGENTS GENUINELY CHANGE OVER TIME.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

// Maximum trait drift from baseline
const MAX_TRAIT_DRIFT = 30; // Traits can shift up to 30 points from original

// Evolution triggers and their trait effects
const EVOLUTION_TRIGGERS: Record<
  string,
  { traits: Record<string, number>; threshold: number }
> = {
  // Negative experiences
  betrayal: {
    traits: { agreeableness: -5, neuroticism: +3, openness: -2 },
    threshold: 1,
  },
  conflict_loss: {
    traits: { neuroticism: +2, agreeableness: -3 },
    threshold: 1,
  },
  social_rejection: {
    traits: { extraversion: -3, neuroticism: +2, agreeableness: -1 },
    threshold: 2,
  },
  repeated_failure: {
    traits: { neuroticism: +4, conscientiousness: -2, openness: -1 },
    threshold: 3,
  },

  // Positive experiences
  successful_conflict_resolution: {
    traits: { agreeableness: +3, conscientiousness: +2, neuroticism: -1 },
    threshold: 1,
  },
  quest_completion: {
    traits: { conscientiousness: +2, neuroticism: -1 },
    threshold: 2,
  },
  positive_social: {
    traits: { extraversion: +2, agreeableness: +1, neuroticism: -1 },
    threshold: 3,
  },
  creative_success: {
    traits: { openness: +3, conscientiousness: +1 },
    threshold: 1,
  },
  leadership_success: {
    traits: { extraversion: +2, conscientiousness: +3, neuroticism: -2 },
    threshold: 2,
  },

  // Transformative experiences
  major_trauma: {
    traits: { neuroticism: +8, agreeableness: -5, openness: -3 },
    threshold: 1,
  },
  enlightenment: {
    traits: { openness: +6, conscientiousness: +3, neuroticism: -4 },
    threshold: 1,
  },
  love: {
    traits: { agreeableness: +4, extraversion: +2, neuroticism: -3 },
    threshold: 1,
  },
};

/**
 * Initialize personality evolution tracking
 */
export const initializePersonalityEvolution = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    baselinePersonality: v.object({
      openness: v.number(),
      conscientiousness: v.number(),
      extraversion: v.number(),
      agreeableness: v.number(),
      neuroticism: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('personalityEvolution')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert('personalityEvolution', {
      worldId: args.worldId,
      agentId: args.agentId,
      originalPersonality: args.baselinePersonality,
      evolutionHistory: [],
      totalDrift: 0,
      driftDirection: {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
      },
      lastEvolved: Date.now(),
      evolutionCount: 0,
    });
  },
});

/**
 * Trigger personality evolution based on experience
 */
export const evolvePersonality = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    trigger: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const evolutionData = await ctx.db
      .query('personalityEvolution')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!evolutionData) {
      console.log('No personality evolution data found');
      return null;
    }

    const triggerEffect = EVOLUTION_TRIGGERS[args.trigger];
    if (!triggerEffect) {
      console.log(`Unknown trigger: ${args.trigger}`);
      return null;
    }

    // Get current personality
    const currentPsychology = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!currentPsychology) return null;

    const now = Date.now();
    const newHistory = [...evolutionData.evolutionHistory];
    let traitsChanged = false;

    // Apply trait changes
    for (const [trait, change] of Object.entries(triggerEffect.traits)) {
      const currentValue = currentPsychology.personality[trait as keyof typeof currentPsychology.personality];
      const baseline = evolutionData.originalPersonality[trait as keyof typeof evolutionData.originalPersonality];

      // Calculate current drift for this trait
      const currentDrift = currentValue - baseline;

      // Don't drift too far from baseline
      if (Math.abs(currentDrift + change) <= MAX_TRAIT_DRIFT) {
        const newValue = Math.max(0, Math.min(100, currentValue + change));

        if (newValue !== currentValue) {
          // Record evolution
          newHistory.push({
            trait,
            oldValue: currentValue,
            newValue,
            change,
            reason: args.reason,
            timestamp: now,
          });

          traitsChanged = true;

          // Update drift direction
          const newDriftDirection = { ...evolutionData.driftDirection };
          newDriftDirection[trait as keyof typeof newDriftDirection] += change;

          // Update personality
          await ctx.db.patch(currentPsychology._id, {
            personality: {
              ...currentPsychology.personality,
              [trait]: newValue,
            },
          });
        }
      }
    }

    if (traitsChanged) {
      // Calculate new total drift
      const newDrift = newHistory.reduce((sum, h) => sum + Math.abs(h.change), 0);

      await ctx.db.patch(evolutionData._id, {
        evolutionHistory: newHistory,
        totalDrift: newDrift,
        lastEvolved: now,
        evolutionCount: evolutionData.evolutionCount + 1,
      });

      return {
        changed: true,
        evolutionCount: evolutionData.evolutionCount + 1,
        totalDrift: newDrift,
      };
    }

    return { changed: false };
  },
});

/**
 * Get personality evolution summary
 */
export const getPersonalityEvolution = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const evolution = await ctx.db
      .query('personalityEvolution')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!evolution) return null;

    const currentPsychology = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!currentPsychology) return evolution;

    // Calculate current vs original
    const comparison = {
      openness: {
        original: evolution.originalPersonality.openness,
        current: currentPsychology.personality.openness,
        change: currentPsychology.personality.openness - evolution.originalPersonality.openness,
      },
      conscientiousness: {
        original: evolution.originalPersonality.conscientiousness,
        current: currentPsychology.personality.conscientiousness,
        change:
          currentPsychology.personality.conscientiousness -
          evolution.originalPersonality.conscientiousness,
      },
      extraversion: {
        original: evolution.originalPersonality.extraversion,
        current: currentPsychology.personality.extraversion,
        change:
          currentPsychology.personality.extraversion -
          evolution.originalPersonality.extraversion,
      },
      agreeableness: {
        original: evolution.originalPersonality.agreeableness,
        current: currentPsychology.personality.agreeableness,
        change:
          currentPsychology.personality.agreeableness -
          evolution.originalPersonality.agreeableness,
      },
      neuroticism: {
        original: evolution.originalPersonality.neuroticism,
        current: currentPsychology.personality.neuroticism,
        change:
          currentPsychology.personality.neuroticism -
          evolution.originalPersonality.neuroticism,
      },
    };

    return {
      ...evolution,
      comparison,
      significantChanges: Object.entries(comparison)
        .filter(([, data]) => Math.abs(data.change) > 5)
        .map(([trait, data]) => ({
          trait,
          change: data.change,
          direction: data.change > 0 ? 'increased' : 'decreased',
        })),
    };
  },
});

/**
 * Analyze if experience should trigger personality evolution
 */
export const analyzeForPersonalityEvolution = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    eventType: v.string(),
    wasPositive: v.boolean(),
    intensity: v.number(),
  },
  handler: async (ctx, args) => {
    // Map event types to evolution triggers
    const triggerMapping: Record<string, { positive: string; negative: string }> = {
      conversation: {
        positive: 'positive_social',
        negative: 'social_rejection',
      },
      conflict: {
        positive: 'successful_conflict_resolution',
        negative: 'conflict_loss',
      },
      quest: {
        positive: 'quest_completion',
        negative: 'repeated_failure',
      },
      betrayal: {
        positive: 'successful_conflict_resolution',
        negative: 'betrayal',
      },
      myth_creation: {
        positive: 'creative_success',
        negative: 'repeated_failure',
      },
    };

    const mapping = triggerMapping[args.eventType];
    if (!mapping) return null;

    const trigger = args.wasPositive ? mapping.positive : mapping.negative;
    const triggerData = EVOLUTION_TRIGGERS[trigger];

    if (!triggerData) return null;

    // Check intensity threshold
    if (args.intensity >= triggerData.threshold * 20) {
      // Multiply by 20 to convert 0-5 threshold to 0-100 scale
      await ctx.runMutation(internal.evolution.personalityEvolution.evolvePersonality, {
        worldId: args.worldId,
        agentId: args.agentId,
        trigger,
        reason: `${args.eventType} (${args.wasPositive ? 'positive' : 'negative'}, intensity ${args.intensity})`,
      });

      return { triggered: true, trigger };
    }

    return { triggered: false };
  },
});
