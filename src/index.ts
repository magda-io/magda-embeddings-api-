import { pipeline, dot } from "@xenova/transformers";

(async () => {
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
    console.log("output:", output.tolist());

    // Compute similarity scores
    const [sourceEmbeddings, ...documentEmbeddings] = output.tolist();
    const similarities = documentEmbeddings.map(
        (x) => 100 * dot(sourceEmbeddings, x)
    );
    console.log(similarities);
})();
