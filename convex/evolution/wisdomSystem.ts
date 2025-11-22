/**
 * PHASE 6 INSPIRED: WISDOM INHERITANCE & MENTORSHIP
 *
 * Experienced agents can mentor others, passing down knowledge.
 * Creates generational knowledge transfer. Elder agents become
 * irreplaceable repositories of cultural wisdom.
 *
 * KNOWLEDGE DIES WITH THE KNOWER UNLESS PASSED DOWN.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

// Wisdom profundity thresholds
const PROFOUND_THRESHOLD = 70;
const SACRED_THRESHOLD = 90;

/**
 * Create wisdom from consolidated memories
 */
export const createWisdomFromMemories = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    memoryIds: v.array(v.id('consolidatedMemories')),
  },
  handler: async (ctx, args) => {
    if (args.memoryIds.length === 0) return null;

    // Get memories
    const memories = await Promise.all(args.memoryIds.map((id) => ctx.db.get(id)));
    const validMemories = memories.filter((m) => m !== null);

    if (validMemories.length === 0) return null;

    // Extract patterns and lessons
    const lessons = validMemories
      .map((m) => m!.lesson)
      .filter((l) => l !== undefined);

    if (lessons.length === 0) return null;

    // Synthesize wisdom
    const wisdomContent = synthesizeWisdom(validMemories as any[]);
    const category = determineWisdomCategory(validMemories as any[]);

    // Calculate quality metrics
    const profundity = calculateProfundity(validMemories as any[]);
    const applicability = calculateApplicability(validMemories as any[]);
    const veracity = calculateVeracity(validMemories as any[]);

    const now = Date.now();

    const wisdomId = await ctx.db.insert('wisdomEntries', {
      worldId: args.worldId,
      title: `Wisdom: ${wisdomContent.title}`,
      content: wisdomContent.content,
      category,
      originatorAgent: args.agentId,
      derivedFrom: args.memoryIds,
      profundity,
      applicability,
      veracity,
      knownBy: [args.agentId],
      masteredBy: [args.agentId],
      teachingDifficulty: calculateTeachingDifficulty(profundity, applicability),
      prerequisiteWisdom: [],
      culturalValue: profundity * 0.5,
      timesShared: 0,
      successfulApplications: 0,
      createdAt: now,
      lastShared: now,
    });

    // Update agent legacy
    await updateAgentLegacy(ctx, args.worldId, args.agentId, 'wisdomCreated', wisdomId);

    return wisdomId;
  },
});

function synthesizeWisdom(memories: any[]): { title: string; content: string } {
  // Simplified wisdom synthesis
  const dominantType = memories[0].memoryType;

  const templates: Record<string, { title: string; content: string }> = {
    lesson: {
      title: 'Pattern Recognition',
      content: 'Through repeated experience, certain patterns emerge that guide future action.',
    },
    trauma: {
      title: 'Guarding Against Pain',
      content:
        'Traumatic experiences teach us to protect ourselves, though sometimes at the cost of connection.',
    },
    triumph: {
      title: 'Path to Success',
      content: 'Success leaves clues - the actions that led to triumph can be repeated.',
    },
    relationship: {
      title: 'Understanding Others',
      content: 'Relationships teach us about trust, vulnerability, and the complexity of connection.',
    },
    wisdom: {
      title: 'Deeper Truth',
      content: 'Some insights transcend individual experience and touch universal truths.',
    },
  };

  return templates[dominantType] || templates.wisdom;
}

function determineWisdomCategory(memories: any[]): string {
  const memoryTypes = memories.map((m) => m.memoryType);

  if (memoryTypes.includes('relationship')) return 'social';
  if (memoryTypes.includes('trauma') || memoryTypes.includes('triumph'))
    return 'emotional';
  if (memoryTypes.includes('wisdom')) return 'philosophical';

  return 'practical';
}

function calculateProfundity(memories: any[]): number {
  // Based on memory strength and emotional charge
  const avgStrength = memories.reduce((sum, m) => sum + m.strength, 0) / memories.length;
  const avgEmotionalCharge =
    memories.reduce((sum, m) => sum + Math.abs(m.emotionalCharge), 0) /
    memories.length;

  return Math.min(100, avgStrength * 0.6 + avgEmotionalCharge * 0.4);
}

function calculateApplicability(memories: any[]): number {
  // How broadly useful is this wisdom?
  const hasPattern = memories.some((m) => m.pattern !== undefined);
  const hasCauseEffect = memories.some((m) => m.causeEffect !== undefined);

  let applicability = 50;

  if (hasPattern) applicability += 20;
  if (hasCauseEffect) applicability += 20;
  if (memories.length > 3) applicability += 10; // More evidence = more applicable

  return Math.min(100, applicability);
}

function calculateVeracity(memories: any[]): number {
  // How reliable is this wisdom?
  const hasCauseEffect = memories.find((m) => m.causeEffect !== undefined);

  if (hasCauseEffect) {
    return hasCauseEffect.causeEffect.confidence * 100;
  }

  // Based on number of confirming memories
  return Math.min(90, 50 + memories.length * 10);
}

