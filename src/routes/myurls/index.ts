import { FastifyPluginAsync } from 'fastify';

interface RequestParams {
    short: string;
}

const myurls: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        const client = await fastify.pg.connect();
        const userId = request.user;
        try {
            const usersUrls = await client.query(
                'select * from urls where user_id=$1',
                [userId]
            );
            if (usersUrls.rows[0]) {
                return usersUrls.rows.map((el) => ({
                    shortUrl: `${request.protocol}://${request.hostname}/${el.short_url}`,
                    originalUrl: el.original_url,
                }));
            } else {
                return "You don't have any URLS";
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });

    fastify.delete('/:short', async function (request, reply) {
        if (!request.user) return 'Please Login to Delete';

        const url = request.params as RequestParams;
        const shortUrl = url.short;

        const client = await fastify.pg.connect();

        try {
            const deleted = await client.query(
                'delete from urls where short_url=$1',
                [shortUrl]
            );
            if (deleted.rowCount) {
                return 'URL Removed';
            } else {
                return 'URL not found';
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });

    fastify.put('/:short', async function (request, reply) {
        if (!request.user) return 'Please Login to Update';
        const url = request.params as RequestParams;
        const shortUrl = url.short;
        const updatedUrl = request.body;
        const client = await fastify.pg.connect();

        try {
            const updated = await client.query(
                'update urls set short_url=$1 where short_url=$2',
                [updatedUrl, shortUrl]
            );
            if (updated.rowCount) {
                return 'URL Updated';
            } else {
                return 'URL not found';
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });
};

export default myurls;
