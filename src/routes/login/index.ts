import fastifyPassport from '@fastify/passport';
import { FastifyPluginAsync } from 'fastify';

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'login Page';
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
                        return reply
                            .code(400)
                            .send({ massage: 'Invalid Email or Password' });
                    }
                    request.login(user);
                }
            ),
        },
        async function (request, reply) {
            return reply.redirect('/myurls');
        }
    );
};

export default login;
