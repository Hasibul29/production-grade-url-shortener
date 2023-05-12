import { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid/async';
import { myQueue } from '../schedule';
import {
    CreateLinkDto,
    GetLinkDto,
    MutateLinkDto,
    UpdateLinkDto,
    createLinkDtoSchema,
    getLinkDtoSchema,
    mutateLinkDtoSchema,
    updateLinkDtoSchema,
} from '../userschema';
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
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: '1 day',
                },
            },
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
                myQueue.add(key, { key: key }, { delay: 20000 });
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
    fastify.delete(
        '/delete-url/:short',
        {
            schema: {
                params: mutateLinkDtoSchema,
            },
        },
        async function (request, reply) {
            if (!request.user) {
                return reply
                    .code(401)
                    .send({ success: false, message: 'User is Logged out' });
            }

            const url = request.params as MutateLinkDto;
            const shortUrl = url.short;

            let client = await fastify.pg.connect();
            try {
                const userinfo = await client.query(
                    'select user_id from urls where short_url=$1',
                    [shortUrl]
                );
                const security = await client.query(
                    'select role from accountsecurity where user_id=$1',
                    [request.user]
                );
                const userId = userinfo.rows[0].user_id;
                const role = security.rows[0].role;
                if (userId !== request.user && role !== 'admin') {
                    return reply.code(401).send({
                        success: false,
                        message: 'Unauthorized access',
                    });
                }
            } catch (err) {
                return err;
            } finally {
                client.release();
            }

            client = await fastify.pg.connect();

            try {
                const deleted = await client.query(
                    'delete from urls where short_url=$1',
                    [shortUrl]
                );
                if (deleted.rowCount) {
                    return reply
                        .code(200)
                        .send({ success: true, message: 'URL Removed' });
                } else {
                    return reply
                        .code(400)
                        .send({ success: false, message: 'URL not found' });
                }
            } catch (err) {
                return err;
            } finally {
                client.release();
            }
        }
    );

    fastify.put(
        '/update-url/:short',
        {
            schema: {
                params: mutateLinkDtoSchema,
                body: updateLinkDtoSchema,
            },
        },
        async function (request, reply) {
            if (!request.user) {
                return reply
                    .code(401)
                    .send({ success: false, message: 'User is Logged out' });
            }

            const url = request.params as MutateLinkDto;
            const shortUrl = url.short;

            let client = await fastify.pg.connect();
            try {
                const userinfo = await client.query(
                    'select user_id from urls where short_url=$1',
                    [shortUrl]
                );
                const security = await client.query(
                    'select role from accountsecurity where user_id=$1',
                    [request.user]
                );
                const userId = userinfo.rows[0].user_id;
                const role = security.rows[0].role;
                if (userId !== request.user && role !== 'admin') {
                    return reply.code(401).send({
                        success: false,
                        message: 'Unauthorized access',
                    });
                }
            } catch (err) {
                return err;
            } finally {
                client.release();
            }

            const updatedUrl = request.body as UpdateLinkDto;
            const newShortUrl = updatedUrl.alias;
            client = await fastify.pg.connect();

            try {
                const updated = await client.query(
                    'update urls set short_url=$1 where short_url=$2',
                    [newShortUrl, shortUrl]
                );
                if (updated.rowCount) {
                    return reply
                        .code(200)
                        .send({ success: true, message: 'URL Updated' });
                } else {
                    return reply
                        .code(400)
                        .send({ success: false, message: 'URL not found' });
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
