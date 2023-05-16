import { FastifyPluginAsync } from 'fastify';
import { removeUserDto, removeUserDtoSchema } from '../../userschema';
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
                'select user_id,email from users where user_id NOT IN (select user_id from accountsecurity where role=$1)',
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
    fastify.delete(
        '/:id',
        {
            schema: {
                params: removeUserDtoSchema,
            },
        },
        async function (request, reply) {
            const userId = (request.params as removeUserDto).id;
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
                    return reply.code(401).send({
                        success: false,
                        message: 'Unauthorized Access',
                    });
                }
            } catch (err) {
                return err;
            } finally {
                client.release();
            }
            client = await fastify.pg.connect();
            try {
                await client.query(
                    'delete from accountsecurity where user_id=$1',
                    [userId]
                );
                await client.query('delete from urls where user_id=$1', [
                    userId,
                ]);
                const removed = await client.query(
                    'delete from users where user_id=$1',
                    [userId]
                );
                if (removed.rowCount) {
                    return reply
                        .code(200)
                        .send({ success: true, message: 'User Removed' });
                }
                return reply
                    .code(400)
                    .send({ success: false, message: 'User not found' });
            } catch (err) {
                return err;
            } finally {
                client.release();
            }
        }
    );
};

export default admin;
