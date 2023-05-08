import * as bcrypt from 'bcrypt';
import { FastifyPluginAsync } from 'fastify';
import { CreateUserDto, createUserDtoSchema } from '../../userschema';

const signup: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'signup here';
    });
    fastify.post(
        '/',
        {
            schema: {
                body: createUserDtoSchema,
            },
        },
        async function (request, reply) {
            const { email, password, confirmPassword } =
                request.body as CreateUserDto;

            if (password !== confirmPassword) {
                return reply
                    .code(400)
                    .send({ success: false, message: "Password Didn't Match" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const client = await fastify.pg.connect();

            try {
                await client.query(
                    'insert into users(email,password_hash,password_salt) values ($1, $2, $3)',
                    [email, hashedPassword, salt]
                );
            } catch (err) {
                return err;
            } finally {
                client.release();
            }
            return reply
                .code(200)
                .send({ success: true, message: 'Registration Complete' });
        }
    );
};

export default signup;