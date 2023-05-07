import fastifyPassport from '@fastify/passport';
import { FastifyPluginAsync } from 'fastify';
import { loginUserDtoSchema } from '../../userschema';

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return { success: true, message: 'login page' };
    });
    fastify.post(
        '/',
        {
            preValidation: fastifyPassport.authenticate(
                'local',
                {
                    authInfo: false,
                },
                async (request, reply, _, user) => {
                    if (!user) {
                        return reply.code(401).send({
                            success: false,
                            message: 'Invalid Email or Password',
                        });
                    }
                    request.login(user);
                }
            ),
            schema: {
                body: loginUserDtoSchema,
            },
        },
        async function (request, reply) {
            return reply
                .code(200)
                .send({ success: true, message: 'Login Success' });
        }
    );
};

export default login;
