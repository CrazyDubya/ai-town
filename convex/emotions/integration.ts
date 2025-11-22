import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { agentId, playerId, conversationId } from '../aiTown/ids';

/**
 * EMOTIONAL INTEGRATION
 *
 * Connects the emotional intelligence system to agent behavior,
 * conversations, and memory formation.
 */

/**
 * Inject emotional context into conversation prompts
 */
export const getEmotionalContext = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const emotionalState = await ctx.runQuery(internal.emotions.engine.getEmotionalState, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (!emotionalState) {
      return {
        moodDescription: '',
        emotionalPrompt: '',
        dominantEmotions: [],
      };
    }

    const state = emotionalState.emotionalState;

    // Find dominant emotions (top 3)
    const emotionLevels = [
      { name: 'joyful', value: state.joy },
      { name: 'sad', value: state.sadness },
      { name: 'trusting', value: state.trust },
      { name: 'disgusted', value: state.disgust },
      { name: 'fearful', value: state.fear },
      { name: 'angry', value: state.anger },
      { name: 'surprised', value: state.surprise },
      { name: 'anticipating', value: state.anticipation },
    ];

    emotionLevels.sort((a, b) => b.value - a.value);
    const dominantEmotions = emotionLevels.slice(0, 3).filter((e) => e.value > 20);

    // Build mood description
    const moodIntensity =
      state.moodIntensity > 70 ? 'very' : state.moodIntensity > 40 ? 'somewhat' : 'slightly';
    const moodDescription = `You are feeling ${moodIntensity} ${state.currentMood}`;

    // Build emotional prompt
    let emotionalPrompt = moodDescription + '.';

    if (dominantEmotions.length > 0) {
      const emotionsList = dominantEmotions.map((e) => e.name).join(', ');
      emotionalPrompt += ` You're experiencing ${emotionsList}.`;
    }

    // Add valence context
    if (state.valence > 30) {
      emotionalPrompt += ' Your overall mood is positive.';
    } else if (state.valence < -30) {
      emotionalPrompt += ' Your overall mood is negative.';
    }

    // Add arousal context
    if (state.arousal > 70) {
      emotionalPrompt += ' You feel energized and alert.';
    } else if (state.arousal < 30) {
      emotionalPrompt += ' You feel calm and low-energy.';
    }

    // Check psychological needs
    const needs = emotionalState.psychologicalNeeds;
    const criticalNeeds = [];

    if (needs.autonomy < 30) criticalNeeds.push('independence');
    if (needs.competence < 30) criticalNeeds.push('accomplishment');
    if (needs.relatedness < 30) criticalNeeds.push('social connection');
    if (needs.stimulation < 30) criticalNeeds.push('excitement');
    if (needs.security < 30) criticalNeeds.push('safety');

    if (criticalNeeds.length > 0) {
      emotionalPrompt += ` You're craving ${criticalNeeds.join(' and ')}.`;
    }

    return {
      moodDescription,
      emotionalPrompt,
      dominantEmotions: dominantEmotions.map((e) => e.name),
      valence: state.valence,
      arousal: state.arousal,
      criticalNeeds,
    };
  },
});

/**
 * Update emotions based on conversation events
 */
