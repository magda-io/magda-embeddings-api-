import fp from "fastify-plugin";
import EmbeddingGenerator from "../libs/EmbeddingGenerator.js";

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
    export interface FastifyInstance {
        embeddingGenerator: EmbeddingGenerator;
    }
}

export interface SupportPluginOptions {
    // Specify Support plugin options here
}

const WAIT_TIME_MS = 500;

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<SupportPluginOptions>(
    async (fastify, opts) => {
        const embeddingGenerator = new EmbeddingGenerator();
        fastify.decorate("embeddingGenerator", embeddingGenerator);

        fastify.addHook("onRequest", function (request, reply, next) {
            if (request.url.startsWith("/status/")) {
                return next();
            }
            if (!this.embeddingGenerator.isReady()) {
                reply.header("Retry-After", WAIT_TIME_MS);
                reply.serviceUnavailable(
                    `Embedding service is not ready yet. Please try again in ${WAIT_TIME_MS}ms.`
                );
            }
            next();
        });

        fastify.addHook("onClose", async function (instance) {
            await instance.embeddingGenerator.dispose();
        });

        await embeddingGenerator.waitTillReady();
    },
    {
        fastify: "4.x",
        name: "setupEmbeddingGenerator",
        dependencies: ["@fastify/sensible"]
    }
);
