import { FastifyPluginAsync } from 'fastify';

const logout: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        request.logout();
        return 'Logout Sucess';
    });
};

export default logout;
