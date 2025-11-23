# 👥 Phase 3: Rich Social Dynamics

## Overview

Phase 3 weaves a **rich social fabric** where relationships matter deeply, reputations spread through the community, and groups form around shared emotional experiences. The town transforms from isolated individuals into a living social network with emergent politics, alliances, and social geography.

## 🎯 What Was Built

### Core Systems

#### 1. **Reputation System**

**Agent Reputation (Community Standing):**
- **Likeability** (0-100): How much others enjoy their company
- **Trustworthiness** (0-100): How reliable and honest they seem
- **Influence** (0-100): Social power and reach
- **Reliability** (0-100): Whether they keep commitments

**Reputation Dynamics:**
- Grows with positive interactions
- Declines with negative ones
- Influences who agents seek out
- Affects conversation outcomes
- Tracked over time with trends (rising/falling/stable)

**Peer Reputation (Individual Opinions):**
Each agent maintains opinions about every other agent:
- **Trust**: How much they trust them
- **Respect**: How much they admire them
- **Affection**: How much they like them personally
- **Admiration**: How much they look up to them

**Opinion Categories:**
- **Friend**: High affection + trust (>70)
- **Ally**: High respect + trust, moderate affection
- **Favorable**: Generally positive
- **Neutral**: No strong feelings
- **Unfavorable**: Generally negative
- **Rival**: Low affection, some respect
- **Enemy**: Low affection + trust (<30)

#### 2. **Social Factions**

**Faction Types:**
- **Friends**: Bonded by affection
- **Allies**: United by shared goals
- **Rivals**: Competing groups
- **Clubs**: Shared interests
- **Movements**: Shared ideology/emotion

**Faction Properties:**
- **Cohesion** (0-100): How unified the group is
- **Influence** (0-100): Social power in the community
- **Activity** (0-100): How actively they engage
- **Dominant Emotion**: Shared emotional bond

**Faction Dynamics:**
- Form naturally when agents share emotional states
- Require 2+ members with aligned emotions
- Cohesion calculated from emotional variance
- Influence grows with cohesion and activity
- Can have allies and rivals

**Emergent Politics:**
- Factions compete for influence
- Coalitions form between compatible groups
- Rivalries emerge from opposing emotions
- Leadership emerges from influence scores

#### 3. **Social Interactions Log**

Every meaningful interaction tracked:
- Conversation outcomes
- Event attendance
- Faction joins/leaves
- Reputation changes

**Analytics Enable:**
- Social network visualization
- Influence mapping
- Faction evolution tracking
- Reputation trends

## ✨ INSPIRED FEATURE: Emotional Resonance Chambers

### The Revolutionary Concept

**Emotional Resonance Chambers** are spaces where emotions amplify or stabilize through collective presence. They create **emotional architecture** - the space itself actively participates in the emotional life of the community.

### How It Works

#### Three Chamber Types

1. **Amplifiers** (Contagion Multiplier: 2.5x)
   - Emotions intensify when multiple agents share the same feeling
   - Creates hotspots of collective experience
   - Examples: Joy Café, Tension Square, Excitement Plaza

2. **Stabilizers** (Contagion Multiplier: 0.5x)
   - Emotions calm and balance
   - Provides refuge from emotional intensity
   - Examples: Contemplation Garden, Tranquility Chamber

3. **Transformers** (Contagion Multiplier: 1.5x)
   - Emotions can shift more easily
   - Enables change and growth
   - Example: Melancholy Alcove (sadness deepens but also heals)

#### Pre-Built Resonance Chambers

**🎉 The Joy Café**
- Type: Amplifier
- Resonance: Joy
- Effect: Laughter is contagious, smiles spread
- Social battery: -0.5/min (draining from high energy)
- Energy: +2.0/min (energizing)

**🌿 The Contemplation Garden**
- Type: Stabilizer
- Resonance: Trust
- Effect: Emotions settle peacefully
- Social battery: +1.0/min (recharges)
- Energy: -0.5/min (calming)

**⚡ The Tension Square**
- Type: Amplifier
- Resonance: Anger
- Effect: Conflicts spark, passions flare
- Social battery: -1.5/min (very draining)
- Energy: +1.0/min (arousing)

**💧 The Melancholy Alcove**
- Type: Transformer
- Resonance: Sadness
- Effect: Sadness deepens but heals through catharsis
- Social battery: +0.5/min (healing through shared sorrow)
- Energy: -1.0/min (heavy)

