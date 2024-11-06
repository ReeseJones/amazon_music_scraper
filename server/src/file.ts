import {readFileSync} from 'fs';

//** For reading entire small json configs */
export function importJson<T>(filePath: string): T {
    const rawContent = readFileSync(filePath, { encoding: 'utf8', flag: 'r' });

    return JSON.parse(rawContent);
}