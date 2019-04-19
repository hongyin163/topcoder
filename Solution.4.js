const fs = require('fs');
const path = require('path');
const readline = require('readline');
class FileSystem {
    mkdir(folder) {
        fs.mkdirSync(folder, {
            recursive: true,
        });
    }
    readFile(file) {
        // return new Promise((resolve, reject) => {
        //     // fs.readFile(file, 'utf-8', function (err, content) {
        //     // 	if (err) {
        //     // 		reject(err);
        //     // 		return;
        //     // 	}
        //     // 	resolve(content);
        //     // })
        //     try {
        //         const content = fs.readFileSync(file, 'utf8');
        //         resolve(content);
        //     } catch (err) {
        //         debugger;
        //         reject(err);
        //     }
        // })
        let fd = fs.openSync(file, 'r');
        const content = fs.readFileSync(fd, 'utf8');
        fs.closeSync(fd);
        return content;
    }
    writeFile(file, content) {
        // return new Promise((resolve, reject) => {
        //     // fs.readFile(file, 'utf-8', function (err, content) {
        //     // 	if (err) {
        //     // 		reject(err);
        //     // 		return;
        //     // 	}
        //     // 	resolve(content);
        //     // })
        //     fs.writeFileSync(file, content);
        //     resolve();
        // })
        let fd = fs.openSync(file, 'w+');
        fs.writeFileSync(fd, content);
        fs.closeSync(fd)
    }
    appendFile(file, content) {
        // return new Promise((resolve, reject) => {
        //     fs.appendFileSync(file, content);
        //     resolve();
        // })
        let fd = fs.openSync(file, 'as');
        fs.appendFileSync(fd, content);
        fs.closeSync(fd);
    }
    readLine(file, callback) {
        console.log(file)
        let fd = fs.openSync(file, 'r');
        const rl = readline.createInterface({
            input: fs.createReadStream(file, {
                encoding: 'utf8',
                fd
            }),
        });
        rl.on('line', (line) => {
            console.log(line)
            callback && callback(line);
        });
        rl.on("close", () => {
            console.log('close')
            fs.closeSync(fd);
        })
        rl.on("pause", () => {
            console.log('pause')
        })
        rl.on("SIGTSTP", () => {
            console.log('SIGTSTP')
        })
    }
    readByLine(file, callback) {
        const stream = fs.createReadStream(file,'utf-8');
        stream.on("data",(data)=>{
            console.log(data)
        })
    }
}

const fileSystem = new FileSystem();

class UF {
    constructor() {
        const me = this;
        me.count = 0;
        me.id = [];
        me.sz = [];
    }
    add(p) {
        const me = this;
        if (typeof me.id[p] === 'undefined') {
            me.id[p] = p;
            me.count = me.id.length;
        }
        if (typeof me.sz[p] === 'undefined') {
            me.sz[p] = 1
        }
    }
    union(p, q) {
        const me = this;
        const id = me.id;
        const sz = me.sz;
        const i = me.find(p);
        const j = me.find(q);

        if (i === j) {
            return;
        }
        // id[i] = j;

        if (sz[i] < sz[j]) {
            id[i] = j;
            sz[i] += sz[i]
        } else {
            id[j] = i;
            sz[i] += sz[j]
        }
        // console.log(me.id);
        // me.count--;
    }
    find(p) {
        const me = this;
        const id = me.id;
        while (p != id[p]) {
            id[p] = id[id[p]];
            p = id[p];
        }
        return p;
    }
    connected(p, q) {
        return this.find(p) === this.find(q);
    }
    count() {
        return this.count;
    }
}

class Solution {
	/**
	 * 初始化
	 * 
	 * @param tempDir 可读写的临时目录
	 */
    init(tempDir) {
        // TODO: 可以在此处初始化一些数据结构
        // console.log(tempDir);

        const me = this;
        me.n2i = {};
        me.i2n = [];
        me.count = 0;
        me.uf = new UF();
        // me.outputFolder = `${tempDir}/output`;
        // fileSystem.mkdir(me.outputFolder);
        me.output = {};
        me.outputIds = {};
        me.outputCount = 0;
    }
    addOutput(key, node) {
        const me = this;
        if (me.outputCount > 5) {
            for (const id in me.output) {
                if (me.output[id].length == 0) continue;
                fileSystem.appendFile(`${me.outputFolder}/${id}`, '\n' + me.output[id].join('\n'));
                me.output[id] = [];
            }
            me.outputCount = 0;
        } else {
            if (!me.output[key]) {
                me.output[key] = [];
            }
            me.output[key].push(node)
            me.outputCount++;
        }
    }
    flush() {
        const me = this;
        for (const id in me.output) {
            fileSystem.appendFile(`${me.outputFolder}/${id}`, '\n' + me.output[id].join('\n'));
            me.output[id] = [];
            me.outputIds[id] = true;
        }
        me.outputCount = 0;
    }
    getOutput(id) {
        const me = this;
        const content = fileSystem.readFile(`${me.outputFolder}/${id}`);
        return content.split(/\n+/).filter(p => !!p);
    }
    add(note) {
        const me = this;
        if (typeof me.n2i[note] == 'undefined') {
            me.n2i[note] = me.count;
            me.i2n[me.count] = note;
            me.count++;
        }
        return me.n2i[note];
    }
    getNode(index) {
        const me = this;
        return me.i2n[index];
    }
    search(addSet) {
        const me = this;
        const count = me.count;
        // const outputIds = me.outputIds;
        const output = me.output;
        for (let i = 0; i < count; i++) {
            let id = me.uf.find(i);
            if (!output[id]) {
                output[id] = [];
            }
            output[id].push(i);
            // output[id] = true;
            // outputIds[id] = true;
            // me.addOutput(id, me.getNode(i));
        }

        // me.flush();

        for (const id in me.output) {
            let list = me.output[id].map((p) => me.getNode(p));
            addSet(list);
        }
    }
	/**
	 * 处理输入文件
	 * 
	 * @param {String} inputPath 输入文件路径
	 * @param {Function} addSet 输出结果
	 * @return {Promise} 
	 */
    async process(inputPath, addSet) {
        const me = this;
        //TODO:实现主体逻辑
        //示例输出: addSet(['aa','bb','cc'])

        const filePath = path.resolve(__dirname, inputPath);
        // const content = fileSystem.readFile(filePath);
        // const data = content.split('\n');
        // data.forEach((line) => {
        //     if (!line) {
        //         return;
        //     }
        //     const [item1, item2] = line.split(',');
        //     const p = me.add(item1);
        //     const q = me.add(item2);
        //     me.uf.add(p);
        //     me.uf.add(q);
        //     me.uf.union(p, q);

        // });
        fileSystem.readByLine(filePath, function (line) {
            console.log(line);
        });

        // me.search(addSet);
    }
}

module.exports = Solution;