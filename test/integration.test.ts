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

test("Should produce same result for single text input or multiple text items input", async (t) => {
    const fastify = await build(t);
    await fastify.listen({ port: 0 });

    const sentences = [
        "chocolate milk",
        "Title: a good milk chocolate receipt. Description: Milk chocolate is a type of chocolate that is made from a blend of cocoa solids, cocoa butter, sugar, and milk or milk powder. Unlike dark chocolate, which has a higher percentage of cocoa solids and little to no milk content, milk chocolate contains a significant amount of milk, giving it a creamier texture and a sweeter, milder flavor. Milk chocolate typically has a lower cocoa content (often between 10% to 50%) compared to dark chocolate. It is commonly used in candy bars, confections, and various desserts.",
        "Title: a good chocolate milk receipt. Description: Chocolate milk is a sweetened, flavored milk beverage that is made by mixing milk (usually cow's milk) with cocoa powder or chocolate syrup and often sugar. The drink can be served cold or hot and is popular as both a refreshing treat and a comfort beverage. Chocolate milk can be made at home or purchased pre-mixed in bottles or cartons. Some versions also include additional ingredients like vanilla extract or stabilizers to improve texture and flavor.",
        "sydney water revenue report"
    ];

    const sentenceOneResult = await requestEmbeddings(
        `http://localhost:${fastify.server.address().port}`,
        [sentences[0]]
    );
    const sentenceTwoResult = await requestEmbeddings(
        `http://localhost:${fastify.server.address().port}`,
        [sentences[1]]
    );
    const sentenceThreeResult = await requestEmbeddings(
        `http://localhost:${fastify.server.address().port}`,
        [sentences[2]]
    );
    const sentenceFourResult = await requestEmbeddings(
        `http://localhost:${fastify.server.address().port}`,
        [sentences[3]]
    );
    const allSentencesResult = await requestEmbeddings(
        `http://localhost:${fastify.server.address().port}`,
        sentences
    );

    deepCloseTo(t, sentenceOneResult[0], allSentencesResult[0]);
    deepCloseTo(t, sentenceTwoResult[0], allSentencesResult[1]);
    deepCloseTo(t, sentenceThreeResult[0], allSentencesResult[2]);
    deepCloseTo(t, sentenceFourResult[0], allSentencesResult[3]);
});
