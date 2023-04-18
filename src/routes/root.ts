import { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid/async';
import isUrl = require('is-url');

interface RequestParam {
    short: string;
}

const urlStorage: Record<string, string> = {};

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.post('/', async (request, reply) => {
        const givenUrl: string = request.body as string;
        const isValid: boolean = isUrl(givenUrl);
        const key: string = await nanoid(5);

        if (!givenUrl || !isValid) {
            return reply.code(400).send('Invalid url');
        }

        urlStorage[key] = givenUrl;
        return `${request.protocol}://${request.hostname}${request.url}${key}`;
    });

    fastify.get('/:short', async (request, reply) => {
        const id = request.params as RequestParam;
        if (!id) {
            reply.code(400).send('Invalid url');
        }
        return {
            'long-url': urlStorage[id.short],
            'short-url ': `${request.protocol}://${request.hostname}/${id.short}`,
        };
    });
};

export default root;
