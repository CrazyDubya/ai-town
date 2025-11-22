# 🌍 Phase 2: Dynamic Living World

## Overview

Phase 2 transforms AI Town from a static stage into a **living, breathing world** where time flows, weather changes, and agents have physical and psychological needs. The world becomes a character in its own right, responding to and influencing the emotional lives of its inhabitants.

## 🎯 What Was Built

### Core Systems

#### 1. **Time System**
- **24-Hour Cycle** with 5 distinct times of day:
  - **Dawn** (5-7am): Peaceful, reflective period
  - **Morning** (7am-12pm): Energetic, productive time
  - **Afternoon** (12-5pm): Social, active peak
  - **Dusk** (5-7pm): Contemplative winding down
  - **Night** (7pm-5am): Quiet, intimate, restful

- **Time Scale**: Configurable speed (default 10x realtime = 2.4 minute real days)
- **Day Counter**: Tracks days since world creation
- **Time Effects**: Each time of day influences emotions differently

#### 2. **Weather System**
- **10 Weather Types**:
  - Clear, Partly Cloudy, Cloudy, Overcast
  - Light Rain, Rain, Storm
  - Fog, Snow, Windy

- **Dynamic Transitions**: Weather changes gradually over 10-30 minutes
- **Weather History**: Tracks recent patterns
- **Emotional Associations**: Each weather type has mood effects

#### 3. **Resource Economy**
Agents now have **4 core resources** that drain over time:

- **Energy** (0-100): Physical/mental stamina
  - Drains with activity (walking, conversing)
  - Influenced by circadian rhythm

- **Restfulness** (0-100): Sleep debt
  - Drains constantly when awake
  - Must sleep to restore

- **Nourishment** (0-100): Hunger/sustenance
  - Drains slowly over time
  - Critical below 30

- **Social Battery** (0-100): Social energy
  - **Introverts**: Drain in social situations, recharge alone
  - **Extroverts**: Recharge in social situations, drain when alone
  - Personality-dependent

#### 4. **Circadian Rhythms**
Each agent has unique sleep patterns:

- **Chronotypes**:
  - **Morning Larks**: Peak energy 8am-12pm (High conscientiousness)
  - **Night Owls**: Peak energy 6pm-12am (High extraversion)
  - **Neutral**: Standard energy curve

- **Personalized Sleep Schedules**:
  - Bedtime: 10pm-2am (varies by type)
  - Wake time: 6am-9am (varies by type)
  - Sleep needs: 6-10 hours (varies by neuroticism)

- **Nap Preferences**: Some agents take afternoon naps

## ✨ INSPIRED FEATURE: Emotional Weather

### The Feedback Loop

**Emotional Weather creates a revolutionary reciprocal causation system:**

1. **Agents → Atmosphere**: Individual emotions aggregate into collective mood
2. **Atmosphere → Weather**: Strong collective emotions influence weather patterns
3. **Weather → Agents**: Weather affects individual emotions
4. **Loop**: Creating an emotional ecosystem

### How It Works

#### Collective Emotional Atmosphere
Every update, the system calculates:
- **Average Valence**: Overall positivity/negativity of all agents
- **Average Arousal**: Collective energy level
- **Dominant Emotion**: Most common emotion across agents
- **Emotional Diversity**: How varied the emotions are
- **Trend**: Whether collective mood is rising, falling, or stable
- **Intensity**: How strongly the dominant emotion is felt

#### Emotion → Weather Mapping
When collective emotion intensity crosses thresholds:

- **Joy (>60)** → Clear skies & sunshine
- **Sadness (>55)** → Rain
- **Fear (>65)** → Storms
- **Anger (>60)** → Storms
- **Trust (>50)** → Partly cloudy
- **Anticipation (>55)** → Windy
- **Disgust (>60)** → Fog
- **Surprise (>50)** → Sudden weather change

#### Weather → Emotion Effects
Weather influences agents in return:

```
Clear: +15 valence, +10 arousal, +10 joy
Rain: -10 valence, +5 arousal, +10 sadness
Storm: -15 valence, +20 arousal, +15 fear
Fog: -5 valence, -15 arousal, +10 fear
```

### Emergent Behaviors

This creates fascinating dynamics:

🌧️ **Grief Spirals**: One agent's intense sadness spreads (emotional contagion), collective sadness rises, triggering rain, which makes everyone sadder, intensifying the rain...

