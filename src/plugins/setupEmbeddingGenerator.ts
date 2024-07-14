import fp from "fastify-plugin";
import EmbeddingGenerator from "../libs/EmbeddingGenerator.js";

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
    export interface FastifyRequest {
        embeddingGenerator: EmbeddingGenerator;
    }
}

export interface SupportPluginOptions {
    // Specify Support plugin options here
}

const WAIT_TIME_MS = 500;

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<SupportPluginOptions>(async (fastify, opts) => {
    const es = new EmbeddingGenerator();
    es.init();

    fastify.decorateRequest("embeddingGenerator", es);

    fastify.addHook("onRequest", function (request, reply, next) {
        if (!request.embeddingGenerator.ready) {
            reply.header("Retry-After", WAIT_TIME_MS);
            reply.serviceUnavailable(
                `Embedding service is not ready yet. Please try again in ${WAIT_TIME_MS}ms.`
            );
        }
        next();
    });
});
