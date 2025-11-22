/**
 * PHASE 5: CINEMATIC MOMENT DETECTION
 *
 * Automatically identifies dramatically significant moments and creates
 * highlight reels, camera cues, and visual storytelling.
 *
 * THE SYSTEM BECOMES ITS OWN DIRECTOR.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Detect cinematic moments from narrative events
 */
export const detectCinematicMoment = internalMutation({
  args: {
    worldId: v.id('worlds'),
    eventId: v.id('narrativeEvents'),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    // Calculate cinematic significance
    const { significance, momentType, recommendedShot } =
      await analyzeCinematicSignificance(ctx, event);

    if (significance < 20) return null; // Too mundane

    const now = Date.now();

    // Determine dominant emotion
    const emotions = event.emotions;
    const dominantEmotion = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)[0][0];

    const emotionalIntensity = Object.values(emotions).reduce((sum, val) => sum + val, 0) / 4;

    // Create cinematic moment
    const momentId = await ctx.db.insert('cinematicMoments', {
      worldId: args.worldId,
      momentType,
      significance,
      significanceLevel: determineSignificanceLevel(significance),
      title: event.title,
      description: event.description,
      primaryAgents: event.primaryAgents,
      secondaryAgents: event.witnessAgents,
      location: event.location,
      dominantEmotion,
      emotionalIntensity,
      relatedEvent: args.eventId,
      relatedArc: event.relatedArc,
      relatedConflict: event.relatedConflict,
      relatedQuest: event.relatedQuest,
      recommendedShot,
      cameraFocus: event.primaryAgents[0] || event.location || 'location',
      duration: calculateFocusDuration(significance),
      occurredAt: event.occurredAt,
      peakAt: event.occurredAt,
      contextBefore: 5000,  // 5 seconds before
      contextAfter: 3000,   // 3 seconds after
      includeInHighlights: significance >= 60,
      highlightPriority: significance,
    });

    // Create timeline marker
    await ctx.db.insert('timelineMarkers', {
      worldId: args.worldId,
      markerType: 'cinematic_moment',
      title: event.title,
      description: event.description,
      relatedMoment: momentId,
      relatedEvent: args.eventId,
      color: getMomentColor(momentType),
      icon: getMomentIcon(momentType),
      timestamp: event.occurredAt,
      prominence: significance,
    });

    // If auto-drama mode enabled and significant enough, update camera
    const camera = await ctx.db
      .query('cameraState')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (camera?.autoDramaEnabled && significance >= camera.dramaticThreshold) {
      await ctx.db.patch(camera._id, {
        mode: 'auto_drama',
        focusTarget: event.primaryAgents[0],
        focusReason: `Dramatic moment: ${event.title}`,
        lastMomentId: momentId,
        currentShot: recommendedShot,
        updatedAt: now,
      });
    }

    // ENHANCEMENT: Cinematic moments create emotional memories for participants
    if (significance >= 60) {
      // Only memorable if truly dramatic
      try {
        // Create memory for each primary agent
        for (const agentId of event.primaryAgents) {
          // Find if this event already has a memory
          const existingMemory = await ctx.db
            .query('memories')
            .withIndex('participantId', (q: any) =>
              q.eq('worldId', args.worldId).eq('participantIds', agentId)
            )
            .filter((q) => q.eq(q.field('description'), event.description))
            .first();

          // Create emotional memory tag for this moment
          if (existingMemory) {
            await ctx.db.insert('emotionalMemories', {
              worldId: args.worldId,
              agentId,
              memoryId: existingMemory._id,
              emotionType: dominantEmotion as any,
              intensity: Math.min(100, emotionalIntensity),
              valence: emotions.joy - emotions.sadness,
              resonanceThreshold: 100 - significance, // More significant = easier to trigger
              timesTriggered: 0,
              created: now,
            });

            console.log(
              `💭 EMOTIONAL MEMORY: ${agentId} will vividly remember "${event.title}" (${dominantEmotion}, significance: ${significance})`
            );
          }
        }
      } catch (e) {
        console.log('Could not create emotional memories for cinematic moment:', e);
      }
    }

    return momentId;
  },
});

