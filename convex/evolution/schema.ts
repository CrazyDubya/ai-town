/**
 * PHASE 6: AGENT EVOLUTION SCHEMA
 *
 * Database schema for agent learning, skill acquisition, personality evolution,
 * memory consolidation, and wisdom inheritance.
 *
 * AGENTS GENUINELY LEARN AND GROW.
 */

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Skill categories
export const skillCategories = v.union(
  v.literal('social'),          // Conversation, persuasion, empathy
  v.literal('emotional'),        // Emotional regulation, resilience
  v.literal('cultural'),         // Ritual performance, myth-telling
  v.literal('conflict'),         // Conflict resolution, mediation
  v.literal('exploration'),      // Navigation, discovery
  v.literal('leadership'),       // Inspiring others, decision-making
  v.literal('creativity'),       // Creating myths, rituals, solutions
  v.literal('wisdom'),           // Pattern recognition, advice-giving
);

// Proficiency levels
export const proficiencyLevels = v.union(
  v.literal('novice'),          // 0-20: Just learning
  v.literal('beginner'),        // 20-40: Basic understanding
  v.literal('competent'),       // 40-60: Solid grasp
  v.literal('proficient'),      // 60-80: Skilled
  v.literal('expert'),          // 80-95: Mastery
  v.literal('master'),          // 95-100: Peak achievement
);

// Learning event types
export const learningEventTypes = v.union(
  v.literal('experience'),      // Learned through doing
  v.literal('observation'),     // Learned by watching
  v.literal('teaching'),        // Learned from mentor
  v.literal('reflection'),      // Learned from memory consolidation
  v.literal('failure'),         // Learned from mistakes
  v.literal('success'),         // Learned from achievement
);

