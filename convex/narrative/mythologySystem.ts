/**
 * PHASE 4 INSPIRED: LIVING MYTHOLOGY SYSTEM
 *
 * Agents create legends, rituals, cautionary tales, and shared wisdom
 * from remarkable events. These stories spread culturally and influence
 * future behavior.
 *
 * THE TOWN DEVELOPS ITS OWN CULTURE AND FOLKLORE.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Transform legendary story arcs into mythology
 */
export const createMythologyFromArcs = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Get legendary arcs (high memorability and impact, resolved)
    const legendaryArcs = await ctx.runQuery(
      internal.narrative.arcDetection.identifyLegendaryArcs,
      { worldId: args.worldId }
    );

    const now = Date.now();
    const createdMyths: Id<'mythology'>[] = [];

    for (const arc of legendaryArcs) {
      // Check if already transformed into myth
      const existingMyth = await ctx.db
        .query('mythology')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
        .filter((q) => q.eq(q.field('originArc'), arc._id))
        .first();

      if (existingMyth) continue;

      // Determine myth type based on arc type
      const mythType = determineMythType(arc.arcType);

      // Get participants
      const heroes: string[] = [];
      const villains: string[] = [];

      // For betrayal, rivalry - protagonist vs antagonist
      if (arc.arcType === 'betrayal' || arc.arcType === 'rivalry') {
        if (arc.protagonists.length > 0) heroes.push(arc.protagonists[0]);
        if (arc.antagonists && arc.antagonists.length > 0) {
          villains.push(arc.antagonists[0]);
        } else if (arc.protagonists.length > 1) {
          villains.push(arc.protagonists[1]);
        }
      } else if (arc.arcType === 'redemption') {
        // Redeemed character is the hero
        heroes.push(...arc.protagonists);
      } else {
        heroes.push(...arc.protagonists);
      }

      // Generate myth content
      const content = generateMythContent(arc);
      const moralLesson = generateMoralLesson(arc);
      const emotionalTone = calculateEmotionalTone(arc);

      // Create the myth
      const mythId = await ctx.db.insert('mythology', {
        worldId: args.worldId,
        mythType,
        title: generateMythTitle(arc),
        content,
        originArc: arc._id,
        creator: arc.protagonists[0], // First protagonist "tells" the story first
        createdAt: now,
        heroes,
        villains: villains.length > 0 ? villains : undefined,
        knownBy: [...arc.protagonists], // Participants know it first
        believedBy: [...arc.protagonists],
        moralLesson,
        emotionalTone,
        culturalSignificance: Math.floor(arc.memorability),
        generationsOld: 0,
        variants: [],
        influencesQuests: mythType === 'hero_tale' || mythType === 'wisdom',
        influencesFactions: mythType === 'legend' || mythType === 'origin_story',
        influencesReputation: true,
        lastToldAt: now,
        timesTold: 1,
        status: 'emerging',
      });

      createdMyths.push(mythId);

      // Update agent narratives
      for (const agentId of arc.protagonists) {
        const narrative = await ctx.db
          .query('agentNarratives')
          .withIndex('agentId', (q) =>
            q.eq('worldId', args.worldId).eq('agentId', agentId)
          )
          .first();

        if (narrative) {
          await ctx.db.patch(narrative._id, {
            createdMyths: [...narrative.createdMyths, mythId],
            knownMyths: [...narrative.knownMyths, mythId],
            believedMyths: [...narrative.believedMyths, mythId],
            legendStatus: Math.min(100, narrative.legendStatus + 10),
          });
        }
      }

      // Log myth creation
      await ctx.db.insert('gameMasterActions', {
        worldId: args.worldId,
        actionType: 'myth_promoted',
        affectedAgents: arc.protagonists,
        trigger: `Legendary arc resolved: ${arc.title}`,
        reasoning: `Arc had memorability ${arc.memorability} and impact ${arc.emotionalImpact}`,
        createdMyth: mythId,
        timestamp: now,
      });
    }

    return { createdMyths };
  },
});

