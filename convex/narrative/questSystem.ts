/**
 * PHASE 4: DYNAMIC QUEST SYSTEM
 *
 * Generates meaningful quests and objectives based on agent psychology,
 * emotional state, social dynamics, and world state.
 *
 * Quests feel personal because they're generated from the agent's actual needs.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Generate quests for an agent based on their current state
 */
export const generateQuestsForAgent = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get agent's psychology
    const psychology = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!psychology) return { quests: [] };

    // Get agent's resources
    const resources = await ctx.db
      .query('agentResources')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get agent's reputation
    const reputation = await ctx.db
      .query('agentReputation')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get agent's narrative state
    const narrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Check how many active quests the agent already has
    const existingQuests = await ctx.db
      .query('narrativeQuests')
      .withIndex('assignedTo', (q) =>
        q.eq('worldId', args.worldId).eq('assignedTo', args.agentId).eq('status', 'active')
      )
      .collect();

    // Don't overload with quests
    if (existingQuests.length >= 3) return { quests: [] };

    const generatedQuests: Id<'quests'>[] = [];
    const now = Date.now();

    // PSYCHOLOGICAL NEEDS QUESTS
    // If autonomy is low, generate quest for independent action
    if (psychology.psychologicalNeeds.autonomy < 30) {
      const questId = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: 'emotional',
        assignedTo: args.agentId,
        issuedBy: 'self',
        title: 'Find My Own Path',
        description: 'I feel constrained. I need to do something that\'s truly my choice.',
        motivation: 'Seeking autonomy and self-direction',
        objectives: [
          {
            description: 'Make a decision independent of others',
            type: 'autonomy',
            threshold: 50,
            completed: false,
          },
        ],
        status: 'active',
        priority: 70,
        createdAt: now,
        acceptedAt: now,
        emotionalReward: 'anticipation',
      });
      generatedQuests.push(questId);
    }

    // If relatedness is low, generate social quest
    if (psychology.psychologicalNeeds.relatedness < 30 && resources) {
      const questId = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: 'social',
        assignedTo: args.agentId,
        issuedBy: 'self',
        title: 'Seek Connection',
        description: 'I\'m feeling isolated. I need meaningful connection with others.',
        motivation: 'Seeking belonging and relatedness',
        objectives: [
          {
            description: 'Have a positive conversation with someone',
            type: 'social',
            threshold: 1,
            completed: false,
          },
        ],
        status: 'active',
        priority: 80,
        createdAt: now,
        acceptedAt: now,
        emotionalReward: 'joy',
      });
      generatedQuests.push(questId);
    }

    // If competence is low, generate challenge quest
    if (psychology.psychologicalNeeds.competence < 30) {
      const questId = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: 'challenge',
        assignedTo: args.agentId,
        issuedBy: 'self',
        title: 'Prove Myself',
        description: 'I need to demonstrate my abilities and feel capable.',
        motivation: 'Seeking competence and mastery',
        objectives: [
          {
            description: 'Successfully complete a difficult task',
            type: 'competence',
            threshold: 1,
            completed: false,
          },
        ],
        status: 'active',
        priority: 60,
        createdAt: now,
        acceptedAt: now,
        emotionalReward: 'anticipation',
      });
      generatedQuests.push(questId);
    }

    // EMOTIONAL STATE QUESTS
    // If very sad, generate quest to find comfort
    if (psychology.emotionalState.sadness > 70) {
      const questId = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: 'emotional',
        assignedTo: args.agentId,
        issuedBy: 'self',
        title: 'Find Solace',
        description: 'This sadness is overwhelming. I need to find peace.',
        motivation: 'Seeking emotional healing',
        objectives: [
          {
            description: 'Visit a calming location',
            type: 'location',
            completed: false,
          },
          {
            description: 'Reduce sadness below 50',
            type: 'emotion',
            threshold: 50,
            completed: false,
          },
        ],
        status: 'active',
        priority: 90,
        createdAt: now,
        acceptedAt: now,
        emotionalReward: 'trust',
      });
      generatedQuests.push(questId);
    }

    // If very angry, generate quest for resolution
    if (psychology.emotionalState.anger > 70) {
      // Check if there's an active conflict
      const conflicts = await ctx.db
        .query('conflicts')
        .withIndex('agent1', (q) =>
          q.eq('worldId', args.worldId).eq('agent1Id', args.agentId).eq('status', 'active')
        )
        .collect();

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        const questId = await ctx.db.insert('narrativeQuests', {
          worldId: args.worldId,
          questType: 'reconciliation',
          assignedTo: args.agentId,
          issuedBy: 'self',
          title: 'Address the Conflict',
          description: 'This anger is consuming me. I need to resolve this.',
          motivation: 'Seeking conflict resolution',
          objectives: [
            {
              description: 'Confront or reconcile with the other party',
              type: 'social',
              target: conflict.agent2Id,
              completed: false,
            },
          ],
          status: 'active',
          priority: 85,
          createdAt: now,
          acceptedAt: now,
        });
        generatedQuests.push(questId);
      }
    }

    // REPUTATION QUESTS
    // If reputation is very low, generate redemption quest
    if (reputation && reputation.communityReputation < -40) {
      const questId = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: 'social',
        assignedTo: args.agentId,
        issuedBy: 'self',
        title: 'Earn Back Trust',
        description: 'People see me negatively. I need to change their perception.',
        motivation: 'Seeking redemption',
        objectives: [
          {
            description: 'Perform helpful actions for others',
            type: 'social',
            threshold: 3,
            completed: false,
          },
          {
            description: 'Improve community reputation by 20 points',
            type: 'reputation',
            threshold: reputation.communityReputation + 20,
            completed: false,
          },
        ],
        status: 'active',
        priority: 75,
        createdAt: now,
        acceptedAt: now,
        reputationChange: 10,
      });
      generatedQuests.push(questId);
    }

    // RESOURCE QUESTS
    // If social battery is critically low
    if (resources && resources.socialBattery < 20) {
      const isIntrovert = psychology.personality.extraversion < 40;

      const questId = await ctx.db.insert('narrativeQuests', {
        worldId: args.worldId,
        questType: isIntrovert ? 'exploration' : 'social',
        assignedTo: args.agentId,
        issuedBy: 'self',
        title: isIntrovert ? 'Find Solitude' : 'Seek Company',
        description: isIntrovert
          ? 'I need time alone to recharge.'
          : 'I need social interaction to energize me.',
        motivation: 'Seeking social battery restoration',
        objectives: [
          {
            description: isIntrovert
              ? 'Spend time in a quiet space'
              : 'Engage with others',
            type: 'social',
            completed: false,
          },
        ],
        status: 'active',
        priority: 70,
        createdAt: now,
        acceptedAt: now,
      });
      generatedQuests.push(questId);
    }

    // Log quest generation
    if (generatedQuests.length > 0) {
      await ctx.db.insert('gameMasterActions', {
        worldId: args.worldId,
        actionType: 'quest_generated',
        affectedAgents: [args.agentId],
        trigger: 'Agent psychological/emotional state analysis',
        reasoning: `Generated ${generatedQuests.length} quests based on needs`,
        timestamp: now,
      });
    }

    return { quests: generatedQuests };
  },
});

