import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

const schema = {
    response: {
        200: Type.Object({
            status: Type.Boolean()
        })
    }
};

const liveness: FastifyPluginAsync = async (
    fastifyInstance,
    opts
): Promise<void> => {
    const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

    fastify.get("/liveness", { schema }, async function (request, reply) {
        return { status: true };
    });
};

export default liveness;
