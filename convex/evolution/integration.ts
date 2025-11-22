/**
 * PHASE 6: EVOLUTION INTEGRATION
 *
 * Ties evolution systems into existing narrative, emotional, and world systems.
 * Manages agent growth, learning, and knowledge transfer.
 */

import { v } from 'convex/values';
import { internalMutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Initialize evolution systems for a new agent
 */
export const initializeAgentEvolution = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    baselinePersonality: v.object({
      openness: v.number(),
      conscientiousness: v.number(),
      extraversion: v.number(),
      agreeableness: v.number(),
      neuroticism: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Initialize personality evolution tracking
    await ctx.runMutation(internal.evolution.personalityEvolution.initializePersonalityEvolution, {
      worldId: args.worldId,
      agentId: args.agentId,
      baselinePersonality: args.baselinePersonality,
    });

    // Initialize legacy tracking
    const now = Date.now();
    await ctx.db.insert('agentLegacy', {
      worldId: args.worldId,
      agentId: args.agentId,
      wisdomCreated: [],
      skillsMastered: [],
      apprenticesTrained: [],
      mythsCreated: [],
      arcsCompleted: [],
      agentsInfluenced: 0,
      culturalImpact: 0,
      legendStatus: 0,
      irreplaceableWisdom: [],
      atRiskKnowledge: [],
      majorEvents: [],
      definingMoments: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Process quest completion for learning
 */
export const processQuestForLearning = internalAction({
  args: {
    worldId: v.id('worlds'),
    questId: v.id('narrativeQuests'),
    agentId: v.string(),
    wasSuccessful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const quest = await ctx.runQuery(internal.narrative.questSystem.getAgentQuests, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    const relevantQuest = quest.find((q) => q._id === args.questId);
    if (!relevantQuest) return;

    // Map quest type to skill category
    const skillMapping: Record<string, string> = {
      social: 'social',
      emotional: 'emotional',
      ritual: 'cultural',
      reconciliation: 'conflict',
      exploration: 'exploration',
      challenge: 'leadership',
      creation: 'creativity',
      discovery: 'wisdom',
    };

    const skillCategory = skillMapping[relevantQuest.questType] || 'social';

    // Record learning event
    await ctx.runMutation(internal.evolution.learningEngine.recordLearningEvent, {
      worldId: args.worldId,
      agentId: args.agentId,
      skillCategory,
      skillName: relevantQuest.questType,
      eventType: 'experience',
      wasSuccessful: args.wasSuccessful,
      description: `Completed quest: ${relevantQuest.title}`,
      relatedQuest: args.questId,
    });

    // Successful quest completion triggers positive personality evolution
    if (args.wasSuccessful) {
      await ctx.runMutation(
        internal.evolution.personalityEvolution.analyzeForPersonalityEvolution,
        {
          worldId: args.worldId,
          agentId: args.agentId,
          eventType: 'quest',
          wasPositive: true,
          intensity: relevantQuest.priority,
        }
      );
    }
  },
});

/**
 * Process conversation for learning and personality evolution
 */
export const processConversationForEvolution = internalAction({
  args: {
    worldId: v.id('worlds'),
    agent1Id: v.string(),
    agent2Id: v.string(),
    wasPositive: v.boolean(),
    hadConflict: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Both agents learn from social interaction
    for (const agentId of [args.agent1Id, args.agent2Id]) {
      // Learn social skills
      await ctx.runMutation(internal.evolution.learningEngine.recordLearningEvent, {
        worldId: args.worldId,
        agentId,
        skillCategory: 'social',
        skillName: 'conversation',
        eventType: 'experience',
        wasSuccessful: args.wasPositive,
        description: 'Participated in conversation',
      });

      // Conflict resolution skill if there was conflict
      if (args.hadConflict) {
        await ctx.runMutation(internal.evolution.learningEngine.recordLearningEvent, {
          worldId: args.worldId,
          agentId,
          skillCategory: 'conflict',
          skillName: 'conflict_resolution',
          eventType: 'experience',
          wasSuccessful: args.wasPositive,
          description: 'Navigated conflict situation',
        });
      }

      // Personality evolution
      await ctx.runMutation(
        internal.evolution.personalityEvolution.analyzeForPersonalityEvolution,
        {
          worldId: args.worldId,
          agentId,
          eventType: args.hadConflict ? 'conflict' : 'conversation',
          wasPositive: args.wasPositive,
          intensity: args.hadConflict ? 70 : 40,
        }
      );
    }

    // Check for mentorship opportunity (if very positive interaction)
    if (args.wasPositive && !args.hadConflict && Math.random() < 0.1) {
      // 10% chance
      // Determine who could mentor whom based on skills
      const agent1Skills = await ctx.runQuery(internal.evolution.learningEngine.getAgentSkills, {
        worldId: args.worldId,
        agentId: args.agent1Id,
      });

      const agent2Skills = await ctx.runQuery(internal.evolution.learningEngine.getAgentSkills, {
        worldId: args.worldId,
        agentId: args.agent2Id,
      });

      const agent1MaxSkill = Math.max(...agent1Skills.map((s) => s.proficiency), 0);
      const agent2MaxSkill = Math.max(...agent2Skills.map((s) => s.proficiency), 0);

      // Agent with significantly higher skill could mentor
      if (Math.abs(agent1MaxSkill - agent2MaxSkill) > 30) {
        const mentorId = agent1MaxSkill > agent2MaxSkill ? args.agent1Id : args.agent2Id;
        const apprenticeId = agent1MaxSkill > agent2MaxSkill ? args.agent2Id : args.agent1Id;

        const mentorSkills = agent1MaxSkill > agent2MaxSkill ? agent1Skills : agent2Skills;
        const topSkills = mentorSkills
          .filter((s) => s.proficiency >= 60)
          .slice(0, 2)
          .map((s) => s.skillCategory);

        if (topSkills.length > 0) {
          await ctx.runMutation(internal.evolution.wisdomSystem.establishMentorship, {
            worldId: args.worldId,
            mentorId,
            apprenticeId,
            focusSkills: topSkills as any[],
          });
        }
      }
    }
  },
});

/**
 * Evolution tick - runs periodically
 */
export const evolutionTick = internalAction({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Decay unused skills
    await ctx.runMutation(internal.evolution.learningEngine.decayUnusedSkills, {
      worldId: args.worldId,
    });

    // Identify at-risk knowledge
    const atRiskWisdom = await ctx.runQuery(internal.evolution.wisdomSystem.identifyAtRiskKnowledge, {
      worldId: args.worldId,
    });

    // Update legacy tracking for at-risk knowledge
    for (const wisdom of atRiskWisdom) {
      for (const agentId of wisdom.knownBy) {
        const legacy = await ctx.db
          .query('agentLegacy')
          .withIndex('agentId', (q: any) =>
            q.eq('worldId', args.worldId).eq('agentId', agentId)
          )
          .first();

        if (legacy && !legacy.atRiskKnowledge.includes(wisdom.wisdomId)) {
          await ctx.db.patch(legacy._id, {
            atRiskKnowledge: [...legacy.atRiskKnowledge, wisdom.wisdomId],
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Conduct active mentorship sessions (random selection)
    const activeMentorships = await ctx.db
      .query('mentorships')
      .withIndex('status', (q: any) =>
        q.eq('worldId', args.worldId).eq('status', 'active')
      )
      .collect();

    // Process a few mentorship sessions each tick
    const sessionsToRun = activeMentorships
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, activeMentorships.length));

    for (const mentorship of sessionsToRun) {
      await ctx.runMutation(internal.evolution.wisdomSystem.conductMentorshipSession, {
        worldId: args.worldId,
        mentorshipId: mentorship._id,
      });
    }
  },
});

/**
 * Consolidate memories into wisdom
 */
export const consolidateMemoriesToWisdom = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get consolidated memories for this agent
    const memories = await ctx.db
      .query('consolidatedMemories')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .collect();

    // Group related memories
    const memoryGroups = groupRelatedMemories(memories);

    // Create wisdom from groups
    for (const group of memoryGroups) {
      if (group.length >= 2) {
        // Need at least 2 memories to form wisdom
        await ctx.runMutation(internal.evolution.wisdomSystem.createWisdomFromMemories, {
          worldId: args.worldId,
          agentId: args.agentId,
          memoryIds: group.map((m) => m._id),
        });
      }
    }
  },
});

function groupRelatedMemories(memories: any[]): any[][] {
  // Simple grouping by memory type
  const groups: Record<string, any[]> = {};

  for (const memory of memories) {
    if (!groups[memory.memoryType]) {
      groups[memory.memoryType] = [];
    }
    groups[memory.memoryType].push(memory);
  }

  return Object.values(groups).filter((group) => group.length >= 2);
}

/**
 * Get comprehensive evolution status for an agent
 */
export const getAgentEvolutionStatus = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get skills
    const skills = await ctx.runQuery(internal.evolution.learningEngine.getAgentSkills, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    // Get personality evolution
    const personalityEvolution = await ctx.runQuery(
      internal.evolution.personalityEvolution.getPersonalityEvolution,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      }
    );

    // Get legacy
    const legacy = await ctx.db
      .query('agentLegacy')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get mentorships (as mentor and apprentice)
    const asMentor = await ctx.db
      .query('mentorships')
      .withIndex('mentor', (q) =>
        q.eq('worldId', args.worldId).eq('mentorId', args.agentId)
      )
      .collect();

    const asApprentice = await ctx.db
      .query('mentorships')
      .withIndex('apprentice', (q) =>
        q.eq('worldId', args.worldId).eq('apprenticeId', args.agentId)
      )
      .collect();

    // Get irreplaceable wisdom
    const irreplaceableWisdom = await ctx.runQuery(
      internal.evolution.wisdomSystem.getIrreplaceableWisdom,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      }
    );

    return {
      skills: {
        total: skills.length,
        byLevel: {
          master: skills.filter((s) => s.proficiencyLevel === 'master').length,
          expert: skills.filter((s) => s.proficiencyLevel === 'expert').length,
          proficient: skills.filter((s) => s.proficiencyLevel === 'proficient').length,
        },
        top3: skills.sort((a, b) => b.proficiency - a.proficiency).slice(0, 3),
      },
      personality: {
        hasEvolved: personalityEvolution ? personalityEvolution.evolutionCount > 0 : false,
        totalDrift: personalityEvolution?.totalDrift || 0,
        significantChanges: personalityEvolution?.significantChanges || [],
      },
      legacy: {
        culturalImpact: legacy?.culturalImpact || 0,
        agentsInfluenced: legacy?.agentsInfluenced || 0,
        wisdomCreated: legacy?.wisdomCreated.length || 0,
        irreplaceableWisdom: irreplaceableWisdom.length,
      },
      mentorship: {
        asMentor: asMentor.length,
        asApprentice: asApprentice.length,
        activeMentorships: [...asMentor, ...asApprentice].filter((m) => m.status === 'active')
          .length,
      },
    };
  },
});
