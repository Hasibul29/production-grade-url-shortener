import * as bcrypt from 'bcrypt';
import * as EmailValidator from 'email-validator';
import { FastifyPluginAsync } from 'fastify';

interface LoginRequest {
    email: string;
    password: string;
}

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'login Page';
    });
    fastify.post('/', async function (request, reply) {
        const { email, password } = request.body as LoginRequest;

        if (!EmailValidator.validate(email)) {
            return 'Invalid email address';
        }

        const client = await fastify.pg.connect();

        try {
            const userData = await client.query(
                'Select password_hash From Users Where email = $1',
                [email]
            );
            if (!userData.rows[0]) {
                return "User Doesn't Exist";
            } else {
                const hashedPassword = userData.rows[0].password_hash;
                const isPasswordCorrect = await bcrypt.compare(
                    password,
                    hashedPassword
                );
                if (isPasswordCorrect) {
                    return 'login Success';
                } else {
                    return 'Wrong Password';
                }
            }
        } catch (err) {
            console.log('There Is an error', err);
        } finally {
            client.release();
        }
        return request.body;
    });
};

export default login;
