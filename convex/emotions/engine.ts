import { v } from 'convex/values';
import { internalMutation, internalQuery, MutationCtx, QueryCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { GameId } from '../aiTown/ids';

/**
 * EMOTIONAL ENGINE
 *
 * Core processing for the emotional intelligence system.
 * Handles emotion decay, mood calculation, contagion, and resonance.
 */

// Emotion decay rate (emotions fade over time)
const EMOTION_DECAY_RATE = 0.95;  // Multiply by this each minute
const MOOD_SHIFT_THRESHOLD = 30;   // Emotion must be this strong to shift mood
const CONTAGION_BASE_STRENGTH = 0.3; // Base emotional transfer rate
const RESONANCE_DECAY = 0.98;      // Memory resonance fades over time

// Emotional valence mapping (positive/negative nature of emotions)
const EMOTION_VALENCE = {
  joy: 1.0,
  trust: 0.7,
  anticipation: 0.5,
  surprise: 0.0,    // Neutral - can be good or bad
  sadness: -0.8,
  disgust: -0.6,
  fear: -0.7,
  anger: -0.5,
} as const;

// Emotional arousal mapping (energy level)
const EMOTION_AROUSAL = {
  joy: 0.8,
  anger: 0.9,
  fear: 0.9,
  surprise: 0.95,
  anticipation: 0.7,
  disgust: 0.6,
  trust: 0.4,
  sadness: 0.3,
} as const;

// Mood categories derived from emotional state
interface MoodCategory {
  name: string;
  description: string;
  requiredEmotions: Record<string, number>; // Min intensity required
  valenceRange: [number, number];
  arousalRange: [number, number];
}

const MOOD_CATEGORIES: MoodCategory[] = [
  {
    name: 'euphoric',
    description: 'Overwhelmingly happy and energetic',
    requiredEmotions: { joy: 70 },
    valenceRange: [60, 100],
    arousalRange: [60, 100],
  },
  {
    name: 'content',
    description: 'Peacefully satisfied',
    requiredEmotions: { joy: 40, trust: 30 },
    valenceRange: [30, 100],
    arousalRange: [0, 50],
  },
  {
    name: 'excited',
    description: 'Full of anticipation and energy',
    requiredEmotions: { anticipation: 50 },
    valenceRange: [20, 100],
    arousalRange: [60, 100],
  },
  {
    name: 'anxious',
    description: 'Worried and on edge',
    requiredEmotions: { fear: 50, anticipation: 30 },
    valenceRange: [-100, 0],
    arousalRange: [50, 100],
  },
  {
    name: 'melancholic',
    description: 'Deeply sad and reflective',
    requiredEmotions: { sadness: 60 },
    valenceRange: [-100, -40],
    arousalRange: [0, 40],
  },
  {
    name: 'angry',
    description: 'Filled with frustration or rage',
    requiredEmotions: { anger: 50 },
    valenceRange: [-100, -20],
    arousalRange: [60, 100],
  },
  {
    name: 'suspicious',
    description: 'Distrustful and wary',
    requiredEmotions: { disgust: 40, fear: 30 },
    valenceRange: [-100, -20],
    arousalRange: [30, 70],
  },
  {
    name: 'surprised',
    description: 'Caught off-guard',
    requiredEmotions: { surprise: 60 },
    valenceRange: [-50, 50],
    arousalRange: [70, 100],
  },
  {
    name: 'calm',
    description: 'Emotionally balanced',
    requiredEmotions: {},
    valenceRange: [-20, 20],
    arousalRange: [0, 30],
  },
  {
    name: 'neutral',
    description: 'No strong emotions',
    requiredEmotions: {},
    valenceRange: [-30, 30],
    arousalRange: [20, 50],
  },
];

/**
 * Calculate current mood from emotional state
 */
export function calculateMood(emotions: {
  joy: number;
  sadness: number;
  trust: number;
  disgust: number;
  fear: number;
  anger: number;
  surprise: number;
  anticipation: number;
  valence: number;
  arousal: number;
}): { mood: string; intensity: number } {
  // Score each mood category
  const moodScores = MOOD_CATEGORIES.map((category) => {
    let score = 100;

    // Check required emotions
    for (const [emotion, minIntensity] of Object.entries(category.requiredEmotions)) {
      const emotionValue = emotions[emotion as keyof typeof emotions] as number;
      if (emotionValue < minIntensity) {
        score -= (minIntensity - emotionValue);
      }
    }

    // Check valence range
    if (emotions.valence < category.valenceRange[0] || emotions.valence > category.valenceRange[1]) {
      score -= 30;
    }

    // Check arousal range
    if (emotions.arousal < category.arousalRange[0] || emotions.arousal > category.arousalRange[1]) {
      score -= 20;
    }

    return { category, score: Math.max(0, score) };
  });

  // Find best matching mood
  moodScores.sort((a, b) => b.score - a.score);
  const bestMood = moodScores[0];

  return {
    mood: bestMood.category.name,
    intensity: bestMood.score,
  };
}

/**
 * Calculate valence and arousal from individual emotions
 */
export function calculateEmotionalMetrics(emotions: {
  joy: number;
  sadness: number;
  trust: number;
  disgust: number;
  fear: number;
  anger: number;
  surprise: number;
  anticipation: number;
}): { valence: number; arousal: number; dominance: number } {
  let valence = 0;
  let arousal = 0;
  let totalIntensity = 0;

  for (const [emotion, intensity] of Object.entries(emotions)) {
    const emotionType = emotion as keyof typeof EMOTION_VALENCE;
    valence += EMOTION_VALENCE[emotionType] * intensity;
    arousal += EMOTION_AROUSAL[emotionType] * intensity;
    totalIntensity += intensity;
  }

  // Normalize
  if (totalIntensity > 0) {
    valence = (valence / totalIntensity) * 100;
    arousal = (arousal / totalIntensity) * 100;
  }

  // Dominance is inverse of fear + sadness
  const dominance = 100 - ((emotions.fear + emotions.sadness) / 2);

  return {
    valence: Math.max(-100, Math.min(100, valence)),
    arousal: Math.max(0, Math.min(100, arousal)),
    dominance: Math.max(0, Math.min(100, dominance)),
  };
}

/**
 * Apply emotion decay over time
 */
export function decayEmotions(
  emotions: {
    joy: number;
    sadness: number;
    trust: number;
    disgust: number;
    fear: number;
    anger: number;
    surprise: number;
    anticipation: number;
  },
  minutesElapsed: number,
  emotionalRegulation: number,
): typeof emotions {
  // Higher regulation = faster decay (return to baseline faster)
  const decayRate = Math.pow(EMOTION_DECAY_RATE, minutesElapsed * (1 + emotionalRegulation / 100));

  return {
    joy: emotions.joy * decayRate,
    sadness: emotions.sadness * decayRate,
    trust: emotions.trust * decayRate,
    disgust: emotions.disgust * decayRate,
    fear: emotions.fear * decayRate,
    anger: emotions.anger * decayRate,
    surprise: emotions.surprise * decayRate,
    anticipation: emotions.anticipation * decayRate,
  };
}

/**
 * Blend emotions toward baseline over time
 */
export function blendTowardBaseline(
  current: { [key: string]: number },
  baseline: { [key: string]: number },
  blendFactor: number, // 0-1, higher = faster return to baseline
): typeof current {
  const result: any = {};
  for (const key of Object.keys(current)) {
    result[key] = current[key] * (1 - blendFactor) + baseline[key] * blendFactor;
  }
  return result;
}

/**
 * Calculate emotional contagion strength based on relationship and empathy
 */
export function calculateContagionStrength(
  sourceEmpathy: number,
  targetEmpathy: number,
  relationshipBond: number, // 0-100: strength of relationship
  proximity: number,         // 0-1: physical closeness
): number {
  // Average empathy of both agents
  const avgEmpathy = (sourceEmpathy + targetEmpathy) / 2;

  // Contagion increases with empathy, relationship strength, and proximity
  const strength =
    CONTAGION_BASE_STRENGTH *
    (avgEmpathy / 100) *
    (1 + relationshipBond / 100) *
    proximity;

  return Math.min(1, strength);
}

/**
 * Apply emotional contagion from source to target
 */
export function applyEmotionalContagion(
  targetEmotions: {
    joy: number;
    sadness: number;
    trust: number;
    disgust: number;
    fear: number;
    anger: number;
    surprise: number;
    anticipation: number;
  },
  sourceEmotions: typeof targetEmotions,
  contagionStrength: number,
): typeof targetEmotions {
  const result = { ...targetEmotions };

  // Transfer each emotion based on contagion strength
  for (const emotion of Object.keys(targetEmotions)) {
    const key = emotion as keyof typeof targetEmotions;
    const delta = (sourceEmotions[key] - targetEmotions[key]) * contagionStrength;
    result[key] = Math.max(0, Math.min(100, targetEmotions[key] + delta));
  }

  return result;
}

/**
 * ENHANCEMENT: Calculate how personality traits modulate emotional intensity
 *
 * High neuroticism amplifies negative emotions
 * High agreeableness amplifies positive social emotions
 * High extraversion amplifies high-arousal emotions
 */
function getPersonalityEmotionModifier(
  emotion: string,
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }
): number {
  let modifier = 1.0;

  // Neuroticism amplifies negative emotions (fear, sadness, anger)
  if (emotion === 'fear' || emotion === 'sadness' || emotion === 'anger') {
    // High neuroticism (80+) → 1.3x multiplier
    // Low neuroticism (20-) → 0.7x multiplier
    modifier *= 0.7 + (personality.neuroticism / 100) * 0.6;
  }

  // Neuroticism dampens positive emotions
  if (emotion === 'joy' || emotion === 'trust') {
    modifier *= 1.3 - (personality.neuroticism / 100) * 0.6;
  }

  // Agreeableness amplifies trust and dampens disgust/anger
  if (emotion === 'trust') {
    modifier *= 0.8 + (personality.agreeableness / 100) * 0.4;
  }
  if (emotion === 'disgust' || emotion === 'anger') {
    modifier *= 1.2 - (personality.agreeableness / 100) * 0.4;
  }

  // Extraversion amplifies high-arousal emotions (joy, anger, surprise, anticipation)
  if (emotion === 'joy' || emotion === 'anger' || emotion === 'surprise' || emotion === 'anticipation') {
    modifier *= 0.9 + (personality.extraversion / 100) * 0.3;
  }

  // Openness amplifies surprise and anticipation
  if (emotion === 'surprise' || emotion === 'anticipation') {
    modifier *= 0.9 + (personality.openness / 100) * 0.2;
  }

  // Conscientiousness dampens impulsive emotions (surprise, anger)
  if (emotion === 'surprise' || emotion === 'anger') {
    modifier *= 1.1 - (personality.conscientiousness / 100) * 0.2;
  }

  return Math.max(0.5, Math.min(1.5, modifier)); // Cap between 0.5x and 1.5x
}

