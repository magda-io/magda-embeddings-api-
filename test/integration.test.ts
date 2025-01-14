import { test } from "node:test";
import * as assert from "node:assert";
import { build, requestEmbeddings, deepCloseTo } from "./helper.js";
import { defaultModel } from "../src/libs/EmbeddingEncoder.js";
import { OpenAIEmbeddings } from "@langchain/openai";

test("Should work with @langchain/openai", async (t) => {
    const fastify = await build(t);
    await fastify.listen({ port: 0 });

    const embeddings = new OpenAIEmbeddings({
        verbose: true,
        model:
            typeof defaultModel === "string" ? defaultModel : defaultModel.name,
        configuration: {
            baseURL: `http://localhost:${fastify.server.address().port}/v1`
        },
        apiKey: "we-dont-need-key-but-make-lib-happy"
    });

    const res = await embeddings.embedQuery("Hello world");
    assert.equal(res.length, 768);
});
