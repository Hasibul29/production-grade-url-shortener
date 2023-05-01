import { FastifyPluginAsync } from 'fastify';
const signup: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'signup';
    });
};

export default signup;
