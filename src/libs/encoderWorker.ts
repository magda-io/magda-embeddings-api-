import EmbeddingEncoder, { defaultModel } from "./EmbeddingEncoder.js";
import workerpool from "workerpool";

const encoder: EmbeddingEncoder = new EmbeddingEncoder();

export async function encode(
    sentences: string | string[],
    model: string = defaultModel.name
) {
    return await encoder.encode(sentences, model);
}

export async function waitTillReady() {
    await encoder.waitTillReady();
}

export function getSupportModels() {
    return encoder.supportModels;
}

export function getDefaultModelName() {
    return encoder.defaultModelName;
}

export function isReady() {
    return encoder.isReady();
}

workerpool.worker({
    encode,
    waitTillReady,
    getSupportModels,
    getDefaultModelName,
    isReady
});
