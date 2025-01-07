import fp from "fastify-plugin";
import EmbeddingEncoder from "../libs/EmbeddingEncoder.js";

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
    export interface FastifyInstance {
        embeddingEncoder: EmbeddingEncoder;
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
        const embeddingEncoder = new EmbeddingEncoder(
            fastify?.appConfig?.modelList
        );
        fastify.decorate("embeddingEncoder", embeddingEncoder);

        fastify.addHook("onRequest", function (request, reply, next) {
            if (request.url.startsWith("/status/")) {
                return next();
            }
            if (!this.embeddingEncoder.isReady()) {
                reply.header("Retry-After", WAIT_TIME_MS);
                reply.serviceUnavailable(
                    `Embedding service is not ready yet. Please try again in ${WAIT_TIME_MS}ms.`
                );
            }
            next();
        });

        fastify.addHook("onClose", async function (instance) {
            await instance.embeddingEncoder.dispose();
        });

        await embeddingEncoder.waitTillReady();
    },
    {
        fastify: "4.x",
        name: "setupEmbeddingEncoder",
        dependencies: ["@fastify/sensible", "loadAppConfig"]
    }
);
