/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as agent_conversation from "../agent/conversation.js";
import type * as agent_embeddingsCache from "../agent/embeddingsCache.js";
import type * as agent_memory from "../agent/memory.js";
import type * as aiTown_agent from "../aiTown/agent.js";
import type * as aiTown_agentDescription from "../aiTown/agentDescription.js";
import type * as aiTown_agentInputs from "../aiTown/agentInputs.js";
import type * as aiTown_agentOperations from "../aiTown/agentOperations.js";
import type * as aiTown_conversation from "../aiTown/conversation.js";
import type * as aiTown_conversationMembership from "../aiTown/conversationMembership.js";
import type * as aiTown_game from "../aiTown/game.js";
import type * as aiTown_ids from "../aiTown/ids.js";
import type * as aiTown_inputHandler from "../aiTown/inputHandler.js";
import type * as aiTown_inputs from "../aiTown/inputs.js";
import type * as aiTown_insertInput from "../aiTown/insertInput.js";
import type * as aiTown_location from "../aiTown/location.js";
import type * as aiTown_main from "../aiTown/main.js";
import type * as aiTown_movement from "../aiTown/movement.js";
import type * as aiTown_player from "../aiTown/player.js";
import type * as aiTown_playerDescription from "../aiTown/playerDescription.js";
import type * as aiTown_world from "../aiTown/world.js";
import type * as aiTown_worldMap from "../aiTown/worldMap.js";
import type * as cinematic_integration from "../cinematic/integration.js";
import type * as cinematic_momentDetection from "../cinematic/momentDetection.js";
import type * as cinematic_visualizationQueries from "../cinematic/visualizationQueries.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as emotions_engine from "../emotions/engine.js";
import type * as emotions_initialization from "../emotions/initialization.js";
import type * as emotions_integration from "../emotions/integration.js";
import type * as emotions_memoryResonance from "../emotions/memoryResonance.js";
import type * as engine_abstractGame from "../engine/abstractGame.js";
import type * as engine_historicalObject from "../engine/historicalObject.js";
import type * as evolution_integration from "../evolution/integration.js";
import type * as evolution_learningEngine from "../evolution/learningEngine.js";
import type * as evolution_personalityEvolution from "../evolution/personalityEvolution.js";
import type * as evolution_wisdomSystem from "../evolution/wisdomSystem.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as messages from "../messages.js";
import type * as music from "../music.js";
import type * as narrative_arcDetection from "../narrative/arcDetection.js";
import type * as narrative_conflictEngine from "../narrative/conflictEngine.js";
import type * as narrative_integration from "../narrative/integration.js";
import type * as narrative_mythologySystem from "../narrative/mythologySystem.js";
import type * as narrative_questSystem from "../narrative/questSystem.js";
import type * as social_factions from "../social/factions.js";
import type * as social_integration from "../social/integration.js";
import type * as social_reputation from "../social/reputation.js";
import type * as social_resonanceChambers from "../social/resonanceChambers.js";
import type * as testing from "../testing.js";
import type * as util_FastIntegerCompression from "../util/FastIntegerCompression.js";
import type * as util_assertNever from "../util/assertNever.js";
import type * as util_asyncMap from "../util/asyncMap.js";
import type * as util_compression from "../util/compression.js";
import type * as util_geometry from "../util/geometry.js";
import type * as util_isSimpleObject from "../util/isSimpleObject.js";
import type * as util_llm from "../util/llm.js";
import type * as util_minheap from "../util/minheap.js";
import type * as util_object from "../util/object.js";
import type * as util_sleep from "../util/sleep.js";
import type * as util_types from "../util/types.js";
import type * as util_xxhash from "../util/xxhash.js";
import type * as world_integration from "../world/integration.js";
import type * as world_resourceEngine from "../world/resourceEngine.js";
import type * as world_timeEngine from "../world/timeEngine.js";
import type * as world_weatherEngine from "../world/weatherEngine.js";
import type * as world from "../world.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "agent/conversation": typeof agent_conversation;
  "agent/embeddingsCache": typeof agent_embeddingsCache;
  "agent/memory": typeof agent_memory;
  "aiTown/agent": typeof aiTown_agent;
  "aiTown/agentDescription": typeof aiTown_agentDescription;
  "aiTown/agentInputs": typeof aiTown_agentInputs;
  "aiTown/agentOperations": typeof aiTown_agentOperations;
  "aiTown/conversation": typeof aiTown_conversation;
  "aiTown/conversationMembership": typeof aiTown_conversationMembership;
  "aiTown/game": typeof aiTown_game;
  "aiTown/ids": typeof aiTown_ids;
  "aiTown/inputHandler": typeof aiTown_inputHandler;
  "aiTown/inputs": typeof aiTown_inputs;
  "aiTown/insertInput": typeof aiTown_insertInput;
  "aiTown/location": typeof aiTown_location;
  "aiTown/main": typeof aiTown_main;
  "aiTown/movement": typeof aiTown_movement;
  "aiTown/player": typeof aiTown_player;
  "aiTown/playerDescription": typeof aiTown_playerDescription;
  "aiTown/world": typeof aiTown_world;
  "aiTown/worldMap": typeof aiTown_worldMap;
  "cinematic/integration": typeof cinematic_integration;
  "cinematic/momentDetection": typeof cinematic_momentDetection;
  "cinematic/visualizationQueries": typeof cinematic_visualizationQueries;
  constants: typeof constants;
  crons: typeof crons;
  "emotions/engine": typeof emotions_engine;
  "emotions/initialization": typeof emotions_initialization;
  "emotions/integration": typeof emotions_integration;
  "emotions/memoryResonance": typeof emotions_memoryResonance;
  "engine/abstractGame": typeof engine_abstractGame;
  "engine/historicalObject": typeof engine_historicalObject;
  "evolution/integration": typeof evolution_integration;
  "evolution/learningEngine": typeof evolution_learningEngine;
  "evolution/personalityEvolution": typeof evolution_personalityEvolution;
  "evolution/wisdomSystem": typeof evolution_wisdomSystem;
  http: typeof http;
  init: typeof init;
  messages: typeof messages;
  music: typeof music;
  "narrative/arcDetection": typeof narrative_arcDetection;
  "narrative/conflictEngine": typeof narrative_conflictEngine;
  "narrative/integration": typeof narrative_integration;
  "narrative/mythologySystem": typeof narrative_mythologySystem;
  "narrative/questSystem": typeof narrative_questSystem;
  "social/factions": typeof social_factions;
  "social/integration": typeof social_integration;
  "social/reputation": typeof social_reputation;
  "social/resonanceChambers": typeof social_resonanceChambers;
  testing: typeof testing;
  "util/FastIntegerCompression": typeof util_FastIntegerCompression;
  "util/assertNever": typeof util_assertNever;
  "util/asyncMap": typeof util_asyncMap;
  "util/compression": typeof util_compression;
  "util/geometry": typeof util_geometry;
  "util/isSimpleObject": typeof util_isSimpleObject;
  "util/llm": typeof util_llm;
  "util/minheap": typeof util_minheap;
  "util/object": typeof util_object;
  "util/sleep": typeof util_sleep;
  "util/types": typeof util_types;
  "util/xxhash": typeof util_xxhash;
  "world/integration": typeof world_integration;
  "world/resourceEngine": typeof world_resourceEngine;
  "world/timeEngine": typeof world_timeEngine;
  "world/weatherEngine": typeof world_weatherEngine;
  world: typeof world;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
