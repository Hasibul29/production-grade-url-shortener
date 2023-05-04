import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import fastifyPassport from '@fastify/passport';
import fastifyPostgres from '@fastify/postgres';
import * as bcrypt from 'bcrypt';
import { FastifyPluginAsync } from 'fastify';
import * as fs from 'fs';
import { join } from 'path';
import fastifySecureSession = require('@fastify/secure-session');
require('dotenv').config();
const LocalStrategy = require('passport-local').Strategy;

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

    void fastify.register(fastifyPostgres, {
        connectionString: 'postgres://postgres:Hasib@127.0.0.1:5432/url',
    });

    void fastify.register(fastifySecureSession, {
        key: fs.readFileSync(join(__dirname, 'secret-key')),
    });
    void fastify.register(fastifyPassport.initialize());
    void fastify.register(fastifyPassport.secureSession());

    fastifyPassport.use(
        new LocalStrategy(async function (
            email: string,
            password: string,
            done: (error: any, user?: any) => void
        ) {
            console.log(email);
            const client = await fastify.pg.connect();

            try {
                const userData = await client.query(
                    'Select password_hash From Users Where email = $1',
                    [email]
                );
                if (!userData.rows[0]) {
                    return done(null, false);
                } else {
                    const hashedPassword = userData.rows[0].password_hash;
                    const isPasswordCorrect = await bcrypt.compare(
                        password,
                        hashedPassword
                    );
                    if (isPasswordCorrect) {
                        return done(null, userData.rows[0]);
                    } else {
                        return done(null, false);
                    }
                }
            } catch (err) {
                return done(err);
            } finally {
                client.release();
            }
        })
    );
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