async function analyzeCinematicSignificance(ctx: any, event: any) {
  let significance = event.significance || 0;
  let momentType: any = 'emotional_peak';
  let recommendedShot: any = 'medium';

  // Emotional intensity boosts significance
  const emotionalSum = Object.values(event.emotions).reduce((sum: number, val: any) => sum + val, 0);
  const avgEmotion = emotionalSum / 4;
  significance += avgEmotion * 0.3;

  // Check for specific moment types
  if (event.relatedConflict) {
    const conflict = await ctx.db.get(event.relatedConflict);
    if (conflict) {
      if (conflict.status === 'climactic') {
        momentType = 'conflict_climax';
        significance += 30;
        recommendedShot = 'close';
      } else if (conflict.status === 'escalating') {
        momentType = 'conflict_escalation';
        significance += 20;
        recommendedShot = 'two_shot';
      } else if (conflict.status === 'resolved' && conflict.resolutionType === 'reconciliation') {
        momentType = 'reconciliation';
        significance += 25;
        recommendedShot = 'close';
      }
    }
  }

  if (event.relatedArc) {
    const arc = await ctx.db.get(event.relatedArc);
    if (arc && arc.stage === 'climax') {
      momentType = 'arc_climax';
      significance += 35;
      recommendedShot = 'extreme_close';
    }
  }

  if (event.relatedQuest) {
    const quest = await ctx.db.get(event.relatedQuest);
    if (quest && quest.status === 'completed') {
      momentType = 'quest_completion';
      significance += 15;
      recommendedShot = 'medium';
    }
  }

  // Betrayal detection (high anger + broken bond)
  if (event.emotions.anger > 70 && event.emotions.sadness > 60) {
    momentType = 'betrayal';
    significance += 40;
    recommendedShot = 'extreme_close';
  }

  // Group moments
  if (event.primaryAgents.length > 2) {
    recommendedShot = 'group';
  }

  return {
    significance: Math.min(100, significance),
    momentType,
    recommendedShot,
  };
}

function determineSignificanceLevel(significance: number): any {
  if (significance >= 80) return 'climactic';
  if (significance >= 60) return 'dramatic';
  if (significance >= 40) return 'interesting';
  if (significance >= 20) return 'notable';
  return 'mundane';
}

function calculateFocusDuration(significance: number): number {
  // More significant moments hold camera longer
  const baseDuration = 3000; // 3 seconds
  const multiplier = 1 + (significance / 100);
  return Math.floor(baseDuration * multiplier);
}

function getMomentColor(momentType: string): string {
  const colors: Record<string, string> = {
    emotional_peak: '#FFD700',       // Gold
    conflict_escalation: '#FF6347',  // Red
    conflict_climax: '#DC143C',      // Crimson
    reconciliation: '#32CD32',       // Lime green
    betrayal: '#8B0000',             // Dark red
    revelation: '#1E90FF',           // Dodger blue
    quest_completion: '#4169E1',     // Royal blue
    arc_climax: '#FF1493',           // Deep pink
    myth_creation: '#9370DB',        // Medium purple
    ritual_performance: '#DDA0DD',   // Plum
    faction_formation: '#FF8C00',    // Dark orange
    weather_shift: '#87CEEB',        // Sky blue
  };
  return colors[momentType] || '#808080';
}

function getMomentIcon(momentType: string): string {
  const icons: Record<string, string> = {
    emotional_peak: 'heart',
    conflict_escalation: 'warning',
    conflict_climax: 'bolt',
    reconciliation: 'handshake',
    betrayal: 'broken-heart',
    revelation: 'lightbulb',
    quest_completion: 'check-circle',
    arc_climax: 'star',
    myth_creation: 'book',
    ritual_performance: 'ritual',
    faction_formation: 'users',
    weather_shift: 'cloud',
  };
  return icons[momentType] || 'circle';
}

/**
 * Generate daily highlight reel
 */