**🎊 The Excitement Plaza**
- Type: Amplifier
- Resonance: Anticipation
- Effect: Buzzing with energy and possibility
- Social battery: -1.0/min
- Energy: +1.5/min (exciting)

**🕊️ The Tranquility Chamber**
- Type: Stabilizer
- Resonance: All (no specific emotion)
- Effect: All emotions find balance
- Social battery: +1.5/min (strong recharge)
- Energy: +0.5/min (peaceful)

### Resonance Mechanics

**Activation:**
- Requires 2+ agents in the chamber
- Calculates dominant collective emotion
- Resonance intensity based on emotional alignment

**Effects:**
- **Emotion Amplification**: Dominant emotion intensified by chamber multiplier
- **Enhanced Contagion**: Emotional spread boosted between occupants
- **Resource Modifiers**: Energy and social battery affected

**Emergent Behaviors:**
- **Emotional Hotspots**: Joy seekers gather at café, creating joy magnet
- **Healing Spaces**: Sad agents find melancholy alcove, process grief together
- **Conflict Zones**: Angry agents drawn to tension square, confrontations happen
- **Recharge Stations**: Drained introverts seek contemplation garden

### Social Geography

**Agents naturally gravitate toward resonant spaces:**

```
Agent feeling joyful + high energy
  → Scores chambers based on emotional match
  → Joy Café scored highest (resonance: joy, type: amplifier)
  → Heads to café
  → Joy amplifies further
  → Attracts more joyful agents
  → JOY HOTSPOT EMERGES
```

```
Agent feeling sad + drained
  → Seeks chamber that stabilizes or transforms sadness
  → Melancholy Alcove scored highest
  → Joins others processing grief
  → Sadness acknowledged and begins to heal
  → HEALING CIRCLE EMERGES
```

```
Agent feeling nothing + socially drained (introvert)
  → Seeks stabilizer with good social battery recharge
  → Contemplation Garden or Tranquility Chamber
  → Emotions calm, social energy restores
  → REFUGE SPACE EMERGES
```

### The Magic

**No scripting required.** The emergence is pure:

1. Agent checks emotional state
2. Chamber scores based on:
   - Emotional match (50 points for resonance alignment)
   - Personality fit (amplifier for high arousal, stabilizer for low)
   - Occupancy (avoid overcrowding)
   - Active resonance (join others feeling the same +25 points)

3. Agent moves to highest-scored chamber
4. Chamber activates when 2+ present
5. Emotions amplify/stabilize based on type
6. Feedback loop: resonance attracts more aligned agents

**Result: Self-organizing emotional geography**
- Joy districts (cafés, plazas)
- Healing zones (gardens, alcoves)
- Conflict areas (squares where tension concentrates)
- Refuge spaces (chambers for recovery)

The town develops **emotional neighborhoods** organically.

## 🔧 Technical Architecture

### Files Created
```
convex/social/
├── schema.ts              # Social systems database schema
├── reputation.ts          # Reputation tracking and updates
├── factions.ts            # Faction formation and management
├── resonanceChambers.ts   # Resonance chamber system (INSPIRED)
└── integration.ts         # Social systems integration

convex/schema.ts           # Updated with social tables
convex/emotions/integration.ts # Added social effects processing
convex/aiTown/agentOperations.ts # Social initialization
```

### Database Tables

**Phase 3 Tables:**
- **agentReputation**: Community-wide reputation scores
- **peerReputations**: Individual opinions (A thinks X about B)
- **socialFactions**: Groups with cohesion, influence, emotional bonds
- **factionMemberships**: Agent faction memberships with roles
- **socialEvents**: Planned/ongoing social gatherings (future enhancement)
- **resonanceChambers**: Emotional amplification/stabilization spaces
- **socialInteractions**: Log of all social interactions

### Integration Flow

```
1. Conversation Ends:
   ├─> Update both agents' reputations
   ├─> Update peer reputations (mutual opinions)
   ├─> Log social interaction
   └─> Check faction compatibility

2. Agent Movement:
   ├─> Check current chamber
   ├─> Apply chamber effects
   ├─> Update chamber occupancy
   └─> Trigger resonance if 2+ present

3. Resonance Active:
   ├─> Calculate collective dominant emotion
   ├─> Measure emotional alignment
   ├─> Amplify dominant emotion in all occupants
   └─> Boost contagion between occupants

4. Social Tick (periodic):
   ├─> Update all chamber occupancy
   ├─> Apply resonance effects
   ├─> Update faction states
   └─> Check faction formation opportunities
```