/**
 * Trigger emotion in an agent
 */
export const triggerEmotion = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    emotion: v.string(),
    intensity: v.number(),
    cause: v.optional(v.string()),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agentPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentPsych) {
      console.warn(`No psychology record for agent ${args.agentId}`);
      return;
    }

    const now = Date.now();
    const minutesElapsed = (now - agentPsych.emotionalState.lastUpdated) / (1000 * 60);

    // Apply decay to current emotions
    const decayedEmotions = decayEmotions(
      agentPsych.emotionalState,
      minutesElapsed,
      agentPsych.emotionalRegulation,
    );

    // Apply new emotion with personality modulation
    const emotionKey = args.emotion as keyof typeof decayedEmotions;
    if (emotionKey in decayedEmotions) {
      // ENHANCEMENT: Personality affects emotional intensity
      const personalityModifier = getPersonalityEmotionModifier(
        args.emotion,
        agentPsych.personality
      );
      const modulatedIntensity = args.intensity * personalityModifier;

      decayedEmotions[emotionKey] = Math.min(
        100,
        decayedEmotions[emotionKey] + modulatedIntensity,
      );
    }

    // Recalculate metrics
    const metrics = calculateEmotionalMetrics(decayedEmotions);
    const mood = calculateMood({ ...decayedEmotions, ...metrics });

    // Update emotional state
    const newState = {
      ...decayedEmotions,
      ...metrics,
      currentMood: mood.mood,
      moodIntensity: mood.intensity,
      lastUpdated: now,
    };

    await ctx.db.patch(agentPsych._id, {
      emotionalState: newState,
      updatedAt: now,
    });

    // Log significant emotional events
    if (args.intensity > 40) {
      await ctx.db.insert('emotionalEvents', {
        worldId: args.worldId,
        agentId: args.agentId,
        timestamp: now,
        eventType: 'emotion_spike',
        description: `${args.emotion} spiked to ${args.intensity.toFixed(0)} ${args.cause ? `due to ${args.cause}` : ''}`,
        emotionSnapshot: newState,
        triggeredBy: args.cause,
        conversationId: args.conversationId,
      });
    }

    return newState;
  },
});

