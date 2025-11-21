import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * WEATHER ENGINE (with EMOTIONAL WEATHER - INSPIRED FEATURE)
 *
 * Manages dynamic weather that responds to collective emotional state.
 * Creates a feedback loop: emotions influence weather, weather influences emotions.
 */

// Weather emotional associations
const WEATHER_EMOTIONS = {
  clear: { valence: 15, arousal: 10, primaryEmotion: 'joy' },
  partly_cloudy: { valence: 5, arousal: 0, primaryEmotion: 'trust' },
  cloudy: { valence: -5, arousal: -5, primaryEmotion: 'sadness' },
  overcast: { valence: -10, arousal: -10, primaryEmotion: 'sadness' },
  light_rain: { valence: -5, arousal: -5, primaryEmotion: 'sadness' },
  rain: { valence: -10, arousal: 5, primaryEmotion: 'sadness' },
  storm: { valence: -15, arousal: 20, primaryEmotion: 'fear' },
  fog: { valence: -5, arousal: -15, primaryEmotion: 'fear' },
  snow: { valence: 10, arousal: -10, primaryEmotion: 'surprise' },
  windy: { valence: 0, arousal: 15, primaryEmotion: 'anticipation' },
};

// Emotional state to weather mapping (INSPIRED: Emotional Weather)
const EMOTION_TO_WEATHER: Record<string, { weather: string; threshold: number }> = {
  joy: { weather: 'clear', threshold: 60 },
  sadness: { weather: 'rain', threshold: 55 },
  fear: { weather: 'storm', threshold: 65 },
  anger: { weather: 'storm', threshold: 60 },
  trust: { weather: 'partly_cloudy', threshold: 50 },
  anticipation: { weather: 'windy', threshold: 55 },
  disgust: { weather: 'fog', threshold: 60 },
  surprise: { weather: 'clear', threshold: 50 }, // Sudden change
};

/**
 * Calculate world atmosphere from all agents' emotional states
 */
export const calculateWorldAtmosphere = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get all agent psychology records
    const agentPsychologies = await ctx.db
      .query('agentPsychology')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    if (agentPsychologies.length === 0) {
      return null;
    }

    const now = Date.now();

    // Aggregate emotional metrics
    let totalValence = 0;
    let totalArousal = 0;
    let totalDominance = 0;

    // Count dominant emotions
    const emotionCounts: Record<string, number> = {};
    const emotionIntensities: Record<string, number[]> = {};

    for (const psych of agentPsychologies) {
      const state = psych.emotionalState;

      totalValence += state.valence;
      totalArousal += state.arousal;
      totalDominance += state.dominance;

      // Find agent's dominant emotion
      const emotions = [
        { name: 'joy', value: state.joy },
        { name: 'sadness', value: state.sadness },
        { name: 'trust', value: state.trust },
        { name: 'disgust', value: state.disgust },
        { name: 'fear', value: state.fear },
        { name: 'anger', value: state.anger },
        { name: 'surprise', value: state.surprise },
        { name: 'anticipation', value: state.anticipation },
      ];

      emotions.sort((a, b) => b.value - a.value);
      const dominantEmotion = emotions[0];

      emotionCounts[dominantEmotion.name] = (emotionCounts[dominantEmotion.name] || 0) + 1;
      if (!emotionIntensities[dominantEmotion.name]) {
        emotionIntensities[dominantEmotion.name] = [];
      }
      emotionIntensities[dominantEmotion.name].push(dominantEmotion.value);
    }

    const count = agentPsychologies.length;
    const avgValence = totalValence / count;
    const avgArousal = totalArousal / count;
    const avgDominance = totalDominance / count;

    // Find dominant collective emotion
    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    const dominantEmotion = sortedEmotions[0]?.[0] || 'neutral';

    // Calculate emotional diversity (how spread out emotions are)
    const maxCount = sortedEmotions[0]?.[1] || 1;
    const emotionalDiversity = Math.min(100, ((count - maxCount) / count) * 100);

    // Calculate trend (compare to previous atmosphere)
    const previousAtmosphere = await ctx.db
      .query('worldAtmosphere')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .first();

    let trend = 'stable';
    if (previousAtmosphere) {
      const valenceDiff = avgValence - previousAtmosphere.averageValence;
      if (valenceDiff > 10) trend = 'rising';
      else if (valenceDiff < -10) trend = 'falling';
    }

    // Calculate intensity (how strong is the dominant emotion)
    const avgIntensity = dominantEmotion in emotionIntensities
      ? emotionIntensities[dominantEmotion].reduce((a, b) => a + b, 0) /
        emotionIntensities[dominantEmotion].length
      : 50;

    // Store atmosphere
    await ctx.db.insert('worldAtmosphere', {
      worldId: args.worldId,
      averageValence: avgValence,
      averageArousal: avgArousal,
      averageDominance: avgDominance,
      dominantEmotion,
      emotionalDiversity,
      trend,
      intensity: avgIntensity,
      calculatedAt: now,
    });

    return {
      avgValence,
      avgArousal,
      dominantEmotion,
      intensity: avgIntensity,
      trend,
    };
  },
});

