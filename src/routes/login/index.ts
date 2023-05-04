import fastifyPassport from '@fastify/passport';
import { FastifyPluginAsync } from 'fastify';

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'login Page';
    });
    fastify.post(
        '/',
        {
            preValidation: fastifyPassport.authenticate('local', {
                successRedirect: '/myurls',
                failureRedirect: '/login',
                authInfo: false,
            }),
        },
        async function (request, reply) {
            return request.user;
        }
    );
};

export default login;
