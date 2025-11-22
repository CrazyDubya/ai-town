import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { agentId, playerId } from '../aiTown/ids';
import { calculateCircadianEnergy } from './timeEngine';

/**
 * RESOURCE ENGINE
 *
 * Manages agent resources: energy, rest, nourishment, and social battery.
 * Resources drain over time and activities, creating needs that drive behavior.
 */

// Resource drain rates (per minute)
const DRAIN_RATES = {
  energy: {
    idle: 0.5,
    walking: 1.0,
    conversing: 0.8,
    activity: 1.5,
  },
  restfulness: {
    awake: 1.0,
    tired: 1.5,
  },
  nourishment: {
    base: 0.3,
  },
  socialBattery: {
    introvert_alone: -1.0, // Recharges when alone
    introvert_social: 2.0, // Drains in social situations
    extrovert_alone: 1.0, // Drains when alone
    extrovert_social: -1.5, // Recharges in social situations
    neutral_social: 0.5, // Slight drain
  },
};

/**
 * Generate circadian rhythm based on personality
 */
export function generateCircadianRhythm(personality: {
  extraversion: number;
  conscientiousness: number;
  neuroticism: number;
}): {
  chronotype: string;
  sleepSchedule: { bedtime: number; wakeTime: number; hoursNeeded: number };
  peakEnergyTime: string;
  napTime?: string;
} {
  // Extraversion + low neuroticism → night owl
  // Conscientiousness + low extraversion → morning lark

  let chronotype = 'neutral';
  let bedtime = 23;
  let wakeTime = 7;
  let hoursNeeded = 8;
  let peakEnergyTime = 'afternoon';
  let napTime: string | undefined;

  if (personality.conscientiousness > 70 && personality.extraversion < 50) {
    // Morning lark
    chronotype = 'morning_lark';
    bedtime = 22;
    wakeTime = 6;
    peakEnergyTime = 'morning';
  } else if (personality.extraversion > 70 && personality.neuroticism < 40) {
    // Night owl
    chronotype = 'night_owl';
    bedtime = 1; // 1am
    wakeTime = 9;
    peakEnergyTime = 'night';
  }

  // Neuroticism affects sleep needs
  if (personality.neuroticism > 70) {
    hoursNeeded = 9; // Need more sleep
  } else if (personality.neuroticism < 30) {
    hoursNeeded = 7; // Need less sleep
  }

  // Some agents take naps
  if (personality.conscientiousness < 50 && Math.random() > 0.5) {
    napTime = 'afternoon';
  }

  return {
    chronotype,
    sleepSchedule: { bedtime, wakeTime, hoursNeeded },
    peakEnergyTime,
    napTime,
  };
}

/**
 * Initialize agent resources
 */
export const initializeAgentResources = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    playerId: playerId,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('agentResources')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (existing) {
      return existing;
    }

    // Get agent's personality
    const agentPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentPsych) {
      throw new Error(`No psychology found for agent ${args.agentId}`);
    }

    const circadian = generateCircadianRhythm(agentPsych.personality);
    const now = Date.now();

    const resources = await ctx.db.insert('agentResources', {
      worldId: args.worldId,
      agentId: args.agentId,
      playerId: args.playerId,
      resources: {
        energy: 80,
        restfulness: 90,
        nourishment: 75,
        socialBattery: agentPsych.personality.extraversion, // Start at personality baseline
        lastUpdated: now,
      },
      circadian,
      createdAt: now,
      updatedAt: now,
    });

    console.log(
      `Initialized resources for agent ${args.agentId} (${circadian.chronotype})`,
    );

    return resources;
  },
});

/**
 * Update agent resources over time
 */
