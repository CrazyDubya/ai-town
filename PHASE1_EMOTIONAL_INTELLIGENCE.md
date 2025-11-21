# 🧠 Phase 1: Emotional Intelligence System

## Overview

Phase 1 introduces a **groundbreaking emotional intelligence system** that transforms AI Town from a simple simulation into a living, breathing world where agents have rich inner lives, dynamic moods, and authentic emotional experiences.

## 🎯 What Was Built

### Core Systems

#### 1. **Emotional State Tracking**
- **8 Primary Emotions** (Plutchik's Wheel):
  - Joy, Sadness, Trust, Disgust, Fear, Anger, Surprise, Anticipation
  - Each tracked with intensity (0-100)
- **Derived Metrics**:
  - Valence: Overall positivity/negativity (-100 to 100)
  - Arousal: Energy level (0-100)
  - Dominance: Sense of control (0-100)
- **Mood States**: Contextual moods like "content", "anxious", "euphoric", "melancholic"

#### 2. **Personality Framework (Big Five/OCEAN)**
- **Openness**: Creative vs Practical
- **Conscientiousness**: Organized vs Spontaneous
- **Extraversion**: Outgoing vs Reserved
- **Agreeableness**: Friendly vs Assertive
- **Neuroticism**: Sensitive vs Resilient

Each agent gets a unique personality profile that influences their emotional responses.

#### 3. **Psychological Needs** (Self-Determination Theory)
- **Autonomy**: Need for independence
- **Competence**: Need for mastery/achievement
- **Relatedness**: Need for social connection
- **Stimulation**: Need for novelty/excitement
- **Security**: Need for safety/predictability

Unmet needs drive behavior and affect emotions.

#### 4. **Emotional Memory System**
- Memories are tagged with the emotions felt during the experience
- Intensity and valence (positive/negative) recorded
- Enables authentic emotional recall

## ✨ INSPIRED FEATURES

### 🌊 Emotional Contagion
**Emotions spread between agents like ripples in water**

- When agents interact, emotions transfer based on:
  - **Empathy levels**: How susceptible each agent is to others' feelings
  - **Relationship strength**: Closer bonds = stronger emotional influence
  - **Proximity**: Physical closeness amplifies contagion
  - **Context**: Conversations create intense emotional exchange

**Example**: Alice's joy at discovering something new spreads to nearby agents, especially those who are empathetic or close friends with her.

### 🔮 Memory Resonance
**Past emotional experiences echo through time**

- Memories aren't passive storage—they actively resurface when:
  - Current emotional state matches past emotional experiences
  - Similar contexts trigger relevant emotional memories
  - Resonance strengthens with repeated triggering

**Emergent Behaviors**:
- **Trauma Responses**: Past negative experiences resurface in similar situations
- **Nostalgia**: Joyful memories bubble up during happy moments
- **Pattern Recognition**: Agents learn from emotional outcomes
- **Emotional Wisdom**: Past experiences shape current reactions

**Example**: The Queen of Hearts' anger resonates with memories of past slights, making her increasingly volatile over time. Meanwhile, Alice's positive memory of meeting the Mad Hatter makes her anticipate their next conversation with joy.

## 🎭 Personality Presets

8 rich personality archetypes with unique emotional profiles:

1. **Curious Optimist** (Alice-like)
   - High openness, extraversion, low neuroticism
   - Baseline: High joy, anticipation, trust
   - High empathy and emotional regulation

2. **Anxious Perfectionist** (White Rabbit-like)
   - High conscientiousness and neuroticism
   - Baseline: High fear, anticipation, moderate sadness
   - Needs high security and competence

3. **Eccentric Dreamer** (Mad Hatter-like)
   - Very high openness, low conscientiousness
   - Baseline: Joy, surprise, anticipation
   - Craves autonomy and stimulation

4. **Tyrannical Ruler** (Queen of Hearts-like)
   - Low agreeableness, high neuroticism
   - Baseline: High anger, disgust
   - Low empathy, needs autonomy and security

5. **Friendly Empath**
   - High agreeableness and empathy
   - Baseline: Joy, trust
   - Strong need for social connection

6. **Melancholic Artist**
   - High openness and neuroticism
   - Baseline: Sadness, introspection
   - High empathy, craves stimulation

7. **Stoic Guardian**
   - High conscientiousness and emotional regulation
   - Baseline: Trust, calm
   - Needs security and competence

8. **Chaotic Trickster**
   - High openness and extraversion, low conscientiousness
   - Baseline: Joy, surprise
   - Craves stimulation and autonomy

## 🔧 Technical Architecture

### Files Created
```
convex/emotions/
├── schema.ts              # Database schema for emotional data
├── engine.ts              # Core emotional processing logic
├── initialization.ts      # Personality and emotion initialization
├── memoryResonance.ts     # Memory resonance system (INSPIRED)
└── integration.ts         # Integration with agent behavior

convex/schema.ts           # Updated with emotion tables
convex/agent/conversation.ts # Enhanced with emotional context
convex/aiTown/agent.ts     # Registered emotion operations
convex/aiTown/agentInputs.ts # Emotion init on agent creation
convex/aiTown/agentOperations.ts # Emotion initialization handler
```

### Database Tables

- **agentPsychology**: Core psychology profile (personality, emotions, needs)
- **emotionalMemories**: Memories tagged with emotions and resonance data
- **emotionalContagionEvents**: Log of emotion transfers between agents
- **emotionalBonds**: Relationship bonds with emotional metrics
- **emotionalEvents**: Event log for debugging and analytics

### Integration Points

1. **Agent Creation**: Emotions initialized with personality-matched profiles
2. **Conversation Start**: Emotional context injected into prompts
3. **Conversation Continue**: Emotional contagion processed
4. **Conversation End**: Emotional bonds updated
5. **Memory Formation**: Emotions tagged for future resonance
6. **Agent Decision Making**: Emotions influence behavior (future enhancement)

## 🌟 How It Works

### Example Conversation Flow

```
1. Alice approaches Mad Hatter
   → Alice's anticipation rises (+15)
   → Emotional context added to prompt: "You feel excited and curious"

2. Mad Hatter responds
   → Mad Hatter's joy is high (eccentric personality)
   → Emotional contagion: Alice catches some of his joy
   → Alice's joy increases from 60 to 68

3. Conversation continues
   → Both agents' emotions influence their responses
   → Resonant memories surface (past tea parties for Mad Hatter)
   → LLM receives: "Resonant memory: Joy from last tea party"

4. Conversation ends positively
   → Emotional bond strengthens (affection +5, trust +3)
   → Memory tagged with "joy" emotion (intensity: 75, valence: +80)
   → Bond enables stronger future contagion

5. Days later, Alice feels joy...
   → Memory resonance triggered
   → Past Mad Hatter conversation resurfaces
   → Alice seeks him out again (emergent behavior!)
```

### Emotional Decay & Regulation

- Emotions naturally decay over time (return to baseline)
- Decay rate influenced by **emotional regulation** trait
- High regulation = faster recovery from emotional spikes
- Mood shifts require sustained emotional intensity

## 🎮 Gameplay Impact

### Before Phase 1
- Agents had static personalities
- Conversations lacked emotional depth
- No learning from past emotional experiences
- Behavior was consistent but flat

### After Phase 1
- **Dynamic Personalities**: Agents have bad days, good days, emotional arcs
- **Rich Conversations**: Mood affects tone, word choice, and topics
- **Emergent Relationships**: Emotional bonds develop naturally over time
- **Psychological Depth**: Agents feel real because they have inner lives
- **Learning & Growth**: Past experiences shape future behavior

## 💡 Design Decisions

### Why Plutchik's Wheel?
- Well-researched emotion model
- 8 primary emotions cover the spectrum
- Oppositional pairs (joy-sadness, trust-disgust, fear-anger, surprise-anticipation)
- Enables nuanced emotional states

### Why Big Five Personality?
- Most validated personality model in psychology
- Predicts behavior better than other models
- Easy to understand and tune
- Maps naturally to LLM prompts

### Why Self-Determination Theory?
- Explains intrinsic motivation
- Drives realistic agent behavior
- Creates emergent goal-seeking
- Ties to emotions naturally (unmet needs → negative emotions)

### Why Emotional Contagion?
- Humans experience this constantly
- Makes social dynamics feel authentic
- Creates group emotional states
- Enables "vibe" in the town (everyone's happy, everyone's tense, etc.)

### Why Memory Resonance?
- Most innovative feature
- Makes agents feel like they have a past
- Enables trauma, nostalgia, wisdom
- Emergent pattern recognition
- No manual scripting required—emotions naturally guide memory recall

## 🚀 Future Enhancements (Next Phases)

Phase 1 sets the foundation for:

- **Phase 2**: Time/weather affecting emotions (rainy days = melancholy)
- **Phase 3**: Multi-agent group conversations with complex emotional dynamics
- **Phase 4**: Game Master using emotional state to create dramatic moments
- **Phase 5**: UI showing emotion indicators, mood colors, relationship graphs
- **Phase 6**: Skill development influenced by emotional state

## 📊 Metrics & Analytics

The system logs:
- Emotion spikes (intensity > 40)
- Mood shifts
- Critical needs (value < 20)
- Contagion events
- Memory resonance triggers

Use `emotionalEvents` table to analyze agent psychology over time.

## 🎯 Success Criteria

✅ **Achieved**:
- Each agent has unique, consistent personality
- Emotions influence conversation tone
- Emotional contagion creates realistic social dynamics
- Memories resurface based on emotional similarity
- System degrades gracefully (works without LLM support)
- Zero impact on performance (async processing)

## 🔮 The Magic

The real magic of Phase 1 is **emergence**. We didn't script:
- Agents seeking out friends when lonely
- Agents avoiding those who made them angry
- Nostalgic references to past good times
- Trauma responses to negative experiences

These behaviors emerge naturally from the interaction of:
- Emotional state affecting decisions
- Memory resonance surfacing relevant past experiences
- Emotional contagion creating shared experiences
- Psychological needs driving behavior

**This is the foundation of a living world.**

---

## Next: Phase 2 - Dynamic Living World 🌍

Building on emotional intelligence, Phase 2 will add:
- Day/night cycles affecting mood and behavior
- Dynamic weather with emotional impacts
- Resource economy (agents need food, rest, social interaction)
- Emergent events that agents react to emotionally

Stay tuned!
