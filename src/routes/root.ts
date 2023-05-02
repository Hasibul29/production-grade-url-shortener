import { addMonths, format } from 'date-fns';
import { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid/async';
import isUrl = require('is-url');

interface RequestParam {
    short: string;
}

export const urlStorage: Map<string, string> = new Map<string, string>();

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async (request, reply) => {
        return 'Welcome';
    });

    fastify.post('/', async (request, reply) => {
        const givenUrl: string = request.body as string;
        const isValid: boolean = isUrl(givenUrl);
        const key: string = await nanoid(5);

        if (!givenUrl || !isValid) {
            return reply.code(400).send('Invalid url');
        }

        const timeLimit = format(addMonths(Date.now(), 2), 'yyyy-MM-dd');
        const client = await fastify.pg.connect();

        const userLoggedIn = true; //for now
        const userId = 1; //for now
        try {
            if (userLoggedIn) {
                client.query(
                    'Insert into Urls(user_id,short_url,original_url,time_limit) Values($1,$2,$3,$4)',
                    [userId, key, givenUrl, timeLimit] // not sure how to do
                );
            } else {
                client.query(
                    'Insert into Urls(short_url,original_url,time_limit) Values($1,$2,$3)',
                    [key, givenUrl, timeLimit]
                );
            }
        } catch (err) {
            console.log('There is an error ', err);
        } finally {
            client.release();
        }
        const generatedUrl = `${request.protocol}://${request.hostname}${request.url}${key}`;
        urlStorage.set(key, givenUrl);
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
            console.log('There was an error ', err);
        } finally {
            client.release();
        }
    });
};

export default root;
