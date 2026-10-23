const fs = require('fs');
let content = fs.readFileSync('convex/aiTown/agent.ts', 'utf8');

const find = `  handler: async (ctx, args) => {
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: args.playerId,
      text: args.text,
      messageUuid: args.messageUuid,
      worldId: args.worldId,
    });`;

const rep = `  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('messages')
      .withIndex('messageUuid', (q) =>
        q.eq('conversationId', args.conversationId).eq('messageUuid', args.messageUuid)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert('messages', {
        conversationId: args.conversationId,
        author: args.playerId,
        text: args.text,
        messageUuid: args.messageUuid,
        worldId: args.worldId,
      });
    }`;

content = content.replace(find, rep);
fs.writeFileSync('convex/aiTown/agent.ts', content);
