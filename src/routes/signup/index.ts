import * as bcrypt from 'bcrypt';
import { FastifyPluginAsync } from 'fastify';

interface UserInfo {
    email: string;
    password: string;
    confirmPassword: string;
}

const signup: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'signup';
    });
    fastify.post('/', async function (request, reply) {
        const { email, password, confirmPassword } = request.body as UserInfo;

        if (password != confirmPassword) {
            return "Password Didn't Match";
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const client = await fastify.pg.connect();

        await client.query(
            'INSERT INTO Users(email,password_hash,password_salt) VALUES ($1, $2, $3)',
            [email, hashedPassword, salt]
        );

        return 'Registration Complete';
    });
};

export default signup;
