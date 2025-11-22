/**
 * PHASE 4: NARRATIVE ARC DETECTION ENGINE
 *
 * Automatically recognizes when emergent story patterns form from agent behavior.
 * The Game Master doesn't script stories - it identifies and amplifies them.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

// Patterns that indicate different story arc types
const ARC_PATTERNS = {
  friendship: {
    indicators: [
      'multiple_positive_interactions',
      'increasing_emotional_bond',
      'shared_activities',
      'mutual_trust_growth',
    ],
    emotionalSignature: { joy: 0.6, trust: 0.7 },
    minInteractions: 3,
  },
  rivalry: {
    indicators: [
      'repeated_conflicts',
      'competitive_emotions',
      'opposing_faction_membership',
      'negative_reputation_trend',
    ],
    emotionalSignature: { anger: 0.5, anticipation: 0.6 },
    minInteractions: 2,
  },
  betrayal: {
    indicators: [
      'trust_drop_after_high_bond',
      'sudden_negative_shift',
      'broken_expectations',
    ],
    emotionalSignature: { sadness: 0.7, anger: 0.6, trust: -0.8 },
    minInteractions: 1, // Can happen in a single moment
  },
  redemption: {
    indicators: [
      'low_reputation_improving',
      'positive_actions_after_negative',
      'increasing_trust_bonds',
      'faction_acceptance',
    ],
    emotionalSignature: { joy: 0.5, anticipation: 0.6 },
    minInteractions: 4,
  },
  transformation: {
    indicators: [
      'major_personality_shift',
      'emotional_baseline_change',
      'role_change',
      'behavioral_pattern_break',
    ],
    emotionalSignature: { surprise: 0.6, anticipation: 0.5 },
    minInteractions: 5,
  },
  loss: {
    indicators: [
      'broken_emotional_bond',
      'sustained_sadness',
      'social_withdrawal',
      'grief_memories',
    ],
    emotionalSignature: { sadness: 0.8, trust: -0.5 },
    minInteractions: 1,
  },
};

/**
 * Detect potential story arcs from recent agent interactions
 */
export const detectStoryArcs = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lookbackWindow = 24 * 60 * 60 * 1000; // 24 hours

    // Get recent narrative events
    const recentEvents = await ctx.db
      .query('narrativeEvents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.gt(q.field('occurredAt'), now - lookbackWindow))
      .collect();

    // Get active story arcs to avoid duplicates
    const activeArcs = await ctx.db
      .query('storyArcs')
      .withIndex('active', (q) =>
        q.eq('worldId', args.worldId).eq('resolvedAt', undefined)
      )
      .collect();

    // Group events by agent pairs
    const agentPairEvents = new Map<string, typeof recentEvents>();

    for (const event of recentEvents) {
      if (event.primaryAgents.length < 2) continue;

      for (let i = 0; i < event.primaryAgents.length; i++) {
        for (let j = i + 1; j < event.primaryAgents.length; j++) {
          const agent1 = event.primaryAgents[i];
          const agent2 = event.primaryAgents[j];
          const pairKey = [agent1, agent2].sort().join('_');

          if (!agentPairEvents.has(pairKey)) {
            agentPairEvents.set(pairKey, []);
          }
          agentPairEvents.get(pairKey)!.push(event);
        }
      }
    }

    const detectedArcs: Id<'storyArcs'>[] = [];

    // Analyze each agent pair for story patterns
    for (const [pairKey, events] of agentPairEvents.entries()) {
      const [agent1Id, agent2Id] = pairKey.split('_');

      // Check if there's already an active arc for this pair
      const existingArc = activeArcs.find(
        (arc) =>
          arc.protagonists.includes(agent1Id) &&
          arc.protagonists.includes(agent2Id)
      );
      if (existingArc) continue;

      // Try to match patterns
      const detectedPattern = await analyzeEventsForPattern(ctx, {
        worldId: args.worldId,
        agent1Id,
        agent2Id,
        events,
      });

      if (detectedPattern) {
        // Create new story arc
        const arcId = await ctx.db.insert('storyArcs', {
          worldId: args.worldId,
          arcType: detectedPattern.arcType,
          protagonists: [agent1Id, agent2Id],
          stage: 'rising_action',
          intensity: detectedPattern.intensity,
          title: detectedPattern.title,
          summary: detectedPattern.summary,
          keyEvents: events.map((e) => e._id),
          startedAt: events[0].occurredAt,
          lastEventAt: events[events.length - 1].occurredAt,
          memorability: detectedPattern.memorability,
          emotionalImpact: detectedPattern.emotionalImpact,
        });

        detectedArcs.push(arcId);

        // Log Game Master action
        await ctx.db.insert('gameMasterActions', {
          worldId: args.worldId,
          actionType: 'arc_recognized',
          affectedAgents: [agent1Id, agent2Id],
          trigger: `Pattern detected: ${detectedPattern.arcType}`,
          reasoning: detectedPattern.reasoning,
          createdArc: arcId,
          timestamp: now,
        });
      }
    }

    return { detectedArcs: detectedArcs.length };
  },
});

