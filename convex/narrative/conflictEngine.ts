/**
 * PHASE 4: CONFLICT ESCALATION & RESOLUTION ENGINE
 *
 * Manages dramatic tension between agents. Tracks conflicts, determines when
 * they escalate or resolve, and creates opportunities for reconciliation.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Detect and create new conflicts from negative interactions
 */
export const detectConflicts = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agent1Id: v.string(),
    agent2Id: v.string(),
    eventId: v.id('narrativeEvents'),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    // Check if there's already an active conflict between these agents
    const existingConflict = await ctx.db
      .query('conflicts')
      .withIndex('agent1', (q) =>
        q.eq('worldId', args.worldId).eq('agent1Id', args.agent1Id)
      )
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field('agent2Id'), args.agent2Id),
            q.eq(q.field('agent1Id'), args.agent2Id)
          ),
          q.or(
            q.eq(q.field('status'), 'active'),
            q.eq(q.field('status'), 'escalating'),
            q.eq(q.field('status'), 'emerging')
          )
        )
      )
      .first();

    // Determine if this event indicates conflict
    const hasHighAnger = (event.emotions.anger || 0) > 50;
    const hasHighFear = (event.emotions.fear || 0) > 50;
    const hasNegativeEmotions = hasHighAnger || hasHighFear;

    if (!hasNegativeEmotions && !existingConflict) {
      return null; // No conflict
    }

    const now = Date.now();

    // Get emotional bond between agents
    const bond = await ctx.db
      .query('emotionalBonds')
      .withIndex('agentPair', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agent1Id).eq('otherAgentId', args.agent2Id)
      )
      .first();

    // Get peer reputation
    const peerRep = await ctx.db
      .query('peerReputations')
      .withIndex('raterRatee', (q: any) =>
        q.eq('worldId', args.worldId).eq('raterId', args.agent1Id).eq('rateeId', args.agent2Id)
      )
      .first();

    if (existingConflict) {
      // Escalate existing conflict
      const newIntensity = Math.min(
        100,
        existingConflict.intensityScore + calculateIntensityIncrease(event)
      );
      const newSeverity = determineSeverity(newIntensity);
      const newStatus = determineConflictStatus(newIntensity, existingConflict.status);

      await ctx.db.patch(existingConflict._id, {
        intensityScore: newIntensity,
        severity: newSeverity,
        status: newStatus,
        escalationEvents: [...existingConflict.escalationEvents, args.eventId],
        lastEscalationAt: now,
      });

      // Log escalation
      await ctx.db.insert('gameMasterActions', {
        worldId: args.worldId,
        actionType: 'conflict_escalated',
        affectedAgents: [args.agent1Id, args.agent2Id],
        trigger: 'Negative interaction detected',
        reasoning: `Conflict escalated to ${newSeverity} (intensity: ${newIntensity})`,
        timestamp: now,
      });

      return existingConflict._id;
    } else {
      // Create new conflict
      const conflictType = determineConflictType(event, bond, peerRep);
      const initialIntensity = calculateIntensityIncrease(event);
      const severity = determineSeverity(initialIntensity);

      const conflictId = await ctx.db.insert('conflicts', {
        worldId: args.worldId,
        agent1Id: args.agent1Id,
        agent2Id: args.agent2Id,
        conflictType,
        severity,
        intensityScore: initialIntensity,
        triggerEvent: args.eventId,
        escalationEvents: [],
        status: 'emerging',
        startedAt: now,
        lastEscalationAt: now,
      });

      // Create a conflict resolution quest for both agents
      const quest1 = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: 'reconciliation',
        assignedTo: args.agent1Id,
        issuedBy: 'game_master',
        title: 'Address the Tension',
        description: `There's growing conflict. Should I confront it or let it be?`,
        motivation: 'Managing interpersonal conflict',
        objectives: [
          {
            description: 'Decide how to handle the conflict',
            type: 'decision',
            completed: false,
          },
        ],
        status: 'active',
        priority: 70,
        createdAt: now,
        acceptedAt: now,
        relatedConflict: conflictId,
      });

      // Log new conflict
      await ctx.db.insert('gameMasterActions', {
        worldId: args.worldId,
        actionType: 'conflict_escalated',
        affectedAgents: [args.agent1Id, args.agent2Id],
        trigger: 'Negative interaction created new conflict',
        reasoning: `New ${conflictType} conflict detected (${severity})`,
        timestamp: now,
      });

      return conflictId;
    }
  },
});

function calculateIntensityIncrease(event: any): number {
  const anger = event.emotions.anger || 0;
  const fear = event.emotions.fear || 0;
  const sadness = event.emotions.sadness || 0;

  // High anger increases intensity most
  let increase = anger * 0.5;

  // Fear and sadness contribute less but still matter
  increase += fear * 0.3;
  increase += sadness * 0.2;

  // Event significance multiplies the impact
  const significanceMultiplier = 1 + (event.significance / 100);

  return Math.min(50, increase * significanceMultiplier);
}

function determineSeverity(intensity: number): 'minor' | 'moderate' | 'serious' | 'critical' {
  if (intensity >= 75) return 'critical';
  if (intensity >= 50) return 'serious';
  if (intensity >= 25) return 'moderate';
  return 'minor';
}

function determineConflictStatus(
  intensity: number,
  currentStatus: string
): 'emerging' | 'active' | 'escalating' | 'climactic' | 'resolving' | 'resolved' | 'dormant' {
  if (intensity < 10) return 'resolved';
  if (intensity < 20) return 'resolving';
  if (intensity >= 80) return 'climactic';
  if (intensity >= 60 && currentStatus === 'active') return 'escalating';
  if (intensity >= 30) return 'active';
  return 'emerging';
}

