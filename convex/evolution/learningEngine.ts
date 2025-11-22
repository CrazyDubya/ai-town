/**
 * PHASE 6: LEARNING & SKILL ACQUISITION ENGINE
 *
 * Agents develop skills through practice, observation, and teaching.
 * Proficiency grows with successful application.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

// Skill growth rates
const BASE_GROWTH_RATE = 2.0;
const SUCCESS_MULTIPLIER = 1.5;
const FAILURE_PENALTY = 0.5;
const TEACHING_BOOST = 2.0;
const OBSERVATION_RATE = 0.5;

/**
 * Record a learning event and update skill proficiency
 */
export const recordLearningEvent = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    skillCategory: v.string(),
    skillName: v.string(),
    eventType: v.string(),
    wasSuccessful: v.boolean(),
    description: v.string(),
    teacherAgent: v.optional(v.string()),
    relatedEvent: v.optional(v.id('narrativeEvents')),
    relatedQuest: v.optional(v.id('narrativeQuests')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get or create skill
    let skill = await ctx.db
      .query('agentSkills')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .filter((q) => q.eq(q.field('skillName'), args.skillName))
      .first();

    let proficiencyGain = 0;

    if (!skill) {
      // Create new skill
      const initialProficiency = args.teacherAgent ? 10 : 5;

      skill = {
        _id: await ctx.db.insert('agentSkills', {
          worldId: args.worldId,
          agentId: args.agentId,
          skillCategory: args.skillCategory as any,
          skillName: args.skillName,
          description: `Proficiency in ${args.skillName}`,
          proficiency: initialProficiency,
          proficiencyLevel: 'novice',
          timesPerformed: 1,
          successRate: args.wasSuccessful ? 1.0 : 0.0,
          lastPracticed: now,
          growthRate: BASE_GROWTH_RATE,
          plateauThreshold: 80,
          learnedFrom: args.teacherAgent,
          teachingQuality: args.teacherAgent ? 70 : undefined,
          createdAt: now,
          updatedAt: now,
        }),
        proficiency: initialProficiency,
        successRate: args.wasSuccessful ? 1.0 : 0.0,
        timesPerformed: 1,
        growthRate: BASE_GROWTH_RATE,
        plateauThreshold: 80,
      } as any;

      proficiencyGain = initialProficiency;
    } else {
      // Update existing skill
      const newTimesPerformed = skill.timesPerformed + 1;
      const newSuccessRate =
        (skill.successRate * skill.timesPerformed + (args.wasSuccessful ? 1 : 0)) /
        newTimesPerformed;

      // Calculate proficiency gain
      proficiencyGain = calculateProficiencyGain(
        skill.proficiency,
        skill.growthRate,
        skill.plateauThreshold,
        args.eventType as any,
        args.wasSuccessful,
        args.teacherAgent !== undefined
      );

      const newProficiency = Math.min(100, skill.proficiency + proficiencyGain);
      const newLevel = determineProficiencyLevel(newProficiency);
      const oldLevel = skill.proficiencyLevel;

      await ctx.db.patch(skill._id, {
        proficiency: newProficiency,
        proficiencyLevel: newLevel,
        timesPerformed: newTimesPerformed,
        successRate: newSuccessRate,
        lastPracticed: now,
        updatedAt: now,
      });

      // ENHANCEMENT: Reaching expert/master level is a cinematic moment!
      if (newLevel !== oldLevel && (newLevel === 'expert' || newLevel === 'master')) {
        try {
          const skillTitle =
            newLevel === 'master'
              ? `Mastery Achieved: ${args.skillName}`
              : `Expertise Attained: ${args.skillName}`;

          const skillDescription =
            newLevel === 'master'
              ? `${args.agentId} has achieved complete mastery of ${args.skillName}, reaching the pinnacle of ${args.skillCategory} ability.`
              : `${args.agentId} has become an expert in ${args.skillName}, demonstrating exceptional ${args.skillCategory} proficiency.`;

          // Create narrative event for this milestone
          const eventId = await ctx.runMutation(internal.narrative.integration.recordNarrativeEvent, {
            worldId: args.worldId,
            eventType: 'skill_milestone',
            title: skillTitle,
            description: skillDescription,
            primaryAgents: [args.agentId],
            significance: newLevel === 'master' ? 85 : 70,
            emotions: {
              joy: 70,
              sadness: 0,
              anger: 0,
              fear: 0,
            },
          });

          console.log(
            `🎓 MILESTONE: ${args.agentId} reached ${newLevel} level in ${args.skillName}`
          );
        } catch (e) {
          console.log('Could not record skill milestone:', e);
        }
      }
    }

    // Record learning event
    await ctx.db.insert('learningEvents', {
      worldId: args.worldId,
      agentId: args.agentId,
      eventType: args.eventType as any,
      skillCategory: args.skillCategory as any,
      skillName: args.skillName,
      description: args.description,
      wasSuccessful: args.wasSuccessful,
      relatedEvent: args.relatedEvent,
      relatedQuest: args.relatedQuest,
      teacherAgent: args.teacherAgent,
      proficiencyGain,
      occurredAt: now,
    });

    // ENHANCEMENT: Skill growth satisfies competence psychological need
    if (proficiencyGain > 0) {
      try {
        // Scale competence boost based on proficiency gain (bigger gains = more satisfaction)
        const competenceBoost = Math.min(15, Math.ceil(proficiencyGain * 2));

        await ctx.runMutation(internal.emotions.engine.updateNeeds, {
          worldId: args.worldId,
          agentId: args.agentId,
          needChanges: {
            competence: competenceBoost,
          },
        });
      } catch (e) {
        // Silently fail if emotions system not available
        console.log('Could not update competence need:', e);
      }
    }

    return { proficiencyGain, newProficiency: (skill as any).proficiency + proficiencyGain };
  },
});

