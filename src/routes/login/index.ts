import fastifyPassport from '@fastify/passport';
import { FastifyPluginAsync } from 'fastify';
import { loginUserDtoSchema } from '../../userschema';

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
                            .code(401)
                            .send({ massage: 'Invalid Email or Password' });
                    }
                    request.login(user);
                }
            ),
            schema: {
                body: loginUserDtoSchema,
            },
        },
        async function (request, reply) {
            return reply.redirect('/myurls');
        }
    );
};

export default login;