/**
 * Analyze events to find story patterns
 */
async function analyzeEventsForPattern(
  ctx: any,
  args: {
    worldId: Id<'worlds'>;
    agent1Id: string;
    agent2Id: string;
    events: any[];
  }
) {
  if (args.events.length === 0) return null;

  // Get emotional bond between agents
  const bond1 = await ctx.db
    .query('emotionalBonds')
    .withIndex('agentPair', (q: any) =>
      q.eq('worldId', args.worldId).eq('agentId', args.agent1Id).eq('otherAgentId', args.agent2Id)
    )
    .first();

  const bond2 = await ctx.db
    .query('emotionalBonds')
    .withIndex('agentPair', (q: any) =>
      q.eq('worldId', args.worldId).eq('agentId', args.agent2Id).eq('otherAgentId', args.agent1Id)
    )
    .first();

  const avgBond = bond1 && bond2 ? (bond1.bondStrength + bond2.bondStrength) / 2 : 0;

  // Calculate average emotional intensity
  const avgEmotions = args.events.reduce(
    (acc, event) => ({
      joy: acc.joy + (event.emotions.joy || 0),
      sadness: acc.sadness + (event.emotions.sadness || 0),
      anger: acc.anger + (event.emotions.anger || 0),
      fear: acc.fear + (event.emotions.fear || 0),
    }),
    { joy: 0, sadness: 0, anger: 0, fear: 0 }
  );

  Object.keys(avgEmotions).forEach((key) => {
    avgEmotions[key as keyof typeof avgEmotions] /= args.events.length;
  });

  // Check for betrayal (trust drop after high bond)
  if (avgBond > 60 && bond1 && bond2) {
    const recentBond = (bond1.bondStrength + bond2.bondStrength) / 2;
    const bondChange = recentBond - avgBond;

    if (bondChange < -30 && avgEmotions.sadness > 50) {
      return {
        arcType: 'betrayal' as const,
        intensity: Math.min(100, Math.abs(bondChange)),
        title: 'A Broken Trust',
        summary: `The relationship between the agents has fractured unexpectedly.`,
        memorability: 80,
        emotionalImpact: 90,
        reasoning: 'Significant bond strength drop with high sadness',
      };
    }
  }

  // Check for friendship (increasing bond, positive emotions)
  if (
    avgEmotions.joy > 50 &&
    avgBond > 40 &&
    args.events.length >= ARC_PATTERNS.friendship.minInteractions
  ) {
    return {
      arcType: 'friendship' as const,
      intensity: avgBond,
      title: 'An Unlikely Friendship',
      summary: `A bond is forming through shared experiences and mutual trust.`,
      memorability: 60,
      emotionalImpact: 70,
      reasoning: 'Multiple positive interactions with growing emotional bond',
    };
  }

  // Check for rivalry (repeated interactions, competitive emotions)
  if (
    avgEmotions.anger > 40 ||
    (avgEmotions.anger > 30 && args.events.length >= 3)
  ) {
    // Check if they're in opposing factions
    const agent1Factions = await ctx.db
      .query('factionMemberships')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agent1Id)
      )
      .collect();

    const agent2Factions = await ctx.db
      .query('factionMemberships')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agent2Id)
      )
      .collect();

    const inOpposingFactions = agent1Factions.some((f1) =>
      agent2Factions.some((f2) => f1.factionId !== f2.factionId)
    );

    if (inOpposingFactions || args.events.length >= 3) {
      return {
        arcType: 'rivalry' as const,
        intensity: avgEmotions.anger,
        title: 'A Growing Rivalry',
        summary: `Tension builds between the agents through repeated conflicts.`,
        memorability: 70,
        emotionalImpact: 75,
        reasoning: 'Repeated interactions with elevated anger',
      };
    }
  }

  // Check for redemption (low reputation improving)
  const agent1Rep = await ctx.db
    .query('agentReputation')
    .withIndex('agentId', (q: any) =>
      q.eq('worldId', args.worldId).eq('agentId', args.agent1Id)
    )
    .first();

  if (
    agent1Rep &&
    agent1Rep.communityReputation < -30 &&
    avgEmotions.joy > 40 &&
    args.events.length >= 4
  ) {
    return {
      arcType: 'redemption' as const,
      intensity: Math.abs(agent1Rep.communityReputation),
      title: 'A Path to Redemption',
      summary: `Despite past mistakes, positive change is emerging.`,
      memorability: 85,
      emotionalImpact: 80,
      reasoning: 'Low reputation agent engaging in positive interactions',
    };
  }

  // Check for loss (sustained sadness)
  if (avgEmotions.sadness > 60 && args.events.length >= 2) {
    return {
      arcType: 'loss' as const,
      intensity: avgEmotions.sadness,
      title: 'A Time of Grief',
      summary: `Dealing with loss and its emotional aftermath.`,
      memorability: 75,
      emotionalImpact: 85,
      reasoning: 'Sustained high sadness across interactions',
    };
  }

  return null;
}

