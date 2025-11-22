import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { agentId } from '../aiTown/ids';
import * as embeddingsCache from '../agent/embeddingsCache';

/**
 * MEMORY RESONANCE SYSTEM (INSPIRED FEATURE)
 *
 * Memories aren't just stored - they RESONATE with current emotional states.
 * When an agent feels a similar emotion, past memories with that emotion can
 * spontaneously surface, creating psychological depth and continuity.
 *
 * This creates emergent behaviors:
 * - Trauma responses (past fear triggers current fear)
 * - Nostalgia (joy memories surface during joyful moments)
 * - Pattern recognition (similar emotional contexts trigger relevant memories)
 * - Emotional learning (past emotional outcomes influence current decisions)
 */

/**
 * Calculate emotional similarity between two emotional states
 * Returns 0-1 (1 = identical emotions)
 */
function calculateEmotionalSimilarity(
  state1: {
    joy: number;
    sadness: number;
    trust: number;
    disgust: number;
    fear: number;
    anger: number;
    surprise: number;
    anticipation: number;
  },
  state2: typeof state1,
): number {
  let totalDifference = 0;
  let totalIntensity = 0;

  for (const emotion of Object.keys(state1)) {
    const key = emotion as keyof typeof state1;
    const diff = Math.abs(state1[key] - state2[key]);
    const avgIntensity = (state1[key] + state2[key]) / 2;

    // Weight by average intensity (stronger emotions matter more)
    totalDifference += diff * avgIntensity;
    totalIntensity += avgIntensity * 100;
  }

  if (totalIntensity === 0) return 0;

  // Convert to 0-1 similarity score
  const similarity = 1 - totalDifference / totalIntensity;
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Tag a memory with emotional context
 */
export const tagMemoryWithEmotion = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    memoryId: v.id('memories'),
    emotionType: v.string(),
    intensity: v.number(),
    valence: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate resonance threshold based on intensity
    // Stronger emotions = more easily triggered later
    const resonanceThreshold = 100 - args.intensity;

    await ctx.db.insert('emotionalMemories', {
      worldId: args.worldId,
      agentId: args.agentId,
      memoryId: args.memoryId,
      emotionType: args.emotionType as any,
      intensity: args.intensity,
      valence: args.valence,
      resonanceThreshold,
      timesTriggered: 0,
      created: now,
    });

    console.log(
      `Tagged memory ${args.memoryId} with ${args.emotionType} (intensity: ${args.intensity})`,
    );
  },
});

/**
 * Find memories that resonate with current emotional state
 */
export const findResonantMemories = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    currentEmotionalState: v.object({
      joy: v.number(),
      sadness: v.number(),
      trust: v.number(),
      disgust: v.number(),
      fear: v.number(),
      anger: v.number(),
      surprise: v.number(),
      anticipation: v.number(),
    }),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get all emotional memories for this agent
    const emotionalMemories = await ctx.db
      .query('emotionalMemories')
      .withIndex('agentMemories', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .collect();

    // Get agent's current psychology to reconstruct emotional states
    const agentPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentPsych || emotionalMemories.length === 0) {
      return [];
    }

    // Score each memory by resonance
    const scoredMemories = await Promise.all(
      emotionalMemories.map(async (emotionalMemory) => {
        // Get the actual memory
        const memory = await ctx.db.get(emotionalMemory.memoryId);
        if (!memory) return null;

        // Calculate emotional similarity
        // For simplicity, create a simplified emotional state from the memory
        const memoryEmotionalState = { ...agentPsych.emotionalBaseline };
        const emotionKey = emotionalMemory.emotionType as keyof typeof memoryEmotionalState;
        if (emotionKey in memoryEmotionalState) {
          memoryEmotionalState[emotionKey] = emotionalMemory.intensity;
        }

        const similarity = calculateEmotionalSimilarity(
          args.currentEmotionalState,
          memoryEmotionalState,
        );

        // Resonance score combines similarity, intensity, and how often it's been triggered
        // Memories that have been triggered multiple times have stronger resonance
        const recencyBonus = Math.max(0, 1 - (Date.now() - emotionalMemory.created) / (30 * 24 * 60 * 60 * 1000)); // Decay over 30 days
        const triggerBonus = Math.min(1, emotionalMemory.timesTriggered / 10); // Cap at 10 triggers

        const resonanceScore =
          similarity * emotionalMemory.intensity * (1 + triggerBonus * 0.5) * (1 + recencyBonus * 0.3);

        // Only include if above threshold
        if (resonanceScore > emotionalMemory.resonanceThreshold) {
          return {
            memory,
            emotionalMemory,
            resonanceScore,
            similarity,
          };
        }

        return null;
      }),
    );

    // Filter nulls and sort by resonance score
    const validMemories = scoredMemories.filter((m) => m !== null);
    validMemories.sort((a, b) => b!.resonanceScore - a!.resonanceScore);

    return validMemories.slice(0, limit);
  },
});

/**
 * Trigger a memory resonance (marks that memory was recalled)
 */
