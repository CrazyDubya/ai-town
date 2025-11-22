/**
 * PHASE 4: GAME MASTER INTEGRATION
 *
 * Ties together all narrative systems and provides hooks for the rest
 * of the codebase to interact with the Game Master.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Initialize narrative systems for a new agent
 */
export const initializeAgentNarrative = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Create agent narrative record
    await ctx.db.insert('agentNarratives', {
      worldId: args.worldId,
      agentId: args.agentId,
      arcProgress: 0,
      definingMoments: [],
      activeQuests: [],
      completedQuests: [],
      currentConflicts: [],
      resolvedConflicts: [],
      involvedInArcs: [],
      knownMyths: [],
      believedMyths: [],
      createdMyths: [],
      reputation: 'newcomer',
      narrativeRole: [],
      legendStatus: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Record a narrative event from agent action
 */
export const recordNarrativeEvent = internalMutation({
  args: {
    worldId: v.id('worlds'),
    eventType: v.string(),
    title: v.string(),
    description: v.string(),
    primaryAgents: v.array(v.string()),
    witnessAgents: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    significance: v.number(),
    emotions: v.object({
      joy: v.number(),
      sadness: v.number(),
      anger: v.number(),
      fear: v.number(),
    }),
    weather: v.optional(v.string()),
    timeOfDay: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate emotional intensity
    const emotionalIntensity =
      (args.emotions.joy +
        args.emotions.sadness +
        args.emotions.anger +
        args.emotions.fear) /
      4;

    // Create the event
    const eventId = await ctx.db.insert('narrativeEvents', {
      worldId: args.worldId,
      eventType: args.eventType,
      title: args.title,
      description: args.description,
      primaryAgents: args.primaryAgents,
      witnessAgents: args.witnessAgents,
      location: args.location,
      significance: args.significance,
      emotionalIntensity,
      emotions: args.emotions,
      weather: args.weather,
      timeOfDay: args.timeOfDay,
      occurredAt: now,
      retoldCount: 0,
    });

    // Update defining moments for agents if significant enough
    if (args.significance > 60) {
      for (const agentId of args.primaryAgents) {
        const narrative = await ctx.db
          .query('agentNarratives')
          .withIndex('agentId', (q) =>
            q.eq('worldId', args.worldId).eq('agentId', agentId)
          )
          .first();

        if (narrative) {
          const definingMoments = [...narrative.definingMoments, eventId];
          // Keep only top 10 most significant moments
          if (definingMoments.length > 10) {
            definingMoments.shift();
          }

          await ctx.db.patch(narrative._id, {
            definingMoments,
            updatedAt: now,
          });
        }
      }
    }

    // Progress any story arcs that involve these agents
    await ctx.runMutation(internal.narrative.arcDetection.progressStoryArcs, {
      worldId: args.worldId,
      eventId,
    });

    return eventId;
  },
});

/**
 * Process narrative implications of a conversation
 */
export const processConversationNarrative = internalAction({
  args: {
    worldId: v.id('worlds'),
    agent1Id: v.string(),
    agent2Id: v.string(),
    wasPositive: v.boolean(),
    emotionalIntensity: v.number(),
  },
  handler: async (ctx, args) => {
    // Get emotional states
    const agent1Psychology = await ctx.runQuery(
      internal.emotions.integration.getEmotionalContext,
      { worldId: args.worldId, agentId: args.agent1Id }
    );

    const agent2Psychology = await ctx.runQuery(
      internal.emotions.integration.getEmotionalContext,
      { worldId: args.worldId, agentId: args.agent2Id }
    );

    if (!agent1Psychology || !agent2Psychology) return;

    // Calculate average emotions
    const avgEmotions = {
      joy: (agent1Psychology.currentMood.joy + agent2Psychology.currentMood.joy) / 2,
      sadness:
        (agent1Psychology.currentMood.sadness + agent2Psychology.currentMood.sadness) / 2,
      anger: (agent1Psychology.currentMood.anger + agent2Psychology.currentMood.anger) / 2,
      fear: (agent1Psychology.currentMood.fear + agent2Psychology.currentMood.fear) / 2,
    };

    // Record as narrative event
    const eventId = await ctx.runMutation(
      internal.narrative.integration.recordNarrativeEvent,
      {
        worldId: args.worldId,
        eventType: 'conversation',
        title: args.wasPositive ? 'Friendly Exchange' : 'Tense Interaction',
        description: `Conversation between agents`,
        primaryAgents: [args.agent1Id, args.agent2Id],
        significance: args.emotionalIntensity,
        emotions: avgEmotions,
      }
    );

    // Check for conflict
    if (!args.wasPositive && args.emotionalIntensity > 40) {
      await ctx.runMutation(internal.narrative.conflictEngine.detectConflicts, {
        worldId: args.worldId,
        agent1Id: args.agent1Id,
        agent2Id: args.agent2Id,
        eventId,
      });
    }

    // Check for resolution of existing conflicts
    if (args.wasPositive) {
      await ctx.runMutation(internal.narrative.conflictEngine.processConflictResolution, {
        worldId: args.worldId,
        agent1Id: args.agent1Id,
        agent2Id: args.agent2Id,
        wasPositive: true,
      });
    }

    // Chance to share mythology during positive conversations
    if (args.wasPositive && Math.random() < 0.3) {
      await ctx.runMutation(internal.narrative.mythologySystem.shareMythology, {
        worldId: args.worldId,
        tellerId: args.agent1Id,
        listenerId: args.agent2Id,
      });
    }
  },
});

/**
 * Game Master tick - runs periodically to manage narrative systems
 */
export const gameMasterTick = internalAction({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Detect new story arcs
    await ctx.runMutation(internal.narrative.arcDetection.detectStoryArcs, {
      worldId: args.worldId,
    });

    // Generate quests for agents who need them
    const allAgents = await ctx.runQuery(internal.aiTown.main.getActiveAgents, {
      worldId: args.worldId,
    });

    // Generate quests for a few random agents each tick
    const agentsToProcess = allAgents
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, allAgents.length));

    for (const agent of agentsToProcess) {
      await ctx.runMutation(internal.narrative.questSystem.generateQuestsForAgent, {
        worldId: args.worldId,
        agentId: agent.id,
      });

      // Also try mythology quests
      await ctx.runMutation(internal.narrative.questSystem.generateMythologyQuests, {
        worldId: args.worldId,
        agentId: agent.id,
      });
    }

    // Natural conflict decay
    await ctx.runMutation(internal.narrative.conflictEngine.decayConflicts, {
      worldId: args.worldId,
    });

    // Transform legendary arcs into mythology
    await ctx.runMutation(internal.narrative.mythologySystem.createMythologyFromArcs, {
      worldId: args.worldId,
    });

    // Create rituals from patterns
    await ctx.runMutation(internal.narrative.mythologySystem.createRituals, {
      worldId: args.worldId,
    });

    // Evolve mythology (establish or fade)
    await ctx.runMutation(internal.narrative.mythologySystem.evolveMythology, {
      worldId: args.worldId,
    });
  },
});

