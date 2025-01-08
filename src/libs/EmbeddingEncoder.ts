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
} from "@huggingface/transformers";
import { limitFunction } from "p-limit";

export interface ExtractionConfig {
    pooling?: "none" | "mean" | "cls";
    normalize?: boolean;
    quantize?: boolean;
    precision?: "binary" | "ubinary";
}

export const defaultModel: ModelItem = {
    name: "Alibaba-NLP/gte-base-en-v1.5",
    dtype: "q8",
    extraction_config: {
        pooling: "cls",
        normalize: true,
        quantize: false
    }
};

export const DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
    pooling: "cls",
    normalize: true,
    quantize: false,
    precision: "binary"
};

export interface ModelItem {
    name: string;
    // whether or not this model is the default model
    // if all models are not default, the first one will be used as default
    default?: boolean;
    quantized?: boolean | null;
    config?: any;
    cache_dir?: string;
    local_files_only?: boolean;
    revision?: string;
    model_file_name?: string;
    extraction_config?: ExtractionConfig;
    dtype?: "fp32" | "fp16" | "q8" | "int8" | "uint8" | "q4" | "bnb4" | "q4f16";
}

export type ConfigModelListItem = string | ModelItem;

const MODEL_RESET_RUN_COUNT_THRESHOLD = 1;

interface ModelRefType {
    modelPromise: Promise<PreTrainedModel>;
    // how many pending runs
    usage: number;
    // total run count till now
    runCount: number;
}

class EmbeddingEncoder {
    protected ready: boolean = false;
    protected readPromise: Promise<void>;

    private tokenizer: PreTrainedTokenizer | null = null;
    private modelRef: ModelRefType | null = null;

    private supportModelNames: string[] = [defaultModel.name];
    // although we allow user to pass in a list of models, we only use the first one (default model) is used for now
    private defaultModel: string = defaultModel.name;
    private modelList: ModelItem[] = [{ ...defaultModel }];
    private runPromise: Promise<void> = Promise.resolve();

    //private extractor: FeatureExtractionPipeline | null = null;

    private pipelineLayout = {
        tokenizer: AutoTokenizer,
        model: AutoModel
    };

    constructor(modelListConfig: ConfigModelListItem[] = []) {
        if (modelListConfig?.length) {
            this.processModelList(modelListConfig);
        }
        this.readPromise = this.init();
    }

    /**
     * Given modelList: ModelListItem[]:
     * - process it & convert to ModelItem[]
     * In the process, we will also :
     * - set process result to this.modelList
     * - set this.defaultModel and this.supportModelNames
     *
     * @private
     * @memberof embeddingEncoder
     */
    private processModelList(modelList: ConfigModelListItem[]) {
        const modelNames: string[] = [];
        const modelItems: ModelItem[] = [];
        let defaultModel: string = "";

        for (const model of modelList) {
            if (typeof model === "string") {
                modelNames.push(model);
                modelItems.push({
                    name: model,
                    extraction_config: { ...DEFAULT_EXTRACTION_CONFIG }
                });
            } else {
                if (typeof model.name !== "string") {
                    throw new Error(
                        "Invalid model list supplied, when list item is not a string, it must contain a string `name` field"
                    );
                }
                modelNames.push(model.name);
                if (model?.default === true) {
                    defaultModel = model.name;
                }
                modelItems.push({
                    ...model,
                    extraction_config: {
                        ...DEFAULT_EXTRACTION_CONFIG,
                        ...(model?.extraction_config
                            ? model.extraction_config
                            : {})
                    }
                });
            }
        }
        if (!defaultModel) {
            defaultModel = modelNames[0];
        }

        this.defaultModel = defaultModel;
        this.supportModelNames = modelNames;
        this.modelList = modelItems;
    }

    private getModelByName(modelName: string): ModelItem {
        const foundModel = this.modelList.find(
            (item) => item.name === modelName
        );
        if (!foundModel) {
            throw new Error(`Cannot find model \`${modelName}\`.`);
        }
        return foundModel;
    }

    get supportModels() {
        return this.supportModelNames;
    }

    get defaultModelName() {
        return this.defaultModel;
    }

    isReady() {
        return this.ready;
    }

    async waitTillReady() {
        await this.readPromise;
    }

