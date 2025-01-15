import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { HttpErrorResponseSchema } from "../../libs/types.js";

const schema = {
    response: {
        200: Type.Object({
            totalWorkers: Type.Integer(),
            busyWorkers: Type.Integer(),
            idleWorkers: Type.Integer(),
            pendingTasks: Type.Integer(),
            activeTasks: Type.Integer()
        }),
        503: HttpErrorResponseSchema
    }
};

export const WAIT_TIME_MS = 500;

const workers = fp(
    async (fastifyInstance, opts) => {
        const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

        fastify.get("/workers", { schema }, async function (request, reply) {
            return this.embeddingEncoderWorker.stats();
        });
    },
    {
        fastify: "4.x",
        name: "/status/workers",
        dependencies: ["@fastify/sensible"]
    }
);

// wrapping the plugin created using fastify-plugin to make route prefixing work
// https://fastify.dev/docs/latest/Reference/Routes/#route-prefixing-and-fastify-plugin
const routes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.register(workers);
};

export default routes;