/**
 * Enhance conversation prompt with narrative context
 */
export const enhancePromptWithNarrative = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    otherAgentId: v.optional(v.string()),
    basePrompt: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const enhanced = [...args.basePrompt];

    // Get active quests
    const questContext = await ctx.runQuery(
      internal.narrative.questSystem.getQuestContext,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      }
    );

    if (questContext) {
      enhanced.push('');
      enhanced.push('CURRENT QUEST:');
      enhanced.push(`Quest: ${questContext.currentQuest}`);
      enhanced.push(`Motivation: ${questContext.motivation}`);
      enhanced.push(
        `Objectives: ${questContext.objectives.join(', ')}`
      );
    }

    // Get conflict context
    const conflictContext = await ctx.runQuery(
      internal.narrative.conflictEngine.getConflictContext,
      {
        worldId: args.worldId,
        agentId: args.agentId,
        otherAgentId: args.otherAgentId,
      }
    );

    if (conflictContext?.hasConflict) {
      enhanced.push('');
      enhanced.push('CONFLICT WARNING:');
      enhanced.push(
        `You have a ${conflictContext.severity} ${conflictContext.conflictType} conflict with this person.`
      );
      enhanced.push(`Tension level: ${conflictContext.intensity}/100`);
      enhanced.push(
        `Status: ${conflictContext.status}. Consider how to handle this.`
      );
    } else if (conflictContext?.hasActiveConflicts) {
      enhanced.push('');
      enhanced.push(
        `You have ${conflictContext.conflictCount} active conflict(s) weighing on your mind.`
      );
    }

    // Get mythology context
    const mythContext = await ctx.runQuery(
      internal.narrative.mythologySystem.getMythologyContext,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      }
    );

    if (mythContext) {
      enhanced.push('');
      enhanced.push('CULTURAL BELIEFS:');
      enhanced.push(`You believe in "${mythContext.believesIn}" (${mythContext.mythType})`);
      enhanced.push(`Moral: ${mythContext.moralLesson}`);
      enhanced.push(`This is a ${mythContext.culturalImportance > 70 ? 'sacred' : 'known'} story in your culture.`);
    }

    // Get story arc context
    const arcs = await ctx.runQuery(internal.narrative.arcDetection.getAgentStoryArcs, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (arcs.length > 0) {
      const activeArc = arcs[0];
      enhanced.push('');
      enhanced.push('CURRENT STORY:');
      enhanced.push(`You're in the midst of: ${activeArc.title}`);
      enhanced.push(`Stage: ${activeArc.stage}, Intensity: ${activeArc.intensity}/100`);
      enhanced.push(`This ${activeArc.arcType} story is unfolding around you.`);
    }

    return enhanced;
  },
});

/**
 * Get narrative summary for an agent
 */
export const getAgentNarrativeSummary = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const narrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!narrative) return null;

    const activeQuests = await ctx.db
      .query('narrativeQuests')
      .withIndex('assignedTo', (q) =>
        q.eq('worldId', args.worldId).eq('assignedTo', args.agentId).eq('status', 'active')
      )
      .collect();

    const conflicts = await ctx.runQuery(
      internal.narrative.conflictEngine.getAgentConflicts,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      }
    );

    const arcs = await ctx.runQuery(internal.narrative.arcDetection.getAgentStoryArcs, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    return {
      narrative,
      activeQuests: activeQuests.length,
      completedQuests: narrative.completedQuests.length,
      activeConflicts: conflicts.length,
      resolvedConflicts: narrative.resolvedConflicts.length,
      currentArcs: arcs.length,
      knownMyths: narrative.knownMyths.length,
      createdMyths: narrative.createdMyths.length,
      legendStatus: narrative.legendStatus,
      reputation: narrative.reputation,
    };
  },
});
