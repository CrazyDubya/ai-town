import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentId, playerId } from '../aiTown/ids';

/**
 * PHASE 1: EMOTIONAL INTELLIGENCE SYSTEM
 *
 * This system tracks the emotional and psychological state of each agent,
 * enabling rich, dynamic character behavior that evolves over time.
 */

// Core emotion types based on Plutchik's wheel of emotions
export const EmotionType = v.union(
  v.literal('joy'),
  v.literal('sadness'),
  v.literal('trust'),
  v.literal('disgust'),
  v.literal('fear'),
  v.literal('anger'),
  v.literal('surprise'),
  v.literal('anticipation'),
);

// Big Five personality traits (OCEAN model)
export const personalityTraits = v.object({
  openness: v.number(),        // 0-100: Creative vs Practical
  conscientiousness: v.number(), // 0-100: Organized vs Spontaneous
  extraversion: v.number(),     // 0-100: Outgoing vs Reserved
  agreeableness: v.number(),    // 0-100: Friendly vs Assertive
  neuroticism: v.number(),      // 0-100: Sensitive vs Resilient
});

// Current emotional state
export const emotionalState = v.object({
  // Primary emotion intensities (0-100)
  joy: v.number(),
  sadness: v.number(),
  trust: v.number(),
  disgust: v.number(),
  fear: v.number(),
  anger: v.number(),
  surprise: v.number(),
  anticipation: v.number(),

  // Derived emotional metrics
  valence: v.number(),          // Overall positive/negative (-100 to 100)
  arousal: v.number(),          // Energy level (0-100)
  dominance: v.number(),        // Sense of control (0-100)

  // Mood state (persists longer than emotions)
  currentMood: v.string(),      // e.g., "content", "melancholic", "excited", "anxious"
  moodIntensity: v.number(),    // 0-100

  lastUpdated: v.number(),      // Timestamp for decay calculations
});

// Emotional memory - tags memories with emotional context
export const emotionalMemory = v.object({
  memoryId: v.id('memories'),
  emotionType: EmotionType,
  intensity: v.number(),        // 0-100: How strong was the emotion
  valence: v.number(),          // -100 to 100: Positive or negative

  // Memory resonance: similar emotions can trigger this memory
  resonanceThreshold: v.number(), // How easily this memory is triggered
  timesTriggered: v.number(),    // Track how often this memory resurfaces

  created: v.number(),
  lastTriggered: v.optional(v.number()),
});

// Emotional contagion tracking - emotions spread between agents
export const emotionalContagion = v.object({
  sourceAgentId: agentId,
  targetAgentId: agentId,
  emotionType: EmotionType,
  intensity: v.number(),        // How strongly the emotion transferred
  timestamp: v.number(),

  // Context of the contagion
  context: v.string(),          // "conversation", "proximity", "observation"
  conversationId: v.optional(v.string()),
});

// Emotional relationship bonds between agents
export const emotionalBond = v.object({
  agent1Id: agentId,
  agent2Id: agentId,

  // Relationship emotions (accumulated over time)
  affection: v.number(),        // 0-100
  trust: v.number(),            // 0-100
  respect: v.number(),          // 0-100
  rivalry: v.number(),          // 0-100

  // Emotional synchrony: how much emotions spread between them
  contagionStrength: v.number(), // 0-100: Higher = more emotional influence

  // Relationship type derived from emotions
  relationshipType: v.string(), // "friend", "acquaintance", "rival", "stranger"

  lastInteraction: v.number(),
  totalInteractions: v.number(),
});

// Psychological needs (influences behavior and emotions)
export const psychologicalNeeds = v.object({
  // Based on self-determination theory
  autonomy: v.number(),         // 0-100: Need for independence
  competence: v.number(),       // 0-100: Need for mastery/achievement
  relatedness: v.number(),      // 0-100: Need for social connection

  // Additional needs
  stimulation: v.number(),      // 0-100: Need for novelty/excitement
  security: v.number(),         // 0-100: Need for safety/predictability

  lastUpdated: v.number(),
});

export const emotionTables = {
  // Agent psychological profiles
  agentPsychology: defineTable({
    worldId: v.id('worlds'),
    agentId,
    playerId,

    personality: personalityTraits,
    emotionalState,
    psychologicalNeeds,

    // Long-term emotional baseline (what's "normal" for this agent)
    emotionalBaseline: emotionalState,

    // Emotional regulation ability (how quickly they return to baseline)
    emotionalRegulation: v.number(), // 0-100: Higher = faster recovery

    // Empathy level (affects emotional contagion susceptibility)
    empathy: v.number(),            // 0-100: Higher = more affected by others

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('playerId', ['worldId', 'playerId']),

  // Emotional memories with resonance
  emotionalMemories: defineTable({
    worldId: v.id('worlds'),
    agentId,
    ...emotionalMemory,
  })
    .index('worldId', ['worldId'])
    .index('agentMemories', ['worldId', 'agentId'])
    .index('memoryId', ['memoryId'])
    .index('emotionType', ['worldId', 'agentId', 'emotionType']),

  // Track emotional contagion events
  emotionalContagionEvents: defineTable({
    worldId: v.id('worlds'),
    ...emotionalContagion,
  })
    .index('worldId', ['worldId'])
    .index('sourceAgent', ['worldId', 'sourceAgentId', 'timestamp'])
    .index('targetAgent', ['worldId', 'targetAgentId', 'timestamp'])
    .index('conversation', ['worldId', 'conversationId']),

  // Emotional bonds between agents
  emotionalBonds: defineTable({
    worldId: v.id('worlds'),
    ...emotionalBond,
  })
    .index('worldId', ['worldId'])
    .index('agent1', ['worldId', 'agent1Id'])
    .index('agent2', ['worldId', 'agent2Id'])
    .index('relationship', ['worldId', 'agent1Id', 'agent2Id']),

  // Emotional event log for analytics and debugging
  emotionalEvents: defineTable({
    worldId: v.id('worlds'),
    agentId,
    timestamp: v.number(),

    eventType: v.string(),      // "emotion_spike", "mood_shift", "need_critical", "contagion"
    description: v.string(),

    // Snapshot of emotional state at event time
    emotionSnapshot: emotionalState,

    // Context
    triggeredBy: v.optional(v.string()), // What caused this event
    conversationId: v.optional(v.string()),
    otherAgentId: v.optional(agentId),
  })
    .index('worldId', ['worldId'])
    .index('agentEvents', ['worldId', 'agentId', 'timestamp'])
    .index('eventType', ['worldId', 'eventType', 'timestamp']),
};
