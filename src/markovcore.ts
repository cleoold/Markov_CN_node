import * as nodejieba from 'nodejieba';
import { getRandomInt } from './util';

const scanAllWords = (sentence: string): string[] => {
    return nodejieba.tag(sentence).map((e: any) => e.word)
        .filter((w: any) => w !== ' ');
};

/** implementation of markov text generator */
export class MarkovImpl {
    static get NOWORD() { return '\n'; } /** indicates a sentence ends */

    statetab: { /** dictionary of word chain */
        [k: string]: string[]
    } = {};

    insertNewWord(prefix: string, value: string): void {
        const lst = this.statetab[prefix];
        if (lst === undefined)
            this.statetab[prefix] = [ value ];
        else if (!lst.includes(value))
            lst.push(value);
    }

    updateTable(sentence: string): void {
        let w1 = MarkovImpl.NOWORD;
        const allwords = scanAllWords(sentence);
        if (allwords === []) return;
        for (let nextword of allwords) {
            this.insertNewWord(w1, nextword);
            w1 = nextword;
        }
        this.insertNewWord(w1, MarkovImpl.NOWORD);
    }

    generateText(maxwords: number): string {
        const sb: string[] = [];
        let w1 = MarkovImpl.NOWORD;
        for (let i = 0; i < maxwords; i++) {
            const lst = this.statetab[w1];
            if (lst === undefined || lst.length === 0) break;
            /** choose random item from list */
            const nextword = lst[getRandomInt(0, lst.length-1)];
            if (nextword == MarkovImpl.NOWORD) break;
            sb.push(nextword);
            w1 = nextword;
        }
        return sb.join('');
    }
}
