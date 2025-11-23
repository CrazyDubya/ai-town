import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { agentId } from '../aiTown/ids';

/**
 * EMOTIONAL RESONANCE CHAMBERS (PHASE 3 INSPIRED)
 *
 * Spaces where emotions amplify through collective presence.
 * Creates emergent social geography as agents gravitate toward
 * spaces that match or balance their emotional state.
 *
 * Think of it as emotional architecture - the space itself becomes
 * an active participant in the emotional life of the community.
 */

// Chamber type effects
const CHAMBER_TYPES = {
  amplifier: {
    description: 'Emotions intensify when multiple agents share the same feeling',
    contagionMultiplier: 2.5,
    emotionAmplification: 1.5,
    moodStabilization: 0.3,
  },
  stabilizer: {
    description: 'Emotions calm and balance, providing refuge from intensity',
    contagionMultiplier: 0.5,
    emotionAmplification: 0.7,
    moodStabilization: 1.5,
  },
  transformer: {
    description: 'Emotions can shift more easily, enabling change and growth',
    contagionMultiplier: 1.5,
    emotionAmplification: 1.2,
    moodStabilization: 0.8,
  },
};

// Resonance chamber templates
const CHAMBER_TEMPLATES = [
  {
    name: 'The Joy Café',
    chamberType: 'amplifier',
    resonanceEmotion: 'joy',
    atmosphere: 'Warm, welcoming space where laughter echoes and smiles are contagious',
    effects: {
      emotionAmplification: 1.5,
      moodStabilization: 0.5,
      energyModifier: 2.0,
      socialBatteryModifier: -0.5, // Slight drain from high energy
    },
  },
  {
    name: 'The Contemplation Garden',
    chamberType: 'stabilizer',
    resonanceEmotion: 'trust',
    atmosphere: 'Peaceful sanctuary where emotions settle like falling leaves',
    effects: {
      emotionAmplification: 0.7,
      moodStabilization: 2.0,
      energyModifier: -0.5,
      socialBatteryModifier: 1.0, // Recharges social battery
    },
  },
  {
    name: 'The Tension Square',
    chamberType: 'amplifier',
    resonanceEmotion: 'anger',
    atmosphere: 'Charged public space where conflicts spark and passions flare',
    effects: {
      emotionAmplification: 2.0,
      moodStabilization: 0.3,
      energyModifier: 1.0,
      socialBatteryModifier: -1.5, // Draining
    },
  },
  {
    name: 'The Melancholy Alcove',
    chamberType: 'transformer',
    resonanceEmotion: 'sadness',
    atmosphere: 'Quiet corner where sadness deepens but also heals through shared sorrow',
    effects: {
      emotionAmplification: 1.3,
      moodStabilization: 1.2,
      energyModifier: -1.0,
      socialBatteryModifier: 0.5, // Slight recharge through catharsis
    },
  },
  {
    name: 'The Excitement Plaza',
    chamberType: 'amplifier',
    resonanceEmotion: 'anticipation',
    atmosphere: 'Vibrant gathering place buzzing with energy and possibility',
    effects: {
      emotionAmplification: 1.8,
      moodStabilization: 0.4,
      energyModifier: 1.5,
      socialBatteryModifier: -1.0,
    },
  },
  {
    name: 'The Tranquility Chamber',
    chamberType: 'stabilizer',
    resonanceEmotion: undefined, // Stabilizes all emotions
    atmosphere: 'Serene retreat where all emotions find balance and peace',
    effects: {
      emotionAmplification: 0.6,
      moodStabilization: 2.5,
      energyModifier: 0.5,
      socialBatteryModifier: 1.5, // Strong recharge
    },
  },
];

/**
 * Initialize resonance chambers in the world
 */
