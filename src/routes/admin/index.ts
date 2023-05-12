import { FastifyPluginAsync } from 'fastify';
const admin: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        let client = await fastify.pg.connect();
        if (!request.user) {
            return reply
                .code(401)
                .send({ success: false, message: 'Unauthorized Access' });
        }
        try {
            const security = await client.query(
                'select role from accountsecurity where user_id=$1',
                [request.user]
            );
            const role = security.rows[0].role;
            if (role !== 'admin') {
                return reply
                    .code(401)
                    .send({ success: false, message: 'Unauthorized Access' });
            }
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
        client = await fastify.pg.connect();
        try {
            const userData = await client.query(
                'select * from users where user_id NOT IN (select user_id from accountsecurity where role=$1)',
                ['admin']
            );
            return userData.rows.map((el, ind) => {
                return {
                    [ind]: { ...el },
                };
            });
        } catch (err) {
            return err;
        } finally {
            client.release();
        }
    });
};

export default admin;
