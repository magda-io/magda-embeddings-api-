import t from "tap";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import type SetupEmbeddingGeneratorType from "../../src/plugins/setupEmbeddingGenerator.js";
import { MockEmbeddingGenerator } from "../helper.js";

const SetupEmbeddingGenerator = await t.mockImport<
    typeof SetupEmbeddingGeneratorType
>("../../src/plugins/setupEmbeddingGenerator.js", {
    "../../src/libs/EmbeddingGenerator.js": MockEmbeddingGenerator
});

t.test("should works for child plugin routes", async (t) => {
    const fastify = Fastify();
    fastify.register(sensible);
    fastify.register(SetupEmbeddingGenerator);
    fastify.register(async (fastify, opts) => {
        fastify.get("/test", async function (request, reply) {
            if (typeof this.embeddingGenerator === "object") {
                return { hasPlugin: true };
            } else {
                return { hasPlugin: false };
            }
        });
    });
    await fastify.ready();
    const res = await fastify.inject({
        url: "/test"
    });
    t.same(JSON.parse(res.payload), { hasPlugin: true });
});

t.test(
    "should reply 503 unavailable when embedding service is not ready",
    async (t) => {
        const fastify = Fastify();
        fastify.register(sensible);
        fastify.register(SetupEmbeddingGenerator);
        fastify.register(async (fastify, opts) => {
            fastify.get("/test", async function (request, reply) {
                if (typeof this.embeddingGenerator === "object") {
                    return { hasPlugin: true };
                } else {
                    return { hasPlugin: false };
                }
            });
        });
        await fastify.ready();
        const res = await fastify.inject({
            url: "/test"
        });
        t.same(JSON.parse(res.payload), { hasPlugin: true });
        (fastify.embeddingGenerator as any).setReady(false);
        const res2 = await fastify.inject({
            url: "/test"
        });
        t.equal(res2.statusCode, 503);
    }
);

t.test(
    "should not reply 503 unavailable for /status/* endpoints, when embedding service is not ready",
    async (t) => {
        const fastify = Fastify();
        fastify.register(sensible);
        fastify.register(SetupEmbeddingGenerator);
        fastify.register(async (fastify, opts) => {
            fastify.get("/status/ready", async function (request, reply) {
                if (typeof this.embeddingGenerator === "object") {
                    return { hasPlugin: true };
                } else {
                    return { hasPlugin: false };
                }
            });
        });
        await fastify.ready();
        const res = await fastify.inject({
            url: "/status/ready"
        });
        t.same(JSON.parse(res.payload), { hasPlugin: true });
        (fastify.embeddingGenerator as any).setReady(false);
        const res2 = await fastify.inject({
            url: "/status/ready"
        });
        t.equal(res2.statusCode, 200);
    }
);