export const triggerMemoryResonance = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    memoryId: v.id('memories'),
  },
  handler: async (ctx, args) => {
    // Find the emotional memory
    const emotionalMemory = await ctx.db
      .query('emotionalMemories')
      .withIndex('memoryId', (q) => q.eq('memoryId', args.memoryId))
      .first();

    if (!emotionalMemory) return;

    const now = Date.now();

    // Update trigger count and timestamp
    await ctx.db.patch(emotionalMemory._id, {
      timesTriggered: emotionalMemory.timesTriggered + 1,
      lastTriggered: now,
    });

    // Log the resonance event
    await ctx.db.insert('emotionalEvents', {
      worldId: args.worldId,
      agentId: args.agentId,
      timestamp: now,
      eventType: 'memory_resonance',
      description: `Memory resonated: triggered ${emotionalMemory.emotionType} (${emotionalMemory.timesTriggered + 1} times total)`,
      emotionSnapshot: (
        await ctx.db
          .query('agentPsychology')
          .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
          .first()
      )!.emotionalState,
    });

    console.log(
      `Memory ${args.memoryId} resonated for agent ${args.agentId} (${emotionalMemory.timesTriggered + 1} times)`,
    );
  },
});

/**
 * Analyze emotional patterns in memories
 * Returns insights about an agent's emotional history
 */
export const analyzeEmotionalPatterns = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const emotionalMemories = await ctx.db
      .query('emotionalMemories')
      .withIndex('agentMemories', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .collect();

    if (emotionalMemories.length === 0) {
      return {
        totalMemories: 0,
        dominantEmotions: [],
        averageValence: 0,
        traumaticMemories: [],
        joyfulMemories: [],
      };
    }

    // Count emotions
    const emotionCounts: Record<string, number> = {};
    const emotionIntensities: Record<string, number[]> = {};
    let totalValence = 0;

    for (const mem of emotionalMemories) {
      emotionCounts[mem.emotionType] = (emotionCounts[mem.emotionType] || 0) + 1;
      if (!emotionIntensities[mem.emotionType]) {
        emotionIntensities[mem.emotionType] = [];
      }
      emotionIntensities[mem.emotionType].push(mem.intensity);
      totalValence += mem.valence;
    }

    // Find dominant emotions
    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({
        emotion,
        count,
        averageIntensity:
          emotionIntensities[emotion].reduce((a, b) => a + b, 0) /
          emotionIntensities[emotion].length,
      }));

    // Find traumatic memories (negative, high intensity, frequently triggered)
    const traumaticMemories = emotionalMemories
      .filter((m) => m.valence < -50 && m.intensity > 60)
      .sort((a, b) => b.timesTriggered - a.timesTriggered)
      .slice(0, 3);

    // Find joyful memories (positive, high intensity)
    const joyfulMemories = emotionalMemories
      .filter((m) => m.valence > 50 && m.intensity > 60)
      .sort((a, b) => b.timesTriggered - a.timesTriggered)
      .slice(0, 3);

    return {
      totalMemories: emotionalMemories.length,
      dominantEmotions,
      averageValence: totalValence / emotionalMemories.length,
      traumaticMemories: traumaticMemories.map((m) => ({
        memoryId: m.memoryId,
        emotion: m.emotionType,
        intensity: m.intensity,
        timesTriggered: m.timesTriggered,
      })),
      joyfulMemories: joyfulMemories.map((m) => ({
        memoryId: m.memoryId,
        emotion: m.emotionType,
        intensity: m.intensity,
        timesTriggered: m.timesTriggered,
      })),
    };
  },
});

/**
 * Apply emotional learning from past memories
 * Returns suggested emotion changes based on similar past experiences
 */
export const applyEmotionalLearning = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    context: v.string(), // e.g., "starting conversation with Alice"
    currentEmotions: v.object({
      joy: v.number(),
      sadness: v.number(),
      trust: v.number(),
      disgust: v.number(),
      fear: v.number(),
      anger: v.number(),
      surprise: v.number(),
      anticipation: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Find memories with similar context
    const emotionalMemories = await ctx.db
      .query('emotionalMemories')
      .withIndex('agentMemories', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .collect();

    // Get actual memories and filter by context similarity
    const relevantMemories = await Promise.all(
      emotionalMemories.map(async (emotionalMemory) => {
        const memory = await ctx.db.get(emotionalMemory.memoryId);
        if (!memory) return null;

        // Simple context matching (in production, use embeddings)
        const contextWords = args.context.toLowerCase().split(' ');
        const memoryText = memory.description.toLowerCase();
        const matches = contextWords.filter((word) => memoryText.includes(word)).length;

        if (matches > 0) {
          return { emotionalMemory, memory, contextMatches: matches };
        }
        return null;
      }),
    );

    const validMemories = relevantMemories.filter((m) => m !== null);

    if (validMemories.length === 0) {
      return { suggestion: null, confidence: 0 };
    }

    // Aggregate emotional outcomes from similar past experiences
    const emotionalLearning: Record<string, number[]> = {};

    for (const mem of validMemories) {
      const emotion = mem!.emotionalMemory.emotionType;
      if (!emotionalLearning[emotion]) {
        emotionalLearning[emotion] = [];
      }
      // Weight by valence (positive outcomes reinforce, negative teach avoidance)
      emotionalLearning[emotion].push(
        mem!.emotionalMemory.intensity * (mem!.emotionalMemory.valence / 100),
      );
    }

    // Calculate suggested emotional adjustments
    const suggestions: Array<{ emotion: string; adjustment: number }> = [];

    for (const [emotion, intensities] of Object.entries(emotionalLearning)) {
      const avgAdjustment = intensities.reduce((a, b) => a + b, 0) / intensities.length;
      suggestions.push({ emotion, adjustment: avgAdjustment });
    }

    // Confidence based on number of relevant memories
    const confidence = Math.min(100, (validMemories.length / 5) * 100);

    return {
      suggestion: suggestions.length > 0 ? suggestions[0] : null,
      allSuggestions: suggestions,
      confidence,
      relevantMemoryCount: validMemories.length,
    };
  },
});