export const evolutionTables = {
  // Agent skills and proficiencies
  agentSkills: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Skill details
    skillCategory: skillCategories,
    skillName: v.string(),
    description: v.string(),

    // Proficiency
    proficiency: v.number(),      // 0-100
    proficiencyLevel: proficiencyLevels,

    // Learning history
    timesPerformed: v.number(),   // How many times practiced
    successRate: v.number(),      // 0-1, how often successful
    lastPracticed: v.number(),

    // Growth tracking
    growthRate: v.number(),       // How fast this skill improves
    plateauThreshold: v.number(), // When learning slows down

    // Teacher influence
    learnedFrom: v.optional(v.string()), // Mentor agent ID
    teachingQuality: v.optional(v.number()), // 0-100

    // Tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('category', ['worldId', 'skillCategory'])
    .index('proficiency', ['worldId', 'proficiency'])
    // OPTIMIZATION: Fast lookups for specific skills by name
    .index('agentSkill', ['worldId', 'agentId', 'skillName']),

  // Learning events
  learningEvents: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Event details
    eventType: learningEventTypes,
    skillCategory: skillCategories,
    skillName: v.string(),

    // What happened
    description: v.string(),
    wasSuccessful: v.boolean(),

    // Context
    relatedEvent: v.optional(v.id('narrativeEvents')),
    relatedQuest: v.optional(v.id('narrativeQuests')),
    teacherAgent: v.optional(v.string()),

    // Learning outcome
    proficiencyGain: v.number(),  // How much skill increased
    insightGained: v.optional(v.string()),

    // Tracking
    occurredAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId', 'occurredAt']),

  // Personality evolution tracking
  personalityEvolution: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Original baseline (from initialization)
    originalPersonality: v.object({
      openness: v.number(),
      conscientiousness: v.number(),
      extraversion: v.number(),
      agreeableness: v.number(),
      neuroticism: v.number(),
    }),

    // Evolution history
    evolutionHistory: v.array(
      v.object({
        trait: v.string(),
        oldValue: v.number(),
        newValue: v.number(),
        change: v.number(),
        reason: v.string(),
        timestamp: v.number(),
      })
    ),

    // Current drift from baseline
    totalDrift: v.number(),        // Sum of absolute changes
    driftDirection: v.object({     // Net direction of change
      openness: v.number(),
      conscientiousness: v.number(),
      extraversion: v.number(),
      agreeableness: v.number(),
      neuroticism: v.number(),
    }),

    // Tracking
    lastEvolved: v.number(),
    evolutionCount: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId']),

  // Memory consolidation
  consolidatedMemories: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Memory type
    memoryType: v.union(
      v.literal('lesson'),        // Learned pattern
      v.literal('trauma'),        // Significant negative
      v.literal('triumph'),       // Significant positive
      v.literal('relationship'),  // Important connection
      v.literal('wisdom'),        // Insight or truth
    ),

    // Content
    title: v.string(),
    description: v.string(),
    lesson: v.optional(v.string()), // What was learned

    // Source
    originEvents: v.array(v.id('narrativeEvents')),
    consolidatedFrom: v.number(),  // How many events contributed

    // Strength
    strength: v.number(),          // 0-100, how vivid/important
    emotionalCharge: v.number(),   // -100 to +100

    // Pattern recognition
    pattern: v.optional(v.string()), // "When X happens, Y follows"
    causeEffect: v.optional(v.object({
      trigger: v.string(),
      outcome: v.string(),
      confidence: v.number(),      // 0-1
    })),

    // Retrieval
    timesRecalled: v.number(),
    lastRecalled: v.number(),

    // Tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('strength', ['worldId', 'strength']),

  // INSPIRED: Wisdom & Mentorship
  wisdomEntries: defineTable({
    worldId: v.id('worlds'),

    // Wisdom details
    title: v.string(),
    content: v.string(),
    category: v.string(),          // 'social', 'emotional', 'practical', etc.

    // Source
    originatorAgent: v.string(),   // Who discovered this wisdom
    derivedFrom: v.array(v.id('consolidatedMemories')),

    // Wisdom quality
    profundity: v.number(),        // 0-100, how deep/valuable
    applicability: v.number(),     // 0-100, how broadly useful
    veracity: v.number(),          // 0-100, how often it's true

    // Knowledge holders
    knownBy: v.array(v.string()),  // Agent IDs
    masteredBy: v.array(v.string()), // Agents who deeply understand

    // Teaching
    teachingDifficulty: v.number(), // 0-100
    prerequisiteWisdom: v.array(v.id('wisdomEntries')),

    // Cultural status
    culturalValue: v.number(),     // 0-100
    timesShared: v.number(),
    successfulApplications: v.number(),

    // Tracking
    createdAt: v.number(),
    lastShared: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('originator', ['worldId', 'originatorAgent'])
    .index('profundity', ['worldId', 'profundity']),

  // Mentorship relationships
  mentorships: defineTable({
    worldId: v.id('worlds'),

    // Relationship
    mentorId: v.string(),
    apprenticeId: v.string(),

    // Focus areas
    focusSkills: v.array(skillCategories),
    focusWisdom: v.array(v.id('wisdomEntries')),

    // Progress
    sessionsHeld: v.number(),
    wisdomTransferred: v.array(v.id('wisdomEntries')),
    skillsImproved: v.array(v.object({
      skill: v.string(),
      startingProficiency: v.number(),
      currentProficiency: v.number(),
    })),

    // Relationship quality
    compatibility: v.number(),     // 0-100
    teachingEffectiveness: v.number(), // 0-100
    learningReceptivity: v.number(),   // 0-100

    // Status
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('discontinued'),
    ),

    // Tracking
    startedAt: v.number(),
    lastSession: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('worldId', ['worldId'])
    .index('mentor', ['worldId', 'mentorId'])
    .index('apprentice', ['worldId', 'apprenticeId'])
    .index('status', ['worldId', 'status']),

  // Agent legacy (what they leave behind)
  agentLegacy: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Contributions
    wisdomCreated: v.array(v.id('wisdomEntries')),
    skillsMastered: v.array(v.string()),
    apprenticesTrained: v.array(v.string()),
    mythsCreated: v.array(v.id('mythology')),
    arcsCompleted: v.array(v.id('storyArcs')),

    // Impact
    agentsInfluenced: v.number(),  // How many agents learned from them
    culturalImpact: v.number(),    // 0-100
    legendStatus: v.number(),      // 0-100, from narrative system

    // Unique knowledge
    irreplaceableWisdom: v.array(v.id('wisdomEntries')), // Only they know
    atRiskKnowledge: v.array(v.id('wisdomEntries')),    // Few know

    // Historical record
    majorEvents: v.array(v.id('narrativeEvents')),
    definingMoments: v.array(v.id('cinematicMoments')),

    // Status
    isActive: v.boolean(),
    deactivatedAt: v.optional(v.number()),

    // Tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('impact', ['worldId', 'culturalImpact']),

  // Pattern recognition database
  learnedPatterns: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Pattern details
    patternType: v.string(),       // 'behavioral', 'emotional', 'social', 'causal'
    description: v.string(),

    // Pattern structure
    trigger: v.string(),           // What starts the pattern
    sequence: v.array(v.string()), // What happens
    outcome: v.string(),           // Result

    // Evidence
    observationCount: v.number(),  // Times seen
    confidence: v.number(),        // 0-1, how sure
    exceptions: v.number(),        // Times it didn't hold

    // Utility
    actionable: v.boolean(),       // Can agent use this?
    suggestedAction: v.optional(v.string()),

    // Tracking
    firstObserved: v.number(),
    lastObserved: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('confidence', ['worldId', 'confidence']),
};