/**
 * Generate mythology-driven quests
 */
export const generateMythologyQuests = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get agent's known and believed myths
    const narrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!narrative || narrative.believedMyths.length === 0) {
      return { quests: [] };
    }

    const generatedQuests: Id<'quests'>[] = [];
    const now = Date.now();

    // Get believed myths
    for (const mythId of narrative.believedMyths) {
      const myth = await ctx.db.get(mythId);
      if (!myth) continue;

      // Ritual myths can generate ritual quests
      if (myth.mythType === 'ritual' && myth.ritual) {
        const questId = await ctx.db.insert('narrativeQuests', {
          worldId: args.worldId,
          questType: 'ritual',
          assignedTo: args.agentId,
          issuedBy: 'mythology',
          title: `Perform: ${myth.title}`,
          description: myth.content,
          motivation: `Following the ritual: ${myth.moralLesson || 'tradition'}`,
          objectives: myth.ritual.actions.map((action, idx) => ({
            description: action,
            type: 'ritual',
            completed: false,
          })),
          status: 'active',
          priority: 60,
          createdAt: now,
          acceptedAt: now,
        });
        generatedQuests.push(questId);

        // Only generate one ritual quest at a time
        break;
      }

      // Hero tales can inspire challenge quests
      if (myth.mythType === 'hero_tale') {
        const questId = await ctx.db.insert('narrativeQuests', {
          worldId: args.worldId,
          questType: 'challenge',
          assignedTo: args.agentId,
          issuedBy: 'mythology',
          title: `Follow in the Footsteps`,
          description: `Inspired by ${myth.title}, I want to prove my own heroism.`,
          motivation: 'Seeking to emulate legendary heroism',
          objectives: [
            {
              description: 'Perform a courageous act',
              type: 'heroic',
              completed: false,
            },
          ],
          status: 'active',
          priority: 65,
          createdAt: now,
          acceptedAt: now,
        });
        generatedQuests.push(questId);
        break;
      }
    }

    return { quests: generatedQuests };
  },
});

/**
 * Update quest progress based on agent actions
 */