export const initializeResonanceChambers = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('resonanceChambers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    if (existing.length > 0) {
      return existing;
    }

    // Get world map to place chambers
    const map = await ctx.db
      .query('maps')
      .filter((q) => q.eq(q.field('worldId'), args.worldId))
      .first();

    if (!map) {
      throw new Error('World map not found');
    }

    const chambers = [];
    const now = Date.now();

    // Place chambers in different areas of the map
    for (let i = 0; i < CHAMBER_TEMPLATES.length; i++) {
      const template = CHAMBER_TEMPLATES[i];
      const chamberType = CHAMBER_TYPES[template.chamberType as keyof typeof CHAMBER_TYPES];

      // Distribute chambers across the map
      const x = Math.floor((map.width / (CHAMBER_TEMPLATES.length + 1)) * (i + 1));
      const y = Math.floor(map.height / 2);

      const chamber = await ctx.db.insert('resonanceChambers', {
        worldId: args.worldId,
        locationName: template.name,
        chamberType: template.chamberType,
        area: {
          x: x - 2,
          y: y - 2,
          width: 4,
          height: 4,
        },
        resonanceEmotion: template.resonanceEmotion,
        resonanceStrength: 75, // Strong resonance
        contagionMultiplier: chamberType.contagionMultiplier,
        capacity: 6,
        currentOccupants: [],
        activeResonance: false,
        resonanceIntensity: 0,
        dominantEmotion: undefined,
        effects: template.effects,
        atmosphere: template.atmosphere,
        isPublic: true,
        createdAt: now,
        lastUpdated: now,
      });

      chambers.push(chamber);
    }

    console.log(`Initialized ${chambers.length} resonance chambers`);
    return chambers;
  },
});

/**
 * Check if agent is in a resonance chamber
 */
export const checkAgentInChamber = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentPosition: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const chambers = await ctx.db
      .query('resonanceChambers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    for (const chamber of chambers) {
      const { area } = chamber;
      if (
        args.agentPosition.x >= area.x &&
        args.agentPosition.x < area.x + area.width &&
        args.agentPosition.y >= area.y &&
        args.agentPosition.y < area.y + area.height
      ) {
        return chamber;
      }
    }

    return null;
  },
});

/**
 * Update chamber occupancy
 */
export const updateChamberOccupancy = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get all agents and their positions
    const world = await ctx.db.get(args.worldId);
    if (!world) return;

    const chambers = await ctx.db
      .query('resonanceChambers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    for (const chamber of chambers) {
      const occupants: string[] = [];

      // Check each player's position
      for (const player of world.players) {
        const { area } = chamber;
        if (
          player.position.x >= area.x &&
          player.position.x < area.x + area.width &&
          player.position.y >= area.y &&
          player.position.y < area.y + area.height
        ) {
          // Find agent for this player
          const agent = world.agents.find((a) => a.playerId === player.id);
          if (agent) {
            occupants.push(agent.id);
          }
        }
      }

      const now = Date.now();

      // Update occupancy
      await ctx.db.patch(chamber._id, {
        currentOccupants: occupants,
        activeResonance: occupants.length >= 2, // Resonance requires 2+ agents
        lastUpdated: now,
      });
    }
  },
});

/**
 * Calculate and apply resonance chamber effects
 */
