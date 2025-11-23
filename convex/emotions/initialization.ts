import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { agentId, playerId } from '../aiTown/ids';

/**
 * EMOTIONAL INTELLIGENCE INITIALIZATION
 *
 * Sets up psychological profiles for agents with unique personalities
 */

// Personality presets based on character archetypes
interface PersonalityPreset {
  name: string;
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  emotionalBaseline: {
    joy: number;
    sadness: number;
    trust: number;
    disgust: number;
    fear: number;
    anger: number;
    surprise: number;
    anticipation: number;
  };
  empathy: number;
  emotionalRegulation: number;
  needsProfile: {
    autonomy: number;
    competence: number;
    relatedness: number;
    stimulation: number;
    security: number;
  };
}

export const PERSONALITY_PRESETS: Record<string, PersonalityPreset> = {
  curious_optimist: {
    name: 'Curious Optimist',
    traits: {
      openness: 85,
      conscientiousness: 60,
      extraversion: 70,
      agreeableness: 75,
      neuroticism: 35,
    },
    emotionalBaseline: {
      joy: 60,
      trust: 55,
      anticipation: 50,
      surprise: 30,
      sadness: 15,
      fear: 20,
      anger: 10,
      disgust: 10,
    },
    empathy: 70,
    emotionalRegulation: 60,
    needsProfile: {
      autonomy: 70,
      competence: 60,
      relatedness: 75,
      stimulation: 85,
      security: 50,
    },
  },

  anxious_perfectionist: {
    name: 'Anxious Perfectionist',
    traits: {
      openness: 65,
      conscientiousness: 90,
      extraversion: 40,
      agreeableness: 60,
      neuroticism: 75,
    },
    emotionalBaseline: {
      fear: 45,
      anticipation: 55,
      sadness: 30,
      trust: 40,
      joy: 25,
      anger: 20,
      disgust: 25,
      surprise: 15,
    },
    empathy: 65,
    emotionalRegulation: 45,
    needsProfile: {
      autonomy: 50,
      competence: 90,
      relatedness: 50,
      stimulation: 40,
      security: 85,
    },
  },

  eccentric_dreamer: {
    name: 'Eccentric Dreamer',
    traits: {
      openness: 95,
      conscientiousness: 40,
      extraversion: 60,
      agreeableness: 70,
      neuroticism: 50,
    },
    emotionalBaseline: {
      joy: 50,
      anticipation: 60,
      surprise: 45,
      trust: 45,
      sadness: 25,
      fear: 20,
      anger: 15,
      disgust: 20,
    },
    empathy: 60,
    emotionalRegulation: 55,
    needsProfile: {
      autonomy: 85,
      competence: 50,
      relatedness: 60,
      stimulation: 95,
      security: 30,
    },
  },

  tyrannical_ruler: {
    name: 'Tyrannical Ruler',
    traits: {
      openness: 50,
      conscientiousness: 70,
      extraversion: 75,
      agreeableness: 20,
      neuroticism: 60,
    },
    emotionalBaseline: {
      anger: 50,
      disgust: 40,
      anticipation: 45,
      trust: 30,
      fear: 35,
      joy: 35,
      sadness: 20,
      surprise: 15,
    },
    empathy: 30,
    emotionalRegulation: 40,
    needsProfile: {
      autonomy: 95,
      competence: 85,
      relatedness: 40,
      stimulation: 70,
      security: 75,
    },
  },

  friendly_empath: {
    name: 'Friendly Empath',
    traits: {
      openness: 75,
      conscientiousness: 65,
      extraversion: 80,
      agreeableness: 90,
      neuroticism: 45,
    },
    emotionalBaseline: {
      joy: 55,
      trust: 70,
      anticipation: 40,
      sadness: 25,
      fear: 25,
      anger: 10,
      disgust: 15,
      surprise: 30,
    },
    empathy: 90,
    emotionalRegulation: 65,
    needsProfile: {
      autonomy: 55,
      competence: 60,
      relatedness: 90,
      stimulation: 65,
      security: 70,
    },
  },

  melancholic_artist: {
    name: 'Melancholic Artist',
    traits: {
      openness: 90,
      conscientiousness: 50,
      extraversion: 35,
      agreeableness: 65,
      neuroticism: 70,
    },
    emotionalBaseline: {
      sadness: 50,
      trust: 45,
      anticipation: 35,
      joy: 30,
      fear: 35,
      disgust: 25,
      anger: 20,
      surprise: 30,
    },
    empathy: 80,
    emotionalRegulation: 50,
    needsProfile: {
      autonomy: 75,
      competence: 70,
      relatedness: 60,
      stimulation: 80,
      security: 50,
    },
  },

  stoic_guardian: {
    name: 'Stoic Guardian',
    traits: {
      openness: 55,
      conscientiousness: 85,
      extraversion: 45,
      agreeableness: 70,
      neuroticism: 25,
    },
    emotionalBaseline: {
      trust: 60,
      anticipation: 45,
      joy: 40,
      fear: 20,
      sadness: 20,
      anger: 25,
      disgust: 20,
      surprise: 20,
    },
    empathy: 55,
    emotionalRegulation: 85,
    needsProfile: {
      autonomy: 65,
      competence: 75,
      relatedness: 70,
      stimulation: 45,
      security: 90,
    },
  },

  chaotic_trickster: {
    name: 'Chaotic Trickster',
    traits: {
      openness: 85,
      conscientiousness: 30,
      extraversion: 85,
      agreeableness: 40,
      neuroticism: 55,
    },
    emotionalBaseline: {
      joy: 65,
      anticipation: 60,
      surprise: 50,
      disgust: 30,
      trust: 35,
      anger: 35,
      fear: 25,
      sadness: 20,
    },
    empathy: 50,
    emotionalRegulation: 40,
    needsProfile: {
      autonomy: 90,
      competence: 65,
      relatedness: 55,
      stimulation: 95,
      security: 25,
    },
  },
};

