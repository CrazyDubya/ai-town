/**
 * PHASE 5: VISUALIZATION QUERIES
 *
 * Backend queries that provide data for visual UI elements:
 * - Emotion indicators and auras
 * - Relationship graphs
 * - Quest/arc/myth status
 * - World state overlays
 */

import { v } from 'convex/values';
import { query, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * Get emotion visualization data for all active agents
 */
export const getEmotionVisualization = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get all agents in this world
    const agents = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const emotionData = [];

    for (const agent of agents) {
      const psychology = await ctx.db
        .query('agentPsychology')
        .withIndex('agentId', (q: any) =>
          q.eq('worldId', args.worldId).eq('agentId', agent.id)
        )
        .first();

      if (!psychology) continue;

      // Calculate dominant emotion
      const emotions = psychology.emotionalState;
      const dominantEmotion = Object.entries(emotions)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

      // Calculate mood valence and arousal
      const mood = {
        valence: (emotions.joy + emotions.trust - emotions.sadness - emotions.disgust) / 4,
        arousal: (emotions.anger + emotions.fear + emotions.anticipation + emotions.surprise) / 4,
      };

      emotionData.push({
        agentId: agent.id,
        agentName: agent.name,
        dominantEmotion: dominantEmotion[0],
        dominantIntensity: dominantEmotion[1],
        allEmotions: emotions,
        mood,
        // Visual cues
        auraColor: getEmotionColor(dominantEmotion[0]),
        auraIntensity: (dominantEmotion[1] as number) / 100,
        expressionIcon: getEmotionIcon(dominantEmotion[0]),
      });
    }

    return emotionData;
  },
});

function getEmotionColor(emotion: string): string {
  const colors: Record<string, string> = {
    joy: '#FFD700',        // Gold
    sadness: '#4169E1',    // Royal blue
    anger: '#DC143C',      // Crimson
    fear: '#9370DB',       // Medium purple
    trust: '#32CD32',      // Lime green
    disgust: '#8B4513',    // Saddle brown
    anticipation: '#FFA500', // Orange
    surprise: '#FF1493',   // Deep pink
  };
  return colors[emotion] || '#808080';
}

function getEmotionIcon(emotion: string): string {
  const icons: Record<string, string> = {
    joy: '😊',
    sadness: '😢',
    anger: '😠',
    fear: '😨',
    trust: '🤝',
    disgust: '🤢',
    anticipation: '🤔',
    surprise: '😲',
  };
  return icons[emotion] || '😐';
}

/**
 * Get relationship graph data for visualization
 */
export const getRelationshipGraph = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get all agents (nodes)
    const agents = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const nodes = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
    }));

    // Get all emotional bonds (edges)
    const bonds = await ctx.db
      .query('emotionalBonds')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    // Get all conflicts
    const conflicts = await ctx.db
      .query('conflicts')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'escalating'),
          q.eq(q.field('status'), 'climactic')
        )
      )
      .collect();

    const edges = [];

    // Add bond edges
    for (const bond of bonds) {
      // Only show significant bonds
      if (Math.abs(bond.bondStrength) < 20) continue;

      const isPositive = bond.bondStrength > 0;
      const intensity = Math.abs(bond.bondStrength);

      edges.push({
        source: bond.agentId,
        target: bond.otherAgentId,
        type: isPositive ? 'bond' : 'negative',
        strength: intensity,
        color: isPositive ? '#32CD32' : '#FF6347',
        width: Math.max(1, intensity / 20), // 1-5 pixels
        label: isPositive ? 'Bond' : 'Tension',
      });
    }

    // Add conflict edges (override bonds if conflict exists)
    for (const conflict of conflicts) {
      // Remove any existing edge between these agents
      const existingIndex = edges.findIndex(
        (e) =>
          (e.source === conflict.agent1Id && e.target === conflict.agent2Id) ||
          (e.source === conflict.agent2Id && e.target === conflict.agent1Id)
      );
      if (existingIndex !== -1) {
        edges.splice(existingIndex, 1);
      }

      edges.push({
        source: conflict.agent1Id,
        target: conflict.agent2Id,
        type: 'conflict',
        strength: conflict.intensityScore,
        severity: conflict.severity,
        color: getConflictColor(conflict.severity),
        width: Math.max(2, conflict.intensityScore / 15), // 2-7 pixels
        label: `Conflict (${conflict.severity})`,
        animated: conflict.status === 'escalating' || conflict.status === 'climactic',
      });
    }

    // Get factions for grouping
    const factions = await ctx.db
      .query('socialFactions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const factionMemberships = await ctx.db
      .query('factionMemberships')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const groups = factions.map((faction) => ({
      id: faction._id,
      name: faction.name,
      members: factionMemberships
        .filter((m) => m.factionId === faction._id)
        .map((m) => m.agentId),
      cohesion: faction.cohesion,
      influence: faction.influence,
    }));

    return {
      nodes,
      edges,
      groups,
    };
  },
});

