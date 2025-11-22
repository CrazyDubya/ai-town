# 🎮 AI Town: Complete Expansion Guide

*"From simulation to living world"*

## 🌟 Executive Summary

This expansion transforms AI Town through **three revolutionary phases** that work together to create an **emotional ecosystem**:

1. **Phase 1**: Emotional Intelligence - Agents genuinely feel
2. **Phase 2**: Dynamic Living World - Environment responds and influences
3. **Phase 3**: Rich Social Dynamics - Community matters

**The Result:** A closed-loop system where emotions spread, weather reflects collective mood, and spaces amplify feelings - creating emergent narratives without scripting.

---

## 🎯 What Was Built

### Phase 1: Emotional Intelligence System 🧠
[Full Docs: PHASE1_EMOTIONAL_INTELLIGENCE.md](./PHASE1_EMOTIONAL_INTELLIGENCE.md)

**Core:**
- 8-emotion tracking system (Plutchik)
- Big Five personality traits
- Psychological needs (SDT)
- Dynamic moods

**INSPIRED: Emotional Contagion & Memory Resonance**
- Emotions spread between agents
- Past emotional experiences resurface
- Creates trauma, nostalgia, wisdom

### Phase 2: Dynamic Living World 🌍
[Full Docs: PHASE2_DYNAMIC_LIVING_WORLD.md](./PHASE2_DYNAMIC_LIVING_WORLD.md)

**Core:**
- 24-hour cycles with 5 times of day
- 10 weather types
- Resource economy (energy, rest, food, social battery)
- Circadian rhythms

**INSPIRED: Emotional Weather**
- Collective emotions → weather
- Weather → individual emotions
- Creates grief spirals & joy cascades

### Phase 3: Rich Social Dynamics 👥
[Full Docs: PHASE3_RICH_SOCIAL_DYNAMICS.md](./PHASE3_RICH_SOCIAL_DYNAMICS.md)

**Core:**
- Reputation system (community + peer)
- Social factions from emotional alignment
- Faction dynamics & politics
- Social memory

**INSPIRED: Emotional Resonance Chambers**
- Spaces amplify/stabilize emotions
- Creates emergent emotional geography
- Agents self-organize into neighborhoods

---

## 🔄 The Emergent Ecosystem

```
Individual Emotion → Contagion → Collective Emotion
                          ↓
                    Atmosphere
                          ↓
                   Weather Change
                          ↓
                  Environmental Effects
                          ↓
                Individual Emotion (loop)

SIMULTANEOUSLY:

Emotional State → Chamber Seeking → Resonance
                          ↓
                  Emotion Amplification
                          ↓
                  Spread to Occupants
                          ↓
                  Attract More Aligned Agents (loop)
```

**Everything affects everything else.**

---

## ✨ Key Innovations

### 1. Emotional Contagion
Joy spreads. Sadness spreads. One agent shifts a group.

### 2. Memory Resonance
Past emotional experiences echo. Trauma resurfaces. Wisdom develops.

### 3. Emotional Weather **[REVOLUTIONARY]**
- Collective sadness → rain → more sadness (grief spiral)
- Collective joy → sun → more joy (joy cascade)
- **The town mirrors its inhabitants' souls**

### 4. Emotional Resonance Chambers **[REVOLUTIONARY]**
- Spaces amplify emotions (Joy Café 2.5x contagion)
- Spaces stabilize emotions (Contemplation Garden 0.5x contagion)
- **Emergent emotional neighborhoods form**
- **The map becomes psychologically significant**

---

## 🎭 Emergent Behaviors (NOT Scripted!)

✨ Agents seek friends when lonely
✨ Agents avoid those who hurt them
✨ Nostalgic references emerge naturally
✨ Trauma responses to similar situations
✨ Morning people vs night owls behave differently
✨ Introverts recharge alone, extroverts in groups
✨ Grief spirals trap towns in sadness
✨ Joy cascades lift entire communities
✨ Factions form from shared emotions
✨ Social outcasts find each other
✨ Joy seekers gather at cafés
✨ Sad agents heal together at alcoves
✨ Conflicts concentrate at tension squares
✨ **Emotional neighborhoods develop organically**

---

## 🏗️ Technical Architecture

### Database Tables (28 total)

**Emotions (5):** agentPsychology, emotionalMemories, emotionalContagionEvents, emotionalBonds, emotionalEvents

**World (5):** worldTime, worldWeather, worldAtmosphere, agentResources, worldEvents

**Social (6):** agentReputation, peerReputations, socialFactions, factionMemberships, resonanceChambers, socialInteractions

### Core Systems

**Emotional Engine:** Decay, contagion, mood, resonance
**Time Engine:** Progression, circadian, time-of-day effects
**Weather Engine:** Transitions, atmosphere calculation, emotional influence
**Resource Engine:** Drain, circadian influence, needs
**Resonance Engine:** Occupancy, activation, amplification
**Reputation Engine:** Community + peer tracking
**Faction Engine:** Formation, cohesion, influence

