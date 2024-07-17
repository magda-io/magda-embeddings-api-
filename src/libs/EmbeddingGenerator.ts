/* eslint camelcase: 0 */

import {
    AutoTokenizer,
    AutoModel,
    quantize_embeddings,
    PreTrainedModel,
    PreTrainedTokenizer,
    FeatureExtractionPipelineOptions,
    mean_pooling,
    PretrainedOptions
} from "@xenova/transformers";

export const supportModels = ["Alibaba-NLP/gte-base-en-v1.5"];
export const defaultModel = "Alibaba-NLP/gte-base-en-v1.5";

class EmbeddingGenerator {
    protected ready: boolean = false;
    protected readPromise: Promise<void>;

    private tokenizer: PreTrainedTokenizer | null = null;
    private model: PreTrainedModel | null = null;

    private pipelineLayout = {
        tokenizer: AutoTokenizer,
        model: AutoModel,
        default: {
            model: defaultModel
        }
    };

    constructor() {
        this.readPromise = this.init();
    }

    get supportModels() {
        return supportModels;
    }

    isReady() {
        return this.ready;
    }

    async waitTillReady() {
        await this.readPromise;
    }

    private async createPipeline(
        model: string | null = null,
        pretrainedOptions: PretrainedOptions = {}
    ) {
        if (model === null) {
            model = this.pipelineLayout.default.model;
        }

        const defaultPretrainedOptions = {
            quantized: true,
            config: null,
            local_files_only: false,
            revision: "main"
        };

        pretrainedOptions = {
            ...defaultPretrainedOptions,
            ...pretrainedOptions
        };

        const creationTasks = [
            this.pipelineLayout.tokenizer.from_pretrained(
                model,
                pretrainedOptions
            ),
            this.pipelineLayout.model.from_pretrained(model, pretrainedOptions)
        ] as [Promise<PreTrainedTokenizer>, Promise<PreTrainedModel>];

        await Promise.all(creationTasks);
        this.tokenizer = await creationTasks[0];
        this.model = await creationTasks[1];
    }

    private async featureExtraction(
        texts: string | string[],
        opts: FeatureExtractionPipelineOptions = {}
    ) {
        if (!this.tokenizer || !this.model) {
            throw new Error("Tokenizer or model not initialized");
        }

        const defaultOpts = {
            pooling: "none",
            normalize: false,
            quantize: false,
            precision: "binary"
        } as FeatureExtractionPipelineOptions;

        opts = { ...defaultOpts, ...opts };

        // Run tokenization
        const model_inputs = this.tokenizer(texts, {
            padding: true,
            truncation: true
        });

        // Run model
        const outputs = await this.model(model_inputs);

        let result =
            outputs.last_hidden_state ??
            outputs.logits ??
            outputs.token_embeddings;
        if (opts.pooling === "none") {
            // Skip pooling
        } else if (opts.pooling === "mean") {
            result = mean_pooling(result, model_inputs.attention_mask);
        } else if (opts.pooling === "cls") {
            result = result.slice(null, 0);
        } else {
            throw Error(`Pooling method '${opts.pooling}' not supported.`);
        }

        if (opts.normalize) {
            result = result.normalize(2, -1);
        }

        if (opts.quantize) {
            result = quantize_embeddings(result, opts.precision as any);
        }

        return [result, model_inputs];
    }

    protected async init() {
        // Create feature extraction pipeline
        await this.createPipeline("Alibaba-NLP/gte-base-en-v1.5", {
            quantized: false // Comment out this line to use the quantized version
        });
        this.ready = true;
    }

    async dispose() {
        if (this.model) {
            await this.model.dispose();
        }
    }

    async generate(sentences: string | string[], model: string = defaultModel) {
        if (model && this.supportModels.indexOf(model) === -1) {
            throw new Error(
                `Model \`${model}\` is not supported. Supported models: ${this.supportModels.join(", ")}`
            );
        }
        const output = await this.featureExtraction(sentences, {
            normalize: true,
            pooling: "cls"
        });

        const embeddings = output[0].tolist() as number[][];
        const tokenSize = output[1].input_ids.size as number;

        return { embeddings, tokenSize };
    }

    async tokenize(
        texts: string | string[],
        model: string = defaultModel,
        opts: {
            text_pair?: string | string[];
            padding?: boolean | "max_length";
            add_special_tokens?: boolean;
            truncation?: boolean;
            max_length?: number;
            return_tensor?: boolean;
            return_token_type_ids?: boolean;
        } = {}
    ) {
        if (!this.tokenizer) {
            throw new Error("Tokenizer not initialized");
        }
        if (model && this.supportModels.indexOf(model) === -1) {
            throw new Error(
                `Model \`${model}\` is not supported. Supported models: ${this.supportModels.join(", ")}`
            );
        }
        opts = {
            ...opts,
            ...(typeof opts.padding !== "boolean" ? { padding: true } : {}),
            ...(typeof opts.truncation !== "boolean"
                ? { truncation: true }
                : {})
        };

        return this.tokenizer(texts, {
            padding: true,
            truncation: true
        });
    }
}

export default EmbeddingGenerator;
