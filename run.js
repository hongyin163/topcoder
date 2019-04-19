const Solution = require('./Solution');

const s = new Solution();
s.process(`${__dirname}/input.10.txt`)


// const fs = require('fs');
// const readline = require('readline');

// function readLine(file, callback) {
//     console.log(file)
//     const rl = readline.createInterface({
//         input: fs.createReadStream(file, 'utf8'),
//     });
//     rl.on("close", () => {
//         console.log('close')
//     })
//     rl.on('line', (line) => {
//         console.log(line)
//         callback && callback(line);
//     });
//     rl.on("close",()=>{
//         console.log('close')
//     })
//     rl.on("pause",()=>{
//         console.log('pause')
//     })
//     rl.on("SIGTSTP",()=>{
//         console.log('SIGTSTP')
//     })
// }

// readLine(`${__dirname}/input.10.txt`, function (data) {
//     // console.log('==');
//     console.log(data);
// })