import { chatCompletion } from "../util/llm";
import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { WorldMap, serializedWorldMap } from './worldMap';
import { rememberConversation } from '../agent/memory';
import { GameId, agentId, conversationId, playerId } from './ids';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';
import { serializedAgent } from './agent';
import { ACTIVITIES, ACTIVITY_COOLDOWN, CONVERSATION_COOLDOWN } from '../constants';
import { api, internal } from '../_generated/api';
import { sleep } from '../util/sleep';
import { serializedPlayer } from './player';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.worldId,
      args.agentId as GameId<'agents'>,
      args.playerId as GameId<'players'>,
      args.conversationId as GameId<'conversations'>,
    );
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishRememberConversation',
      args: {
        agentId: args.agentId,
        operationId: args.operationId,
      },
    });
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    const text = await completionFn(
      ctx,
      args.worldId,
      args.conversationId as GameId<'conversations'>,
      args.playerId as GameId<'players'>,
      args.otherPlayerId as GameId<'players'>,
    );

    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
    });
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: v.object(serializedPlayer),
    agent: v.object(serializedAgent),
    map: v.object(serializedWorldMap),
    otherFreePlayers: v.array(v.object(serializedPlayer)),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { player, agent } = args;
    const map = new WorldMap(args.map);
    const now = Date.now();
    // Don't try to start a new conversation if we were just in one.
    const justLeftConversation =
      agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN;
    // Don't try again if we recently tried to find someone to invite.
    const recentlyAttemptedInvite =
      agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;
    const recentActivity = player.activity && now < player.activity.until + ACTIVITY_COOLDOWN;
    // Decide whether to do an activity or wander somewhere.
    if (!player.pathfinding) {
      if (recentActivity || justLeftConversation) {
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: wanderDestination(map),
          },
        });
        return;
      } else {
        let activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        try {
          const { name, identity, plan } = await ctx.runQuery(
            internal.aiTown.agentOperations.agentDescriptionQuery,
            {
              worldId: args.worldId,
              agentId: agent.id,
              playerId: player.id,
            }
          );

          const prompt = `You are ${name}.
Your identity is: ${identity}
Your current plan is: ${plan}

Choose an activity to do right now, and an emoji to represent it.
Output in JSON format with two keys: "description" (a short string describing the activity, e.g. "reading a book") and "emoji" (a single emoji, e.g. "📖").
`;
          const completion = await chatCompletion({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
            response_format: { type: 'json_object' },
          });
          const result = JSON.parse(completion.content);
          if (result.description && result.emoji) {
            activity = {
              description: result.description,
              emoji: result.emoji,
              duration: 60_000,
            };
          }
        } catch (e) {
          console.error("Failed to generate activity with LLM, falling back to random:", e);
        }

        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            activity: {
              description: activity.description,
              emoji: activity.emoji,
              until: Date.now() + activity.duration,
            },
          },
        });
        return;
      }
    }
    const invitee =
      justLeftConversation || recentlyAttemptedInvite
        ? undefined
        : await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
            now,
            worldId: args.worldId,
            player: args.player,
            otherFreePlayers: args.otherFreePlayers,
          });

    // TODO: We hit a lot of OCC errors on sending inputs in this file. It's
    // easy for them to get scheduled at the same time and line up in time.
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishDoSomething',
      args: {
        operationId: args.operationId,
        agentId: args.agent.id,
        invitee,
      },
    });
  },
});

function wanderDestination(worldMap: WorldMap) {
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (worldMap.width - 2)),
    y: 1 + Math.floor(Math.random() * (worldMap.height - 2)),
  };
}

// PHASE 1: Initialize emotional intelligence for a new agent
export const initializeAgentEmotions = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    playerId: v.string(),
    characterName: v.string(),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Initialize emotions
      await ctx.runMutation(internal.emotions.initialization.initializeAgentPsychology, {
        worldId: args.worldId,
        agentId: args.agentId,
        playerId: args.playerId,
        characterName: args.characterName,
      });
      console.log(`Initialized emotions for agent ${args.characterName} (${args.agentId})`);

      // PHASE 2: Initialize resources (energy, rest, nourishment, social battery)
      await ctx.runMutation(internal.world.resourceEngine.initializeAgentResources, {
        worldId: args.worldId,
        agentId: args.agentId,
        playerId: args.playerId,
      });
      console.log(`Initialized resources for agent ${args.characterName} (${args.agentId})`);

      // PHASE 3: Initialize social systems (reputation)
      await ctx.runMutation(internal.social.integration.initializeAgentSocialSystems, {
        worldId: args.worldId,
        agentId: args.agentId,
      });
      console.log(`Initialized social systems for agent ${args.characterName} (${args.agentId})`);

      // PHASE 4: Initialize narrative systems (story arcs, quests, mythology)
      await ctx.runMutation(internal.narrative.integration.initializeAgentNarrative, {
        worldId: args.worldId,
        agentId: args.agentId,
      });
      console.log(`Initialized narrative systems for agent ${args.characterName} (${args.agentId})`);

      // PHASE 6: Initialize evolution systems (learning, personality tracking, legacy)
      const psychology = await ctx.runQuery(internal.emotions.integration.getEmotionalContext, {
        worldId: args.worldId,
        agentId: args.agentId,
      });

      if (psychology) {
        await ctx.runMutation(internal.evolution.integration.initializeAgentEvolution, {
          worldId: args.worldId,
          agentId: args.agentId,
          baselinePersonality: {
            openness: psychology.personality.openness,
            conscientiousness: psychology.personality.conscientiousness,
            extraversion: psychology.personality.extraversion,
            agreeableness: psychology.personality.agreeableness,
            neuroticism: psychology.personality.neuroticism,
          },
        });
        console.log(`Initialized evolution systems for agent ${args.characterName} (${args.agentId})`);
      }
    } catch (error) {
      console.log(`Could not initialize agent systems for ${args.agentId}:`, error);
      // Don't fail agent creation if initialization fails
    }
  },
});

export const agentDescriptionQuery = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId as GameId<'players'>))
      .first();
    const agentDescription = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId as GameId<'agents'>))
      .first();
    return {
      name: playerDescription?.name || 'Unknown',
      identity: agentDescription?.identity || '',
      plan: agentDescription?.plan || '',
    };
  },
});
