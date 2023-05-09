import { Queue } from 'bullmq';
import { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid/async';
import {
    CreateLinkDto,
    GetLinkDto,
    createLinkDtoSchema,
    getLinkDtoSchema,
} from '../userschema';

const myQueue = new Queue('url-expire');
interface DbError {
    statusCode: string;
    code: string;
    error: string;
    message: string;
}

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async (request, reply) => {
        return reply.code(200).send({ success: true, messgae: 'Welcome' });
    });

    fastify.post(
        '/',
        {
            schema: {
                body: createLinkDtoSchema,
            },
        },
        async (request, reply) => {
            const givenUrl = request.body as CreateLinkDto;

            let userLoggedIn = false;
            const userId = request.user;

            if (userId) {
                userLoggedIn = true;
            }

            const key: string =
                givenUrl.alias && userLoggedIn
                    ? givenUrl.alias
                    : await nanoid(5);

            const client = await fastify.pg.connect();

            try {
                if (userLoggedIn) {
                    await client.query(
                        'insert into urls(user_id,short_url,original_url) values($1,$2,$3)',
                        [userId, key, givenUrl.url]
                    );
                } else {
                    await client.query(
                        'insert into urls(short_url,original_url) values($1,$2)',
                        [key, givenUrl.url]
                    );
                }
                myQueue.add(
                    key,
                    { key: key },
                    { delay: 20000, removeOnComplete: true, removeOnFail: true }
                );
            } catch (err) {
                if ((err as DbError).code === '23505') {
                    return reply.code(400).send({
                        success: false,
                        message: 'The given alias in taken',
                    });
                } else {
                    return reply.code(400).send({
                        success: false,
                        message: 'Something is wrong',
                    });
                }
            } finally {
                client.release();
            }
            const generatedUrl = `${request.protocol}://${request.hostname}${request.url}${key}`;
            return reply.code(200).send({
                success: true,
                message: 'Url generated',
                url: generatedUrl,
            });
        }
    );

    fastify.get(
        '/:short',
        {
            schema: {
                params: getLinkDtoSchema,
            },
        },
        async (request, reply) => {
            const id = request.params as GetLinkDto;
            if (!id) {
                return reply
                    .code(400)
                    .send({ success: false, message: 'Invalid url' });
            }

            const client = await fastify.pg.connect();
            try {
                const urlFromDb = await client.query(
                    'select original_url from urls where short_url=$1',
                    [id.short]
                );
                if (urlFromDb.rows[0]) {
                    const originalUrl: string = urlFromDb.rows[0]
                        .original_url as string;
                    return reply.redirect(originalUrl);
                } else {
                    return reply
                        .code(400)
                        .send({ success: false, message: 'Url was not found' });
                }
            } catch (err) {
                return err;
            } finally {
                client.release();
            }
        }
    );
};

export default root;