function determineConflictType(event: any, bond: any, peerRep: any): string {
  // High anger with broken bond = betrayal
  if (bond && bond.bondStrength < -30 && (event.emotions.anger || 0) > 60) {
    return 'betrayal';
  }

  // Low reputation = personal dislike
  if (peerRep && peerRep.reputationScore < -30) {
    return 'personal';
  }

  // High anger, high anticipation = competitive
  if ((event.emotions.anger || 0) > 40 && (event.emotions.anticipation || 0) > 40) {
    return 'competitive';
  }

  // High fear = threatening situation
  if ((event.emotions.fear || 0) > 50) {
    return 'threatening';
  }

  // Default to ideological (differing values)
  return 'ideological';
}

/**
 * Process conflict de-escalation from positive interactions
 */
export const processConflictResolution = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agent1Id: v.string(),
    agent2Id: v.string(),
    wasPositive: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.wasPositive) return;

    // Find active conflicts between these agents
    const conflicts = await ctx.db
      .query('conflicts')
      .withIndex('agent1', (q) =>
        q.eq('worldId', args.worldId).eq('agent1Id', args.agent1Id)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('agent2Id'), args.agent2Id),
          q.or(
            q.eq(q.field('status'), 'active'),
            q.eq(q.field('status'), 'escalating'),
            q.eq(q.field('status'), 'climactic')
          )
        )
      )
      .collect();

    const now = Date.now();

    for (const conflict of conflicts) {
      // Positive interaction reduces intensity
      const reductionAmount = 15; // Positive interactions have strong de-escalating effect
      const newIntensity = Math.max(0, conflict.intensityScore - reductionAmount);
      const newSeverity = determineSeverity(newIntensity);
      const newStatus = newIntensity < 20 ? 'resolving' : conflict.status;

      await ctx.db.patch(conflict._id, {
        intensityScore: newIntensity,
        severity: newSeverity,
        status: newStatus,
      });

      // If resolved, mark resolution type
      if (newIntensity === 0) {
        await ctx.db.patch(conflict._id, {
          status: 'resolved',
          resolutionType: 'reconciliation',
          resolvedAt: now,
        });

        // Complete any reconciliation quests
        const quests = await ctx.db
          .query('narrativeQuests')
          .withIndex('assignedTo', (q) =>
            q.eq('worldId', args.worldId).eq('assignedTo', args.agent1Id).eq('status', 'active')
          )
          .filter((q) => q.eq(q.field('relatedConflict'), conflict._id))
          .collect();

        for (const quest of quests) {
          await ctx.db.patch(quest._id, {
            status: 'completed',
            completedAt: now,
          });
        }
      }
    }
  },
});

/**
 * Natural conflict decay over time
 */
export const decayConflicts = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const activeConflicts = await ctx.db
      .query('conflicts')
      .withIndex('active', (q) =>
        q.eq('worldId', args.worldId).eq('status', 'active')
      )
      .collect();

    const now = Date.now();
    const decayInterval = 60 * 60 * 1000; // 1 hour

    for (const conflict of activeConflicts) {
      const timeSinceEscalation = now - conflict.lastEscalationAt;

      // Conflicts naturally cool off if no recent escalation
      if (timeSinceEscalation > decayInterval) {
        const decayAmount = 5;
        const newIntensity = Math.max(0, conflict.intensityScore - decayAmount);
        const newSeverity = determineSeverity(newIntensity);

        await ctx.db.patch(conflict._id, {
          intensityScore: newIntensity,
          severity: newSeverity,
          status: newIntensity < 20 ? 'dormant' : conflict.status,
        });
      }
    }
  },
});

/**
 * Get conflicts involving an agent
 */
export const getAgentConflicts = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const conflicts1 = await ctx.db
      .query('conflicts')
      .withIndex('agent1', (q) =>
        q.eq('worldId', args.worldId).eq('agent1Id', args.agentId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'escalating'),
          q.eq(q.field('status'), 'climactic')
        )
      )
      .collect();

    const conflicts2 = await ctx.db
      .query('conflicts')
      .withIndex('agent2', (q) =>
        q.eq('worldId', args.worldId).eq('agent2Id', args.agentId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'escalating'),
          q.eq(q.field('status'), 'climactic')
        )
      )
      .collect();

    return [...conflicts1, ...conflicts2];
  },
});

/**
 * Get conflict context for conversation prompts
 */
export const getConflictContext = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    otherAgentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conflicts = await ctx.runQuery(internal.narrative.conflictEngine.getAgentConflicts, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (conflicts.length === 0) return null;

    // If talking to specific agent, check for conflict with them
    if (args.otherAgentId) {
      const specificConflict = conflicts.find(
        (c) =>
          (c.agent1Id === args.otherAgentId || c.agent2Id === args.otherAgentId)
      );

      if (specificConflict) {
        return {
          hasConflict: true,
          conflictType: specificConflict.conflictType,
          severity: specificConflict.severity,
          intensity: specificConflict.intensityScore,
          status: specificConflict.status,
        };
      }
    }

    // Otherwise return most intense conflict
    const mostIntense = conflicts.sort((a, b) => b.intensityScore - a.intensityScore)[0];

    return {
      hasActiveConflicts: true,
      conflictCount: conflicts.length,
      mostIntenseType: mostIntense.conflictType,
      mostIntenseSeverity: mostIntense.severity,
    };
  },
});