export const updateQuestProgress = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    actionType: v.string(),
    actionData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const activeQuests = await ctx.db
      .query('narrativeQuests')
      .withIndex('assignedTo', (q) =>
        q.eq('worldId', args.worldId).eq('assignedTo', args.agentId).eq('status', 'active')
      )
      .collect();

    const now = Date.now();
    const completedQuests: Id<'quests'>[] = [];

    for (const quest of activeQuests) {
      let questModified = false;
      let allObjectivesComplete = true;

      for (let i = 0; i < quest.objectives.length; i++) {
        const objective = quest.objectives[i];
        if (objective.completed) continue;

        // Check if this action completes the objective
        let shouldComplete = false;

        switch (objective.type) {
          case 'social':
            if (args.actionType === 'conversation_ended' && args.actionData?.wasPositive) {
              shouldComplete = true;
            }
            break;

          case 'emotion':
            if (args.actionType === 'emotion_changed' && args.actionData?.emotion) {
              const emotionValue = args.actionData.value;
              if (objective.threshold && emotionValue < objective.threshold) {
                shouldComplete = true;
              }
            }
            break;

          case 'location':
            if (args.actionType === 'location_visited' && args.actionData?.location) {
              shouldComplete = true;
            }
            break;

          case 'reputation':
            if (args.actionType === 'reputation_changed') {
              const newRep = args.actionData?.newReputation;
              if (objective.threshold && newRep >= objective.threshold) {
                shouldComplete = true;
              }
            }
            break;

          case 'ritual':
            if (args.actionType === 'ritual_action' && args.actionData?.actionIndex === i) {
              shouldComplete = true;
            }
            break;
        }

        if (shouldComplete) {
          // ENHANCEMENT: Skill proficiency affects quest success probability
          let actuallySucceeds = true;

          try {
            // Map objective type to skill category
            const skillCategoryMap: Record<string, string> = {
              social: 'social',
              emotion: 'emotional',
              ritual: 'cultural',
              reputation: 'leadership',
              autonomy: 'leadership',
              competence: 'wisdom',
              relatedness: 'social',
            };

            const skillCategory = skillCategoryMap[objective.type];

            if (skillCategory) {
              // Get agent's skills in this category
              const agentSkills = await ctx.db
                .query('agentSkills')
                .withIndex('category', (q: any) =>
                  q.eq('worldId', args.worldId).eq('skillCategory', skillCategory)
                )
                .filter((q) => q.eq(q.field('agentId'), args.agentId))
                .collect();

              if (agentSkills.length > 0) {
                // Use highest proficiency in this category
                const maxProficiency = Math.max(...agentSkills.map((s) => s.proficiency));

                // Base success rate: 50% + proficiency/2
                // Novice (10): 55% success
                // Competent (50): 75% success
                // Expert (85): 92.5% success
                // Master (100): 100% success
                const successRate = Math.min(1.0, 0.5 + maxProficiency / 200);

                actuallySucceeds = Math.random() < successRate;

                if (!actuallySucceeds) {
                  console.log(
                    `Quest objective failed due to low ${skillCategory} skill (proficiency: ${maxProficiency}, chance: ${(successRate * 100).toFixed(1)}%)`
                  );
                }
              }
            }
          } catch (e) {
            // If skill system not available, always succeed
            console.log('Could not check skills for quest completion:', e);
          }

          if (actuallySucceeds) {
            quest.objectives[i].completed = true;
            quest.objectives[i].completedAt = now;
            questModified = true;
          }
        }

        if (!quest.objectives[i].completed) {
          allObjectivesComplete = false;
        }
      }

      if (questModified) {
        await ctx.db.patch(quest._id, {
          objectives: quest.objectives,
        });

        if (allObjectivesComplete) {
          await ctx.db.patch(quest._id, {
            status: 'completed',
            completedAt: now,
          });
          completedQuests.push(quest._id);

          // Apply quest rewards
          if (quest.emotionalReward) {
            await ctx.runMutation(internal.emotions.engine.triggerEmotion, {
              worldId: args.worldId,
              agentId: args.agentId,
              emotion: quest.emotionalReward,
              intensity: 30,
              source: 'quest_completion',
            });
          }

          if (quest.reputationChange) {
            const reputation = await ctx.db
              .query('agentReputation')
              .withIndex('agentId', (q) =>
                q.eq('worldId', args.worldId).eq('agentId', args.agentId)
              )
              .first();

            if (reputation) {
              await ctx.db.patch(reputation._id, {
                communityReputation: reputation.communityReputation + quest.reputationChange,
              });
            }
          }
        }
      }
    }

    return { completedQuests };
  },
});

/**
 * Get active quests for an agent
 */
export const getAgentQuests = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('narrativeQuests')
      .withIndex('assignedTo', (q) =>
        q.eq('worldId', args.worldId).eq('assignedTo', args.agentId).eq('status', 'active')
      )
      .collect();
  },
});

/**
 * Get quest context for conversation prompts
 */
export const getQuestContext = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const quests = await ctx.runQuery(internal.narrative.questSystem.getAgentQuests, {
      worldId: args.worldId,
      agentId: args.agentId,
    });

    if (quests.length === 0) return null;

    // Format highest priority quest for context
    const highestPriorityQuest = quests.sort((a, b) => b.priority - a.priority)[0];

    return {
      currentQuest: highestPriorityQuest.title,
      motivation: highestPriorityQuest.motivation,
      objectives: highestPriorityQuest.objectives
        .filter((obj) => !obj.completed)
        .map((obj) => obj.description),
    };
  },
});
