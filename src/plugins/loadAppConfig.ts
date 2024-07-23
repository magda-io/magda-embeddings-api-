import fp from "fastify-plugin";
import fse from "fs-extra/esm";

declare module "fastify" {
    export interface FastifyInstance {
        appConfig: {
            [key: string]: any;
        };
    }
}

export interface SupportPluginOptions {
    appConfigFile?: string;
}

export default fp<SupportPluginOptions>(
    async (fastify, opts) => {
        fastify.decorate("appConfig", {} as any);
        if (opts?.appConfigFile) {
            fastify.log.info(`Loading app config from ${opts.appConfigFile}`);
            const appConfig = await fse.readJson(opts.appConfigFile);
            fastify.appConfig = appConfig;
        }
    },
    {
        fastify: "4.x",
        name: "loadAppConfig"
    }
);