/**
 * Progress existing story arcs based on new events
 */
export const progressStoryArcs = internalMutation({
  args: {
    worldId: v.id('worlds'),
    eventId: v.id('narrativeEvents'),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;

    // Get all active arcs involving the agents in this event
    const activeArcs = await ctx.db
      .query('storyArcs')
      .withIndex('active', (q) =>
        q.eq('worldId', args.worldId).eq('resolvedAt', undefined)
      )
      .collect();

    for (const arc of activeArcs) {
      const agentsInArc = event.primaryAgents.some((agentId) =>
        arc.protagonists.includes(agentId)
      );

      if (!agentsInArc) continue;

      // Add this event to the arc
      const updatedKeyEvents = [...arc.keyEvents, args.eventId];

      // Update arc intensity based on event
      const intensityChange = calculateIntensityChange(arc, event);
      const newIntensity = Math.max(
        0,
        Math.min(100, arc.intensity + intensityChange)
      );

      // Determine if stage should progress
      const newStage = determineArcStage(arc, newIntensity, updatedKeyEvents.length);

      // Check if arc should resolve
      const shouldResolve = newStage === 'resolution' && newIntensity < 30;

      await ctx.db.patch(arc._id, {
        keyEvents: updatedKeyEvents,
        intensity: newIntensity,
        stage: newStage,
        lastEventAt: event.occurredAt,
        ...(shouldResolve && { resolvedAt: Date.now() }),
      });

      // Update memorability based on intensity
      if (newIntensity > 70) {
        await ctx.db.patch(arc._id, {
          memorability: Math.min(100, arc.memorability + 5),
        });
      }
    }
  },
});

function calculateIntensityChange(arc: any, event: any): number {
  // Emotional intensity of the event affects arc intensity
  const emotionalSum =
    (event.emotions.joy || 0) +
    (event.emotions.sadness || 0) +
    (event.emotions.anger || 0) +
    (event.emotions.fear || 0);

  const avgEmotion = emotionalSum / 4;

  // High emotion events increase intensity
  if (avgEmotion > 60) return 10;
  if (avgEmotion > 40) return 5;
  if (avgEmotion > 20) return 2;

  // Low emotion events decrease intensity (cooling off)
  return -5;
}

function determineArcStage(
  arc: any,
  intensity: number,
  eventCount: number
): any {
  // Stage progression based on intensity and event count
  if (intensity < 20 && eventCount >= 5) return 'resolution';
  if (intensity > 80) return 'climax';
  if (intensity > 60) return 'rising_action';
  if (eventCount < 3) return 'setup';
  if (intensity < 40) return 'falling_action';

  return arc.stage; // Keep current stage
}

/**
 * Get active story arcs for an agent
 */
export const getAgentStoryArcs = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const arcs = await ctx.db
      .query('storyArcs')
      .withIndex('active', (q) =>
        q.eq('worldId', args.worldId).eq('resolvedAt', undefined)
      )
      .collect();

    return arcs.filter(
      (arc) =>
        arc.protagonists.includes(args.agentId) ||
        arc.antagonists?.includes(args.agentId) ||
        arc.supporting?.includes(args.agentId)
    );
  },
});

/**
 * Identify arcs ready to become mythology
 */
export const identifyLegendaryArcs = internalQuery({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const resolvedArcs = await ctx.db
      .query('storyArcs')
      .withIndex('memorable', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.neq(q.field('resolvedAt'), undefined))
      .collect();

    // Arcs with high memorability and emotional impact are legendary
    return resolvedArcs.filter(
      (arc) => arc.memorability > 70 && arc.emotionalImpact > 70
    );
  },
});
