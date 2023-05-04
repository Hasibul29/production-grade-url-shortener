import fastifyPassport from '@fastify/passport';
import { FastifyPluginAsync } from 'fastify';

interface LoginRequest {
    email: string;
    password: string;
}

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return 'login Page';
    });
    fastify.post(
        '/',
        {
            preValidation: fastifyPassport.authenticate('local', {
                successRedirect: '/myurls',
                failureRedirect: '/login',
                authInfo: false,
            }),
        },
        async function (request, reply) {
            return request.body as LoginRequest;
            //     const { email, password } = request.body as LoginRequest;

            //     if (!EmailValidator.validate(email)) {
            //         return 'Invalid email address';
            //     }

            //     const client = await fastify.pg.connect();

            //     try {
            //         const userData = await client.query(
            //             'Select password_hash From Users Where email = $1',
            //             [email]
            //         );
            //         if (!userData.rows[0]) {
            //             return "User Doesn't Exist";
            //         } else {
            //             const hashedPassword = userData.rows[0].password_hash;
            //             const isPasswordCorrect = await bcrypt.compare(
            //                 password,
            //                 hashedPassword
            //             );
            //             if (isPasswordCorrect) {
            //                 return 'login Success';
            //             } else {
            //                 return 'Wrong Password';
            //             }
            //         }
            //     } catch (err) {
            //         return err;
            //     } finally {
            //         client.release();
            //     }
        }
    );
};

export default login;