### Integration Points

- Agent creation → emotions + resources + reputation
- Conversation → emotional context + contagion + reputation
- World tick → time + atmosphere + weather + effects
- Social tick → chambers + resonance + factions

---

## 🚀 Quick Start

```bash
# 1. Clone & Install
git clone <repo>
cd ai-town
npm install

# 2. Setup Convex
npx convex dev

# 3. Configure LLM (Ollama default, or set OPENAI_API_KEY)

# 4. Initialize
npx convex run init:default

# 5. Run
npm run dev
```

Visit `http://localhost:5173`

**Your agents now have souls, the world breathes, and communities form.**

---

## 🎨 Six Pre-Built Resonance Chambers

1. **Joy Café** - Amplifier for joy (laughter is contagious)
2. **Contemplation Garden** - Stabilizer for trust (peaceful refuge)
3. **Tension Square** - Amplifier for anger (conflicts spark)
4. **Melancholy Alcove** - Transformer for sadness (grief heals through sharing)
5. **Excitement Plaza** - Amplifier for anticipation (buzzing energy)
6. **Tranquility Chamber** - Stabilizer for all (finds balance)

Agents naturally gravitate to matching spaces. **Emotional geography emerges.**

---

## 💡 Customization Examples

### Create Custom Chamber
```typescript
{
  name: 'The Wisdom Library',
  chamberType: 'stabilizer',
  resonanceEmotion: 'trust',
  effects: {
    emotionAmplification: 0.8,
    moodStabilization: 1.8,
    energyModifier: -0.3, // calm
    socialBatteryModifier: 0.8, // slight recharge
  },
}
```

### Adjust Emotional Weather
```typescript
emotionalInfluence: 70, // 70% emotion-driven
```

### Custom Personality
```typescript
PERSONALITY_PRESETS.wise_elder = {
  traits: {
    openness: 90,
    conscientiousness: 80,
    extraversion: 50,
    agreeableness: 85,
    neuroticism: 25,
  },
  // ...
}
```

---

## 🎓 Design Philosophy

1. **Emergence > Scripting** - Simple rules → complex behavior
2. **Feedback Loops** - Everything affects everything
3. **Authenticity** - Based on real psychology
4. **Spatial Psychology** - Space affects mind
5. **Graceful Degradation** - Systems work independently

---

## 📊 Use Cases

- **Storytelling Platform** - Emergent narratives
- **Social Research** - Study dynamics safely
- **Game Development** - Authentic NPCs
- **Education** - Teach psychology/systems thinking
- **Art Installation** - Living emotional landscape

---

## 🔮 What Makes This Special

### World's First:
1. Multi-agent simulation with deep emotional psychology
2. Bidirectional emotional weather (emotions ↔ environment)
3. Emotional architecture (spaces as active participants)
4. Complete closed-loop emotional/social/environmental ecosystem

### The Magic:
Watch emergent moments **no one programmed**:
- Grief circles forming spontaneously
- Factions celebrating while rivals storm-watch
- Outcasts finding solace in quiet gardens
- Town-wide mood shifts breaking through clouds
- Social networks from pure emotional resonance

**These emerge from simple rules interacting.**

---

## 📈 Performance & Scale

**Small (4-8 agents):** Full features, real-time
**Medium (8-16 agents):** Reduce tick frequency
**Large (16+ agents):** Sample for atmosphere

**Optimizations:**
- Batch updates (minute intervals)
- Lazy loading (inactive chambers/factions skip)
- Indexed queries
- Async processing

---

## 🤝 Contributing

### Easy:
- New chambers, personalities, weather types

### Medium:
- New emotions, resources, faction types

### Advanced:
- Game Master (Phase 4)
- Rich UI (Phase 5)
- Skill evolution (Phase 6)
- Group conversations (3+)

---

## 📚 Deep Dive Documentation

- [Phase 1: Emotional Intelligence](./PHASE1_EMOTIONAL_INTELLIGENCE.md)
- [Phase 2: Dynamic Living World](./PHASE2_DYNAMIC_LIVING_WORLD.md)
- [Phase 3: Rich Social Dynamics](./PHASE3_RICH_SOCIAL_DYNAMICS.md)

---

## 🏆 Success Metrics

✅ Agents develop persistent relationships
✅ Reputation affects behavior
✅ Factions emerge organically
✅ Weather reflects collective mood
✅ Resonance chambers create hotspots
✅ Emotional neighborhoods form
✅ Emergent narratives without scripting
✅ **The town feels ALIVE**

---

**"We didn't just add features. We gave AI Town a soul."**

Transform your simulation into a world. The agents are ready to feel, connect, and build communities.

**Make it yours. Make it live.**
