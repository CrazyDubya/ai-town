import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentId, playerId, conversationId } from '../aiTown/ids';

/**
 * PHASE 3: RICH SOCIAL DYNAMICS
 *
 * Group conversations, social factions, reputation systems, and social events
 * that create a living social fabric where relationships matter deeply.
 */

// Reputation aspects tracked for each agent
export const reputationProfile = v.object({
  // Overall scores (0-100)
  likeability: v.number(),       // How much others like this agent
  trustworthiness: v.number(),   // How much others trust them
  influence: v.number(),         // Social influence/popularity
  reliability: v.number(),       // Do they keep commitments?

  // Social metrics
  totalInteractions: v.number(), // Total conversations
  positiveInteractions: v.number(), // Positive outcomes
  negativeInteractions: v.number(), // Negative outcomes

  // Reputation trend
  recentTrend: v.string(),       // "rising", "falling", "stable"

  lastUpdated: v.number(),
});

// Individual reputation between two agents
export const peerReputation = v.object({
  observer: agentId,              // Who has this opinion
  subject: agentId,               // Who it's about

  // Specific assessments (0-100)
  trust: v.number(),
  respect: v.number(),
  affection: v.number(),
  admiration: v.number(),

  // Opinion summary
  overallOpinion: v.string(),     // "friend", "ally", "rival", "enemy", "neutral"

  // Recent interactions
  lastInteraction: v.number(),
  interactionCount: v.number(),

  // Bias factors
  firstImpression: v.number(),    // -100 to 100: initial bias
  reputationInfluence: v.number(), // How much others' opinions matter

  updatedAt: v.number(),
});

// Social faction/group
export const socialFaction = v.object({
  name: v.string(),
  description: v.string(),

  // Faction identity
  factionType: v.string(),        // "friends", "rivals", "allies", "club", "movement"
  dominantEmotion: v.string(),    // Shared emotional bond

  // Members
  members: v.array(agentId),
  leader: v.optional(agentId),

  // Faction attributes
  cohesion: v.number(),           // 0-100: How unified
  influence: v.number(),          // 0-100: Social power
  activity: v.number(),           // 0-100: How active

  // Faction mood (collective)
  averageValence: v.number(),
  averageArousal: v.number(),

  // Relations with other factions
  allies: v.array(v.string()),    // Faction IDs
  rivals: v.array(v.string()),    // Faction IDs

  createdAt: v.number(),
  lastActivity: v.number(),
});

// Social event (gathering, party, meeting)
export const socialEvent = v.object({
  name: v.string(),
  description: v.string(),

  // Event details
  eventType: v.string(),          // "party", "meeting", "gathering", "celebration", "debate"
  location: v.optional(v.string()), // Location name

  // Timing
  startTime: v.number(),
  endTime: v.number(),
  duration: v.number(),           // Planned duration (ms)

  // Attendees
  organizer: agentId,
  invitees: v.array(agentId),
  attendees: v.array(agentId),
  declined: v.array(agentId),

  // Event atmosphere
  emotionalTone: v.string(),      // "joyful", "tense", "somber", "exciting"
  intensity: v.number(),          // 0-100

  // Status
  status: v.string(),             // "planned", "ongoing", "completed", "cancelled"

  createdAt: v.number(),
});

// PHASE 3 INSPIRED: Emotional Resonance Chamber
// Locations that amplify or stabilize emotions through collective presence
export const resonanceChamber = v.object({
  locationName: v.string(),
  chamberType: v.string(),        // "amplifier", "stabilizer", "transformer"

  // Position in world
  area: v.object({
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
  }),

  // Resonance properties
  resonanceEmotion: v.optional(v.string()), // Which emotion does it amplify?
  resonanceStrength: v.number(),  // 0-100: Amplification power
  contagionMultiplier: v.number(), // 1.0-3.0: Emotional contagion boost

  // Capacity & occupancy
  capacity: v.number(),           // Max agents for full effect
  currentOccupants: v.array(agentId),

  // Current resonance state
  activeResonance: v.boolean(),   // Is resonance effect active?
  resonanceIntensity: v.number(), // 0-100: Current intensity
  dominantEmotion: v.optional(v.string()), // Current collective emotion

  // Effects
  effects: v.object({
    emotionAmplification: v.number(), // Multiplier for emotions felt here
    moodStabilization: v.number(),    // Resistance to mood swings
    energyModifier: v.number(),       // Energy change per minute
    socialBatteryModifier: v.number(), // Social battery change
  }),

  // Atmosphere
  atmosphere: v.string(),         // Description
  isPublic: v.boolean(),          // Can anyone enter?

  createdAt: v.number(),
  lastUpdated: v.number(),
});

export const socialTables = {
  // Agent reputation profiles
  agentReputation: defineTable({
    worldId: v.id('worlds'),
    agentId: agentId,
    ...reputationProfile,
  })
    .index('worldId', ['worldId'])
    .index('agentId', ['worldId', 'agentId'])
    .index('influence', ['worldId', 'influence']),

  // Peer-to-peer reputation (what A thinks of B)
  peerReputations: defineTable({
    worldId: v.id('worlds'),
    ...peerReputation,
  })
    .index('worldId', ['worldId'])
    .index('observer', ['worldId', 'observer'])
    .index('subject', ['worldId', 'subject'])
    .index('relationship', ['worldId', 'observer', 'subject']),

  // Social factions and groups
  socialFactions: defineTable({
    worldId: v.id('worlds'),
    ...socialFaction,
  })
    .index('worldId', ['worldId'])
    .index('activity', ['worldId', 'lastActivity'])
    .index('cohesion', ['worldId', 'cohesion']),

  // Faction memberships (for quick lookup)
  factionMemberships: defineTable({
    worldId: v.id('worlds'),
    factionId: v.string(),
    agentId: agentId,
    joinedAt: v.number(),
    role: v.string(),               // "leader", "member", "initiate"
    commitment: v.number(),         // 0-100: How dedicated
  })
    .index('worldId', ['worldId'])
    .index('faction', ['worldId', 'factionId'])
    .index('agent', ['worldId', 'agentId']),

  // Social events
  socialEvents: defineTable({
    worldId: v.id('worlds'),
    ...socialEvent,
  })
    .index('worldId', ['worldId'])
    .index('status', ['worldId', 'status'])
    .index('time', ['worldId', 'startTime']),

  // INSPIRED: Emotional resonance chambers
  resonanceChambers: defineTable({
    worldId: v.id('worlds'),
    ...resonanceChamber,
  })
    .index('worldId', ['worldId'])
    .index('active', ['worldId', 'activeResonance'])
    .index('chamberType', ['worldId', 'chamberType']),

  // Social interaction log
  socialInteractions: defineTable({
    worldId: v.id('worlds'),
    timestamp: v.number(),

    interactionType: v.string(),    // "conversation", "event", "faction_join", "reputation_change"
    participants: v.array(agentId),

    // Outcome
    outcome: v.string(),            // "positive", "negative", "neutral"
    emotionalImpact: v.number(),    // -100 to 100

    // Context
    location: v.optional(v.string()),
    factionId: v.optional(v.string()),
    eventId: v.optional(v.string()),
    conversationId: v.optional(conversationId),

    // Description
    description: v.string(),
  })
    .index('worldId', ['worldId'])
    .index('timestamp', ['worldId', 'timestamp'])
    .index('participants', ['worldId'])
    .index('interactionType', ['worldId', 'interactionType']),
};
