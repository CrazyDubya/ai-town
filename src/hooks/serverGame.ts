import { GameId } from '../../convex/aiTown/ids.ts';
import { AgentDescription } from '../../convex/aiTown/agentDescription.ts';
import { PlayerDescription } from '../../convex/aiTown/playerDescription.ts';
import { World } from '../../convex/aiTown/world.ts';
import { WorldMap } from '../../convex/aiTown/worldMap.ts';
import { useContext } from 'react';
import { ServerGameContext } from '../components/ServerGameProvider.tsx';

export type ServerGame = {
  world: World;
  playerDescriptions: Map<GameId<'players'>, PlayerDescription>;
  agentDescriptions: Map<GameId<'agents'>, AgentDescription>;
  worldMap: WorldMap;
};

export function useServerGame(): ServerGame | undefined {
  return useContext(ServerGameContext);
}
