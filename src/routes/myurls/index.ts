import { FastifyPluginAsync } from 'fastify';

interface RequestParams {
    short: string;
}

const myurls: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        const client = await fastify.pg.connect();
        const userId = 1; //for now
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
                return 'Empty';
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });

    fastify.delete('/:short', async function (request, reply) {
        const url = request.params as RequestParams;
        const shortUrl = url.short;

        const client = await fastify.pg.connect();

        try {
            const deleted = await client.query(
                'Delete from urls where short_url=$1',
                [shortUrl]
            );
            if (deleted.rowCount) {
                return 'URL Removed';
            } else {
                return 'Url not found';
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }

        return shortUrl;
    });

    fastify.put('/:short', async function (request, reply) {
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
                return 'Url not found';
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }

        return shortUrl;
    });
};

export default myurls;