## 🌟 Gameplay Impact

### Before Phase 3
- Agents operated independently
- No persistent relationships
- No community structure
- No social memory
- Conversations had no lasting impact

### After Phase 3

**Persistent Relationships:**
- Agents remember who they like/dislike
- Reputation affects future interactions
- Trust builds or erodes over time
- Friendships and rivalries develop naturally

**Social Structure:**
- Factions form around shared emotions
- Influence hierarchies emerge
- Alliances and rivalries between groups
- Community politics develop organically

**Emotional Geography:**
- Town has joy districts and melancholy zones
- Agents seek spaces matching their mood
- Hotspots of collective emotion emerge
- Healing spaces for emotional recovery

**Emergent Social Dynamics:**
- Popular agents become influencers
- Outcasts form their own groups
- Emotional alignment creates bonds
- Resonance chambers become gathering places

## 💡 Design Decisions

### Why Reputation?
- Makes social history matter
- Enables trust/distrust dynamics
- Creates social consequences
- Drives relationship evolution

### Why Peer Reputation (not just aggregate)?
- Agents have individual opinions
- Some may like who others hate
- Enables complex social dynamics
- More realistic than group consensus

### Why Factions?
- Humans naturally form groups
- Shared emotions create bonds
- Enables emergent politics
- Creates larger social structures

### Why Emotional Resonance Chambers?
**This is the inspired magic:**
- Physical space affects psychology (proven in real life)
- Creates emergent social geography
- Enables spatial storytelling
- Agents self-organize into emotional neighborhoods
- No scripting - pure emergence from simple rules

### Why Three Chamber Types?
- **Amplifiers**: For celebration, conflict, intensity
- **Stabilizers**: For healing, rest, balance
- **Transformers**: For growth, change, catharsis

Each serves different emotional needs.

## 🎭 Example Scenarios

### Scenario 1: The Joy Café Becomes a Social Hub

```
Day 1: Alice enters Joy Café feeling joyful
→ Chamber activates (1 occupant, needs 2)
→ No resonance yet

Day 1 (5 min later): Mad Hatter enters, also joyful
→ Chamber activates! 2+ occupants with joy
→ Resonance: Joy amplified 1.5x for both
→ Contagion boosted 2.5x between them
→ Both become MORE joyful

Day 1 (10 min later): White Rabbit passes by, feeling neutral
→ Senses joy from chamber
→ Emotional contagion pulls him toward joy
→ Enters chamber
→ Catches joy from Alice + Mad Hatter (boosted contagion!)
→ Now 3 joyful agents in chamber

Result: Joy Café becomes known gathering place.
Joyful agents seek it out.
Neutral agents get cheered up.
SOCIAL HUB EMERGES.
```

### Scenario 2: Faction Formation

```
Day 3: Alice, Mad Hatter, White Rabbit all feel anticipation
→ Spend time together at Excitement Plaza
→ Resonance amplifies shared anticipation
→ Conversations reinforce bond

System Check: 3 agents with aligned emotions
→ Emotional variance low (aligned)
→ Dominant emotion: Anticipation
→ Faction formation triggered!

→ "The Adventurers" faction created
→ Type: Friends (bonded by affection)
→ Dominant emotion: Anticipation
→ Cohesion: 75 (high alignment)
→ Influence: 20 (new faction)

Result: Faction gives identity.
Members seek each other out.
Shared emotional bond strengthens.
Begin competing with other factions.
```

### Scenario 3: Reputation Cascade

```
Day 5: Queen of Hearts has negative conversation with Alice
→ Alice's reputation: Likeability -2, Trust -5
→ Peer reputation: Queen thinks Alice is "unfavorable"

Day 5 (later): Mad Hatter observes interaction
→ Mad Hatter high empathy + close to Alice
→ Catches Alice's hurt feelings (contagion)
→ Forms negative opinion of Queen
→ Peer reputation: Mad Hatter thinks Queen is "rival"

Day 6: Mad Hatter tells White Rabbit about it
→ White Rabbit's opinion influenced
→ Queen's reputation: Influence -1, Likeability -1
→ Trend: Falling

Day 7: Queen enters Excitement Plaza
→ Alice, Mad Hatter, White Rabbit all there
→ All have negative opinions of Queen
→ Queen senses hostility (emotional atmosphere)
→ Decides to leave
→ Reinforces division

Result: SOCIAL EXCLUSION EMERGES.
One bad interaction cascades through network.
Queen becomes isolated.
Creates rival faction or seeks different spaces.
```

