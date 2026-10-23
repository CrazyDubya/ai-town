const fs = require('fs');

let content = fs.readFileSync('convex/aiTown/agentOperations.ts', 'utf8');

// Replace retry block with a helper
const helper = `
async function sendInputWithRetries(ctx: any, name: string, args: any) {
  return await retryWithBackoff(async () => {
    try {
      return await ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: args.worldId,
        name,
        args,
      });
    } catch (e: any) {
      const msg = e.message?.toLowerCase() || '';
      if (
        msg.includes('concurrency') ||
        msg.includes('concurrent') ||
        msg.includes('too many concurrent requests') ||
        msg.includes('occ')
      ) {
        throw { retry: true, error: e };
      }
      throw e;
    }
  });
}
`;

content = content.replace('import { sleep } from \'../util/sleep\';', 'import { sleep } from \'../util/sleep\';\n' + helper);

// Replace usages
content = content.replace(/await retryWithBackoff\(async \(\) => \{\n\s*try \{\n\s*await ctx\.runMutation\(api\.aiTown\.main\.sendInput, \{\n\s*worldId: args\.worldId,\n\s*name: 'finishRememberConversation',\n\s*args: \{\n\s*agentId: args\.agentId,\n\s*operationId: args\.operationId,\n\s*\},\n\s*\}\);\n\s*\} catch \(e: any\) \{\n\s*if \(e\.message\?\.includes\('concurrency'\) \|\| e\.message\?\.includes\('TooManyConcurrentRequests'\)\) \{\n\s*throw \{ retry: true, error: e \};\n\s*\}\n\s*throw e;\n\s*\}\n\s*\}\);/g, `await sendInputWithRetries(ctx, 'finishRememberConversation', { worldId: args.worldId, agentId: args.agentId, operationId: args.operationId });`);

content = content.replace(/await retryWithBackoff\(async \(\) => \{\n\s*try \{\n\s*await ctx\.runMutation\(api\.aiTown\.main\.sendInput, \{\n\s*worldId: args\.worldId,\n\s*name: 'finishDoSomething',\n\s*args: \{\n\s*operationId: args\.operationId,\n\s*agentId: agent\.id,\n\s*destination: wanderDestination\(map\),\n\s*\},\n\s*\}\);\n\s*\} catch \(e: any\) \{\n\s*if \(e\.message\?\.includes\('concurrency'\) \|\| e\.message\?\.includes\('TooManyConcurrentRequests'\)\) \{\n\s*throw \{ retry: true, error: e \};\n\s*\}\n\s*throw e;\n\s*\}\n\s*\}\);/g, `await sendInputWithRetries(ctx, 'finishDoSomething', { worldId: args.worldId, operationId: args.operationId, agentId: agent.id, destination: wanderDestination(map) });`);

content = content.replace(/await retryWithBackoff\(async \(\) => \{\n\s*try \{\n\s*await ctx\.runMutation\(api\.aiTown\.main\.sendInput, \{\n\s*worldId: args\.worldId,\n\s*name: 'finishDoSomething',\n\s*args: \{\n\s*operationId: args\.operationId,\n\s*agentId: agent\.id,\n\s*activity: \{\n\s*description: activity\.description,\n\s*emoji: activity\.emoji,\n\s*until: Date\.now\(\) \+ activity\.duration,\n\s*\},\n\s*\},\n\s*\}\);\n\s*\} catch \(e: any\) \{\n\s*if \(e\.message\?\.includes\('concurrency'\) \|\| e\.message\?\.includes\('TooManyConcurrentRequests'\)\) \{\n\s*throw \{ retry: true, error: e \};\n\s*\}\n\s*throw e;\n\s*\}\n\s*\}\);/g, `await sendInputWithRetries(ctx, 'finishDoSomething', { worldId: args.worldId, operationId: args.operationId, agentId: agent.id, activity: { description: activity.description, emoji: activity.emoji, until: Date.now() + activity.duration } });`);

content = content.replace(/await retryWithBackoff\(async \(\) => \{\n\s*try \{\n\s*await ctx\.runMutation\(api\.aiTown\.main\.sendInput, \{\n\s*worldId: args\.worldId,\n\s*name: 'finishDoSomething',\n\s*args: \{\n\s*operationId: args\.operationId,\n\s*agentId: args\.agent\.id,\n\s*invitee,\n\s*\},\n\s*\}\);\n\s*\} catch \(e: any\) \{\n\s*if \(e\.message\?\.includes\('concurrency'\) \|\| e\.message\?\.includes\('TooManyConcurrentRequests'\)\) \{\n\s*throw \{ retry: true, error: e \};\n\s*\}\n\s*throw e;\n\s*\}\n\s*\}\);/g, `await sendInputWithRetries(ctx, 'finishDoSomething', { worldId: args.worldId, operationId: args.operationId, agentId: args.agent.id, invitee });`);

// Update the TODO comment
content = content.replace(`    // TODO: We hit a lot of OCC errors on sending inputs in this file. It's
    // easy for them to get scheduled at the same time and line up in time.`, `    // Jitter plus retryWithBackoff handles OCC errors on sending inputs in this file.
    // It's easy for them to get scheduled at the same time and line up in time.`);

// Also wrap the send message
content = content.replace(`    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
    });`, `    await retryWithBackoff(async () => {
      try {
        await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
          worldId: args.worldId,
          conversationId: args.conversationId,
          agentId: args.agentId,
          playerId: args.playerId,
          text,
          messageUuid: args.messageUuid,
          leaveConversation: args.type === 'leave',
          operationId: args.operationId,
        });
      } catch (e: any) {
        const msg = e.message?.toLowerCase() || '';
        if (
          msg.includes('concurrency') ||
          msg.includes('concurrent') ||
          msg.includes('too many concurrent requests') ||
          msg.includes('occ')
        ) {
          throw { retry: true, error: e };
        }
        throw e;
      }
    });`);

fs.writeFileSync('convex/aiTown/agentOperations.ts', content);
