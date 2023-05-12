import { FastifyPluginAsync } from 'fastify';

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
};

export default myurls;