export const updateAgentResources = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    activityType: v.optional(v.string()), // "idle", "walking", "conversing", "activity", "sleeping"
    inConversation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agentResources = await ctx.db
      .query('agentResources')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentResources) {
      throw new Error(`No resources found for agent ${args.agentId}`);
    }

    // Get world time
    const worldTime = await ctx.db
      .query('worldTime')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (!worldTime) {
      return; // Time not initialized yet
    }

    const now = Date.now();
    const minutesElapsed = (now - agentResources.resources.lastUpdated) / (1000 * 60);

    // Calculate circadian energy
    const circadianEnergy = calculateCircadianEnergy(
      worldTime.hour,
      agentResources.circadian.chronotype,
    );

    // Calculate resource changes
    const activityType = args.activityType || 'idle';
    let energyDrain = DRAIN_RATES.energy[activityType as keyof typeof DRAIN_RATES.energy] || DRAIN_RATES.energy.idle;
    let restfulnessDrain = DRAIN_RATES.restfulness.awake;
    let nourishmentDrain = DRAIN_RATES.nourishment.base;

    // Get agent personality for social battery
    const agentPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    let socialBatteryChange = 0;

    if (agentPsych) {
      const extraversion = agentPsych.personality.extraversion;
      const inSocialSituation = args.inConversation || false;

      if (extraversion > 65) {
        // Extrovert
        socialBatteryChange = inSocialSituation
          ? DRAIN_RATES.socialBattery.extrovert_social
          : DRAIN_RATES.socialBattery.extrovert_alone;
      } else if (extraversion < 35) {
        // Introvert
        socialBatteryChange = inSocialSituation
          ? DRAIN_RATES.socialBattery.introvert_social
          : DRAIN_RATES.socialBattery.introvert_alone;
      } else {
        // Neutral
        socialBatteryChange = inSocialSituation ? DRAIN_RATES.socialBattery.neutral_social : 0;
      }
    }

    // Apply changes
    const resources = agentResources.resources;
    let newEnergy = resources.energy - energyDrain * minutesElapsed;
    let newRestfulness = resources.restfulness - restfulnessDrain * minutesElapsed;
    let newNourishment = resources.nourishment - nourishmentDrain * minutesElapsed;
    let newSocialBattery = resources.socialBattery + socialBatteryChange * minutesElapsed;

    // Circadian influence on energy
    // Energy gradually moves toward circadian level
    const circadianInfluence = 0.1 * minutesElapsed;
    newEnergy = newEnergy * (1 - circadianInfluence) + circadianEnergy * circadianInfluence;

    // Clamp values
    newEnergy = Math.max(0, Math.min(100, newEnergy));
    newRestfulness = Math.max(0, Math.min(100, newRestfulness));
    newNourishment = Math.max(0, Math.min(100, newNourishment));
    newSocialBattery = Math.max(0, Math.min(100, newSocialBattery));

    // Update resources
    await ctx.db.patch(agentResources._id, {
      resources: {
        energy: newEnergy,
        restfulness: newRestfulness,
        nourishment: newNourishment,
        socialBattery: newSocialBattery,
        lastUpdated: now,
      },
      updatedAt: now,
    });

    // Trigger needs-based emotions if resources are critical
    if (newEnergy < 20 || newRestfulness < 20 || newNourishment < 30 || newSocialBattery < 25) {
      // Update psychological needs based on resources
      const needChanges: any = {};

      if (newNourishment < 30) needChanges.security = -10;
      if (newEnergy < 20 || newRestfulness < 20) needChanges.autonomy = -10;
      if (newSocialBattery < 25) {
        if (agentPsych && agentPsych.personality.extraversion > 65) {
          needChanges.relatedness = -15; // Extroverts need social connection
        }
      }

      if (Object.keys(needChanges).length > 0) {
        try {
          await ctx.runMutation(internal.emotions.engine.updateNeeds, {
            worldId: args.worldId,
            agentId: args.agentId,
            needChanges,
          });
        } catch (e) {
          console.log('Could not update needs:', e);
        }
      }
    }

    return {
      energy: newEnergy,
      restfulness: newRestfulness,
      nourishment: newNourishment,
      socialBattery: newSocialBattery,
    };
  },
});

/**
 * Restore agent resources (eating, resting, etc.)
 */
export const restoreAgentResource = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    resourceType: v.string(), // "energy", "restfulness", "nourishment", "socialBattery"
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const agentResources = await ctx.db
      .query('agentResources')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentResources) {
      return;
    }

    const resources = { ...agentResources.resources };
    const now = Date.now();

    // Restore resource
    switch (args.resourceType) {
      case 'energy':
        resources.energy = Math.min(100, resources.energy + args.amount);
        break;
      case 'restfulness':
        resources.restfulness = Math.min(100, resources.restfulness + args.amount);
        break;
      case 'nourishment':
        resources.nourishment = Math.min(100, resources.nourishment + args.amount);
        break;
      case 'socialBattery':
        resources.socialBattery = Math.min(100, resources.socialBattery + args.amount);
        break;
    }

    resources.lastUpdated = now;

    await ctx.db.patch(agentResources._id, {
      resources,
      updatedAt: now,
    });

    return resources;
  },
});

/**
 * Get agent resources
 */
export const getAgentResources = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const agentResources = await ctx.db
      .query('agentResources')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    return agentResources;
  },
});

import { internal } from '../_generated/api';