export const updateEmotionsFromConversation = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    conversationId: conversationId,
    eventType: v.string(), // "conversation_started", "positive_exchange", "negative_exchange", "conversation_ended"
    otherAgentId: v.optional(agentId),
  },
  handler: async (ctx, args) => {
    const emotionChanges: Record<
      string,
      { emotion: string; intensity: number; needChanges?: any }
    > = {
      conversation_started: {
        emotion: 'anticipation',
        intensity: 15,
        needChanges: { relatedness: 5 },
      },
      positive_exchange: {
        emotion: 'joy',
        intensity: 20,
        needChanges: { relatedness: 10, competence: 5 },
      },
      negative_exchange: {
        emotion: 'sadness',
        intensity: 15,
        needChanges: { relatedness: -5 },
      },
      conversation_ended: {
        emotion: 'trust',
        intensity: 10,
        needChanges: { relatedness: 15 },
      },
      rejected_invite: {
        emotion: 'sadness',
        intensity: 25,
        needChanges: { relatedness: -10, autonomy: -5 },
      },
    };

    const change = emotionChanges[args.eventType];
    if (!change) return;

    // Trigger emotion
    await ctx.runMutation(internal.emotions.engine.triggerEmotion, {
      worldId: args.worldId,
      agentId: args.agentId,
      emotion: change.emotion,
      intensity: change.intensity,
      cause: args.eventType,
      conversationId: args.conversationId,
    });

    // Update needs
    if (change.needChanges) {
      await ctx.runMutation(internal.emotions.engine.updateNeeds, {
        worldId: args.worldId,
        agentId: args.agentId,
        needChanges: change.needChanges,
      });
    }

    // If there's another agent, process emotional contagion
    if (args.otherAgentId) {
      await ctx.runMutation(internal.emotions.engine.processContagion, {
        worldId: args.worldId,
        sourceAgentId: args.agentId,
        targetAgentId: args.otherAgentId,
        proximity: 1.0, // Full proximity during conversation
        context: 'conversation',
        conversationId: args.conversationId,
      });

      // PHASE 3: Process social effects (reputation changes)
      if (args.eventType === 'conversation_ended') {
        const wasPositive = change.emotion === 'joy' || change.emotion === 'trust';
        try {
          await ctx.runMutation(internal.social.integration.processConversationSocialEffects, {
            worldId: args.worldId,
            agent1Id: args.agentId,
            agent2Id: args.otherAgentId,
            wasPositive,
            impactStrength: 0.5,
          });
        } catch (e) {
          console.log('Could not process social effects:', e);
        }

        // PHASE 4: Process narrative effects (conflicts, quests, story arcs)
        try {
          // Get current emotional intensity for narrative significance
          const psychology = await ctx.db
            .query('agentPsychology')
            .withIndex('agentId', (q: any) =>
              q.eq('worldId', args.worldId).eq('agentId', args.agentId)
            )
            .first();

          const emotionalIntensity = psychology
            ? (psychology.emotionalState.joy +
                psychology.emotionalState.sadness +
                psychology.emotionalState.anger +
                psychology.emotionalState.fear) /
              4
            : 50;

          await ctx.runAction(internal.narrative.integration.processConversationNarrative, {
            worldId: args.worldId,
            agent1Id: args.agentId,
            agent2Id: args.otherAgentId,
            wasPositive,
            emotionalIntensity,
          });
        } catch (e) {
          console.log('Could not process narrative effects:', e);
        }
      }
    }
  },
});

/**
 * Get resonant memories for conversation context
 */
export const getResonantMemoriesForConversation = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
  },
  handler: async (ctx, args) => {
    const emotionalState = await ctx.runQuery(internal.emotions.engine.getEmotionalState, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (!emotionalState) return [];

    const resonantMemories = await ctx.runQuery(internal.emotions.memoryResonance.findResonantMemories, {
      worldId: args.worldId,
      agentId: args.agentId,
      currentEmotionalState: {
        joy: emotionalState.emotionalState.joy,
        sadness: emotionalState.emotionalState.sadness,
        trust: emotionalState.emotionalState.trust,
        disgust: emotionalState.emotionalState.disgust,
        fear: emotionalState.emotionalState.fear,
        anger: emotionalState.emotionalState.anger,
        surprise: emotionalState.emotionalState.surprise,
        anticipation: emotionalState.emotionalState.anticipation,
      },
      limit: 2, // Top 2 resonant memories
    });

    return resonantMemories;
  },
});

/**
 * Enhance conversation prompts with emotional intelligence
 */