/**
 * INSPIRED: Determine weather based on collective emotional state
 */
export function determineEmotionalWeather(
  dominantEmotion: string,
  intensity: number,
  valence: number,
  arousal: number,
): { weather: string; emotionallyDriven: boolean } {
  // Check if emotion is strong enough to influence weather
  const emotionMapping = EMOTION_TO_WEATHER[dominantEmotion];

  if (!emotionMapping) {
    return { weather: 'partly_cloudy', emotionallyDriven: false };
  }

  // Emotion must be intense enough to affect weather
  if (intensity < emotionMapping.threshold) {
    return { weather: 'partly_cloudy', emotionallyDriven: false };
  }

  // Strong emotion influences weather
  let weather = emotionMapping.weather;

  // Arousal affects intensity
  if (arousal > 70 && weather === 'rain') {
    weather = 'storm'; // High arousal intensifies
  } else if (arousal < 30 && weather === 'rain') {
    weather = 'light_rain'; // Low arousal softens
  }

  // Valence fine-tuning
  if (valence > 40 && weather === 'cloudy') {
    weather = 'partly_cloudy'; // Positive bias lightens
  } else if (valence < -40 && weather === 'cloudy') {
    weather = 'overcast'; // Negative bias darkens
  }

  return { weather, emotionallyDriven: true };
}

/**
 * Initialize world weather
 */
export const initializeWorldWeather = internalMutation({
  args: {
    worldId: v.id('worlds'),
    initialWeather: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('worldWeather')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const weather = (args.initialWeather || 'partly_cloudy') as any;

    const worldWeather = await ctx.db.insert('worldWeather', {
      worldId: args.worldId,
      currentWeather: weather,
      weatherIntensity: 50,
      emotionalInfluence: 30, // 30% emotion influence by default
      nextWeather: 'partly_cloudy' as any,
      transitionProgress: 0,
      weatherStartTime: now,
      weatherDuration: 15 * 60 * 1000, // 15 minutes
      recentWeather: [{ weather, timestamp: now, emotionalInfluence: false }],
      lastUpdated: now,
    });

    await ctx.db.insert('worldEvents', {
      worldId: args.worldId,
      timestamp: now,
      eventType: 'weather_initialized',
      description: `Weather initialized: ${weather}`,
    });

    return worldWeather;
  },
});

/**
 * Update world weather (considers emotional influence)
 */
