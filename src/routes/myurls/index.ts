import { FastifyPluginAsync } from 'fastify';
import { urlStorage } from '../root';
const myurls: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        console.log(urlStorage);
        return Object.fromEntries(urlStorage);
    });
};

export default myurls;