function getConflictColor(severity: string): string {
  const colors = {
    minor: '#FFA500',      // Orange
    moderate: '#FF6347',   // Tomato
    serious: '#DC143C',    // Crimson
    critical: '#8B0000',   // Dark red
  };
  return colors[severity as keyof typeof colors] || '#FF6347';
}

/**
 * Get active story arcs with visual data
 */
export const getActiveStoryArcs = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const arcs = await ctx.db
      .query('storyArcs')
      .withIndex('active', (q) =>
        q.eq('worldId', args.worldId).eq('resolvedAt', undefined)
      )
      .collect();

    const arcData = [];

    for (const arc of arcs) {
      arcData.push({
        id: arc._id,
        type: arc.arcType,
        title: arc.title,
        stage: arc.stage,
        intensity: arc.intensity,
        protagonists: arc.protagonists,
        antagonists: arc.antagonists,
        // Visual
        color: getArcColor(arc.arcType),
        icon: getArcIcon(arc.arcType),
        progress: calculateArcProgress(arc.stage),
        memorability: arc.memorability,
      });
    }

    return arcData;
  },
});

function getArcColor(arcType: string): string {
  const colors: Record<string, string> = {
    friendship: '#32CD32',
    rivalry: '#FF8C00',
    betrayal: '#8B0000',
    redemption: '#4169E1',
    love: '#FF1493',
    loss: '#4682B4',
    transformation: '#9370DB',
    quest: '#FFD700',
    discovery: '#1E90FF',
    celebration: '#FF69B4',
  };
  return colors[arcType] || '#808080';
}

function getArcIcon(arcType: string): string {
  const icons: Record<string, string> = {
    friendship: '🤝',
    rivalry: '⚔️',
    betrayal: '💔',
    redemption: '🌅',
    love: '❤️',
    loss: '😢',
    transformation: '🦋',
    quest: '🎯',
    discovery: '🔍',
    celebration: '🎉',
  };
  return icons[arcType] || '📖';
}

function calculateArcProgress(stage: string): number {
  const stageProgress: Record<string, number> = {
    setup: 20,
    rising_action: 50,
    climax: 80,
    falling_action: 90,
    resolution: 100,
  };
  return stageProgress[stage] || 0;
}

/**
 * Get quest progress for all agents
 */
export const getQuestProgress = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const quests = await ctx.db
      .query('narrativeQuests')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    return quests.map((quest) => {
      const completedObjectives = quest.objectives.filter((o) => o.completed).length;
      const totalObjectives = quest.objectives.length;
      const progress = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

      return {
        id: quest._id,
        agentId: quest.assignedTo,
        title: quest.title,
        type: quest.questType,
        issuedBy: quest.issuedBy,
        priority: quest.priority,
        objectives: quest.objectives,
        progress,
        // Visual
        color: getQuestColor(quest.questType),
        icon: getQuestIcon(quest.questType),
      };
    });
  },
});

function getQuestColor(questType: string): string {
  const colors: Record<string, string> = {
    social: '#32CD32',
    emotional: '#FF69B4',
    exploration: '#1E90FF',
    ritual: '#9370DB',
    challenge: '#FF8C00',
    reconciliation: '#4169E1',
    discovery: '#FFD700',
    creation: '#FF1493',
  };
  return colors[questType] || '#808080';
}

function getQuestIcon(questType: string): string {
  const icons: Record<string, string> = {
    social: '👥',
    emotional: '💭',
    exploration: '🗺️',
    ritual: '🕯️',
    challenge: '⚡',
    reconciliation: '🤝',
    discovery: '🔍',
    creation: '✨',
  };
  return icons[questType] || '📋';
}

/**
 * Get mythology status and cultural spread
 */
