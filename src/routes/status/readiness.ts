import fp from "fastify-plugin";
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { HttpErrorResponseSchema } from "../../libs/types.js";

const schema = {
    response: {
        200: Type.Object({
            status: Type.Boolean()
        }),
        503: HttpErrorResponseSchema
    }
};

export const WAIT_TIME_MS = 500;

export default fp(
    async (fastifyInstance, opts) => {
        const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

        fastify.get("/readiness", { schema }, async function (request, reply) {
            if (this.embeddingGenerator?.isReady() === true) {
                return { status: true };
            } else {
                reply.header("Retry-After", WAIT_TIME_MS);
                reply.serviceUnavailable(
                    `Embedding service is not ready yet. Please try again in ${WAIT_TIME_MS}ms.`
                );
                return reply;
            }
        });
    },
    {
        fastify: "4.x",
        name: "/status/readiness",
        dependencies: ["@fastify/sensible"]
    }
);
