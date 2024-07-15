import t from "tap";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import type SetupEmbeddingGeneratorType from "../../src/plugins/setupEmbeddingGenerator.js";
import EmbeddingGenerator from "../../src/libs/EmbeddingGenerator.js";

const MODEL_LOADING_TIME = 500;

class MockEmbeddingGenerator extends EmbeddingGenerator {
    override async init() {
        await new Promise((resolve) => setTimeout(resolve, MODEL_LOADING_TIME));
        this.ready = true;
        return {} as any;
    }
}

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
        fastify.get("/test", async (request, reply) => {
            if (typeof request.embeddingGenerator.ready === "boolean") {
                return { hasPlugin: true };
            } else {
                return { hasPlugin: false };
            }
        });
    });
    await fastify.ready();
    await new Promise((resolve) =>
        setTimeout(resolve, MODEL_LOADING_TIME + 100)
    );
    const res = await fastify.inject({
        url: "/test"
    });
    t.same(JSON.parse(res.payload), { hasPlugin: true });
});

t.test(
    "should reply 503 unavailable before embedding service is ready",
    async (t) => {
        const fastify = Fastify();
        fastify.register(sensible);
        fastify.register(SetupEmbeddingGenerator);
        fastify.register(async (fastify, opts) => {
            fastify.get("/test", async (request, reply) => {
                if (typeof request.embeddingGenerator.ready === "boolean") {
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
        t.equal(res.statusCode, 503);
    }
);
