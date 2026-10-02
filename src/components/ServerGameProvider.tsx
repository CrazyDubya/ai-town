import { createContext, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { World } from '../../convex/aiTown/world';
import { AgentDescription } from '../../convex/aiTown/agentDescription';
import { PlayerDescription } from '../../convex/aiTown/playerDescription';
import { WorldMap } from '../../convex/aiTown/worldMap';
import { parseMap } from '../../convex/util/object';
import { ServerGame } from '../hooks/serverGame';

export const ServerGameContext = createContext<ServerGame | undefined>(undefined);

export function ServerGameProvider({ children }: { children: React.ReactNode }) {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const descriptions = useQuery(api.world.gameDescriptions, worldId ? { worldId } : 'skip');

  const game = useMemo(() => {
    if (!worldState || !descriptions) {
      return undefined;
    }
    return {
      world: new World(worldState.world),
      agentDescriptions: parseMap(
        descriptions.agentDescriptions,
        AgentDescription,
        (p) => p.agentId,
      ),
      playerDescriptions: parseMap(
        descriptions.playerDescriptions,
        PlayerDescription,
        (p) => p.playerId,
      ),
      worldMap: new WorldMap(descriptions.worldMap),
    };
  }, [worldState, descriptions]);

  return (
    <ServerGameContext.Provider value={game}>
      {children}
    </ServerGameContext.Provider>
  );
}