export const getMythologyStatus = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const myths = await ctx.db
      .query('mythology')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'spreading'),
          q.eq(q.field('status'), 'established'),
          q.eq(q.field('status'), 'sacred')
        )
      )
      .collect();

    return myths.map((myth) => ({
      id: myth._id,
      type: myth.mythType,
      title: myth.title,
      status: myth.status,
      culturalSignificance: myth.culturalSignificance,
      knownByCount: myth.knownBy.length,
      believedByCount: myth.believedBy.length,
      timesTold: myth.timesTold,
      generationsOld: myth.generationsOld,
      // Visual
      color: getMythColor(myth.mythType),
      icon: getMythIcon(myth.mythType),
    }));
  },
});

function getMythColor(mythType: string): string {
  const colors: Record<string, string> = {
    legend: '#FFD700',
    cautionary_tale: '#DC143C',
    origin_story: '#4169E1',
    hero_tale: '#FF8C00',
    tragedy: '#4682B4',
    ritual: '#9370DB',
    wisdom: '#32CD32',
    prophecy: '#FF1493',
  };
  return colors[mythType] || '#808080';
}

function getMythIcon(mythType: string): string {
  const icons: Record<string, string> = {
    legend: '⭐',
    cautionary_tale: '⚠️',
    origin_story: '📜',
    hero_tale: '🦸',
    tragedy: '😢',
    ritual: '🕯️',
    wisdom: '💡',
    prophecy: '🔮',
  };
  return icons[mythType] || '📖';
}

/**
 * Get world state overlay data
 */
export const getWorldStateOverlay = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get time of day
    const worldTime = await ctx.db
      .query('worldTime')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    // Get weather
    const weather = await ctx.db
      .query('worldWeather')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    // Get atmosphere
    const atmosphere = await ctx.db
      .query('worldAtmosphere')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    // Get resonance chambers
    const chambers = await ctx.db
      .query('resonanceChambers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    return {
      time: worldTime
        ? {
            hour: worldTime.hour,
            timeOfDay: worldTime.timeOfDay,
            dayNumber: worldTime.dayNumber,
          }
        : null,
      weather: weather
        ? {
            current: weather.currentWeather,
            emotionallyDriven: weather.emotionallyDriven,
            dominantEmotion: weather.dominantEmotion,
          }
        : null,
      atmosphere: atmosphere
        ? {
            valence: atmosphere.valence,
            arousal: atmosphere.arousal,
            dominantEmotion: atmosphere.dominantEmotion,
            intensity: atmosphere.intensity,
          }
        : null,
      resonanceChambers: chambers.map((chamber) => ({
        id: chamber._id,
        name: chamber.name,
        location: chamber.location,
        chamberType: chamber.chamberType,
        focusEmotion: chamber.focusEmotion,
        currentOccupants: chamber.currentOccupants,
        isActive: chamber.isActive,
        // Visual
        color: getChamberColor(chamber.chamberType),
        intensity: chamber.emotionAmplification,
      })),
    };
  },
});

function getChamberColor(chamberType: string): string {
  const colors: Record<string, string> = {
    amplifier: '#FF6347',    // Red - intense
    stabilizer: '#4169E1',   // Blue - calm
    transformer: '#9370DB',  // Purple - change
  };
  return colors[chamberType] || '#808080';
}

/**
 * Get comprehensive agent status for detail view
 */
export const getAgentDetailedStatus = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get agent
    const agent = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.eq(q.field('id'), args.agentId))
      .first();

    if (!agent) return null;

    // Get psychology
    const psychology = await ctx.db
      .query('agentPsychology')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get resources
    const resources = await ctx.db
      .query('agentResources')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get reputation
    const reputation = await ctx.db
      .query('agentReputation')
      .withIndex('agentId', (q: any) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get narrative
    const narrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    // Get active quests
    const quests = await ctx.db
      .query('narrativeQuests')
      .withIndex('assignedTo', (q: any) =>
        q.eq('worldId', args.worldId).eq('assignedTo', args.agentId).eq('status', 'active')
      )
      .collect();

    // Get conflicts
    const conflicts = await ctx.db
      .query('conflicts')
      .withIndex('agent1', (q: any) =>
        q.eq('worldId', args.worldId).eq('agent1Id', args.agentId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'escalating')
        )
      )
      .collect();

    return {
      agent: {
        id: agent.id,
        name: agent.name,
      },
      psychology,
      resources,
      reputation,
      narrative: narrative
        ? {
            legendStatus: narrative.legendStatus,
            reputation: narrative.reputation,
            activeArcs: narrative.involvedInArcs.length,
            knownMyths: narrative.knownMyths.length,
            createdMyths: narrative.createdMyths.length,
          }
        : null,
      activeQuests: quests.length,
      activeConflicts: conflicts.length,
    };
  },
});
