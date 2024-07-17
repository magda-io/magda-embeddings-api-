import { Type } from "@sinclair/typebox";

export const StringEnum = <T extends string[]>(values: [...T]) =>
    Type.Unsafe<T[number]>({
        type: "string",
        enum: values
    });

export const HttpErrorResponseSchema = Type.Object({
    status: Type.Integer(),
    statusCode: Type.Integer(),
    expose: Type.Boolean(),
    headers: Type.Optional(Type.Record(Type.String(), Type.String()))
});