function calculateTeachingDifficulty(profundity: number, applicability: number): number {
  // More profound wisdom is harder to teach
  // More applicable wisdom is easier to teach

  return Math.max(0, Math.min(100, profundity - applicability * 0.5));
}

/**
 * Share wisdom from mentor to apprentice
 */
export const shareWisdom = internalMutation({
  args: {
    worldId: v.id('worlds'),
    wisdomId: v.id('wisdomEntries'),
    teacherId: v.string(),
    learnerId: v.string(),
  },
  handler: async (ctx, args) => {
    const wisdom = await ctx.db.get(args.wisdomId);
    if (!wisdom) return null;

    // Check if teacher knows this wisdom
    if (!wisdom.knownBy.includes(args.teacherId)) {
      return { success: false, reason: 'Teacher does not know this wisdom' };
    }

    // Check if learner already knows
    if (wisdom.knownBy.includes(args.learnerId)) {
      // Maybe they can deepen understanding (move from known to mastered)
      if (!wisdom.masteredBy.includes(args.learnerId)) {
        // Chance to master based on teaching quality
        const teacherMastery = wisdom.masteredBy.includes(args.teacherId);
        const masteryChance = teacherMastery ? 0.6 : 0.3;

        if (Math.random() < masteryChance) {
          await ctx.db.patch(args.wisdomId, {
            masteredBy: [...wisdom.masteredBy, args.learnerId],
          });

          return { success: true, deepened: true, mastered: true };
        }

        return { success: true, deepened: true, mastered: false };
      }

      return { success: false, reason: 'Already known and mastered' };
    }

    // Teaching success based on difficulty and teacher mastery
    const teacherMastery = wisdom.masteredBy.includes(args.teacherId);
    const baseDifficulty = wisdom.teachingDifficulty;

    const teacherBonus = teacherMastery ? 30 : 0;
    const successChance = Math.max(0.1, (100 - baseDifficulty + teacherBonus) / 100);

    const success = Math.random() < successChance;

    if (success) {
      const now = Date.now();

      const newKnownBy = [...wisdom.knownBy, args.learnerId];
      const newTimesShared = wisdom.timesShared + 1;
      const newCulturalValue = Math.min(100, wisdom.culturalValue + 1);

      await ctx.db.patch(args.wisdomId, {
        knownBy: newKnownBy,
        timesShared: newTimesShared,
        lastShared: now,
        culturalValue: newCulturalValue,
      });

      // ENHANCEMENT: When wisdom becomes widely shared and valued, transform into mythology
      if (
        newCulturalValue >= 80 &&
        newKnownBy.length >= 5 &&
        newTimesShared >= 10
      ) {
        try {
          await ctx.runMutation(internal.narrative.mythologySystem.createMythFromWisdom, {
            worldId: args.worldId,
            wisdomId: args.wisdomId,
            wisdomContent: wisdom.content,
            culturalValue: newCulturalValue,
            knownByCount: newKnownBy.length,
          });

          console.log(
            `📜 TRANSFORMATION: Wisdom "${wisdom.content.slice(0, 50)}..." became cultural mythology`
          );
        } catch (e) {
          console.log('Could not transform wisdom to mythology:', e);
        }
      }

      // Update agent legacy
      await updateAgentLegacy(ctx, args.worldId, args.teacherId, 'apprenticesTrained', args.learnerId);

      return { success: true, deepened: false };
    }

    return { success: false, reason: 'Teaching attempt unsuccessful' };
  },
});

/**
 * Create or update mentorship relationship
 */
export const establishMentorship = internalMutation({
  args: {
    worldId: v.id('worlds'),
    mentorId: v.string(),
    apprenticeId: v.string(),
    focusSkills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if mentorship already exists
    const existing = await ctx.db
      .query('mentorships')
      .withIndex('mentor', (q) =>
        q.eq('worldId', args.worldId).eq('mentorId', args.mentorId)
      )
      .filter((q) => q.eq(q.field('apprenticeId'), args.apprenticeId))
      .first();

    if (existing && existing.status === 'active') {
      return { exists: true, mentorshipId: existing._id };
    }

    const now = Date.now();

    // Get mentor's skills
    const mentorSkills = await ctx.db
      .query('agentSkills')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.mentorId)
      )
      .collect();

    // Get relevant wisdom
    const mentorWisdom = await ctx.db
      .query('wisdomEntries')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.eq(q.field('knownBy'), args.mentorId))
      .collect();

    // Calculate compatibility
    const compatibility = Math.floor(Math.random() * 30 + 60); // 60-90

    const mentorshipId = await ctx.db.insert('mentorships', {
      worldId: args.worldId,
      mentorId: args.mentorId,
      apprenticeId: args.apprenticeId,
      focusSkills: args.focusSkills as any[],
      focusWisdom: mentorWisdom.slice(0, 5).map((w) => w._id),
      sessionsHeld: 0,
      wisdomTransferred: [],
      skillsImproved: [],
      compatibility,
      teachingEffectiveness: 70,
      learningReceptivity: 70,
      status: 'active',
      startedAt: now,
      lastSession: now,
    });

    return { exists: false, mentorshipId };
  },
});