/**
 * Generate a random personality variation
 */
function varyPersonality(base: PersonalityPreset, variation: number = 10): PersonalityPreset {
  const vary = (value: number) => {
    const delta = (Math.random() - 0.5) * 2 * variation;
    return Math.max(0, Math.min(100, value + delta));
  };

  return {
    ...base,
    traits: {
      openness: vary(base.traits.openness),
      conscientiousness: vary(base.traits.conscientiousness),
      extraversion: vary(base.traits.extraversion),
      agreeableness: vary(base.traits.agreeableness),
      neuroticism: vary(base.traits.neuroticism),
    },
    emotionalBaseline: {
      joy: vary(base.emotionalBaseline.joy),
      sadness: vary(base.emotionalBaseline.sadness),
      trust: vary(base.emotionalBaseline.trust),
      disgust: vary(base.emotionalBaseline.disgust),
      fear: vary(base.emotionalBaseline.fear),
      anger: vary(base.emotionalBaseline.anger),
      surprise: vary(base.emotionalBaseline.surprise),
      anticipation: vary(base.emotionalBaseline.anticipation),
    },
    empathy: vary(base.empathy),
    emotionalRegulation: vary(base.emotionalRegulation),
    needsProfile: {
      autonomy: vary(base.needsProfile.autonomy),
      competence: vary(base.needsProfile.competence),
      relatedness: vary(base.needsProfile.relatedness),
      stimulation: vary(base.needsProfile.stimulation),
      security: vary(base.needsProfile.security),
    },
  };
}

/**
 * Map character names to personality presets
 */
const CHARACTER_PERSONALITY_MAP: Record<string, string> = {
  Alice: 'curious_optimist',
  'White Rabbit': 'anxious_perfectionist',
  'Mad Hatter': 'eccentric_dreamer',
  'Queen of Hearts': 'tyrannical_ruler',
};

/**
 * Initialize emotional psychology for an agent
 */
export const initializeAgentPsychology = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    playerId: playerId,
    characterName: v.optional(v.string()),
    personalityPreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already initialized
    const existing = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();

    if (existing) {
      console.log(`Agent ${args.agentId} already has psychology profile`);
      return existing;
    }

    // Select personality preset
    let presetKey = args.personalityPreset;

    if (!presetKey && args.characterName) {
      presetKey = CHARACTER_PERSONALITY_MAP[args.characterName];
    }

    if (!presetKey) {
      // Random preset
      const presetKeys = Object.keys(PERSONALITY_PRESETS);
      presetKey = presetKeys[Math.floor(Math.random() * presetKeys.length)];
    }

    const basePreset = PERSONALITY_PRESETS[presetKey] || PERSONALITY_PRESETS.friendly_empath;

    // Add some variation to make each agent unique
    const personality = varyPersonality(basePreset, 10);

    const now = Date.now();

    // Calculate initial metrics from baseline
    const valence =
      ((personality.emotionalBaseline.joy +
        personality.emotionalBaseline.trust -
        personality.emotionalBaseline.sadness -
        personality.emotionalBaseline.fear) /
        400) *
      100;

    const arousal =
      ((personality.emotionalBaseline.joy +
        personality.emotionalBaseline.anger +
        personality.emotionalBaseline.surprise +
        personality.emotionalBaseline.anticipation) /
        400) *
      100;

    const dominance =
      100 -
      (personality.emotionalBaseline.fear + personality.emotionalBaseline.sadness) / 2;

    const emotionalState = {
      ...personality.emotionalBaseline,
      valence,
      arousal,
      dominance,
      currentMood: 'neutral',
      moodIntensity: 50,
      lastUpdated: now,
    };

    const psychProfile = await ctx.db.insert('agentPsychology', {
      worldId: args.worldId,
      agentId: args.agentId,
      playerId: args.playerId,
      personality: personality.traits,
      emotionalState,
      psychologicalNeeds: {
        ...personality.needsProfile,
        lastUpdated: now,
      },
      emotionalBaseline: {
        ...personality.emotionalBaseline,
        valence,
        arousal,
        dominance,
        currentMood: 'neutral',
        moodIntensity: 50,
        lastUpdated: now,
      },
      emotionalRegulation: personality.emotionalRegulation,
      empathy: personality.empathy,
      createdAt: now,
      updatedAt: now,
    });

    console.log(
      `Initialized ${args.characterName || 'agent'} with ${personality.name} personality`,
    );

    return psychProfile;
  },
});

