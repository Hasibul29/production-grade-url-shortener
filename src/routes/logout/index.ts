import { FastifyPluginAsync } from 'fastify';

const logout: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        request.logout();
        return reply
            .code(200)
            .send({ success: true, message: 'Logout Successful' });
    });
};

export default logout;
