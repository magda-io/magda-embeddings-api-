import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
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

const startup = fp(
    async (fastifyInstance, opts) => {
        const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

        fastify.get("/startup", { schema }, async function (request, reply) {
            return { status: true };
        });
    },
    {
        fastify: "4.x",
        name: "/status/startup",
        dependencies: ["@fastify/sensible"]
    }
);

// wrapping the plugin created using fastify-plugin to make route prefixing work
// https://fastify.dev/docs/latest/Reference/Routes/#route-prefixing-and-fastify-plugin
const routes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.register(startup);
};

export default routes;
