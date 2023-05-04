import * as path from 'node:path';

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const sourceFilepath = path.resolve(__dirname, '..', 'secret-key');
const destinationDirectory = path.resolve(__dirname, '..', 'dist');
const destinationFilepath = path.resolve(__dirname, '..', 'dist', 'secret-key');

if (!existsSync(sourceFilepath)) {
    console.error(`[Error] ${sourceFilepath} file doesn't exist`);
    console.info(
        '\n[Hint] Run this command:\n\nnpx @fastify/secure-session | Out-File -Encoding default -NoNewline -FilePath secret-key'
    );
    console.info(
        '\n[Notice] Remember to add secret-key in your .gitignore file!'
    );
    process.exit(1);
}

if (!existsSync(destinationDirectory)) {
    mkdirSync(destinationDirectory);
}

copyFileSync(sourceFilepath, destinationFilepath);
