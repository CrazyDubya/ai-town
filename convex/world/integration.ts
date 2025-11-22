import { v } from 'convex/values';
import { internalMutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * WORLD INTEGRATION
 *
 * Ties time, weather, resources, and emotions together.
 * Periodically updates world state and applies effects to all agents.
 */

/**
 * Initialize all world systems for a new world
 */
export const initializeWorldSystems = internalMutation({
  args: {
    worldId: v.id('worlds'),
    timeScale: v.optional(v.number()),
    startHour: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Initialize time
    await ctx.runMutation(internal.world.timeEngine.initializeWorldTime, {
      worldId: args.worldId,
      timeScale: args.timeScale || 10.0,
      startHour: args.startHour || 9,
    });

    // Initialize weather
    await ctx.runMutation(internal.world.weatherEngine.initializeWorldWeather, {
      worldId: args.worldId,
      initialWeather: 'partly_cloudy',
    });

    console.log(`Initialized world systems for ${args.worldId}`);
  },
});

/**
 * World tick - updates all world systems
 * Should be called periodically (e.g., every minute)
 */
export const worldTick = internalAction({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // 1. Update time
    const timeResult = await ctx.runMutation(internal.world.timeEngine.updateWorldTime, {
      worldId: args.worldId,
    });

    // 2. Calculate atmosphere from agent emotions
    const atmosphere = await ctx.runMutation(internal.world.weatherEngine.calculateWorldAtmosphere, {
      worldId: args.worldId,
    });

    // 3. Update weather (considers emotional influence)
    const weatherResult = await ctx.runMutation(internal.world.weatherEngine.updateWorldWeather, {
      worldId: args.worldId,
    });

    // 4. Apply environmental effects to all agents
    await ctx.runMutation(internal.world.integration.applyEnvironmentalEffects, {
      worldId: args.worldId,
      timeChanged: timeResult.timeChanged,
      weatherChanged: weatherResult.weatherChanged,
    });

    return {
      timeResult,
      atmosphere,
      weatherResult,
    };
  },
});

/**
 * Apply environmental effects (time, weather) to all agents' emotions
 */
export const applyEnvironmentalEffects = internalMutation({
  args: {
    worldId: v.id('worlds'),
    timeChanged: v.boolean(),
    weatherChanged: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.timeChanged && !args.weatherChanged) {
      return; // No environmental changes to apply
    }

    // Get world state
    const worldTime = await ctx.db
      .query('worldTime')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    const worldWeather = await ctx.db
      .query('worldWeather')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (!worldTime || !worldWeather) {
      return;
    }

    // Get all agents
    const world = await ctx.db.get(args.worldId);
    if (!world) return;

    // OPTIMIZATION: Batch-process environmental effects
    // Calculate all emotion changes first, then apply in parallel

    // Calculate environmental emotion changes (same for all agents)
    const environmentalEmotions: Array<{ emotion: string; intensity: number }> = [];

    if (args.timeChanged) {
      const timeEffects = getTimeOfDayEmotionalModifiers(worldTime.timeOfDay);
      environmentalEmotions.push(...timeEffects.emotions.map((e) => ({
        emotion: e.emotion,
        intensity: e.change,
      })));
    }

    const weatherEffects = getWeatherEmotionalEffects(
      worldWeather.currentWeather,
      worldWeather.weatherIntensity,
    );
    environmentalEmotions.push(...weatherEffects.emotions.map((e) => ({
      emotion: e.emotion,
      intensity: e.change,
    })));

    // Batch all emotion trigger operations
    const emotionTriggers: Promise<any>[] = [];

    for (const agent of world.agents) {
      // Apply each environmental emotion change to this agent
      for (const change of environmentalEmotions) {
        if (change.intensity !== 0) {
          emotionTriggers.push(
            ctx.runMutation(internal.emotions.engine.triggerEmotion, {
              worldId: args.worldId,
              agentId: agent.id,
              emotion: change.emotion,
              intensity: Math.abs(change.intensity),
              cause: args.timeChanged
                ? `time_of_day_${worldTime.timeOfDay}`
                : `weather_${worldWeather.currentWeather}`,
            }).catch((e) => {
              console.log(`Could not apply environmental effect to agent ${agent.id}:`, e);
            })
          );
        }
      }
    }

    // Execute all emotion triggers in parallel
    await Promise.all(emotionTriggers);

    console.log(
      `Applied environmental effects to ${world.agents.length} agents (time: ${worldTime.timeOfDay}, weather: ${worldWeather.currentWeather})`,
    );
  },
});

/**
 * Update agent resources over time
 * Should be called periodically for each active agent
 */
export const updateAgentResourcesTick = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get agent's current activity
    const world = await ctx.runQuery(internal.aiTown.game.loadWorld, {
      worldId: args.worldId,
      generationNumber: undefined,
    });

    // Determine activity type
    let activityType = 'idle';
    let inConversation = false;

    if (world && world.gameState) {
      const agent = world.gameState.agents.find((a: any) => a.id === args.agentId);
      if (agent) {
        const player = world.gameState.players.find((p: any) => p.id === agent.playerId);
        if (player) {
          if (player.pathfinding) {
            activityType = 'walking';
          } else if (player.activity) {
            activityType = 'activity';
          }

          // Check if in conversation
          const conversations = world.gameState.conversations || [];
          inConversation = conversations.some((c: any) =>
            c.participants?.some((p: any) => p.playerId === agent.playerId),
          );

          if (inConversation) {
            activityType = 'conversing';
          }
        }
      }
    }

    // Update resources
    await ctx.runMutation(internal.world.resourceEngine.updateAgentResources, {
      worldId: args.worldId,
      agentId: args.agentId,
      activityType,
      inConversation,
    });
  },
});

// Helper functions (imported from engines)
import { getTimeOfDayEmotionalModifiers } from './timeEngine';
import { getWeatherEmotionalEffects } from './weatherEngine';
