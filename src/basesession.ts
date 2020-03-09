import * as conf from './config';

/** used to identify different conversation models */
class SelfIdentity {
    public readonly id: string;
    public readonly workingDir: string;
    constructor(id: string) {
        this.id = id;
        this.workingDir = `${conf.MODELPATH}/${id}`;
    }
}

export class BaseSession {
    protected me: SelfIdentity;
    constructor(myname: string) {
        this.me = new SelfIdentity(myname);
    }
    get myname() { return this.me.id; }
}