function determineMythType(
  arcType: string
): 'legend' | 'cautionary_tale' | 'origin_story' | 'hero_tale' | 'tragedy' | 'ritual' | 'wisdom' | 'prophecy' {
  const mapping: Record<string, any> = {
    rise_and_fall: 'cautionary_tale',
    redemption: 'hero_tale',
    rivalry: 'legend',
    friendship: 'legend',
    love: 'legend',
    betrayal: 'cautionary_tale',
    discovery: 'origin_story',
    loss: 'tragedy',
    transformation: 'wisdom',
    quest: 'hero_tale',
    celebration: 'legend',
  };

  return mapping[arcType] || 'legend';
}

function generateMythTitle(arc: any): string {
  const titles: Record<string, string[]> = {
    betrayal: ['The Broken Bond', 'When Trust Shattered', 'The Betrayal'],
    redemption: ['The Second Chance', 'From Darkness to Light', 'The Redemption'],
    rivalry: ['The Great Rivalry', 'When Titans Clashed', 'The Contest'],
    friendship: ['The Unlikely Alliance', 'Bonds Unbreakable', 'The Friendship'],
    loss: ['The Mourning', 'When Joy Left Us', 'The Great Loss'],
    transformation: ['The Metamorphosis', 'The Change', 'Becoming'],
  };

  const options = titles[arc.arcType] || ['The Legend', 'The Tale', 'The Story'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMythContent(arc: any): string {
  // Simplified narrative generation
  const templates: Record<string, string> = {
    betrayal:
      'There was a time when trust was broken, and what was once united became divided. This is the story of how betrayal changed everything.',
    redemption:
      'They say even the darkest soul can find light again. This is the tale of one who fell, and through courage and determination, rose once more.',
    rivalry:
      'Two forces, equally matched, clashed in a contest that would be remembered for generations. Neither yielding, both determined.',
    friendship:
      'Against all odds, an unlikely bond formed. This is how connection transcended difference and created something beautiful.',
    loss:
      'There are moments when joy departs, leaving only memory. This is a story of loss, grief, and the slow path to healing.',
    transformation:
      'Change comes to all, but some transformations are profound. This is how one journey led to complete metamorphosis.',
  };

  return templates[arc.arcType] || 'A remarkable event that shaped our community.';
}

function generateMoralLesson(arc: any): string {
  const lessons: Record<string, string> = {
    betrayal: 'Trust carefully, for once broken, it is difficult to mend.',
    redemption: 'No mistake is beyond correction; change is always possible.',
    rivalry: 'Competition can drive us to greatness, but at what cost?',
    friendship: 'The strongest bonds often form in unexpected places.',
    loss: 'Grief is the price of love; honor it, but do not let it consume you.',
    transformation: 'Embrace change, for it is the only constant.',
  };

  return lessons[arc.arcType] || 'Every story teaches us something.';
}

function calculateEmotionalTone(arc: any): {
  joy: number;
  sadness: number;
  fear: number;
  inspiration: number;
} {
  const tones: Record<
    string,
    { joy: number; sadness: number; fear: number; inspiration: number }
  > = {
    betrayal: { joy: 10, sadness: 80, fear: 60, inspiration: 20 },
    redemption: { joy: 70, sadness: 30, fear: 20, inspiration: 90 },
    rivalry: { joy: 40, sadness: 30, fear: 50, inspiration: 70 },
    friendship: { joy: 85, sadness: 10, fear: 5, inspiration: 75 },
    loss: { joy: 5, sadness: 95, fear: 40, inspiration: 30 },
    transformation: { joy: 60, sadness: 30, fear: 40, inspiration: 85 },
  };

  return tones[arc.arcType] || { joy: 50, sadness: 50, fear: 30, inspiration: 50 };
}

/**
 * Spread mythology between agents through conversation
 */
export const shareMythology = internalMutation({
  args: {
    worldId: v.id('worlds'),
    tellerId: v.string(),
    listenerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get teller's narrative
    const tellerNarrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.tellerId)
      )
      .first();

    if (!tellerNarrative || tellerNarrative.knownMyths.length === 0) {
      return { shared: null };
    }

    // Get listener's narrative
    const listenerNarrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.listenerId)
      )
      .first();

    if (!listenerNarrative) return { shared: null };

    // Find myths the teller knows but listener doesn't
    const unknownMyths = tellerNarrative.knownMyths.filter(
      (mythId) => !listenerNarrative.knownMyths.includes(mythId)
    );

    if (unknownMyths.length === 0) return { shared: null };

    // Share one random myth
    const sharedMythId = unknownMyths[Math.floor(Math.random() * unknownMyths.length)];
    const myth = await ctx.db.get(sharedMythId);

    if (!myth) return { shared: null };

    const now = Date.now();

    // Update listener's narrative
    await ctx.db.patch(listenerNarrative._id, {
      knownMyths: [...listenerNarrative.knownMyths, sharedMythId],
      // They might believe it based on teller's reputation and their personality
      believedMyths: shouldBelieveMyth(myth)
        ? [...listenerNarrative.believedMyths, sharedMythId]
        : listenerNarrative.believedMyths,
    });

    // Update myth's spread
    await ctx.db.patch(sharedMythId, {
      knownBy: [...myth.knownBy, args.listenerId],
      believedBy: shouldBelieveMyth(myth)
        ? [...myth.believedBy, args.listenerId]
        : myth.believedBy,
      lastToldAt: now,
      timesTold: myth.timesTold + 1,
      generationsOld: myth.generationsOld + 0.1, // Each retelling ages it slightly
      status: myth.timesTold > 5 ? 'spreading' : myth.status,
    });

    return { shared: sharedMythId };
  },
});