/**
 * Initialize emotional bond between two agents
 */
export const initializeEmotionalBond = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agent1Id: agentId,
    agent2Id: agentId,
  },
  handler: async (ctx, args) => {
    // Check if bond already exists (either direction)
    const existingBond =
      (await ctx.db
        .query('emotionalBonds')
        .withIndex('relationship', (q) =>
          q
            .eq('worldId', args.worldId)
            .eq('agent1Id', args.agent1Id)
            .eq('agent2Id', args.agent2Id),
        )
        .first()) ||
      (await ctx.db
        .query('emotionalBonds')
        .withIndex('relationship', (q) =>
          q
            .eq('worldId', args.worldId)
            .eq('agent1Id', args.agent2Id)
            .eq('agent2Id', args.agent1Id),
        )
        .first());

    if (existingBond) {
      return existingBond;
    }

    // Create new bond starting as strangers
    const now = Date.now();
    const bond = await ctx.db.insert('emotionalBonds', {
      worldId: args.worldId,
      agent1Id: args.agent1Id,
      agent2Id: args.agent2Id,
      affection: 20, // Neutral starting affection
      trust: 15, // Low initial trust
      respect: 25, // Neutral respect
      rivalry: 0, // No rivalry initially
      contagionStrength: 10, // Weak emotional influence initially
      relationshipType: 'stranger',
      lastInteraction: now,
      totalInteractions: 0,
    });

    return bond;
  },
});

/**
 * Update emotional bond after interaction
 */
export const updateEmotionalBond = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agent1Id: agentId,
    agent2Id: agentId,
    affectionChange: v.optional(v.number()),
    trustChange: v.optional(v.number()),
    respectChange: v.optional(v.number()),
    rivalryChange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find bond (either direction)
    let bond = await ctx.db
      .query('emotionalBonds')
      .withIndex('relationship', (q) =>
        q
          .eq('worldId', args.worldId)
          .eq('agent1Id', args.agent1Id)
          .eq('agent2Id', args.agent2Id),
      )
      .first();

    let reversed = false;
    if (!bond) {
      bond = await ctx.db
        .query('emotionalBonds')
        .withIndex('relationship', (q) =>
          q
            .eq('worldId', args.worldId)
            .eq('agent1Id', args.agent2Id)
            .eq('agent2Id', args.agent1Id),
        )
        .first();
      reversed = true;
    }

    if (!bond) {
      // Create if doesn't exist
      return await ctx.runMutation(internal.emotions.initialization.initializeEmotionalBond, {
        worldId: args.worldId,
        agent1Id: args.agent1Id,
        agent2Id: args.agent2Id,
      });
    }

    const now = Date.now();

    // Apply changes
    const clamp = (val: number) => Math.max(0, Math.min(100, val));

    const newAffection = clamp(bond.affection + (args.affectionChange || 0));
    const newTrust = clamp(bond.trust + (args.trustChange || 0));
    const newRespect = clamp(bond.respect + (args.respectChange || 0));
    const newRivalry = clamp(bond.rivalry + (args.rivalryChange || 0));

    // Contagion strength increases with affection and trust
    const contagionStrength = Math.min(100, (newAffection + newTrust) / 2);

    // Determine relationship type
    let relationshipType = 'stranger';
    if (bond.totalInteractions > 10) {
      if (newAffection > 70 && newTrust > 60) {
        relationshipType = 'close_friend';
      } else if (newAffection > 50) {
        relationshipType = 'friend';
      } else if (newRivalry > 50) {
        relationshipType = 'rival';
      } else if (bond.totalInteractions > 3) {
        relationshipType = 'acquaintance';
      }
    }

    await ctx.db.patch(bond._id, {
      affection: newAffection,
      trust: newTrust,
      respect: newRespect,
      rivalry: newRivalry,
      contagionStrength,
      relationshipType,
      lastInteraction: now,
      totalInteractions: bond.totalInteractions + 1,
    });

    return bond;
  },
});

import { internal } from '../_generated/api';
