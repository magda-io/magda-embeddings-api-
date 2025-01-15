import fp from "fastify-plugin";
//import path from "path";
import workerpool, { Pool } from "workerpool";

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
    export interface FastifyInstance {
        embeddingEncoderWorker: Pool;
    }
}

export interface SupportPluginOptions {
    // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<SupportPluginOptions>(
    async (fastify, opts) => {
        console.log("set up encoder worker pool...");
        const pool = workerpool.pool("./dist/libs/encoderWorker.js", {
            maxWorkers: 1,
            minWorkers: 1,
            workerType: "process"
        });
        fastify.decorate("embeddingEncoderWorker", pool);

        fastify.addHook("onClose", async function (instance) {
            await instance.embeddingEncoderWorker.terminate();
        });

        await pool.exec("waitTillReady");
        console.log("encoder worker pool is ready!");
    },
    {
        fastify: "4.x",
        name: "setupEmbeddingEncoderWorker",
        dependencies: ["@fastify/sensible", "loadAppConfig"]
    }
);