function shouldBelieveMyth(myth: any): boolean {
  // Higher cultural significance = more believable
  // New myths are less believable than established ones
  const baseChance = myth.culturalSignificance / 100;
  const ageBonus = Math.min(0.3, myth.generationsOld / 10);
  const beliefChance = baseChance + ageBonus;

  return Math.random() < beliefChance;
}

/**
 * Create rituals from repeated behaviors
 */
export const createRituals = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    // Look for patterns in narrative events
    // If agents repeatedly do similar things in similar contexts, it becomes ritual

    const recentEvents = await ctx.db
      .query('narrativeEvents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    // Group events by type and location
    const eventPatterns = new Map<string, any[]>();

    for (const event of recentEvents) {
      if (!event.location) continue;

      const key = `${event.eventType}_${event.location}`;
      if (!eventPatterns.has(key)) {
        eventPatterns.set(key, []);
      }
      eventPatterns.get(key)!.push(event);
    }

    const now = Date.now();
    const createdRituals: Id<'mythology'>[] = [];

    // Find patterns that repeat frequently
    for (const [patternKey, events] of eventPatterns.entries()) {
      if (events.length < 5) continue; // Need at least 5 repetitions

      const [eventType, location] = patternKey.split('_');

      // Check if ritual already exists for this pattern
      const existingRitual = await ctx.db
        .query('mythology')
        .withIndex('type', (q) =>
          q.eq('worldId', args.worldId).eq('mythType', 'ritual')
        )
        .filter((q) =>
          q.eq(q.field('ritual')!.location, location)
        )
        .first();

      if (existingRitual) continue;

      // Calculate dominant emotion for this pattern
      const avgEmotions = events.reduce(
        (acc, e) => ({
          joy: acc.joy + (e.emotions.joy || 0),
          sadness: acc.sadness + (e.emotions.sadness || 0),
          fear: acc.fear + (e.emotions.fear || 0),
        }),
        { joy: 0, sadness: 0, fear: 0 }
      );

      Object.keys(avgEmotions).forEach((key) => {
        avgEmotions[key as keyof typeof avgEmotions] /= events.length;
      });

      const dominantEmotion = Object.entries(avgEmotions).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      // Create ritual
      const ritual = generateRitual(eventType, location, dominantEmotion);

      const mythId = await ctx.db.insert('mythology', {
        worldId: args.worldId,
        mythType: 'ritual',
        title: ritual.title,
        content: ritual.content,
        createdAt: now,
        knownBy: [],
        believedBy: [],
        moralLesson: ritual.purpose,
        emotionalTone: {
          joy: dominantEmotion === 'joy' ? 80 : 30,
          sadness: dominantEmotion === 'sadness' ? 80 : 20,
          fear: dominantEmotion === 'fear' ? 70 : 20,
          inspiration: 60,
        },
        ritual: {
          triggerCondition: ritual.trigger,
          location,
          participants: 'individual',
          actions: ritual.actions,
          expectedOutcome: ritual.outcome,
        },
        culturalSignificance: 40, // Start moderate
        generationsOld: 0,
        variants: [],
        influencesQuests: true,
        influencesFactions: false,
        influencesReputation: false,
        lastToldAt: now,
        timesTold: 1,
        status: 'emerging',
      });

      createdRituals.push(mythId);

      // Log ritual creation
      await ctx.db.insert('gameMasterActions', {
        worldId: args.worldId,
        actionType: 'ritual_suggested',
        affectedAgents: [],
        affectedLocation: location,
        trigger: `Pattern detected: ${events.length} similar events`,
        reasoning: `Ritual emerged from repeated ${eventType} at ${location}`,
        createdMyth: mythId,
        timestamp: now,
      });
    }

    return { createdRituals };
  },
});

