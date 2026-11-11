const fs = require('fs');
const path = 'convex/aiTown/agentOperations.ts';
let code = fs.readFileSync(path, 'utf8');

const search = `async function runWithOCCRetry<T>(fn: () => Promise<T>): Promise<T> {
  await sleep(Math.random() * 1000);
  const { result } = await retryWithBackoff(async () => {
    try {
      return await fn();
    } catch (e: any) {
      if (e.message?.includes('concurrency') || e.message?.includes('TooManyConcurrentRequests')) {
        throw { retry: true, error: e };
      }
      throw e;
    }
  });
  return result;
}`;

const replace = `async function runWithOCCRetry<T>(fn: () => Promise<T>): Promise<T> {
  await sleep(Math.random() * 1000);
  const backoffResult = await retryWithBackoff(async () => {
    try {
      return await fn();
    } catch (e: any) {
      if (e.message?.includes('concurrency') || e.message?.includes('TooManyConcurrentRequests')) {
        throw { retry: true, error: e };
      }
      throw e;
    }
  });
  return backoffResult.result;
}`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync(path, code);
    console.log("Patched successfully.");
} else {
    console.log("Could not find search string.");
}
