import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

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
        200: Type.Object({
            object: Type.Const("list"),
            data: Type.Array(schemaEmebeddingObject),
            model: Type.String(),
            usage: Type.Object({
                prompt_tokens: Type.Integer(),
                total_tokens: Type.Integer()
            })
        })
    }
};

const embeddings: FastifyPluginAsync = async (
    fastifyInstance,
    opts
): Promise<void> => {
    const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

    fastify.post("/", { schema }, async function (request, reply) {
        const supportModels = this.embeddingEncoder.supportModels;
        if (
            request.body.model &&
            supportModels.indexOf(request.body.model) === -1
        ) {
            throw fastify.httpErrors.badRequest(
                `Model \`${request.body.model}\` is not supported. Supported models: ${supportModels.join(", ")}`
            );
        }
        const model =
            request.body.model || fastify.embeddingEncoder.defaultModelName;
        const inputItems = Array.isArray(request.body.input)
            ? request.body.input
            : [request.body.input];
        const results = await this.embeddingEncoder.encode(inputItems, model);
        const { embeddings, tokenSize } = results;
        const data = embeddings.map((embedding, index) => ({
            index,
            embedding,
            object: "embedding"
        }));
        return {
            object: "list",
            data,
            model,
            usage: {
                prompt_tokens: tokenSize,
                total_tokens: tokenSize
            }
        };
    });
};

export default embeddings;