export const applyResonanceEffects = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const chambers = await ctx.db
      .query('resonanceChambers')
      .withIndex('active', (q) => q.eq('worldId', args.worldId).eq('activeResonance', true))
      .collect();

    for (const chamber of chambers) {
      if (chamber.currentOccupants.length < 2) continue;

      // Get all occupants' emotional states
      const occupantEmotions = await Promise.all(
        chamber.currentOccupants.map((agentId) =>
          ctx.runQuery(internal.emotions.engine.getEmotionalState, {
            worldId: args.worldId,
            agentId,
          }),
        ),
      );

      // Filter out nulls
      const validEmotions = occupantEmotions.filter((e) => e !== null);
      if (validEmotions.length === 0) continue;

      // Calculate dominant emotion in the chamber
      const emotionCounts: Record<string, number> = {};
      const emotionIntensities: Record<string, number[]> = {};

      for (const emotionData of validEmotions) {
        const state = emotionData.emotionalState;
        const emotions = [
          { name: 'joy', value: state.joy },
          { name: 'sadness', value: state.sadness },
          { name: 'trust', value: state.trust },
          { name: 'disgust', value: state.disgust },
          { name: 'fear', value: state.fear },
          { name: 'anger', value: state.anger },
          { name: 'surprise', value: state.surprise },
          { name: 'anticipation', value: state.anticipation },
        ];

        emotions.sort((a, b) => b.value - a.value);
        const dominant = emotions[0];

        emotionCounts[dominant.name] = (emotionCounts[dominant.name] || 0) + 1;
        if (!emotionIntensities[dominant.name]) {
          emotionIntensities[dominant.name] = [];
        }
        emotionIntensities[dominant.name].push(dominant.value);
      }

      // Find collective dominant emotion
      const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
      const dominantEmotion = sortedEmotions[0]?.[0];

      // Calculate resonance intensity based on alignment
      const alignment = emotionCounts[dominantEmotion] / validEmotions.length;
      const avgIntensity =
        emotionIntensities[dominantEmotion].reduce((a, b) => a + b, 0) /
        emotionIntensities[dominantEmotion].length;

      const resonanceIntensity = alignment * avgIntensity;

      // Update chamber state
      await ctx.db.patch(chamber._id, {
        dominantEmotion,
        resonanceIntensity,
        lastUpdated: Date.now(),
      });

      // Apply RESONANCE effects to all occupants
      for (let i = 0; i < chamber.currentOccupants.length; i++) {
        const agentId = chamber.currentOccupants[i];

        // Amplify the dominant emotion
        const amplificationAmount =
          (chamber.effects.emotionAmplification - 1.0) * resonanceIntensity * 0.3;

        if (amplificationAmount > 0) {
          try {
            await ctx.runMutation(internal.emotions.engine.triggerEmotion, {
              worldId: args.worldId,
              agentId,
              emotion: dominantEmotion,
              intensity: amplificationAmount,
              cause: `resonance_${chamber.locationName}`,
            });
          } catch (e) {
            console.log(`Could not apply resonance to agent ${agentId}:`, e);
          }
        }

        // Apply enhanced emotional contagion between occupants
        if (i < chamber.currentOccupants.length - 1) {
          const otherAgentId = chamber.currentOccupants[i + 1];

          try {
            await ctx.runMutation(internal.emotions.engine.processContagion, {
              worldId: args.worldId,
              sourceAgentId: agentId,
              targetAgentId: otherAgentId,
              proximity: 1.0,
              context: `resonance_chamber_${chamber.chamberType}`,
            });
          } catch (e) {
            console.log(`Could not process resonance contagion:`, e);
          }
        }
      }

      console.log(
        `🔮 RESONANCE: ${chamber.locationName} - ${dominantEmotion} (${resonanceIntensity.toFixed(0)}) affecting ${chamber.currentOccupants.length} agents`,
      );
    }
  },
});

/**
 * Find best chamber for agent's current emotional state
 */
export const findResonantChamber = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const emotionalState = await ctx.runQuery(internal.emotions.engine.getEmotionalState, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (!emotionalState) return null;

    const chambers = await ctx.db
      .query('resonanceChambers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const state = emotionalState.emotionalState;

    // Find agent's dominant emotion
    const emotions = [
      { name: 'joy', value: state.joy },
      { name: 'sadness', value: state.sadness },
      { name: 'trust', value: state.trust },
      { name: 'disgust', value: state.disgust },
      { name: 'fear', value: state.fear },
      { name: 'anger', value: state.anger },
      { name: 'surprise', value: state.surprise },
      { name: 'anticipation', value: state.anticipation },
    ];

    emotions.sort((a, b) => b.value - a.value);
    const dominantEmotion = emotions[0];

    // Score each chamber
    const scoredChambers = chambers.map((chamber) => {
      let score = 0;

      // Match with resonance emotion
      if (chamber.resonanceEmotion === dominantEmotion.name) {
        score += 50;
      }

      // Consider chamber type based on emotional state
      if (state.arousal > 70 && chamber.chamberType === 'amplifier') {
        score += 20; // High arousal → amplifier
      } else if (state.arousal < 30 && chamber.chamberType === 'stabilizer') {
        score += 20; // Low arousal → stabilizer
      } else if (Math.abs(state.valence) < 20 && chamber.chamberType === 'transformer') {
        score += 15; // Neutral valence → transformer
      }

      // Avoid overcrowded chambers
      if (chamber.currentOccupants.length >= chamber.capacity) {
        score -= 30;
      }

      // Prefer active resonance (join others feeling the same way)
      if (chamber.activeResonance && chamber.dominantEmotion === dominantEmotion.name) {
        score += 25;
      }

      return { chamber, score };
    });

    scoredChambers.sort((a, b) => b.score - a.score);
    return scoredChambers[0]?.chamber || null;
  },
});
