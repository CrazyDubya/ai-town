/**
 * PHASE 4: INTELLIGENT GAME MASTER
 *
 * Narrative schema for story detection, quest generation, conflict management,
 * and the INSPIRED mythology system.
 */

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Story arc types that the Game Master recognizes
export const storyArcTypes = v.union(
  v.literal('rise_and_fall'),      // Success followed by tragedy
  v.literal('redemption'),          // Overcoming past mistakes
  v.literal('rivalry'),             // Competitive conflict
  v.literal('friendship'),          // Bond formation and growth
  v.literal('love'),                // Romantic connection
  v.literal('betrayal'),            // Trust broken
  v.literal('discovery'),           // Learning/finding something important
  v.literal('loss'),                // Grief and coping
  v.literal('transformation'),      // Fundamental character change
  v.literal('quest'),               // Journey toward a goal
  v.literal('conflict'),            // Interpersonal tension
  v.literal('celebration'),         // Shared joy and triumph
);

// Quest types
export const questTypes = v.union(
  v.literal('social'),              // Connect with someone
  v.literal('emotional'),           // Achieve emotional state
  v.literal('exploration'),         // Visit locations
  v.literal('ritual'),              // Perform a ritual
  v.literal('challenge'),           // Overcome difficulty
  v.literal('reconciliation'),      // Repair relationship
  v.literal('discovery'),           // Learn something new
  v.literal('creation'),            // Make something (ritual, story, etc.)
);

// Conflict severity levels
export const conflictSeverity = v.union(
  v.literal('minor'),               // Small disagreement (0-25)
  v.literal('moderate'),            // Notable tension (25-50)
  v.literal('serious'),             // Significant conflict (50-75)
  v.literal('critical'),            // Major crisis (75-100)
);

// Mythology types
export const mythologyTypes = v.union(
  v.literal('legend'),              // Story about a remarkable event/person
  v.literal('cautionary_tale'),     // Warning about what not to do
  v.literal('origin_story'),        // Explains how something came to be
  v.literal('hero_tale'),           // Celebrates someone's courage/achievement
  v.literal('tragedy'),             // Sad story with moral lessons
  v.literal('ritual'),              // Repeated ceremonial action
  v.literal('wisdom'),              // Advice or insight passed down
  v.literal('prophecy'),            // Prediction about the future
);

