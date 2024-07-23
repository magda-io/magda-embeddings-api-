import { test } from "node:test";
import * as assert from "node:assert";
import { defaultModel } from "../../../../src/libs/EmbeddingGenerator.js";
import { build } from "../../../helper.js";

const defaultModelName =
    typeof defaultModel === "string" ? defaultModel : defaultModel.name;

test("/v1/embeddings", async (t) => {
    const app = await build(t);

    const res = await app.inject({
        url: "/v1/embeddings",
        method: "POST",
        payload: {
            input: "This is a cake",
            model: defaultModelName
        }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(
        res.headers["content-type"],
        "application/json; charset=utf-8"
    );
    const resData = JSON.parse(res.payload);
    assert.equal(resData.data[0].embedding.length, 768);
    for (let i = 0; i < resData.data[0].embedding.length; i++) {
        assert.equal(typeof resData.data[0].embedding[i], "number");
    }
    assert.equal(resData["model"], defaultModelName);
});
