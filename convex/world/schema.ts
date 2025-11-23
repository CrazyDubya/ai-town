import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * PHASE 2: DYNAMIC LIVING WORLD
 *
 * Time cycles, weather systems, resource economy, and circadian rhythms
 * that make the world feel alive and responsive to agent behavior.
 */

// Time of day affects mood, energy, and behavior
export const TimeOfDay = v.union(
  v.literal('dawn'),      // 5-7am: Peaceful, reflective
  v.literal('morning'),   // 7am-12pm: Energetic, productive
  v.literal('afternoon'), // 12-5pm: Social, active
  v.literal('dusk'),      // 5-7pm: Contemplative, winding down
  v.literal('night'),     // 7pm-5am: Quiet, intimate, rest
);

// Weather types with emotional associations
export const WeatherType = v.union(
  v.literal('clear'),          // Positive, energizing
  v.literal('partly_cloudy'),  // Neutral
  v.literal('cloudy'),         // Slightly somber
  v.literal('overcast'),       // Melancholic
  v.literal('light_rain'),     // Contemplative, cozy
  v.literal('rain'),           // Somber, introspective
  v.literal('storm'),          // Intense, anxious
  v.literal('fog'),            // Mysterious, subdued
  v.literal('snow'),           // Peaceful, magical (if applicable)
  v.literal('windy'),          // Restless, energetic
);

// Agent resource levels
export const agentResources = v.object({
  energy: v.number(),          // 0-100: Physical/mental energy
  restfulness: v.number(),     // 0-100: How rested they feel
  nourishment: v.number(),     // 0-100: Food/sustenance
  socialBattery: v.number(),   // 0-100: Social energy (introverts drain, extroverts charge)
  lastUpdated: v.number(),
});

// Circadian rhythm state
export const circadianState = v.object({
  peakEnergyTime: v.string(),  // Time of day when most energetic
  napTime: v.optional(v.string()), // Preferred nap time
  sleepSchedule: v.object({
    bedtime: v.number(),         // Hour (0-23)
    wakeTime: v.number(),        // Hour (0-23)
    hoursNeeded: v.number(),     // 6-10 hours
  }),
  chronotype: v.string(),        // "morning_lark", "night_owl", "neutral"
});

// World atmosphere - collective emotional state
export const worldAtmosphere = v.object({
  // Aggregate emotional metrics
  averageValence: v.number(),    // -100 to 100
  averageArousal: v.number(),    // 0-100
  averageDominance: v.number(),  // 0-100

  // Dominant collective emotions
  dominantEmotion: v.string(),   // Most common emotion across agents
  emotionalDiversity: v.number(), // 0-100: How varied are emotions

  // Emotional momentum
  trend: v.string(),             // "rising", "falling", "stable"
  intensity: v.number(),         // 0-100: How strong is the collective feeling

  // Timestamp
  calculatedAt: v.number(),
});

export const worldTables = {
  // Current world time and date
  worldTime: defineTable({
    worldId: v.id('worlds'),

    // Time tracking
    currentTime: v.number(),       // Unix timestamp
    startTime: v.number(),         // When world began
    timeScale: v.number(),         // Time multiplier (1.0 = realtime, 10.0 = 10x speed)

    // Current time of day
    timeOfDay: TimeOfDay,

    // Day counter
    dayNumber: v.number(),         // Days since world creation
    hour: v.number(),              // 0-23
    minute: v.number(),            // 0-59

    lastUpdated: v.number(),
  })
    .index('worldId', ['worldId']),

  // Current weather state
  worldWeather: defineTable({
    worldId: v.id('worlds'),

    // Current weather
    currentWeather: WeatherType,
    weatherIntensity: v.number(),  // 0-100

    // PHASE 2 INSPIRED: Emotional Weather
    // Weather influenced by collective emotional state
    emotionalInfluence: v.number(), // 0-100: How much emotions affect weather

    // Weather forecast (next hour)
    nextWeather: WeatherType,
    transitionProgress: v.number(), // 0-1: Progress to next weather

    // Weather duration
    weatherStartTime: v.number(),
    weatherDuration: v.number(),   // How long this weather lasts (ms)

    // Weather history for patterns
    recentWeather: v.array(v.object({
      weather: WeatherType,
      timestamp: v.number(),
      emotionalInfluence: v.boolean(), // Was this emotion-driven?
    })),

    lastUpdated: v.number(),
  })
    .index('worldId', ['worldId']),

  // World atmosphere tracking
  worldAtmosphere: defineTable({
    worldId: v.id('worlds'),
    ...worldAtmosphere,
  })
    .index('worldId', ['worldId'])
    .index('timestamp', ['worldId', 'calculatedAt']),

  // Agent resources (energy, rest, nourishment)
  agentResources: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),
    playerId: v.string(),

    resources: agentResources,

    // Circadian rhythm
    circadian: circadianState,

    // Location-based modifiers
    currentLocation: v.optional(v.string()), // "indoors", "outdoors", "rest_area"

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('playerId', ['worldId', 'playerId']),

  // Time/weather events log
  worldEvents: defineTable({
    worldId: v.id('worlds'),
    timestamp: v.number(),

    eventType: v.string(),        // "time_change", "weather_change", "atmosphere_shift"
    description: v.string(),

    // Data about the event
    data: v.optional(v.any()),

    // If related to emotional weather
    emotionallyDriven: v.optional(v.boolean()),
    triggeringEmotion: v.optional(v.string()),
  })
    .index('worldId', ['worldId'])
    .index('timestamp', ['worldId', 'timestamp'])
    .index('eventType', ['worldId', 'eventType']),

  // Location-based modifiers
  worldLocations: defineTable({
    worldId: v.id('worlds'),

    locationName: v.string(),     // "town_square", "forest", "cafe", "garden"
    locationType: v.string(),     // "social", "rest", "activity", "nature"

    // Position/area
    area: v.object({
      x: v.number(),
      y: v.number(),
      width: v.number(),
      height: v.number(),
    }),

    // Effects when in this location
    effects: v.object({
      energyModifier: v.number(),    // ±per minute
      moodModifier: v.number(),      // ±valence
      socialBatteryModifier: v.number(), // ±per minute
      weatherProtection: v.number(), // 0-100: Protection from weather effects
    }),

    // Ambiance
    atmosphere: v.string(),       // Description of the vibe

    createdAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('locationType', ['worldId', 'locationType']),
};
