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
    const debugFlag = process.env.DEBUG === "true";

    fastify.post("/", { schema }, async function (request, reply) {
        const supportModels =
            await this.embeddingEncoderWorker.exec("getSupportModels");
        const defaultModelName = await this.embeddingEncoderWorker.exec(
            "getDefaultModelName"
        );
        if (
            request.body.model &&
            supportModels.indexOf(request.body.model) === -1
        ) {
            throw fastify.httpErrors.badRequest(
                `Model \`${request.body.model}\` is not supported. Supported models: ${supportModels.join(", ")}`
            );
        }
        const model = request.body.model || defaultModelName;
        const inputItems = Array.isArray(request.body.input)
            ? request.body.input
            : [request.body.input];
        if (debugFlag) {
            console.log(
                "Received encode request. inputItems: ",
                JSON.stringify(inputItems)
            );
        }
        const results = await this.embeddingEncoderWorker.exec("encode", [
            inputItems,
            model
        ]);
        const { embeddings, tokenSize } = results;
        if (debugFlag) {
            console.log(
                `Encode request done. embeddings: ${embeddings[0].length} tokenSize: ${tokenSize}`
            );
        }
        const data = embeddings.map((embedding: number[][], index: number) => ({
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
