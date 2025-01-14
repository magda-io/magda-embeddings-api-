import t from "tap";
import EmbeddingEncoder from "../../src/libs/EmbeddingEncoder.js";

t.test("Test with default model", async (t) => {
    let es: EmbeddingEncoder;

    t.beforeEach(async () => {
        es = new EmbeddingEncoder();
        await es.waitTillReady();
    });
    t.afterEach(async () => {
        await es.dispose();
    });

    t.test("Should tokenize text properly", async (t) => {
        const result = await es.tokenize("Hello world");
        t.equal(result.input_ids.size, 4);
    });

    t.test("Should generate embedding without error", async (t) => {
        const result = await es.encode("Hello world");
        t.equal(result.tokenSize, 4);
    });
});

t.test("Test with custom model config", async (t) => {
    t.test("Should work with custom model config", async (t) => {
        const es = new EmbeddingEncoder([
            {
                name: "Xenova/bge-small-en-v1.5",
                dtype: "q8",
                extraction_config: {
                    pooling: "mean",
                    normalize: true,
                    quantize: true,
                    precision: "ubinary"
                }
            }
        ]);
        await es.waitTillReady();

        const result = await es.encode("Hello world");
        t.equal(result.tokenSize, 4);
    });

    t.test(
        "Should use custom model config extraction config for embedding generation",
        async (t) => {
            const testConfig = {
                pooling: "mean",
                normalize: true,
                quantize: true,
                precision: "ubinary"
            };
            const es = new EmbeddingEncoder([
                {
                    name: "Xenova/bge-small-en-v1.5",
                    dtype: "q8",
                    extraction_config: { ...testConfig } as any
                }
            ]);
            const results = t.capture(
                es,
                "featureExtraction" as any,
                async () => [
                    { tolist: () => [[1, 2, 3]] },
                    { input_ids: { size: 3 } }
                ]
            );
            await es.waitTillReady();

            await es.encode("Hello world");
            t.match(results(), [
                {
                    args: ["Hello world", { ...testConfig }],
                    threw: false
                }
            ]);
        }
    );
});
