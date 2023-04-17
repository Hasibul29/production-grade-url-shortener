import { FastifyPluginAsync } from 'fastify';

interface RequestParam {
    short: string;
}

const arr: string[] = [];

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.post('/', async (request, reply) => {
        const key: number = arr.length;
        if (!request.body) return reply.code(400).send('Invalid url');
        arr[key] = request.body as string;
        return `${request.protocol}://${request.hostname}${request.url}${key}`;
    });

    fastify.get('/:short', async (request, reply) => {
        const id = request.params as RequestParam;
        if (Number(id.short) >= arr.length) reply.code(400).send('Invalid url');
        return {
            'long-url': arr[Number(id.short)],
            'short-url ': `${request.protocol}://${request.hostname}/${id.short}`,
        };
    });
};

export default root;
