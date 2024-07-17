// This file contains code that we reuse between our tests.
import helper from "fastify-cli/helper.js";
import type * as test from "node:test";
import * as path from "path";
import { fileURLToPath } from "url";
import type { Test } from "tap";
import EmbeddingGenerator from "../src/libs/EmbeddingGenerator.js";

export type TestContext = {
    after: typeof test.after;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AppPath = path.join(__dirname, "..", "src", "app.ts");

// Fill in this config with all the configurations
// needed for testing the application
export async function config() {
    return {};
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

export class MockEmbeddingGenerator extends EmbeddingGenerator {
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
