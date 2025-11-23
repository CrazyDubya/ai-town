import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';

/**
 * TIME ENGINE
 *
 * Manages world time progression, day/night cycles, and circadian rhythms.
 */

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60 * 1000;

// Time of day boundaries (hours)
const TIME_BOUNDARIES = {
  dawn: [5, 7],
  morning: [7, 12],
  afternoon: [12, 17],
  dusk: [17, 19],
  night: [19, 5], // Wraps around midnight
};

/**
 * Get time of day from hour
 */
export function getTimeOfDay(hour: number): string {
  if (hour >= TIME_BOUNDARIES.dawn[0] && hour < TIME_BOUNDARIES.dawn[1]) return 'dawn';
  if (hour >= TIME_BOUNDARIES.morning[0] && hour < TIME_BOUNDARIES.morning[1]) return 'morning';
  if (hour >= TIME_BOUNDARIES.afternoon[0] && hour < TIME_BOUNDARIES.afternoon[1])
    return 'afternoon';
  if (hour >= TIME_BOUNDARIES.dusk[0] && hour < TIME_BOUNDARIES.dusk[1]) return 'dusk';
  return 'night';
}

/**
 * Calculate circadian energy level (0-100) based on time and chronotype
 */
export function calculateCircadianEnergy(
  hour: number,
  chronotype: string,
): number {
  // Base energy curve (peaks midday, low at night)
  let baseEnergy: number;

  switch (chronotype) {
    case 'morning_lark':
      // Peak 8am-12pm
      if (hour >= 6 && hour < 12) {
        baseEnergy = 70 + (hour - 6) * 5; // Ramp up
      } else if (hour >= 12 && hour < 18) {
        baseEnergy = 90 - (hour - 12) * 5; // Decline
      } else if (hour >= 18 && hour < 22) {
        baseEnergy = 60 - (hour - 18) * 10; // Rapid decline
      } else {
        baseEnergy = 20; // Night/early morning
      }
      break;

    case 'night_owl':
      // Peak 6pm-12am
      if (hour >= 12 && hour < 18) {
        baseEnergy = 50 + (hour - 12) * 7; // Ramp up
      } else if (hour >= 18 || hour < 2) {
        const adjustedHour = hour >= 18 ? hour - 18 : hour + 6;
        baseEnergy = 90 - adjustedHour * 3; // Peak evening
      } else if (hour >= 2 && hour < 6) {
        baseEnergy = 70 - (hour - 2) * 10; // Decline
      } else {
        baseEnergy = 30; // Morning
      }
      break;

    case 'neutral':
    default:
      // Standard curve
      if (hour >= 6 && hour < 12) {
        baseEnergy = 50 + (hour - 6) * 7;
      } else if (hour >= 12 && hour < 18) {
        baseEnergy = 90 - (hour - 12) * 3;
      } else if (hour >= 18 && hour < 22) {
        baseEnergy = 75 - (hour - 18) * 10;
      } else {
        baseEnergy = 25;
      }
      break;
  }

  return Math.max(0, Math.min(100, baseEnergy));
}

/**
 * Get emotional modifiers for time of day
 */
export function getTimeOfDayEmotionalModifiers(timeOfDay: string): {
  valence: number;
  arousal: number;
  emotions: Array<{ emotion: string; change: number }>;
} {
  switch (timeOfDay) {
    case 'dawn':
      return {
        valence: 5, // Slightly positive
        arousal: -10, // Calm
        emotions: [
          { emotion: 'anticipation', change: 10 },
          { emotion: 'trust', change: 5 },
        ],
      };

    case 'morning':
      return {
        valence: 10, // Positive
        arousal: 15, // Energized
        emotions: [
          { emotion: 'joy', change: 10 },
          { emotion: 'anticipation', change: 5 },
        ],
      };

    case 'afternoon':
      return {
        valence: 5, // Slightly positive
        arousal: 5, // Active
        emotions: [
          { emotion: 'trust', change: 5 },
        ],
      };

    case 'dusk':
      return {
        valence: -5, // Slightly melancholic
        arousal: -10, // Winding down
        emotions: [
          { emotion: 'sadness', change: 5 },
          { emotion: 'anticipation', change: -5 },
        ],
      };

    case 'night':
      return {
        valence: 0, // Neutral
        arousal: -15, // Low energy
        emotions: [
          { emotion: 'trust', change: 10 }, // Intimacy
          { emotion: 'fear', change: 5 }, // Slight unease
        ],
      };

    default:
      return { valence: 0, arousal: 0, emotions: [] };
  }
}

/**
 * Initialize world time
 */
export const initializeWorldTime = internalMutation({
  args: {
    worldId: v.id('worlds'),
    timeScale: v.optional(v.number()),
    startHour: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('worldTime')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const startHour = args.startHour || 9; // Default 9am
    const timeScale = args.timeScale || 10.0; // 10x realtime by default

    const worldTime = await ctx.db.insert('worldTime', {
      worldId: args.worldId,
      currentTime: now,
      startTime: now,
      timeScale,
      timeOfDay: getTimeOfDay(startHour) as any,
      dayNumber: 0,
      hour: startHour,
      minute: 0,
      lastUpdated: now,
    });

    await ctx.db.insert('worldEvents', {
      worldId: args.worldId,
      timestamp: now,
      eventType: 'time_initialized',
      description: `World time initialized at ${startHour}:00, time scale ${timeScale}x`,
    });

    return worldTime;
  },
});

/**
 * Update world time
 */
export const updateWorldTime = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const worldTime = await ctx.db
      .query('worldTime')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (!worldTime) {
      throw new Error(`World time not initialized for ${args.worldId}`);
    }

    const now = Date.now();
    const elapsedMs = now - worldTime.lastUpdated;
    const scaledElapsedMs = elapsedMs * worldTime.timeScale;

    // Calculate new time
    const totalMinutes = worldTime.hour * 60 + worldTime.minute + Math.floor(scaledElapsedMs / MS_PER_MINUTE);
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    const newDayNumber = worldTime.dayNumber + Math.floor(totalMinutes / MINUTES_PER_DAY);

    const previousTimeOfDay = worldTime.timeOfDay;
    const newTimeOfDay = getTimeOfDay(newHour);

    // Update time
    await ctx.db.patch(worldTime._id, {
      currentTime: now,
      hour: newHour,
      minute: newMinute,
      dayNumber: newDayNumber,
      timeOfDay: newTimeOfDay as any,
      lastUpdated: now,
    });

    // Log time of day change
    if (previousTimeOfDay !== newTimeOfDay) {
      await ctx.db.insert('worldEvents', {
        worldId: args.worldId,
        timestamp: now,
        eventType: 'time_change',
        description: `Time of day changed from ${previousTimeOfDay} to ${newTimeOfDay}`,
        data: { hour: newHour, timeOfDay: newTimeOfDay },
      });
    }

    return {
      hour: newHour,
      minute: newMinute,
      timeOfDay: newTimeOfDay,
      dayNumber: newDayNumber,
      timeChanged: previousTimeOfDay !== newTimeOfDay,
    };
  },
});

/**
 * Get current world time
 */
export const getWorldTime = internalQuery({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const worldTime = await ctx.db
      .query('worldTime')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    return worldTime;
  },
});

/**
 * Format world time as readable string
 */
export function formatWorldTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
