import { test } from "node:test";
import * as assert from "node:assert";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { MockEmbeddingEncoder } from "../../helper.js";
import readiness, {
    WAIT_TIME_MS
} from "../../../src/routes/status/readiness.js";

test("/status/readiness should only response 200 when ready", async (t) => {
    const fastify = Fastify();
    t.after(() => fastify.close());

    const es = new MockEmbeddingEncoder(500);
    fastify.decorate("embeddingEncoder", es);
    fastify.register(sensible);
    fastify.register(readiness);

    const res = await fastify.inject({
        url: "/readiness"
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(
        res.headers["content-type"],
        "application/json; charset=utf-8"
    );
    assert.equal(JSON.parse(res.payload).status, true);
});
