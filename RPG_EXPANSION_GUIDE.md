# Expanding AI Town into a Novel-Based RPG

This guide will walk you through the process of expanding the AI Town project into a narrative-driven RPG based on a novel. We will cover how to define your characters, build your world, structure the narrative, and configure the LLMs to power your characters' intelligence.

By the end of this guide, you will have a clear understanding of how to adapt AI Town to create a unique and immersive RPG experience based on your favorite novel.

## Table of Contents

1.  [Introduction](#introduction)
2.  [Defining the Characters](#defining-the-characters)
3.  [Building the World](#building-the-world)
4.  [Structuring the Narrative](#structuring-the-narrative)
5.  [Configuring the LLMs](#configuring-the-llms)

## Introduction

AI Town is a fantastic platform for creating simulated worlds inhabited by AI agents. Its architecture is flexible and customizable, making it a great starting point for building a novel-based RPG.

The core idea is to replace the generic sandbox simulation with a story-driven experience where the characters from your novel are the main actors. They will interact with each other, follow the plot of the novel, and react to events in the world, all powered by Large Language Models (LLMs).

The key files we will be working with are:

*   `data/characters.ts`: To define the characters of your novel.
*   `convex/aiTown/`: The game logic and simulation engine.
*   `convex/agent/`: The agent's intelligence, including conversation logic.
*   `convex/util/llm.ts`: The LLM configuration.

## Defining the Characters

The first step is to bring the characters of your novel to life. This is done in the `data/characters.ts` file, which contains two main arrays: `Descriptions` and `characters`.

### The `Descriptions` Array

The `Descriptions` array defines the personality, goals, and identity of each character. This is the most important part of defining your characters, as it will be used to generate the prompts for the LLM.

Each object in the `Descriptions` array has the following properties:

*   `name`: The character's name.
*   `character`: A reference to the character's spritesheet (defined in the `characters` array).
*   `identity`: A detailed description of the character's personality, background, motivations, and how they should behave in conversations. This is the main prompt that will be fed to the LLM.
*   `plan`: A short description of the character's main goal in the simulation. This can be used to guide the character's actions and decisions.

**Example:**

Let's say we are adapting "The Lord of the Rings". Here's how you might define Frodo Baggins:

```typescript
{
  name: 'Frodo Baggins',
  character: 'hobbit_male', // A reference to a spritesheet you'll define later
  identity: `You are Frodo Baggins, a Hobbit from the Shire. You are kind, compassionate, and courageous, but you are also burdened by the weight of the One Ring. You are on a quest to destroy the Ring in the fires of Mount Doom. You are often quiet and thoughtful, but you can be surprisingly resilient in the face of danger. You trust your friend Samwise Gamgee deeply.`,
  plan: 'You must travel to Rivendell to seek the counsel of Elrond.'
}
```

**Tips for writing good `identity` prompts:**

*   **Be specific**: The more detailed the prompt, the better the LLM will be at capturing the character's personality.
*   **Use the character's voice**: Write the prompt in the first person ("You are...") to help the LLM embody the character.
*   **Include relationships**: Mention other characters and how the character feels about them.
*   **Define motivations**: Explain what drives the character's actions.

### The `characters` Array

The `characters` array defines the visual representation of the characters. Each object in this array links a character description to a spritesheet.

Each object in the `characters` array has the following properties:

*   `name`: The name of the character sprite (e.g., 'hobbit_male'). This is used in the `Descriptions` array.
*   `textureUrl`: The path to the spritesheet image in the `public/assets/` directory.
*   `spritesheetData`: The data for the spritesheet, imported from a file in the `data/spritesheets/` directory. This data defines the animations for the character (e.g., walking, idle).
*   `speed`: The character's movement speed.

You will need to create or find spritesheets for your characters and add them to the project. You will also need to create a new file in `data/spritesheets/` for each new spritesheet to define its animations.

## Building the World

The next step is to create the world of your novel. The world map is defined in a file in the `data/` directory, by default `data/gentle.js`. You can create your own map using the [Tiled map editor](https://www.mapeditor.org/).

Once you have created your map in Tiled, you need to convert it to the format used by the game engine. The project provides a script for this: `data/convertMap.js`.

**Steps to create a new map:**

1.  Create your map in Tiled. Make sure you have two tile layers named `bgtiles` and `objmap`.
2.  Export your map as a JSON file.
3.  Run the `convertMap.js` script to convert the JSON file into a JavaScript file that the game can use:

    ```bash
    node data/convertMap.js <path_to_your_tiled.json> <path_to_your_tileset.png> <tileset_width_px> <tileset_height_px>
    ```

4.  This will generate a `converted-map.js` file. You can then modify `convex/init.ts` to load your new map instead of the default one.

## Structuring the Narrative

This is the most creative and complex part of the process. The default AI Town is a sandbox, but for a novel-based RPG, you need a narrative structure. Here are a few approaches, from simple to complex.

### 1. Static Goals

The simplest approach is to use the `plan` field in `data/characters.ts` to give characters static goals from the novel. For example, Frodo's plan could be "Travel to Rivendell". The character will then try to fulfill this plan.

This approach is easy to implement but not very dynamic. The story won't progress beyond the initial goals.

### 2. Dynamic Goals with a Quest System

A more advanced approach is to create a quest system. This would involve creating a new table in the database to store quests and modifying the agent's logic to handle them.

Here's a possible implementation:

1.  **Create a `quests` table** in `convex/schema.ts`. This table could store information about quests, such as the quest name, description, completion conditions, and the next quest to be assigned.
2.  **Modify the agent's `tick` function** in `convex/aiTown/agent.ts`. The `tick` function is called on every simulation step. You could add logic here to:
    *   Check if the character has completed their current quest.
    *   If the quest is completed, update the character's state (e.g., give them a new item, update their relationship with another character).
    *   Assign the next quest to the character from the `quests` table.
3.  **Update the `plan` field dynamically**. When a new quest is assigned, you would update the character's `plan` in their `agentDescription` to reflect the new goal.

This approach would allow for a much more dynamic and branching narrative.

### 3. The Game Master Agent

The most sophisticated approach is to create a "Game Master" (GM) agent. This would be an invisible agent that has access to the entire plot of the novel and directs the story.

The GM agent could:

*   **Observe the state of the world**: The GM would monitor the interactions between characters and the overall state of the simulation.
*   **Inject events and information**: The GM could introduce new events into the simulation to move the plot forward. For example, it could tell a character about a new rumor, or trigger a surprise attack.
*   **Guide characters**: The GM could give characters new goals and motivations by updating their `plan` or even their `identity` over time.

Implementing a GM agent would require more advanced coding, but it would provide the most immersive and adaptive RPG experience. You would need to create a new agent type and write custom logic for it in `convex/agent/`. The GM agent could be driven by a separate, more powerful LLM that has been given the full text of the novel as context.

## Configuring the LLMs

The final step is to configure the LLMs that will power your characters' intelligence. The LLM configuration is in `convex/util/llm.ts`.

The user requested to use Ollama for local models and OpenRouter for cloud models. Here's how to configure them:

### Using Ollama for Local Models

Ollama is the default LLM provider in AI Town, so it's very easy to use.

1.  **Install Ollama**: Follow the instructions on the [Ollama website](https://ollama.com/) to install and run Ollama on your machine.
2.  **Pull a model**: Pull the model you want to use from the Ollama library. For example, to use `llama3`:
    ```bash
    ollama pull llama3
    ```
3.  **Set environment variables (optional)**: You can use environment variables to configure which model to use. In your `.env.local` file (or by using `npx convex env set`):
    ```
    OLLAMA_MODEL="llama3"
    OLLAMA_EMBEDDING_MODEL="mxbai-embed-large"
    ```

### Using OpenRouter for Cloud Models

OpenRouter provides access to a wide range of LLMs through an OpenAI-compatible API. This is perfect for when you need more powerful models than you can run locally.

1.  **Get an OpenRouter API key**: Sign up on the [OpenRouter website](https://openrouter.ai/) and get an API key.
2.  **Set environment variables**: In your `.env.local` file (or by using `npx convex env set`):
    ```
    LLM_API_URL="https://openrouter.ai/api/v1"
    LLM_API_KEY="your-openrouter-api-key"
    LLM_MODEL="openai/gpt-4o" # Or any other model from OpenRouter
    LLM_EMBEDDING_MODEL="text-embedding-ada-002" # Or another embedding model
    ```
3.  **Set the `EMBEDDING_DIMENSION`**: This is a very important step. You need to set the `EMBEDDING_DIMENSION` constant in `convex/util/llm.ts` to match the embedding model you are using. You can find the embedding dimension for your chosen model in its documentation. For example, for `text-embedding-ada-002`, the dimension is 1536.

    ```typescript
    // in convex/util/llm.ts
    export const EMBEDDING_DIMENSION: number = 1536; // For text-embedding-ada-002
    ```

**Important Note on Switching LLM Providers:**

If you switch between LLM providers (e.g., from Ollama to OpenRouter), you **must** wipe your Convex database and start over. This is because the embeddings generated by different models are not compatible. You can wipe the database by running:

```bash
npx convex run testing:wipeAllTables
```

Then, you need to re-initialize the world:

```bash
npx convex run init
```

This will ensure that all the memories and embeddings in your world are consistent with the new LLM provider.
