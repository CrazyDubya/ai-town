/**
 * PHASE 5: CINEMATIC INTEGRATION
 *
 * Ties cinematic systems into the existing narrative, emotional, and world systems.
 * Automatically detects dramatic moments and manages camera focus.
 */

import { v } from 'convex/values';
import { internalMutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Initialize camera state for a new world
 */
export const initializeCameraState = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Check if camera state already exists
    const existing = await ctx.db
      .query('cameraState')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (existing) return existing._id;

    // Create initial camera state
    const cameraId = await ctx.db.insert('cameraState', {
      worldId: args.worldId,
      mode: 'auto_drama',             // Start in auto-drama mode
      currentShot: 'wide',
      autoDramaEnabled: true,
      dramaticThreshold: 60,           // Auto-focus on dramatic+ moments
      updatedAt: Date.now(),
    });

    return cameraId;
  },
});

/**
 * Process narrative event for cinematic potential
 * Called after a narrative event is recorded
 */
export const processEventForCinematic = internalAction({
  args: {
    worldId: v.id('worlds'),
    eventId: v.id('narrativeEvents'),
  },
  handler: async (ctx, args) => {
    // Detect if this is a cinematic moment
    const momentId = await ctx.runMutation(
      internal.cinematic.momentDetection.detectCinematicMoment,
      {
        worldId: args.worldId,
        eventId: args.eventId,
      }
    );

    // If significant moment detected, create timeline marker
    if (momentId) {
      console.log(`Cinematic moment detected: ${momentId}`);
    }

    return momentId;
  },
});

/**
 * Update camera focus based on mode
 */
export const updateCameraFocus = internalMutation({
  args: {
    worldId: v.id('worlds'),
    mode: v.optional(
      v.union(
        v.literal('manual'),
        v.literal('follow_agent'),
        v.literal('auto_drama'),
        v.literal('story_mode'),
        v.literal('free')
      )
    ),
    focusTarget: v.optional(v.string()),
    focusReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const camera = await ctx.db
      .query('cameraState')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (!camera) {
      // Initialize if doesn't exist
      return await ctx.runMutation(internal.cinematic.integration.initializeCameraState, {
        worldId: args.worldId,
      });
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.mode) {
      updateData.mode = args.mode;
    }

    if (args.focusTarget) {
      updateData.focusTarget = args.focusTarget;
    }

    if (args.focusReason) {
      updateData.focusReason = args.focusReason;
    }

    await ctx.db.patch(camera._id, updateData);

    return camera._id;
  },
});

/**
 * Generate highlight reels for concluded arcs
 */
export const generateArcHighlightReel = internalAction({
  args: {
    worldId: v.id('worlds'),
    arcId: v.id('storyArcs'),
  },
  handler: async (ctx, args) => {
    // Generate arc-specific highlight reel
    const reelId = await ctx.runMutation(
      internal.cinematic.momentDetection.generateArcHighlights,
      {
        worldId: args.worldId,
        arcId: args.arcId,
      }
    );

    if (reelId) {
      console.log(`Generated highlight reel for arc: ${args.arcId}`);
    }

    return reelId;
  },
});

/**
 * Cinematic tick - runs periodically to manage cinematic systems
 */
export const cinematicTick = internalAction({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate daily highlights if it's been 24 hours
    const lastDailyReel = await ctx.runQuery(
      internal.cinematic.momentDetection.getHighlightReels,
      {
        worldId: args.worldId,
        reelType: 'daily',
      }
    );

    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    if (!lastDailyReel || lastDailyReel.length === 0 || lastDailyReel[0].createdAt < oneDayAgo) {
      await ctx.runMutation(internal.cinematic.momentDetection.generateDailyHighlights, {
        worldId: args.worldId,
      });
    }

    // Check for recently resolved arcs that need highlight reels
    const resolvedArcs = await ctx.runQuery(internal.narrative.arcDetection.identifyLegendaryArcs, {
      worldId: args.worldId,
    });

    for (const arc of resolvedArcs) {
      // Check if highlight reel already exists
      const existingReel = await ctx.runQuery(
        internal.cinematic.momentDetection.getHighlightReels,
        {
          worldId: args.worldId,
          reelType: 'arc',
        }
      );

      const hasReel = existingReel.some((reel) => reel.focusArc === arc._id);

      if (!hasReel) {
        await ctx.runAction(internal.cinematic.integration.generateArcHighlightReel, {
          worldId: args.worldId,
          arcId: arc._id,
        });
      }
    }
  },
});

/**
 * Create timeline marker for significant events
 */
export const createTimelineMarker = internalMutation({
  args: {
    worldId: v.id('worlds'),
    markerType: v.union(
      v.literal('arc_stage_change'),
      v.literal('quest_event'),
      v.literal('conflict_event'),
      v.literal('myth_event'),
      v.literal('weather_change'),
      v.literal('user_bookmark')
    ),
    title: v.string(),
    description: v.optional(v.string()),
    relatedEvent: v.optional(v.id('narrativeEvents')),
    timestamp: v.optional(v.number()),
    prominence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { color, icon } = getMarkerVisuals(args.markerType);

    const markerId = await ctx.db.insert('timelineMarkers', {
      worldId: args.worldId,
      markerType: args.markerType,
      title: args.title,
      description: args.description,
      relatedEvent: args.relatedEvent,
      color,
      icon,
      timestamp: args.timestamp || Date.now(),
      prominence: args.prominence || 50,
    });

    return markerId;
  },
});

function getMarkerVisuals(markerType: string): { color: string; icon: string } {
  const visuals: Record<string, { color: string; icon: string }> = {
    arc_stage_change: { color: '#FF1493', icon: '📖' },
    quest_event: { color: '#FFD700', icon: '🎯' },
    conflict_event: { color: '#DC143C', icon: '⚔️' },
    myth_event: { color: '#9370DB', icon: '📜' },
    weather_change: { color: '#87CEEB', icon: '🌤️' },
    user_bookmark: { color: '#32CD32', icon: '📌' },
  };
  return visuals[markerType] || { color: '#808080', icon: '⚫' };
}

/**
 * Get camera recommendations for current world state
 */
export const getCameraRecommendations = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get recent cinematic moments
    const recentMoments = await ctx.runQuery(
      internal.cinematic.momentDetection.getRecentCinematicMoments,
      {
        worldId: args.worldId,
        limit: 5,
        minSignificance: 60,
      }
    );

    if (recentMoments.length === 0) {
      return {
        hasRecommendation: false,
        reason: 'No dramatic moments recently',
      };
    }

    const topMoment = recentMoments[0];

    return {
      hasRecommendation: true,
      moment: topMoment,
      recommendedFocus: topMoment.cameraFocus,
      recommendedShot: topMoment.recommendedShot,
      reason: topMoment.title,
      significance: topMoment.significance,
    };
  },
});
