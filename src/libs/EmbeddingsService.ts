import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

class EmbeddingsService {
    private extractor?: FeatureExtractionPipeline = undefined;
    public ready: boolean = false;

    async init() {
        // Create feature extraction pipeline
        this.extractor = await pipeline(
            "feature-extraction",
            "Alibaba-NLP/gte-base-en-v1.5",
            {
                quantized: false // Comment out this line to use the quantized version
            }
        );
        this.ready = true;
        return this.extractor;
    }

    async generate(sentences: string[]) {
        if (!this.extractor) {
            throw new Error("Extractor not initialized");
        }
        const output = await this.extractor(sentences, {
            normalize: true,
            pooling: "cls"
        });
        return output.tolist() as number[][];
    }
}

export default EmbeddingsService;
