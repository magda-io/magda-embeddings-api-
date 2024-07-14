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

    // console.log("embedding tensor JSON:", JSON.stringify(output));
    // console.log("embedding tensor data JSON:", JSON.stringify(output.data));
    // console.log("embedding list JSON:", JSON.stringify(output.tolist()));
    const result = output.tolist();
    console.log(typeof result[0][0]);
    // Compute similarity scores
    const [sourceEmbeddings, ...documentEmbeddings] = output.tolist();
    const similarities = documentEmbeddings.map(
        (x) => 100 * dot(sourceEmbeddings, x)
    );
    console.log(similarities);
})();