function calculateProficiencyGain(
  currentProficiency: number,
  growthRate: number,
  plateauThreshold: number,
  eventType: string,
  wasSuccessful: boolean,
  hasTeacher: boolean
): number {
  let baseGain = growthRate;

  // Event type modifiers
  const eventMultipliers: Record<string, number> = {
    experience: 1.0,
    observation: OBSERVATION_RATE,
    teaching: TEACHING_BOOST,
    reflection: 0.7,
    failure: FAILURE_PENALTY,
    success: SUCCESS_MULTIPLIER,
  };

  baseGain *= eventMultipliers[eventType] || 1.0;

  // Success/failure modifier
  if (wasSuccessful) {
    baseGain *= SUCCESS_MULTIPLIER;
  } else {
    baseGain *= FAILURE_PENALTY;
  }

  // Teacher boost
  if (hasTeacher && eventType === 'teaching') {
    baseGain *= TEACHING_BOOST;
  }

  // Diminishing returns as proficiency increases
  if (currentProficiency > plateauThreshold) {
    const plateauFactor = 1 - ((currentProficiency - plateauThreshold) / (100 - plateauThreshold));
    baseGain *= Math.max(0.1, plateauFactor);
  }

  // Learning curve - faster at intermediate levels
  if (currentProficiency >= 20 && currentProficiency <= 60) {
    baseGain *= 1.2;
  }

  return baseGain;
}

function determineProficiencyLevel(proficiency: number): any {
  if (proficiency >= 95) return 'master';
  if (proficiency >= 80) return 'expert';
  if (proficiency >= 60) return 'proficient';
  if (proficiency >= 40) return 'competent';
  if (proficiency >= 20) return 'beginner';
  return 'novice';
}

/**
 * Get agent's skills
 */
export const getAgentSkills = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('agentSkills')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .collect();
  },
});

/**
 * Find potential teachers for a skill
 */
export const findPotentialTeachers = internalQuery({
  args: {
    worldId: v.id('worlds'),
    skillName: v.string(),
    excludeAgentId: v.string(),
    minProficiency: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minProf = args.minProficiency || 60; // Must be at least proficient

    const potentialTeachers = await ctx.db
      .query('agentSkills')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) =>
        q.and(
          q.eq(q.field('skillName'), args.skillName),
          q.gte(q.field('proficiency'), minProf),
          q.neq(q.field('agentId'), args.excludeAgentId)
        )
      )
      .collect();

    return potentialTeachers.sort((a, b) => b.proficiency - a.proficiency);
  },
});

/**
 * Skill decay over time (if not practiced)
 */
export const decayUnusedSkills = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const decayThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days

    const allSkills = await ctx.db
      .query('agentSkills')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    for (const skill of allSkills) {
      const timeSinceUse = now - skill.lastPracticed;

      if (timeSinceUse > decayThreshold) {
        // Decay rate: 0.5 points per month unused
        const monthsUnused = timeSinceUse / (30 * 24 * 60 * 60 * 1000);
        const decay = monthsUnused * 0.5;

        const newProficiency = Math.max(0, skill.proficiency - decay);
        const newLevel = determineProficiencyLevel(newProficiency);

        await ctx.db.patch(skill._id, {
          proficiency: newProficiency,
          proficiencyLevel: newLevel,
          updatedAt: now,
        });
      }
    }
  },
});
