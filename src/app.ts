import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import helmet from '@fastify/helmet';
import fastifyPassport from '@fastify/passport';
import fastifyPostgres from '@fastify/postgres';
import rateLimit from '@fastify/rate-limit';
import { fastifySecureSession } from '@fastify/secure-session';
import * as dotenv from 'dotenv';
import { FastifyPluginAsync } from 'fastify';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { configurePassport } from './passport';
import { schedule } from './schedule';

dotenv.config();

export type AppOptions = {
    // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
    fastify,
    opts
): Promise<void> => {
    // Place here your custom code!
    void fastify.register(helmet);
    void fastify.register(fastifyPostgres, {
        connectionString: process.env.DB_SECRET,
    });

    void fastify.register(fastifySecureSession, {
        key: fs.readFileSync(join(__dirname, 'secret-key')),
        cookie: { httpOnly: true },
    });
    void fastify.register(fastifyPassport.initialize());
    void fastify.register(fastifyPassport.secureSession());

    // pasport strategy
    configurePassport(fastify, opts);
    schedule(fastify, opts);
    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });
    fastify.setNotFoundHandler(
        {
            preHandler: fastify.rateLimit({
                max: 4,
                timeWindow: 500000,
            }),
        },
        function (request, reply) {
            reply.code(404).send({ hello: 'world' });
        }
    );

    // ... and then a deserializer that will fetch that user from the database when a request with an id in the session arrives
    // fastifyPassport.registerUserDeserializer(async (id, request) => {
    // return await User.findById(id);
    // });
    // Do not touch the following lines

    // This loads all plugins defined in plugins
    // those should be support plugins that are reused
    // through your application
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'plugins'),
        options: opts,
    });

    // This loads all plugins defined in routes
    // define your routes in one of these
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        options: opts,
    });
};

export default app;
export { app, options };
