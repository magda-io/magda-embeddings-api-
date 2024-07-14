import { test } from "node:test";
import * as assert from "node:assert";
import { pipeline } from "@xenova/transformers";

test("default root route", async (t) => {
    // Create feature extraction pipeline
    const extractor = await pipeline(
        "feature-extraction",
        "Alibaba-NLP/gte-base-en-v1.5",
        {
            quantized: false // Comment out this line to use the quantized version
        }
    );
    // Generate sentence embeddings
    const sentences = [
        "what is the capital of China?",
        "how to implement quick sort in python?",
        "Beijing",
        "sorting algorithms"
    ];

    console.time("embedding");
    const output = await extractor(sentences, {
        normalize: true,
        pooling: "cls"
    });
    console.timeEnd("embedding");
    console.log("embedding tensor JSON:", JSON.stringify(output));
    console.log("embedding tensor data JSON:", JSON.stringify(output.data));
    console.log("embedding list JSON:", JSON.stringify(output.tolist()));

    assert.deepStrictEqual(JSON.parse("{ 'root': true }"), { root: true });
});