    private createPretrainedOptions(
        model: string | null = null,
        pretrainedOptions: PretrainedOptions = {}
    ): PretrainedOptions {
        if (!model) {
            model = this.defaultModel;
        }

        const {
            name: modelName,
            extraction_config,
            ...modelOpts
        } = this.getModelByName(model);

        const defaultPretrainedOptions = {
            quantized: true,
            config: undefined,
            local_files_only: false,
            revision: "main"
        };

        pretrainedOptions = {
            ...defaultPretrainedOptions,
            ...modelOpts,
            ...pretrainedOptions
        };
        return pretrainedOptions;
    }

    private async createPipeline(
        model: string | null = null,
        pretrainedOptions: PretrainedOptions = {}
    ) {
        if (!model) {
            model = this.defaultModel;
        }
        const runtimePretrainedOpt = this.createPretrainedOptions(
            model,
            pretrainedOptions
        );

        // Load tokenizer and model one by one to reduce peak memory usage
        this.tokenizer = await this.pipelineLayout.tokenizer.from_pretrained(
            model,
            runtimePretrainedOpt
        );
        this.modelRef = {
            modelPromise: this.pipelineLayout.model.from_pretrained(
                model,
                runtimePretrainedOpt
            ),
            usage: 0,
            runCount: 0
        };
    }

    /**
     * Recreate model for every MODEL_RESET_RUN_COUNT_THRESHOLD runs to fix memory leaks issue
     * todo: investigate root cause of the memory leaks possibly in upstream `transformers.js` or `onnxruntime-node`
     *
     * @private
     * @param {*} model_inputs
     * @return {*}
     * @memberof EmbeddingEncoder
     */
    private async runModel(model_inputs: any) {
        if (!this.modelRef) {
            throw new Error("Tokenizer or model not initialized");
        }
        let runPromise: Promise<void>;
        do {
            runPromise = this.runPromise;
        } while (runPromise !== this.runPromise);

        let modelInstance: PreTrainedModel | null = null;
        const currentModel = this.modelRef;
        currentModel.usage++;
        currentModel.runCount++;
        try {
            if (currentModel.runCount >= MODEL_RESET_RUN_COUNT_THRESHOLD) {
                const runtimePretrainedOpt = this.createPretrainedOptions();
                this.modelRef = {
                    modelPromise: this.pipelineLayout.model.from_pretrained(
                        this.defaultModel,
                        runtimePretrainedOpt
                    ),
                    usage: 0,
                    runCount: 0
                };
            }
            modelInstance = await currentModel.modelPromise;
            return await modelInstance(model_inputs);
        } finally {
            currentModel.usage--;
            if (
                !currentModel.usage &&
                this.modelRef !== currentModel &&
                modelInstance
            ) {
                modelInstance.dispose();
            }
        }
    }

    private async featureExtraction(
        texts: string | string[],
        opts: FeatureExtractionPipelineOptions = {}
    ) {
        if (!this.tokenizer || !this.modelRef) {
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
        const outputs = await this.runModel(model_inputs);

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
        await this.createPipeline();
        this.ready = true;
    }

    async switchModel(model: string = this.defaultModel) {
        const {
            name: modelName,
            extraction_config,
            ...modelOpts
        } = this.getModelByName(model);
        await this.dispose();
        await this.createPipeline(modelName, modelOpts);
    }

    async dispose() {
        if (this.modelRef) {
            await (await this.modelRef.modelPromise).dispose();
        }
    }

    public encode = limitFunction(this.__encode.bind(this), {
        concurrency: 1
    });

    private async __encode(
        sentences: string | string[],
        model: string = this.defaultModel
    ) {
        // const extractor = await pipeline(
        //     "feature-extraction",
        //     "Alibaba-NLP/gte-base-en-v1.5",
        //     { dtype: "q8" }
        // );
        // if(!this.extractor){
        //     throw new Error("Extractor is not initialised");
        // }
        // const output = await this.extractor(sentences[0], {
        //     pooling: "cls",
        //     normalize: true,
        // });

        // const embeddings = Array.from(output.data);
        // const tokenSize = 0;
        // return { embeddings, tokenSize, output };

        const { extraction_config } = this.getModelByName(model);

        const output = await this.featureExtraction(sentences, {
            ...extraction_config
        });

        const embeddings = output[0].tolist() as number[][];
        const tokenSize = output[1].input_ids.size as number;

        return { embeddings, tokenSize };
    }

    async tokenize(
        texts: string | string[],
        model: string = this.defaultModel,
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

export default EmbeddingEncoder;