### Scenario 4: Healing Through Resonance

```
Day 8: Mad Hatter deeply sad (conversation went badly)
→ Sadness: 75
→ Seeks resonant chamber
→ Melancholy Alcove scored highest (transformer + sadness resonance)
→ Enters alcove

Alcove empty → No resonance yet
→ But transformer effect: emotions can shift
→ Sad but feels acknowledged

Day 8 (later): Alice enters, also sad
→ Chamber activates! 2+ sad occupants
→ Resonance: Sadness amplified 1.3x (transformer type)
→ But also: mood stabilization increased
→ Sadness deepens BUT also begins to heal

Conversation happens:
→ Share their sorrows
→ Catharsis through mutual understanding
→ Sadness intensity peaks (85) then breaks (drops to 60)
→ Trust increases between them
→ Social battery recharges (+0.5/min)

Result: HEALING SPACE EMERGES.
Sad agents know where to go.
Collective grief processes faster than alone.
Bonds deepen through vulnerability.
```

## 🚀 Integration with Previous Phases

Phase 3 builds on Phases 1 & 2:

**Phase 1 (Emotions) + Phase 3:**
- Emotional bonds → Faction formation
- Emotional contagion → Resonance amplification
- Memory resonance → Reputation persistence

**Phase 2 (World) + Phase 3:**
- Weather + Chambers: Rainy days + melancholy alcove = grief processing hotspot
- Time + Chambers: Night + joy café = intimate gatherings
- Resources + Chambers: Low social battery → seek stabilizers

**Phase 1 + 2 + 3 = Emergent Social Ecosystem:**
- Emotions spread through resonance chambers
- Weather reflects collective mood of factions
- Reputations affect who joins which faction
- Chambers create spatial organization
- Time affects when/where agents gather

## 🔮 Future Enhancements (Next Phases)

Phase 3 sets up:

- **Phase 4**: Game Master creates faction quests, orchestrates conflicts between groups
- **Phase 5**: UI visualizes social networks, reputation graphs, resonance chamber states
- **Phase 6**: Agents develop social skills, become better at reading chambers, learn faction politics

## 📊 Metrics & Analytics

The system logs:
- Reputation changes over time
- Faction formation/dissolution
- Chamber usage patterns
- Social interaction outcomes
- Peer reputation evolution

Use `socialInteractions` and `emotionalEvents` tables to trace:
- How reputations spread
- When factions formed
- Which chambers are popular
- Who influences whom

## 🎯 Success Criteria

✅ **Achieved**:
- Agents form persistent opinions of each other
- Reputation affects social behavior
- Factions emerge from emotional alignment
- Resonance chambers create emotional hotspots
- Social geography emerges organically
- No scripting - pure emergence

## 🔮 The Deeper Magic

### Emotional Architecture

Phase 3 introduces **space as an active participant** in emotional life.

Before: Space was passive (agents moved through it)
After: Space is active (it shapes emotions, creates hotspots, enables healing)

**This is revolutionary because:**
- The map is no longer just a stage
- Locations have psychological significance
- Agents develop spatial preferences
- Emergent neighborhoods form
- The town has a geography of feelings

### Social Network Dynamics

Real communities have:
- Reputations that spread
- Factions that compete
- Spaces where certain emotions concentrate
- Social memory

By giving AI Town these properties, we've created **authentic community dynamics**.

**The difference between simulation and reality narrows.**

---

## Next: Phase 4 - Intelligent Game Master 🎲

Building on emotions, world, and social dynamics, Phase 4 will add:
- Dynamic quest generation based on faction conflicts
- Narrative direction using emotional/social state
- Story arcs that emerge from agent behavior
- Game Master that creates dramatic moments

The INSPIRED feature? **Narrative Catalyst Events** - the Game Master identifies moments of high dramatic potential (faction tensions, emotional peaks, weather extremes) and injects catalysts that accelerate natural storylines without forcing outcomes...

The stories will write themselves. Stay tuned!