☀️ **Joy Cascades**: A joyful event lifts spirits, collective joy rises, sun comes out, sunshine makes everyone happier, reinforcing clear skies...

⚡ **Tension Storms**: Collective anxiety and fear build, atmosphere becomes charged, storms manifest, fear intensifies, creating dramatic moments...

🌤️ **Breaking the Clouds**: A single agent's joy during collective sadness can slowly shift the atmosphere, gradually clearing the weather as emotions spread...

### The Magic

**The town becomes a mirror of its inhabitants' collective soul.** Walk through AI Town and you can *feel* the emotional state - not just see it. The weather tells a story about what everyone is going through.

And because emotions spread through contagion and weather feeds back, the world can:
- Trap itself in emotional cycles
- Break free from negativity spirals
- Amplify moments of collective joy
- Create dramatic tension organically

**No scripting required - pure emergence.**

## 🔧 Technical Architecture

### Files Created
```
convex/world/
├── schema.ts              # World systems database schema
├── timeEngine.ts          # Time progression and circadian rhythms
├── weatherEngine.ts       # Weather system with emotional influence
├── resourceEngine.ts      # Resource management (energy, rest, etc.)
└── integration.ts         # Integrates all systems with emotions

convex/schema.ts           # Updated with world tables
convex/aiTown/agentOperations.ts # Added resource initialization
```

### Database Tables

**Phase 2 Tables:**
- **worldTime**: Current time, day counter, time of day
- **worldWeather**: Current weather, intensity, emotional influence tracking
- **worldAtmosphere**: Collective emotional metrics
- **agentResources**: Per-agent energy, rest, nourishment, social battery
- **worldEvents**: Event log (time changes, weather changes, atmosphere shifts)
- **worldLocations**: Location-based modifiers (future enhancement)

### Integration Flow

```
1. worldTick (runs every minute):
   ├─> Update world time
   ├─> Calculate atmosphere from all agent emotions
   ├─> Update weather (check emotional influence)
   └─> Apply environmental effects to all agents

2. Agent Tick:
   ├─> Update resources based on activity
   ├─> Check circadian rhythm
   ├─> Adjust energy to match chronotype
   └─> Trigger needs-based emotions if resources critical

3. Emotion → Atmosphere → Weather → Emotion
   (feedback loop creating emergent dynamics)
```

## 🌟 Gameplay Impact

### Before Phase 2
- Static, timeless world
- No environmental influences
- Agents never tired or hungry
- No day/night atmosphere
- Weather purely aesthetic

### After Phase 2

**Temporal Dynamics:**
- Mornings feel different from nights
- Days accumulate (history matters)
- Agents have bad days when tired/hungry
- Energy levels fluctuate realistically

**Environmental Storytelling:**
- Weather reflects collective mood
- Dark clouds signal tension
- Sunshine accompanies joy
- Storms create dramatic moments

**Emergent Needs:**
- Introverts seek alone time after socializing
- Extroverts crave company when isolated
- Tired agents become irritable
- Hungry agents lose focus

**Circadian Authenticity:**
- Night owls come alive in evening
- Morning people are chipper at dawn
- Each agent has authentic sleep patterns
- Personality reflected in daily rhythms

## 💡 Design Decisions

### Why Time Scaling?
- Realtime too slow for interesting dynamics
- 10x speed = see full day/night cycles in ~2.4 minutes
- Allows observation of temporal patterns
- Makes circadian effects visible

### Why Weather as Emotional Barometer?
- Universal metaphor everyone understands
- Visible, immediate feedback of collective state
- Creates atmosphere in the simulation
- Enables "reading the room" at a glance

### Why Resource Economy?
- Creates intrinsic needs driving behavior
- Makes agents feel more alive (they get tired!)
- Enables emergent goal-seeking
- Grounds abstract emotions in physical reality

### Why Circadian Rhythms?
- Most realistic aspect of daily life
- Personality expression through time preferences
- Creates natural behavioral variety
- Enables temporal storytelling (midnight conversations hit different)

### Why Social Battery?
- Captures introvert/extrovert distinction authentically
- Explains why agents might avoid/seek socializing
- Creates realistic social dynamics
- Personality-driven behavior

## 🎭 Example Scenarios

