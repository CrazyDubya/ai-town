/**
 * PHASE 5: CINEMATIC & VISUALIZATION SCHEMA
 *
 * Database schema for cinematic moments, camera control, highlight reels,
 * and visualization data.
 */

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Cinematic significance levels
export const cinematicSignificance = v.union(
  v.literal('mundane'),        // 0-20: routine activity
  v.literal('notable'),        // 20-40: worth watching
  v.literal('interesting'),    // 40-60: engaging moment
  v.literal('dramatic'),       // 60-80: high drama
  v.literal('climactic'),      // 80-100: peak moment
);

// Camera shot types
export const shotTypes = v.union(
  v.literal('wide'),           // Establishing shot, context
  v.literal('medium'),         // Standard conversation
  v.literal('close'),          // Emotional moment
  v.literal('extreme_close'),  // Peak emotional intensity
  v.literal('two_shot'),       // Interaction between two
  v.literal('group'),          // Multiple agents
  v.literal('over_shoulder'),  // Conversation perspective
);

// Cinematic moment types
export const momentTypes = v.union(
  v.literal('emotional_peak'),      // Extreme emotion
  v.literal('conflict_escalation'), // Fight brewing
  v.literal('conflict_climax'),     // Fight at peak
  v.literal('reconciliation'),      // Making peace
  v.literal('betrayal'),            // Trust broken
  v.literal('revelation'),          // Discovery/realization
  v.literal('quest_completion'),    // Achievement
  v.literal('arc_climax'),          // Story peak
  v.literal('myth_creation'),       // Culture moment
  v.literal('ritual_performance'),  // Ceremonial
  v.literal('faction_formation'),   // Social shift
  v.literal('weather_shift'),       // Environmental drama
);

export const cinematicTables = {
  // Detected cinematic moments
  cinematicMoments: defineTable({
    worldId: v.id('worlds'),

    // Moment details
    momentType: momentTypes,
    significance: v.number(),        // 0-100
    significanceLevel: cinematicSignificance,

    // What's happening
    title: v.string(),
    description: v.string(),

    // Participants
    primaryAgents: v.array(v.string()),
    secondaryAgents: v.optional(v.array(v.string())),
    location: v.optional(v.string()),

    // Emotional context
    dominantEmotion: v.string(),
    emotionalIntensity: v.number(),  // 0-100

    // Narrative connections
    relatedEvent: v.optional(v.id('narrativeEvents')),
    relatedArc: v.optional(v.id('storyArcs')),
    relatedConflict: v.optional(v.id('conflicts')),
    relatedQuest: v.optional(v.id('narrativeQuests')),
    relatedMyth: v.optional(v.id('mythology')),

    // Cinematic direction
    recommendedShot: shotTypes,
    cameraFocus: v.string(),         // Agent ID or location
    duration: v.number(),             // How long to hold focus (ms)

    // Timing
    occurredAt: v.number(),
    peakAt: v.number(),               // When intensity peaked

    // Replay data
    contextBefore: v.number(),        // How much context before (ms)
    contextAfter: v.number(),         // How much context after (ms)

    // Highlight reel
    includeInHighlights: v.boolean(),
    highlightPriority: v.number(),    // 0-100
  })
    .index('worldId', ['worldId'])
    .index('significance', ['worldId', 'significance'])
    .index('timestamp', ['worldId', 'occurredAt'])
    .index('highlights', ['worldId', 'includeInHighlights', 'highlightPriority']),

  // Camera state and focus
  cameraState: defineTable({
    worldId: v.id('worlds'),

    // Camera mode
    mode: v.union(
      v.literal('manual'),           // User control
      v.literal('follow_agent'),     // Follow specific agent
      v.literal('auto_drama'),       // Follow dramatic moments
      v.literal('story_mode'),       // Follow active arcs
      v.literal('free'),             // Wandering
    ),

    // Current focus
    focusTarget: v.optional(v.string()), // Agent ID or location
    focusReason: v.optional(v.string()),

    // Tracking
    lastMomentId: v.optional(v.id('cinematicMoments')),
    currentShot: shotTypes,

    // User preferences
    autoDramaEnabled: v.boolean(),
    dramaticThreshold: v.number(),   // Min significance to auto-focus (0-100)

    // Tracking
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId']),

  // Highlight reels
  highlightReels: defineTable({
    worldId: v.id('worlds'),

    // Reel details
    title: v.string(),
    description: v.string(),

    // Type
    reelType: v.union(
      v.literal('daily'),            // Best of the day
      v.literal('arc'),              // Story arc compilation
      v.literal('agent'),            // Agent-focused
      v.literal('conflict'),         // Conflict saga
      v.literal('custom'),           // User-created
    ),

    // Content
    moments: v.array(v.id('cinematicMoments')),

    // For specific types
    focusArc: v.optional(v.id('storyArcs')),
    focusAgent: v.optional(v.string()),
    focusConflict: v.optional(v.id('conflicts')),

    // Metadata
    totalDuration: v.number(),       // Total ms
    avgSignificance: v.number(),     // Average moment significance

    // Timing
    createdAt: v.number(),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),

    // Status
    autoGenerated: v.boolean(),
  })
    .index('worldId', ['worldId'])
    .index('type', ['worldId', 'reelType'])
    .index('created', ['worldId', 'createdAt']),

  // Playback timeline markers
  timelineMarkers: defineTable({
    worldId: v.id('worlds'),

    // Marker details
    markerType: v.union(
      v.literal('cinematic_moment'),
      v.literal('arc_stage_change'),
      v.literal('quest_event'),
      v.literal('conflict_event'),
      v.literal('myth_event'),
      v.literal('weather_change'),
      v.literal('user_bookmark'),
    ),

    // What it marks
    title: v.string(),
    description: v.optional(v.string()),

    // References
    relatedMoment: v.optional(v.id('cinematicMoments')),
    relatedEvent: v.optional(v.id('narrativeEvents')),

    // Visual
    color: v.string(),               // Hex color for timeline
    icon: v.optional(v.string()),    // Icon identifier

    // Timing
    timestamp: v.number(),

    // Importance
    prominence: v.number(),          // 0-100, how visible on timeline
  })
    .index('worldId', ['worldId'])
    .index('timestamp', ['worldId', 'timestamp'])
    .index('type', ['worldId', 'markerType']),
};
