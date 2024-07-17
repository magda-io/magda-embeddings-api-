import t from "tap";
import EmbeddingGenerator from "../../src/libs/EmbeddingGenerator.js";

let es: EmbeddingGenerator;

t.beforeEach(async () => {
    es = new EmbeddingGenerator();
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
    const result = await es.generate("Hello world");
    t.equal(result.tokenSize, 4);
});