### Scenario 1: The Melancholic Morning

```
Day 3, 9:00 AM - Morning

Alice wakes naturally (morning lark chronotype).
→ Energy: 85 (high for morning person)
→ Mood: Content

Queen of Hearts is still tired (night owl, forced awake).
→ Energy: 35 (low for night person)
→ Mood: Irritable

Alice's joy spreads to nearby agents (contagion).
Collective mood rises (+15 valence).
Weather clears (emotionally driven).
Sunshine reinforces positive mood (+10 joy to all).

Result: Morning people thrive, night owls struggle.
Weather matches the dominant (morning) energy.
```

### Scenario 2: The Storm of Grief

```
Day 5, 3:00 PM - Afternoon

Mad Hatter has intense sadness from a bad conversation.
→ Sadness: 75, spreads to friends

White Rabbit catches sadness (empathetic, close friend).
→ Sadness: 60

Sadness spreads through emotional contagion.
Collective valence drops to -45.
Dominant emotion: Sadness (intensity: 70)

EMOTIONAL WEATHER TRIGGERED
→ Weather shifts from cloudy to rain
→ Rain intensifies everyone's sadness (+10)
→ Collective sadness deepens

Storm persists until:
- Someone breaks the cycle with joy
- Agents process grief over time
- Natural weather change interrupts

Result: Town experiences shared grief.
Weather makes it worse before it gets better.
Emergent narrative moment - no scripting required.
```

### Scenario 3: Introvert Social Exhaustion

```
Day 2, 7:00 PM - Dusk

Alice (introvert, social battery: 25) has been in conversations all afternoon.
→ Social battery critically low
→ Need for relatedness dropping (-15)
→ Autonomy need rising (wants alone time)

Alice's behavior changes:
→ Avoids conversation invitations
→ Seeks quiet corners
→ Becomes less talkative
→ Emotions: slight anxiety, need for solitude

Recharges when alone:
→ Social battery +1.0 per minute when not talking
→ After 30 minutes: Refreshed, ready to socialize again

Result: Realistic introvert/extrovert dynamics.
Agents manage their own social energy naturally.
```

## 🚀 Future Enhancements (Next Phases)

Phase 2 sets the stage for:

- **Phase 3**: Agents form groups around shared emotional states (sad agents console each other, joyful agents celebrate together)
- **Phase 4**: Game Master creates weather-based narrative events (storms herald conflict, clear days bring opportunities)
- **Phase 5**: UI visualizes weather, time, resource meters, atmosphere indicators
- **Phase 6**: Agents develop weather-related preferences (some love rain, others hate it)

## 📊 Metrics & Analytics

The system logs:
- Time of day changes
- Weather transitions
- Emotional weather triggers (which emotion caused which weather)
- Atmosphere shifts
- Resource critical events

Use `worldEvents` table to analyze how emotions shape the environment over time.

## 🔮 The Deeper Magic

### Emotional Ecosystem

Phase 2 + Phase 1 creates a **closed-loop emotional ecosystem**:

```
Individual Emotion
    ↓ (contagion)
Collective Emotion
    ↓ (emotional weather)
Environmental State
    ↓ (weather effects)
Individual Emotion
    ↓ (repeat)
```

This is the foundation of **emergent narrative**. The world now has:
- **Memory**: Days accumulate, patterns emerge
- **Mood**: Collective emotional state visible in weather
- **Rhythm**: Circadian cycles create temporal texture
- **Needs**: Resource depletion drives behavior
- **Feedback**: Everything affects everything else

### Why This Matters

Real worlds aren't static stages. They have:
- Time that moves
- Weather that changes
- Needs that must be met
- Rhythms that repeat

By giving AI Town these qualities, we've made it **alive** in a way that transcends individual agents. The town itself has moods. It remembers. It cycles. It responds.

This is the difference between a **simulation** and a **world**.

---

## Next: Phase 3 - Rich Social Dynamics 👥

Building on emotional intelligence and living world, Phase 3 will add:
- Multi-agent group conversations (3+ people talking naturally)
- Social factions and alliances
- Reputation systems
- Social events and gatherings

The INSPIRED feature? **Emotional Resonance Chambers** - spaces where emotions amplify through collective presence, creating hotspots of joy, sadness, or tension that agents gravitate toward...

Stay tuned!