export const narrativeTables = {
  // Detected story arcs
  storyArcs: defineTable({
    worldId: v.id('worlds'),
    arcType: storyArcTypes,

    // Key participants
    protagonists: v.array(v.string()), // Agent IDs
    antagonists: v.optional(v.array(v.string())),
    supporting: v.optional(v.array(v.string())),

    // Story state
    stage: v.union(
      v.literal('setup'),           // Establishing the situation
      v.literal('rising_action'),   // Tension building
      v.literal('climax'),          // Peak moment
      v.literal('falling_action'),  // Aftermath
      v.literal('resolution'),      // Conclusion
    ),
    intensity: v.number(),          // 0-100, dramatic tension

    // Story details
    title: v.string(),
    summary: v.string(),
    keyEvents: v.array(v.id('narrativeEvents')),

    // Tracking
    startedAt: v.number(),
    lastEventAt: v.number(),
    resolvedAt: v.optional(v.number()),

    // Mythology potential
    memorability: v.number(),       // 0-100, likelihood to become legend
    emotionalImpact: v.number(),    // 0-100, how much it affected people
  })
    .index('worldId', ['worldId'])
    .index('active', ['worldId', 'resolvedAt'])
    .index('memorable', ['worldId', 'memorability']),

  // Dynamic quests and objectives (narrativeQuests to avoid conflict with RPG quests)
  narrativeQuests: defineTable({
    worldId: v.id('worlds'),
    questType: questTypes,

    // Assignment
    assignedTo: v.string(),         // Agent ID
    issuedBy: v.union(
      v.literal('game_master'),     // System-generated
      v.literal('self'),            // Agent's own desire
      v.literal('social'),          // From relationships/factions
      v.literal('mythology'),       // From legends/rituals
    ),

    // Quest details
    title: v.string(),
    description: v.string(),
    motivation: v.string(),         // Why this quest matters to the agent

    // Objectives (what needs to happen)
    objectives: v.array(v.object({
      description: v.string(),
      type: v.string(),             // 'location', 'emotion', 'social', 'item', etc.
      target: v.optional(v.string()),
      threshold: v.optional(v.number()),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    })),

    // State
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('abandoned'),
    ),
    priority: v.number(),           // 0-100

    // Tracking
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    // Rewards (psychological/social)
    emotionalReward: v.optional(v.string()), // Emotion to trigger on completion
    reputationChange: v.optional(v.number()),

    // Story connection
    relatedArc: v.optional(v.id('storyArcs')),
  })
    .index('worldId', ['worldId'])
    .index('assignedTo', ['worldId', 'assignedTo', 'status'])
    .index('active', ['worldId', 'status']),

  // Conflicts between agents
  conflicts: defineTable({
    worldId: v.id('worlds'),

    // Participants
    agent1Id: v.string(),
    agent2Id: v.string(),

    // Conflict details
    conflictType: v.string(),       // 'ideological', 'personal', 'resource', 'romantic', etc.
    severity: conflictSeverity,
    intensityScore: v.number(),     // 0-100

    // History
    triggerEvent: v.optional(v.id('narrativeEvents')),
    escalationEvents: v.array(v.id('narrativeEvents')),

    // State
    status: v.union(
      v.literal('emerging'),        // Just starting to develop
      v.literal('active'),          // Ongoing tension
      v.literal('escalating'),      // Getting worse
      v.literal('climactic'),       // At breaking point
      v.literal('resolving'),       // Moving toward resolution
      v.literal('resolved'),        // Concluded
      v.literal('dormant'),         // Temporarily inactive
    ),

    // Resolution
    resolutionType: v.optional(v.union(
      v.literal('reconciliation'),  // Made peace
      v.literal('victory'),         // One side won
      v.literal('stalemate'),       // Agreed to disagree
      v.literal('avoidance'),       // Chose to avoid each other
      v.literal('escalation'),      // Became worse
    )),

    // Tracking
    startedAt: v.number(),
    lastEscalationAt: v.number(),
    resolvedAt: v.optional(v.number()),

    // Story connection
    relatedArc: v.optional(v.id('storyArcs')),
  })
    .index('worldId', ['worldId'])
    .index('agent1', ['worldId', 'agent1Id', 'status'])
    .index('agent2', ['worldId', 'agent2Id', 'status'])
    .index('active', ['worldId', 'status']),

  // Narrative events (meaningful moments)
  narrativeEvents: defineTable({
    worldId: v.id('worlds'),

    // Event details
    eventType: v.string(),          // 'conversation', 'decision', 'action', 'discovery', etc.
    title: v.string(),
    description: v.string(),

    // Participants
    primaryAgents: v.array(v.string()),
    witnessAgents: v.optional(v.array(v.string())),
    location: v.optional(v.string()),

    // Narrative significance
    significance: v.number(),       // 0-100, how important this is
    emotionalIntensity: v.number(), // 0-100

    // Context
    emotions: v.object({            // Emotional state during event
      joy: v.number(),
      sadness: v.number(),
      anger: v.number(),
      fear: v.number(),
    }),
    weather: v.optional(v.string()),
    timeOfDay: v.optional(v.string()),

    // Story connections
    relatedArc: v.optional(v.id('storyArcs')),
    relatedConflict: v.optional(v.id('conflicts')),
    relatedQuest: v.optional(v.id('narrativeQuests')),

    // Tracking
    occurredAt: v.number(),

    // Mythology potential
    retoldCount: v.number(),        // How many times this story has been shared
    transformedIntoMyth: v.optional(v.id('mythology')),
  })
    .index('worldId', ['worldId'])
    .index('timeline', ['worldId', 'occurredAt'])
    .index('significance', ['worldId', 'significance'])
    .index('agents', ['worldId', 'primaryAgents']),

  // INSPIRED: Living Mythology System
  mythology: defineTable({
    worldId: v.id('worlds'),

    // Myth details
    mythType: mythologyTypes,
    title: v.string(),
    content: v.string(),            // The story/wisdom/ritual

    // Origin
    originEvent: v.optional(v.id('narrativeEvents')),
    originArc: v.optional(v.id('storyArcs')),
    creator: v.optional(v.string()), // Agent who first created this myth
    createdAt: v.number(),

    // Key figures in the myth
    heroes: v.optional(v.array(v.string())), // Agent IDs
    villains: v.optional(v.array(v.string())),

    // Cultural spread
    knownBy: v.array(v.string()),   // Agent IDs who know this myth
    believedBy: v.array(v.string()), // Agent IDs who believe/follow it

    // Moral/lesson
    moralLesson: v.optional(v.string()),
    emotionalTone: v.object({       // Overall emotional character
      joy: v.number(),
      sadness: v.number(),
      fear: v.number(),
      inspiration: v.number(),
    }),

    // Ritual details (if type is 'ritual')
    ritual: v.optional(v.object({
      triggerCondition: v.string(), // When to perform it
      location: v.optional(v.string()),
      participants: v.string(),     // 'individual', 'pair', 'group', 'faction'
      actions: v.array(v.string()),
      expectedOutcome: v.string(),
    })),

    // Cultural impact
    culturalSignificance: v.number(), // 0-100
    generationsOld: v.number(),     // How many "retellings" (increases over time)

    // Evolution
    originalVersion: v.optional(v.id('mythology')), // If this is a variant
    variants: v.array(v.id('mythology')), // Different versions of this myth

    // Influence on behavior
    influencesQuests: v.boolean(),  // Can this generate quests?
    influencesFactions: v.boolean(), // Does this unite/divide groups?
    influencesReputation: v.boolean(), // Does following this affect reputation?

    // Tracking
    lastToldAt: v.number(),
    timesTold: v.number(),

    // State
    status: v.union(
      v.literal('emerging'),        // Just created
      v.literal('spreading'),       // Being shared
      v.literal('established'),     // Widely known
      v.literal('sacred'),          // Core cultural belief
      v.literal('fading'),          // Being forgotten
      v.literal('forgotten'),       // No longer told
    ),
  })
    .index('worldId', ['worldId'])
    .index('type', ['worldId', 'mythType'])
    .index('significance', ['worldId', 'culturalSignificance'])
    .index('status', ['worldId', 'status'])
    .index('creator', ['worldId', 'creator']),

  // Agent's personal narrative (character development)
  agentNarratives: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),

    // Character arc tracking
    characterArc: v.optional(storyArcTypes),
    arcProgress: v.number(),        // 0-100

    // Personal story
    definingMoments: v.array(v.id('narrativeEvents')),
    activeQuests: v.array(v.id('narrativeQuests')),
    completedQuests: v.array(v.id('narrativeQuests')),

    // Conflicts
    currentConflicts: v.array(v.id('conflicts')),
    resolvedConflicts: v.array(v.id('conflicts')),

    // Story arcs they're part of
    involvedInArcs: v.array(v.id('storyArcs')),

    // Mythology
    knownMyths: v.array(v.id('mythology')),
    believedMyths: v.array(v.id('mythology')),
    createdMyths: v.array(v.id('mythology')),

    // Narrative identity
    reputation: v.string(),         // 'hero', 'villain', 'trickster', 'sage', etc.
    narrativeRole: v.array(v.string()), // Active roles in ongoing stories

    // Legacy
    legendStatus: v.number(),       // 0-100, how legendary this agent is

    // Tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('legendary', ['worldId', 'legendStatus']),

  // Game Master decisions and interventions
  gameMasterActions: defineTable({
    worldId: v.id('worlds'),

    // Action details
    actionType: v.union(
      v.literal('quest_generated'),
      v.literal('conflict_escalated'),
      v.literal('arc_recognized'),
      v.literal('event_highlighted'),
      v.literal('myth_promoted'),
      v.literal('ritual_suggested'),
    ),

    // Target
    affectedAgents: v.array(v.string()),
    affectedLocation: v.optional(v.string()),

    // Reasoning
    trigger: v.string(),
    reasoning: v.string(),

    // Result
    createdQuest: v.optional(v.id('narrativeQuests')),
    createdArc: v.optional(v.id('storyArcs')),
    createdMyth: v.optional(v.id('mythology')),

    // Tracking
    timestamp: v.number(),
    success: v.optional(v.boolean()),
  })
    .index('worldId', ['worldId'])
    .index('timestamp', ['worldId', 'timestamp']),
};