export const updateWorldWeather = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const worldWeather = await ctx.db
      .query('worldWeather')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (!worldWeather) {
      throw new Error(`World weather not initialized for ${args.worldId}`);
    }

    const now = Date.now();
    const timeSinceWeatherChange = now - worldWeather.weatherStartTime;

    // Check if it's time for weather transition
    if (timeSinceWeatherChange < worldWeather.weatherDuration) {
      // Still in current weather, just update progress
      const progress = timeSinceWeatherChange / worldWeather.weatherDuration;
      await ctx.db.patch(worldWeather._id, {
        transitionProgress: progress,
        lastUpdated: now,
      });
      return { weatherChanged: false };
    }

    // Time to change weather
    // INSPIRED: Check emotional influence
    const atmosphere = await ctx.db
      .query('worldAtmosphere')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .first();

    let newWeather: string;
    let emotionallyDriven = false;

    // Roll for emotional influence
    const emotionInfluenceRoll = Math.random() * 100;

    if (atmosphere && emotionInfluenceRoll < worldWeather.emotionalInfluence) {
      // EMOTIONAL WEATHER TRIGGERED
      const emotionalWeatherResult = determineEmotionalWeather(
        atmosphere.dominantEmotion,
        atmosphere.intensity,
        atmosphere.averageValence,
        atmosphere.averageArousal,
      );

      newWeather = emotionalWeatherResult.weather;
      emotionallyDriven = emotionalWeatherResult.emotionallyDriven;

      console.log(
        `🌥️ EMOTIONAL WEATHER: ${atmosphere.dominantEmotion} (${atmosphere.intensity.toFixed(0)}) → ${newWeather}`,
      );
    } else {
      // Natural weather progression
      newWeather = generateNaturalWeather(worldWeather.currentWeather, worldWeather.recentWeather);
    }

    // Update weather
    const newDuration = (10 + Math.random() * 20) * 60 * 1000; // 10-30 minutes
    const recentWeather = [
      ...worldWeather.recentWeather.slice(-4), // Keep last 4
      {
        weather: newWeather as any,
        timestamp: now,
        emotionalInfluence: emotionallyDriven,
      },
    ];

    await ctx.db.patch(worldWeather._id, {
      currentWeather: newWeather as any,
      weatherStartTime: now,
      weatherDuration: newDuration,
      transitionProgress: 0,
      recentWeather,
      lastUpdated: now,
    });

    // Log weather change
    await ctx.db.insert('worldEvents', {
      worldId: args.worldId,
      timestamp: now,
      eventType: 'weather_change',
      description: emotionallyDriven
        ? `Weather changed to ${newWeather} (emotionally driven by ${atmosphere?.dominantEmotion})`
        : `Weather changed to ${newWeather} (natural)`,
      emotionallyDriven,
      triggeringEmotion: emotionallyDriven ? atmosphere?.dominantEmotion : undefined,
    });

    return {
      weatherChanged: true,
      newWeather,
      emotionallyDriven,
      triggeringEmotion: emotionallyDriven ? atmosphere?.dominantEmotion : undefined,
    };
  },
});

/**
 * Generate natural weather progression (without emotional influence)
 */
function generateNaturalWeather(currentWeather: string, recentWeather: any[]): string {
  // Weather tends to persist or change gradually
  const transitions: Record<string, string[]> = {
    clear: ['clear', 'clear', 'partly_cloudy', 'windy'],
    partly_cloudy: ['clear', 'partly_cloudy', 'cloudy', 'windy'],
    cloudy: ['partly_cloudy', 'cloudy', 'overcast', 'light_rain'],
    overcast: ['cloudy', 'overcast', 'rain', 'fog'],
    light_rain: ['cloudy', 'light_rain', 'rain', 'partly_cloudy'],
    rain: ['light_rain', 'rain', 'storm', 'overcast'],
    storm: ['rain', 'storm', 'rain', 'overcast'],
    fog: ['fog', 'overcast', 'cloudy', 'partly_cloudy'],
    snow: ['snow', 'cloudy', 'clear', 'partly_cloudy'],
    windy: ['windy', 'partly_cloudy', 'clear', 'cloudy'],
  };

  const possibleNext = transitions[currentWeather] || ['partly_cloudy', 'clear', 'cloudy'];
  return possibleNext[Math.floor(Math.random() * possibleNext.length)];
}

/**
 * Get weather emotional effects
 */
export function getWeatherEmotionalEffects(weather: string, intensity: number = 50): {
  valence: number;
  arousal: number;
  emotions: Array<{ emotion: string; change: number }>;
} {
  const baseEffect = WEATHER_EMOTIONS[weather as keyof typeof WEATHER_EMOTIONS] || {
    valence: 0,
    arousal: 0,
    primaryEmotion: 'trust',
  };

  // Scale by intensity
  const scale = intensity / 50; // 50 is baseline

  return {
    valence: baseEffect.valence * scale,
    arousal: baseEffect.arousal * scale,
    emotions: [{ emotion: baseEffect.primaryEmotion, change: 10 * scale }],
  };
}

/**
 * Get current world weather
 */
export const getWorldWeather = internalQuery({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const worldWeather = await ctx.db
      .query('worldWeather')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    return worldWeather;
  },
});