export const generateDailyHighlights = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Get all highlight-worthy moments from last 24 hours
    const moments = await ctx.db
      .query('cinematicMoments')
      .withIndex('highlights', (q) =>
        q.eq('worldId', args.worldId).eq('includeInHighlights', true)
      )
      .filter((q) => q.gt(q.field('occurredAt'), oneDayAgo))
      .collect();

    if (moments.length === 0) return null;

    // Sort by priority
    const sortedMoments = moments.sort((a, b) => b.highlightPriority - a.highlightPriority);

    // Take top 10
    const topMoments = sortedMoments.slice(0, 10);

    // Calculate total duration and average significance
    const totalDuration = topMoments.reduce(
      (sum, m) => sum + m.duration + m.contextBefore + m.contextAfter,
      0
    );
    const avgSignificance = topMoments.reduce((sum, m) => sum + m.significance, 0) / topMoments.length;

    // Create highlight reel
    const reelId = await ctx.db.insert('highlightReels', {
      worldId: args.worldId,
      title: 'Daily Highlights',
      description: `The most dramatic moments from the last 24 hours`,
      reelType: 'daily',
      moments: topMoments.map((m) => m._id),
      totalDuration,
      avgSignificance,
      createdAt: now,
      periodStart: oneDayAgo,
      periodEnd: now,
      autoGenerated: true,
    });

    return reelId;
  },
});

/**
 * Generate arc-specific highlight reel
 */
export const generateArcHighlights = internalMutation({
  args: {
    worldId: v.id('worlds'),
    arcId: v.id('storyArcs'),
  },
  handler: async (ctx, args) => {
    const arc = await ctx.db.get(args.arcId);
    if (!arc) return null;

    // Get all moments related to this arc
    const moments = await ctx.db
      .query('cinematicMoments')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.eq(q.field('relatedArc'), args.arcId))
      .collect();

    if (moments.length === 0) return null;

    // Sort chronologically
    const sortedMoments = moments.sort((a, b) => a.occurredAt - b.occurredAt);

    const totalDuration = sortedMoments.reduce(
      (sum, m) => sum + m.duration + m.contextBefore + m.contextAfter,
      0
    );
    const avgSignificance = sortedMoments.reduce((sum, m) => sum + m.significance, 0) / sortedMoments.length;

    const now = Date.now();

    const reelId = await ctx.db.insert('highlightReels', {
      worldId: args.worldId,
      title: `Story: ${arc.title}`,
      description: arc.summary,
      reelType: 'arc',
      moments: sortedMoments.map((m) => m._id),
      focusArc: args.arcId,
      totalDuration,
      avgSignificance,
      createdAt: now,
      periodStart: sortedMoments[0].occurredAt,
      periodEnd: sortedMoments[sortedMoments.length - 1].occurredAt,
      autoGenerated: true,
    });

    return reelId;
  },
});

/**
 * Get recent cinematic moments for UI
 */
export const getRecentCinematicMoments = internalQuery({
  args: {
    worldId: v.id('worlds'),
    limit: v.optional(v.number()),
    minSignificance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const minSig = args.minSignificance || 0;

    const moments = await ctx.db
      .query('cinematicMoments')
      .withIndex('timestamp', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.gte(q.field('significance'), minSig))
      .order('desc')
      .take(limit);

    return moments;
  },
});

/**
 * Get highlight reels
 */
export const getHighlightReels = internalQuery({
  args: {
    worldId: v.id('worlds'),
    reelType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('highlightReels')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId));

    if (args.reelType) {
      query = ctx.db
        .query('highlightReels')
        .withIndex('type', (q: any) =>
          q.eq('worldId', args.worldId).eq('reelType', args.reelType as any)
        );
    }

    return await query.order('desc').take(10);
  },
});

/**
 * Get timeline markers for a time range
 */
export const getTimelineMarkers = internalQuery({
  args: {
    worldId: v.id('worlds'),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('timelineMarkers')
      .withIndex('timestamp', (q) => q.eq('worldId', args.worldId))
      .filter((q) =>
        q.and(
          q.gte(q.field('timestamp'), args.startTime),
          q.lte(q.field('timestamp'), args.endTime)
        )
      )
      .collect();
  },
});
