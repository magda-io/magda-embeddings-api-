import { test } from "node:test";
import * as assert from "node:assert";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { MockEmbeddingEncoder } from "../../helper.js";
import readiness, { WAIT_TIME_MS } from "../../../src/routes/status/startup.js";

test("/status/startup should only response 200 when ready", async (t) => {
    const fastify = Fastify();
    t.after(() => fastify.close());

    const es = new MockEmbeddingEncoder(500);
    fastify.decorate("embeddingEncoder", es);
    fastify.register(sensible);
    fastify.register(readiness);

    // before embeddingEncoder is ready
    let res = await fastify.inject({
        url: "/startup"
    });
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.headers["retry-after"], WAIT_TIME_MS + "");

    await new Promise((resolve) => setTimeout(resolve, 600));

    // after embeddingEncoder is ready
    res = await fastify.inject({
        url: "/startup"
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(
        res.headers["content-type"],
        "application/json; charset=utf-8"
    );
    assert.equal(JSON.parse(res.payload).status, true);

    (fastify.embeddingEncoder as any).setReady(false);

    // after embeddingEncoder.isReady = false
    res = await fastify.inject({
        url: "/startup"
    });
    assert.strictEqual(res.headers["retry-after"], WAIT_TIME_MS + "");
    assert.strictEqual(res.statusCode, 503);
});
