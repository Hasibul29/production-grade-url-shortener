import { FastifyPluginAsync } from 'fastify';
import { urlStorage } from '../root';
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
            console.log('There was an error ', err);
        } finally {
            client.release();
        }
        return Object.fromEntries(urlStorage);
    });
};

export default myurls;
