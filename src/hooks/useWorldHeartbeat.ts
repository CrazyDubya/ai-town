import { useMutation, useQuery } from 'convex/react';
import { useEffect, useRef } from 'react';
import { api } from '../../convex/_generated/api';
import { WORLD_HEARTBEAT_INTERVAL } from '../../convex/constants';

export function useWorldHeartbeat() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const worldStatusRef = useRef(worldStatus);

  useEffect(() => {
    worldStatusRef.current = worldStatus;
  }, [worldStatus]);

  // Send a periodic heartbeat to our world to keep it alive.
  const heartbeat = useMutation(api.world.heartbeatWorld);
  useEffect(() => {
    const sendHeartBeat = () => {
      const currentStatus = worldStatusRef.current;
      if (!currentStatus) {
        return;
      }
      // Don't send a heartbeat if we've observed one sufficiently close
      // to the present.
      if (Date.now() - WORLD_HEARTBEAT_INTERVAL / 2 < currentStatus.lastViewed) {
        return;
      }
      void heartbeat({ worldId: currentStatus.worldId });
    };
    sendHeartBeat();
    const id = setInterval(sendHeartBeat, WORLD_HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
    // Rerun if the `worldId` changes but not `worldStatus`, since don't want to
    // resend the heartbeat whenever its last viewed timestamp changes.
  }, [worldId, heartbeat]);
}
