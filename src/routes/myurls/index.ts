import { FastifyPluginAsync } from 'fastify';
import { urlStorage } from '../root';
const myurls: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return Object.fromEntries(urlStorage);
    });
};

export default myurls;
