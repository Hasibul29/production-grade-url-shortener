import fastifyPassport from '@fastify/passport';
import * as bcrypt from 'bcrypt';
import { FastifyPluginAsync } from 'fastify';
import { Strategy as LocalStrategy } from 'passport-local';

export const configurePassport: FastifyPluginAsync = async (fastify) => {
    fastifyPassport.registerUserSerializer(async (user, request) => user);
    fastifyPassport.registerUserDeserializer(async (user, request) => {
        return await user;
    });

    fastifyPassport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            async function (email, password, done) {
                const client = await fastify.pg.connect();
                try {
                    const userData = await client.query(
                        'select * from users where email = $1',
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
                        const user = userData.rows[0].user_id;
                        if (isPasswordCorrect) {
                            return done(null, user);
                        } else {
                            return done(null, false);
                        }
                    }
                } catch (err) {
                    return done(err);
                } finally {
                    client.release();
                }
            }
        )
    );
};
