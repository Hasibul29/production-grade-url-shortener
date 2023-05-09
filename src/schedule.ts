import { Queue, Worker } from 'bullmq';
import { FastifyPluginAsync } from 'fastify';
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { FastifyAdapter } = require('@bull-board/fastify');

export const myQueue = new Queue('url-expire');

export const schedule: FastifyPluginAsync = async (fastify) => {
    const serverAdapter = new FastifyAdapter();
    createBullBoard({
        queues: [new BullMQAdapter(myQueue)],
        serverAdapter,
    });

    serverAdapter.setBasePath('/ui');
    fastify.register(serverAdapter.registerPlugin(), { prefix: '/ui' });
    const worker = new Worker('url-expire', async (job) => {});
    worker.on('completed', async (job) => {
        const client = await fastify.pg.connect();
        try {
            await client.query('delete from urls where short_url=$1', [
                job.name,
            ]);
        } catch (err) {
            console.log(err);
        } finally {
            client.release();
        }
        console.log(`${job.id} has completed!`);
    });
    worker.on('failed', (job, err) => {
        console.log(`${job?.id ?? null} has failed with ${err.message}`);
    });
};
