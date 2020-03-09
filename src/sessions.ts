import { promises as fs } from 'fs';
import { BaseSession } from './basesession';
import { timestamp, logerrx, ensureFolder, ensureFile } from './util';
import { MarkovImpl } from'./markovcore';

/** session to manage all message history for a model (it is a conversation logger) */
export class MessageHistory extends BaseSession {
    writefile: string;

    constructor(myname: string) {
        super(myname);
        this.writefile = `${this.me.workingDir}/conversations.txt`;
    }

    private constructEntry(msg: string, date: Date): string {
        const datestr = timestamp(date);
        return `${datestr} ${msg}\n`;
    }

    /** stores a new message into the history */
    public async addEntry(msg: string, date?: Date): Promise<void> {
        msg = msg.replace('\n', '');
        try {
            await ensureFolder(this.me.workingDir);
            await fs.appendFile(this.writefile, this.constructEntry(msg, date ?? new Date));
        } catch (err) {
            logerrx(`error in MessageHistory:addEntry: ${err.message}`);
        }
    }

    /** get all conversation history, throws if error. */
    public async getAll(): Promise<[ string, string ][]> {
        return (await fs.readFile(this.writefile)).toString()
            .split('\n')
            .filter(Boolean)
            .map(e => (e.split(' ', 2) as [string, string]));
    }
}

/** session to create/modify Markov chains for a model */
export class MarkovSession extends BaseSession {
    private headdictfile: string;
    private nonheaddictfile: string;
    private firsttime: boolean = true;

    private mk: MarkovImpl = new MarkovImpl;

    constructor(myname: string) {
        super(myname);
        this.headdictfile = `${this.me.workingDir}/head.json`;
        this.nonheaddictfile = `${this.me.workingDir}/chunk.json`;
    }

    /** ensures necessary files exist. if they don't, create defaults. */
    private async ensureTargets(): Promise<void> {
        await ensureFolder(this.me.workingDir);
        await Promise.all([
            ensureFile(this.headdictfile, '{}'),
            ensureFile(this.nonheaddictfile, '{}')
        ]);
    }

    /** load model from the json files, if any of them don't exist defaults are used */
    private async loadAll(): Promise<void> {
        await this.ensureTargets();
        this.mk.statetab = {
            ...JSON.parse((await fs.readFile(this.headdictfile)).toString()),
            ...JSON.parse((await fs.readFile(this.nonheaddictfile)).toString())
        };
        this.firsttime = false;
    }

    private async commit(): Promise<void> {
        /** assuming necessary folders exist */
        const { [MarkovImpl.NOWORD]: head, ...nonhead } = { ...this.mk.statetab };
        try {
            await Promise.all([
                fs.writeFile(this.headdictfile, JSON.stringify({ [MarkovImpl.NOWORD]: head }/*, null, 2*/)),
                fs.writeFile(this.nonheaddictfile, JSON.stringify(nonhead/*, null, 2*/))
            ]);
        } catch (err) {
            logerrx(`error in MarkovSession:commit: ${err.message}`);
        }
    }

    /** opens model files, inserts a sentence/array sentences to the model and saves corresponding files.
     * if `usecached` is enabled and this call is not the first time, the current session's in-memory
     * model will be used.  
     * it is not safe to call multiple `updateTable`s at the same time.
    */
    public async updateTable(sentence: string | string[], usecached = false): Promise<void> {
        if (this.firsttime || !usecached)
            await this.loadAll();
        const ss = typeof sentence === 'string' ? [ sentence ] : sentence;
        for (let s of ss)
            this.mk.updateTable(s);
        /** note that the statetab and file's content will be in sync after committing */
        await this.commit();
    }

    /**  opens model files, generates a random sentence based on this model
     * if `usecached` is enabled and this call is not the first time, the current session's in-memory
     * model will be used.
    */
    public async generateText(maxwords: number, usecached = false): Promise<string> {
        if (this.firsttime || !usecached)
            await this.loadAll();
        return this.mk.generateText(maxwords);
    }

    public done(): void {
        this.mk.statetab = {};
    }
}
