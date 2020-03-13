import * as nodejieba from 'nodejieba';
import { getRandomInt } from './util';

const scanAllWords = (sentence: string): string[] => {
    return nodejieba.tag(sentence).map((e: any) => e.word)
        .filter((w: any) => w !== ' ');
};

const englishw = /^[a-zA-Z0-9]+$/;
const englishpunc = /^[:;,.]$/;

/** joins strings of *CN & EN* words with appropriate whitespace eg.  
 *   
 * * [ "haha", "呵呵", "啊啊", "喵嗷嗷", "hello", "嗷", "hello", "world",
 * "the", "night", "了", "yoyo", "such" ]  
 * =>  
 * "haha 呵呵啊啊喵嗷嗷 hello 嗷 hello world the night 了 yoyo such"  
 *   
 * * [ "bye", ",", "my", "curel", "world", ",", "goobye", ",", "really", "-", "awesome", "." ]  
 * =>  
 * "bye, my curel world, goobye, really - awesome."
 * 
 * drawback: "quoted english word" is not handled
 */
const concatenate = (lst: string[]): string => {
    const cpy = lst.slice(),
        englisht = cpy.map(e => englishw.test(e)); // t => test
    englisht[englisht.length] = true;
    if (englisht[0] && !englisht[1] && !englishpunc.test(cpy[1]))
        cpy[0] += ' ';
    for (let i = 1; i < cpy.length; i++) {
        let currt = englisht[i],
            nextt = englisht[i+1];
        if (currt)
            cpy[i] = ' ' + cpy[i];
        if (currt && !nextt && !englishpunc.test(cpy[i+1]))
            cpy[i] += ' ';
    }
    return cpy.join('');
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
        return concatenate(sb);
    }
}
