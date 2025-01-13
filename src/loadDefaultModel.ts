import EmbeddingEncoder from "./libs/EmbeddingEncoder.js";

const encoder = new EmbeddingEncoder();

(async () => {
    await encoder.waitTillReady();
    console.log("Default EmbeddingEncoder model is ready!");
})();
