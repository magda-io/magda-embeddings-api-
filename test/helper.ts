// This file contains code that we reuse between our tests.
import helper from "fastify-cli/helper.js";
import type * as test from "node:test";
import * as assert from "node:assert";
import * as path from "path";
import { fileURLToPath } from "url";
import type { Test } from "tap";
import EmbeddingEncoder from "../src/libs/EmbeddingEncoder.js";

export type TestContext = {
    after: typeof test.after;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AppPath = path.join(__dirname, "..", "src", "app.ts");

// Fill in this config with all the configurations
// needed for testing the application
export async function config() {
    return {
        pluginTimeout: 60000
    };
}

// Automatically build and tear down our instance
export async function build(t: TestContext | Test) {
    // you can set all the options supported by the fastify CLI command
    const argv = [AppPath];

    // fastify-plugin ensures that all decorators
    // are exposed for testing purposes, this is
    // different from the production setup
    const app = await helper.build(argv, await config());

    // Tear down our app after we are done
    t.after(() => app.close());

    return app;
}

export const MOCK_MODEL_LOADING_TIME = 500;

export class MockEmbeddingEncoder extends EmbeddingEncoder {
    private mockModelLoadingTime: number;

    constructor(mockModelLoadingTime: number = MOCK_MODEL_LOADING_TIME) {
        super();
        this.mockModelLoadingTime = mockModelLoadingTime;
    }
    override async init() {
        await new Promise((resolve) =>
            setTimeout(resolve, this.mockModelLoadingTime)
        );
        this.ready = true;
        return {} as any;
    }
    setReady(v: boolean) {
        this.ready = v;
    }
}

export async function requestEmbeddings(
    apiBaseUrl: string,
    sentences: string[]
) {
    const res = await fetch(`${apiBaseUrl}/v1/embeddings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            input: sentences,
            model: "Alibaba-NLP/gte-base-en-v1.5"
        })
    });
    const resData: any = await res.json();
    const embeddings = resData.data.map((item: any) => item.embedding);
    return embeddings as number[][];
}

export function closeTo(
    actual: number,
    expected: number,
    delta: number = 1e-5
) {
    assert.ok(
        Math.abs(actual - expected) < delta,
        `Expected ${actual} to be close to ${expected} within ${delta}`
    );
}

export function deepCloseTo(
    t: TestContext,
    actual: number[],
    expected: number[],
    delta: number = 1e-5
) {
    assert.equal(actual.length, expected.length);
    for (let i = 0; i < actual.length; i++) {
        closeTo(actual[i], expected[i], delta);
    }
}
