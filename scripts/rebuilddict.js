/** rebuild file, run at the *project root* foler */
const fs = require('fs');
const { createInterface } = require('readline');
const { MarkovSession, MessageHistory } = require('../out/sessions');
const conf = require('../out/config');

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = q => new Promise(res => rl.question(q, answer => res(answer)));
const yes = confirm => confirm === 'Y' || confirm === 'y' || confirm === 'yes';

const main = async () => {
    console.log(`This script will rebuild the Markov profile based on existing chat histories (the conversations.txt). The corresponding json files will be rewrote.
This tool is also useful if you provide your own conversation.txt`)
    const dirs = fs.readdirSync(conf.MODELPATH).map(e => `${conf.MODELPATH}/${e}`).filter(e => fs.statSync(e).isDirectory());
    const profiles = dirs.map(e => e.slice(conf.MODELPATH.length + 1));
    let confirm = await question('confirm? Y/N ');
    if (!yes(confirm)) process.exit();
    const baks = [];
    for (let dir of dirs) {
        const files = fs.readdirSync(dir).map(f => `${dir}/${f}`).filter(f => /\.json$/.test(f));
        for (let file of files) {
            const bakfile = `${file}.bak`;
            fs.copyFileSync(file, bakfile);
            baks.push(bakfile);
            fs.unlinkSync(file);
        }
    }
    for (let profile of profiles) {
        const mkov = new MarkovSession(profile);
        const hist = new MessageHistory(profile);
        await mkov.updateTable(
            (await hist.getAll()).map(e => e[1] || e[0]) // first field: date, second field: message
            // if date does not exist, use message directly
        );
    }
    confirm = await question('delete backups? Y/N ');
    if (!yes(confirm)) process.exit();
    for (let bak of baks) {
        fs.unlinkSync(bak);
    }
    process.exit();
};

main().catch(e => { console.error(e); process.exit() });