/**
 * Process emotional contagion between two agents
 */
export const processContagion = internalMutation({
  args: {
    worldId: v.id('worlds'),
    sourceAgentId: v.string(),
    targetAgentId: v.string(),
    proximity: v.number(), // 0-1
    context: v.string(),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get both agents' psychology
    const [sourcePsych, targetPsych] = await Promise.all([
      ctx.db
        .query('agentPsychology')
        .withIndex('agentId', (q) =>
          q.eq('worldId', args.worldId).eq('agentId', args.sourceAgentId),
        )
        .first(),
      ctx.db
        .query('agentPsychology')
        .withIndex('agentId', (q) =>
          q.eq('worldId', args.worldId).eq('agentId', args.targetAgentId),
        )
        .first(),
    ]);

    if (!sourcePsych || !targetPsych) return;

    // Get relationship bond if exists
    const bond = await ctx.db
      .query('emotionalBonds')
      .withIndex('relationship', (q) =>
        q
          .eq('worldId', args.worldId)
          .eq('agent1Id', args.sourceAgentId)
          .eq('agent2Id', args.targetAgentId),
      )
      .first();

    const bondStrength = bond ? (bond.affection + bond.trust) / 2 : 10; // Default weak bond

    // Calculate contagion strength
    const contagionStrength = calculateContagionStrength(
      sourcePsych.empathy,
      targetPsych.empathy,
      bondStrength,
      args.proximity,
    );

    // Apply contagion
    const now = Date.now();
    const minutesElapsed = (now - targetPsych.emotionalState.lastUpdated) / (1000 * 60);
    const decayedEmotions = decayEmotions(
      targetPsych.emotionalState,
      minutesElapsed,
      targetPsych.emotionalRegulation,
    );

    const newEmotions = applyEmotionalContagion(
      decayedEmotions,
      sourcePsych.emotionalState,
      contagionStrength,
    );

    // Recalculate metrics and mood
    const metrics = calculateEmotionalMetrics(newEmotions);
    const mood = calculateMood({ ...newEmotions, ...metrics });

    const newState = {
      ...newEmotions,
      ...metrics,
      currentMood: mood.mood,
      moodIntensity: mood.intensity,
      lastUpdated: now,
    };

    // Update target's emotional state
    await ctx.db.patch(targetPsych._id, {
      emotionalState: newState,
      updatedAt: now,
    });

    // Find the dominant emotion that transferred
    const emotionDiffs = Object.entries(newEmotions).map(([emotion, value]) => ({
      emotion,
      diff: value - decayedEmotions[emotion as keyof typeof decayedEmotions],
    }));
    emotionDiffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    const dominantEmotion = emotionDiffs[0];

    // Log contagion event if significant
    if (Math.abs(dominantEmotion.diff) > 5) {
      await ctx.db.insert('emotionalContagionEvents', {
        worldId: args.worldId,
        sourceAgentId: args.sourceAgentId,
        targetAgentId: args.targetAgentId,
        emotionType: dominantEmotion.emotion as any,
        intensity: Math.abs(dominantEmotion.diff),
        timestamp: now,
        context: args.context,
        conversationId: args.conversationId,
      });
    }

    return { contagionStrength, emotionTransferred: dominantEmotion };
  },
});

