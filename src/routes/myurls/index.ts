import { FastifyPluginAsync } from 'fastify';
import { MutateLinkDto, mutateLinkDtoSchema } from '../../userschema';

const myurls: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        const userId = request.user;

        if (!userId) {
            return reply
                .code(401)
                .send({ success: false, message: 'User not Logged In' });
        }

        const client = await fastify.pg.connect();
        try {
            const usersUrls = await client.query(
                'select * from urls where user_id=$1',
                [userId]
            );
            if (usersUrls.rows[0]) {
                return reply.code(200).send({
                    success: true,
                    message: 'Your Urls',
                    data: usersUrls.rows.map((el) => ({
                        shortUrl: `${request.protocol}://${request.hostname}/${el.short_url}`,
                        originalUrl: el.original_url,
                    })),
                });
            } else {
                return reply.code(200).send({
                    success: true,
                    message: "You don't have any URLS",
                    data: null,
                });
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });

    fastify.delete(
        '/:short',
        {
            schema: {
                params: mutateLinkDtoSchema,
            },
        },
        async function (request, reply) {
            if (!request.user)
                return reply
                    .code(401)
                    .send({ success: false, message: 'User is Logged out' });

            const url = request.params as MutateLinkDto;
            const shortUrl = url.short;

            const client = await fastify.pg.connect();

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
        '/:short',
        {
            schema: {
                params: mutateLinkDtoSchema,
            },
        },
        async function (request, reply) {
            if (!request.user)
                return reply
                    .code(401)
                    .send({ success: false, message: 'User is Logged out' });

            const url = request.params as MutateLinkDto;
            const shortUrl = url.short;
            const updatedUrl = request.body;
            const client = await fastify.pg.connect();

            try {
                const updated = await client.query(
                    'update urls set short_url=$1 where short_url=$2',
                    [updatedUrl, shortUrl]
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

export default myurls;
