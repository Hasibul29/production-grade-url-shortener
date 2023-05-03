import { addMonths, format } from 'date-fns';
import { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid/async';
import isUrl = require('is-url');

interface RequestParam {
    short: string;
}

interface UrlRequest {
    url: string;
    alias?: string;
}

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async (request, reply) => {
        return 'Welcome';
    });

    fastify.post('/', async (request, reply) => {
        const givenUrl = request.body as UrlRequest;
        const isValid: boolean = isUrl(givenUrl.url);
        const userLoggedIn = true; //for now
        const userId = 1; //for now
        const key: string =
            givenUrl.alias && userLoggedIn ? givenUrl.alias : await nanoid(5);

        if (!givenUrl.url || !isValid) {
            return reply.code(400).send('Invalid url');
        }

        const timeLimit = format(addMonths(Date.now(), 2), 'yyyy-MM-dd');
        const client = await fastify.pg.connect();

        try {
            if (userLoggedIn) {
                const user = await client.query(
                    'Insert into Urls(user_id,short_url,original_url,time_limit) Values($1,$2,$3,$4)',
                    [userId, key, givenUrl.url, timeLimit] // not sure how to do
                );
                return user;
            } else {
                await client.query(
                    'Insert into Urls(short_url,original_url,time_limit) Values($1,$2,$3)',
                    [key, givenUrl.url, timeLimit]
                );
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
        const generatedUrl = `${request.protocol}://${request.hostname}${request.url}${key}`;
        return generatedUrl;
    });

    fastify.get('/:short', async (request, reply) => {
        const id = request.params as RequestParam;
        if (!id) {
            reply.code(400).send('Invalid url');
        }

        const client = await fastify.pg.connect();
        console.log(id);
        try {
            const urlFromDb = await client.query(
                'select original_url from urls where short_url=$1',
                [id.short]
            );
            if (urlFromDb.rows[0]) {
                const originalUrl = urlFromDb.rows[0].original_url;
                return reply.redirect(originalUrl as string);
            } else {
                return 'Url was not found';
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });
};

export default root;
