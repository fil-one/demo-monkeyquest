import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker(cacheKey) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", cacheKey);
  return (await import(workerUrl.href)).default;
}

const executionContext = {
  waitUntil() {},
  passThroughOnException() {},
};

const bindings = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

test("server-renders the Monkey Quest trailer page", async () => {
  const worker = await loadWorker(`page-${process.pid}-${Date.now()}`);
  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    bindings,
    executionContext,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Monkey Quest — The Wild Is Calling<\/title>/i);
  assert.match(html, /Hypergalactic/i);
  assert.match(html, /Watch trailer/i);
  assert.match(html, /Powered by/i);
  assert.match(html, /Toei Animation/i);
  assert.match(html, /Filecoin/i);
  assert.match(html, /href="https:\/\/monkeyquest\.fil\.one\/"/i);
  assert.match(html, /<option value="ja">日本語<\/option>/i);
  assert.doesNotMatch(html, /<nav\b|About Monkey Quest|Behind the Scenes/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("returns a safe error while S3 is unconfigured", async () => {
  const worker = await loadWorker(`api-${process.pid}-${Date.now()}`);
  const response = await worker.fetch(
    new Request("http://localhost/api/trailer"),
    bindings,
    executionContext,
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    code: "TRAILER_NOT_CONFIGURED",
    message: "The trailer stream has not been connected yet.",
  });
});
