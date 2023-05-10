import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { Queue, Worker } from 'bullmq';
import * as dotenv from 'dotenv';
import { FastifyPluginAsync } from 'fastify';

dotenv.config();
export const myQueue = new Queue('url-expire', {
    connection: {
        host: 'localhost',
        port: 6379,
    },
});

export const schedule: FastifyPluginAsync = async (fastify) => {
    const serverAdapter = new FastifyAdapter();
    createBullBoard({
        queues: [new BullMQAdapter(myQueue)],
        serverAdapter,
    });
    serverAdapter.setBasePath('/ui');
    fastify.register(serverAdapter.registerPlugin(), {
        prefix: '/ui',
        basePath: 'ui',
    });
    const worker = new Worker('url-expire', async (job) => {}, {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
        },
    });
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