/**
 * Update psychological needs over time
 */
export const updateNeeds = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    needChanges: v.object({
      autonomy: v.optional(v.number()),
      competence: v.optional(v.number()),
      relatedness: v.optional(v.number()),
      stimulation: v.optional(v.number()),
      security: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const agentPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentPsych) return;

    const needs = { ...agentPsych.psychologicalNeeds };
    const now = Date.now();

    // Apply changes
    for (const [need, change] of Object.entries(args.needChanges)) {
      if (change !== undefined) {
        const key = need as keyof typeof needs;
        if (key !== 'lastUpdated') {
          needs[key] = Math.max(0, Math.min(100, needs[key] + change));
        }
      }
    }

    needs.lastUpdated = now;

    await ctx.db.patch(agentPsych._id, {
      psychologicalNeeds: needs,
      updatedAt: now,
    });

    // Log critical needs
    for (const [need, value] of Object.entries(needs)) {
      if (need !== 'lastUpdated' && value < 20) {
        await ctx.db.insert('emotionalEvents', {
          worldId: args.worldId,
          agentId: args.agentId,
          timestamp: now,
          eventType: 'need_critical',
          description: `${need} need critically low: ${value.toFixed(0)}`,
          emotionSnapshot: agentPsych.emotionalState,
        });
      }
    }

    return needs;
  },
});

/**
 * Get agent's current emotional state
 */
export const getEmotionalState = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const agentPsych = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (!agentPsych) return null;

    // Apply decay before returning
    const now = Date.now();
    const minutesElapsed = (now - agentPsych.emotionalState.lastUpdated) / (1000 * 60);
    const decayedEmotions = decayEmotions(
      agentPsych.emotionalState,
      minutesElapsed,
      agentPsych.emotionalRegulation,
    );

    const metrics = calculateEmotionalMetrics(decayedEmotions);
    const mood = calculateMood({ ...decayedEmotions, ...metrics });

    return {
      ...agentPsych,
      emotionalState: {
        ...decayedEmotions,
        ...metrics,
        currentMood: mood.mood,
        moodIntensity: mood.intensity,
        lastUpdated: now,
      },
    };
  },
});
