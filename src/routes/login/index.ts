import { FastifyPluginAsync } from 'fastify';

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'login Page';
    });
};

export default login;
