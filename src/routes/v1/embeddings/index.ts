import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import setupEmbeddingGenerator from "../../../plugins/setupEmbeddingGenerator.js";

const schemaEmebeddingObject = Type.Object({
    index: Type.Integer(),
    embedding: Type.Array(Type.Number()),
    object: Type.Const("embedding")
});

const schema = {
    body: Type.Object({
        input: Type.Union([Type.String(), Type.Array(Type.String())]),
        model: Type.Optional(Type.String())
    }),
    response: {
        200: Type.Array(schemaEmebeddingObject)
    }
};

const embeddings: FastifyPluginAsync = async (
    fastifyInstance,
    opts
): Promise<void> => {
    const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

    fastify.register(setupEmbeddingGenerator);

    fastify.post("/", { schema }, async function (request, reply) {
        if (
            request.body.model &&
            request.embeddingGenerator.supportModels.indexOf(
                request.body.model
            ) === -1
        ) {
            throw fastify.httpErrors.badRequest(
                `Model \`${request.body.model}\` is not supported. Supported models: ${request.embeddingGenerator.supportModels.join(", ")}`
            );
        }
        const inputItems = Array.isArray(request.body.input)
            ? request.body.input
            : [request.body.input];
        const results = await request.embeddingGenerator.generate(inputItems);
        return results.map((embedding, index) => ({
            index,
            embedding,
            object: "embedding"
        }));
    });
};

export default embeddings;