/**
 * Conduct mentorship session
 */
export const conductMentorshipSession = internalMutation({
  args: {
    worldId: v.id('worlds'),
    mentorshipId: v.id('mentorships'),
  },
  handler: async (ctx, args) => {
    const mentorship = await ctx.db.get(args.mentorshipId);
    if (!mentorship || mentorship.status !== 'active') return null;

    const now = Date.now();

    // Share wisdom
    const wisdomToShare = mentorship.focusWisdom.find(
      (wId) => !mentorship.wisdomTransferred.includes(wId)
    );

    if (wisdomToShare) {
      const shareResult = await ctx.runMutation(internal.evolution.wisdomSystem.shareWisdom, {
        worldId: args.worldId,
        wisdomId: wisdomToShare,
        teacherId: mentorship.mentorId,
        learnerId: mentorship.apprenticeId,
      });

      if (shareResult?.success) {
        await ctx.db.patch(args.mentorshipId, {
          wisdomTransferred: [...mentorship.wisdomTransferred, wisdomToShare],
        });
      }
    }

    // Improve skills
    for (const skillCategory of mentorship.focusSkills.slice(0, 2)) {
      // Work on max 2 skills per session
      await ctx.runMutation(internal.evolution.learningEngine.recordLearningEvent, {
        worldId: args.worldId,
        agentId: mentorship.apprenticeId,
        skillCategory: skillCategory,
        skillName: skillCategory, // Simplified
        eventType: 'teaching',
        wasSuccessful: Math.random() < mentorship.teachingEffectiveness / 100,
        description: `Learning ${skillCategory} from mentor`,
        teacherAgent: mentorship.mentorId,
      });
    }

    // Update mentorship
    await ctx.db.patch(args.mentorshipId, {
      sessionsHeld: mentorship.sessionsHeld + 1,
      lastSession: now,
    });

    // Check if mentorship should complete
    if (
      mentorship.sessionsHeld >= 10 ||
      mentorship.wisdomTransferred.length >= mentorship.focusWisdom.length
    ) {
      await ctx.db.patch(args.mentorshipId, {
        status: 'completed',
        completedAt: now,
      });
    }

    return { session: mentorship.sessionsHeld + 1 };
  },
});

/**
 * Identify at-risk knowledge (only known by few)
 */
export const identifyAtRiskKnowledge = internalQuery({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const allWisdom = await ctx.db
      .query('wisdomEntries')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    // Wisdom known by 2 or fewer agents is at risk
    const atRisk = allWisdom.filter((w) => w.knownBy.length <= 2 && w.profundity >= PROFOUND_THRESHOLD);

    return atRisk.map((w) => ({
      wisdomId: w._id,
      title: w.title,
      profundity: w.profundity,
      knownBy: w.knownBy,
      originator: w.originatorAgent,
    }));
  },
});

/**
 * Get agent's irreplaceable wisdom
 */
export const getIrreplaceableWisdom = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const allWisdom = await ctx.db
      .query('wisdomEntries')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.eq(q.field('knownBy'), args.agentId))
      .collect();

    // Wisdom only this agent knows
    const irreplaceable = allWisdom.filter((w) => w.knownBy.length === 1);

    return irreplaceable;
  },
});

async function updateAgentLegacy(
  ctx: any,
  worldId: Id<'worlds'>,
  agentId: string,
  field: string,
  value: any
) {
  let legacy = await ctx.db
    .query('agentLegacy')
    .withIndex('agentId', (q: any) => q.eq('worldId', worldId).eq('agentId', agentId))
    .first();

  if (!legacy) {
    const now = Date.now();
    legacy = {
      _id: await ctx.db.insert('agentLegacy', {
        worldId,
        agentId,
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
      }),
    };
    legacy = await ctx.db.get(legacy._id);
  }

  if (!legacy) return;

  const updateData: any = { updatedAt: Date.now() };

  if (field === 'wisdomCreated' && Array.isArray(legacy.wisdomCreated)) {
    updateData.wisdomCreated = [...legacy.wisdomCreated, value];
    updateData.culturalImpact = Math.min(100, legacy.culturalImpact + 5);
  } else if (field === 'apprenticesTrained') {
    if (Array.isArray(legacy.apprenticesTrained) && !legacy.apprenticesTrained.includes(value)) {
      updateData.apprenticesTrained = [...legacy.apprenticesTrained, value];
      updateData.agentsInfluenced = legacy.agentsInfluenced + 1;
    }
  }

  await ctx.db.patch(legacy._id, updateData);
}