export const enhancePromptWithEmotions = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    basePrompt: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const emotionalContext = await ctx.runQuery(
      internal.emotions.integration.getEmotionalContext,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      },
    );

    const resonantMemories = await ctx.runQuery(
      internal.emotions.integration.getResonantMemoriesForConversation,
      {
        worldId: args.worldId,
        agentId: args.agentId,
      },
    );

    const enhancedPrompt = [...args.basePrompt];

    // Insert emotional context
    if (emotionalContext.emotionalPrompt) {
      enhancedPrompt.push(`\nEmotional State: ${emotionalContext.emotionalPrompt}`);
    }

    // Insert resonant memories if any
    if (resonantMemories && resonantMemories.length > 0) {
      enhancedPrompt.push('\nResonant Memories (past emotional experiences surfacing):');
      for (const rm of resonantMemories) {
        enhancedPrompt.push(
          ` - [${rm.emotionalMemory.emotionType}] ${rm.memory.description} (resonance: ${rm.similarity.toFixed(2)})`,
        );
      }
      enhancedPrompt.push(
        'These memories are coloring your current emotional state and may influence your responses.',
      );
    }

    // Add behavioral guidance based on emotions
    if (emotionalContext.valence < -40) {
      enhancedPrompt.push(
        'Your negative mood may make you more guarded or pessimistic in conversation.',
      );
    } else if (emotionalContext.valence > 40) {
      enhancedPrompt.push(
        'Your positive mood may make you more open and optimistic in conversation.',
      );
    }

    if (emotionalContext.arousal > 70) {
      enhancedPrompt.push('Your high energy may make you speak more quickly or enthusiastically.');
    } else if (emotionalContext.arousal < 30) {
      enhancedPrompt.push('Your low energy may make you speak more slowly or thoughtfully.');
    }

    return enhancedPrompt;
  },
});

/**
 * Process post-conversation emotional effects
 */
export const processPostConversationEmotions = internalAction({
  args: {
    worldId: v.id('worlds'),
    agent1Id: agentId,
    agent2Id: agentId,
    conversationId: conversationId,
    conversationSummary: v.string(),
    wasPositive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Update emotional bonds
    const bondChange = args.wasPositive
      ? { affectionChange: 5, trustChange: 3, respectChange: 2 }
      : { affectionChange: -3, trustChange: -2, rivalryChange: 2 };

    await ctx.runMutation(internal.emotions.initialization.updateEmotionalBond, {
      worldId: args.worldId,
      agent1Id: args.agent1Id,
      agent2Id: args.agent2Id,
      ...bondChange,
    });

    // Trigger emotions for both agents
    const eventType = args.wasPositive ? 'positive_exchange' : 'negative_exchange';

    await Promise.all([
      ctx.runMutation(internal.emotions.integration.updateEmotionsFromConversation, {
        worldId: args.worldId,
        agentId: args.agent1Id,
        conversationId: args.conversationId,
        eventType,
        otherAgentId: args.agent2Id,
      }),
      ctx.runMutation(internal.emotions.integration.updateEmotionsFromConversation, {
        worldId: args.worldId,
        agentId: args.agent2Id,
        conversationId: args.conversationId,
        eventType,
        otherAgentId: args.agent1Id,
      }),
    ]);

    console.log(
      `Processed post-conversation emotions for ${args.agent1Id} and ${args.agent2Id} (${eventType})`,
    );
  },
});

/**
 * Initialize all agents' emotional psychology at world startup
 */
export const initializeWorldEmotions = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get world
    const world = await ctx.db.get(args.worldId);
    if (!world) return;

    // Get all agents
    const agents = world.agents;

    // Get character names
    const agentDescriptions = await Promise.all(
      agents.map((agent) =>
        ctx.db
          .query('agentDescriptions')
          .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', agent.id))
          .first(),
      ),
    );

    // Get player descriptions to get character names
    const playerDescriptions = await Promise.all(
      agents.map((agent) =>
        ctx.db
          .query('playerDescriptions')
          .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', agent.playerId))
          .first(),
      ),
    );

    // Initialize each agent's psychology
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const characterName = playerDescriptions[i]?.name;

      await ctx.runMutation(internal.emotions.initialization.initializeAgentPsychology, {
        worldId: args.worldId,
        agentId: agent.id,
        playerId: agent.playerId,
        characterName,
      });
    }

    console.log(`Initialized emotional psychology for ${agents.length} agents`);
  },
});