function generateRitual(
  eventType: string,
  location: string,
  emotion: string
): {
  title: string;
  content: string;
  purpose: string;
  trigger: string;
  actions: string[];
  outcome: string;
} {
  // Generate ritual based on emotion
  if (emotion === 'joy') {
    return {
      title: `Celebration at ${location}`,
      content: `When joy fills the heart, gather at ${location} to share the feeling.`,
      purpose: 'Amplify and share joy with the community',
      trigger: 'When experiencing high joy',
      actions: [
        'Visit the location',
        'Express gratitude',
        'Share positive feelings with others present',
      ],
      outcome: 'Increased joy and social connection',
    };
  } else if (emotion === 'sadness') {
    return {
      title: `Mourning at ${location}`,
      content: `When grief weighs heavy, seek solace at ${location}.`,
      purpose: 'Process grief in a sacred space',
      trigger: 'When experiencing high sadness',
      actions: [
        'Visit the location alone',
        'Reflect on the loss',
        'Allow emotions to flow',
      ],
      outcome: 'Emotional processing and healing',
    };
  } else {
    return {
      title: `Gathering at ${location}`,
      content: `In times of uncertainty, ${location} becomes a meeting place.`,
      purpose: 'Find courage and community',
      trigger: 'When experiencing fear or anxiety',
      actions: ['Visit the location', 'Seek others', 'Share concerns'],
      outcome: 'Reduced fear through solidarity',
    };
  }
}

/**
 * Get mythology context for conversation prompts
 */
export const getMythologyContext = internalQuery({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const narrative = await ctx.db
      .query('agentNarratives')
      .withIndex('agentId', (q) =>
        q.eq('worldId', args.worldId).eq('agentId', args.agentId)
      )
      .first();

    if (!narrative || narrative.believedMyths.length === 0) {
      return null;
    }

    // Get most culturally significant myths
    const myths = await Promise.all(
      narrative.believedMyths.map((id) => ctx.db.get(id))
    );

    const validMyths = myths.filter((m) => m !== null);
    if (validMyths.length === 0) return null;

    const topMyth = validMyths.sort(
      (a, b) => b!.culturalSignificance - a!.culturalSignificance
    )[0]!;

    return {
      believesIn: topMyth.title,
      mythType: topMyth.mythType,
      moralLesson: topMyth.moralLesson,
      timesHeard: topMyth.timesTold,
      culturalImportance: topMyth.culturalSignificance,
    };
  },
});

/**
 * Evolve mythology over time (establish or fade)
 */
export const evolveMythology = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const allMyths = await ctx.db
      .query('mythology')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const now = Date.now();
    const timeSinceLastTold = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const myth of allMyths) {
      const age = now - myth.lastToldAt;

      // Myths that aren't retold start fading
      if (age > timeSinceLastTold && myth.status !== 'fading') {
        await ctx.db.patch(myth._id, {
          status: myth.status === 'sacred' ? 'established' : 'fading',
        });
      }

      // Widely known myths become established
      if (myth.knownBy.length > 5 && myth.status === 'spreading') {
        await ctx.db.patch(myth._id, {
          status: 'established',
          culturalSignificance: Math.min(100, myth.culturalSignificance + 10),
        });
      }

      // Very old, widely believed myths become sacred
      if (
        myth.knownBy.length > 10 &&
        myth.generationsOld > 5 &&
        myth.culturalSignificance > 80
      ) {
        await ctx.db.patch(myth._id, {
          status: 'sacred',
        });
      }

      // Completely forgotten myths
      if (myth.knownBy.length === 0 && myth.status === 'fading') {
        await ctx.db.patch(myth._id, {
          status: 'forgotten',
        });
      }
    }
  },
});
