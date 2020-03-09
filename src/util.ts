import { promises as fs, constants as fsc } from 'fs';

/** get current timestamp  eg 20.3.7-23:33 for Year.Month.Day-Hour:Min. current time is returned if `date` is `undefined`   
 * only works for 21st century
*/
export const timestamp = (date?: Date): string => {
    let dd = date ?? new Date;
    return `${dd.getFullYear()-2000}.${dd.getMonth()+1}.${dd.getDate()}-${dd.getHours()}:${dd.getMinutes()}`;
};

export const logerrx = (...args: any[]) =>
    console.log(`[${timestamp()}] ERR `, ...args);

export const logx = (...args: any[]) =>
    console.log(`[${timestamp()}] `, ...args);

/** recursively creates folders if it does not exist, otherwise does nothing. throws in case of errors. */
export const ensureFolder = async (fn: string) => {
    const lst = fn.split(/\/|\\/);
    let path = '.';
    for (let i = 0; i < lst.length; i++) {
        path = `${path}/${lst[i]}`;
        try {
            await fs.access(path, fsc.F_OK);
        } catch (err) {
            if (err.code.includes('ENOENT'))
                try {
                    await fs.mkdir(path); /** avoid concurrency issue if multiple function is called at the same time 
                                              can be improved */
                } catch (errr) {
                    if (errr.code.includes('EEXIST'))
                        void 0;
                    else throw errr;
                }
            else throw err;
        }
    }
};

/** checks if file exists, if it doesn't, create it. if path contains directories, must call `ensureFolder` first.
 *  throws in case of errors. */
export const ensureFile = async (fn: string, initcontent: string) => {
    let handle;
    try {
        handle = await fs.open(fn, 'r');
    } catch (err) {
        if (err.code.includes('ENOENT') || err.message.includes('ENOENT'))
            await fs.writeFile(fn, initcontent);
        else throw err;
    } finally {
        if (handle !== undefined) await handle.close();
    }
};

export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
