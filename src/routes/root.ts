import { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid/async';
import isUrl = require('is-url');

interface RequestParam {
    short: string;
}

// interface UrlResponse {
//     originalUrl: string;
//     shortUrl: string;
// }

export const urlStorage: Map<string, string> = new Map<string, string>();

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async (request, reply) => {
        return 'Welcome';
    });

    fastify.post('/', async (request, reply) => {
        const givenUrl: string = request.body as string;
        const isValid: boolean = isUrl(givenUrl);
        const key: string = await nanoid(5);

        if (!givenUrl || !isValid) {
            return reply.code(400).send('Invalid url');
        }

        urlStorage.set(key, givenUrl);
        return `${request.protocol}://${request.hostname}${request.url}${key}`;
    });

    fastify.get('/:short', async (request, reply) => {
        const id = request.params as RequestParam;
        if (!id) {
            reply.code(400).send('Invalid url');
        }
        if (!urlStorage.has(id.short)) {
            return 'Invalid url';
        }
        reply.redirect(urlStorage.get(id.short) as string);
        // return {
        //     originalUrl: urlStorage.get(id.short),
        //     shortUrl: `${request.protocol}://${request.hostname}/${id.short}`,
        // } as UrlResponse;
    });
};

export default root;
