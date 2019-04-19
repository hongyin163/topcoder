const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MAX = 10000000;

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
        //         
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
    readLine(file, onLine, onClose) {
        const rl = readline.createInterface({
            input: fs.createReadStream(file, {
                encoding: 'utf8',
                flag: 'rs+'
            }),
        });
        rl.on('line', (line) => {
            onLine && onLine(line);
        });
        rl.on('close', () => {
            onClose && onClose();
        })
    }
    readByLine(file, callback) {
        const stream = fs.createReadStream(file, 'utf-8');
        stream.on("data", (data) => {
            console.log(data)
        })
    }
}

const fileSystem = new FileSystem();

class UF {
    constructor(id, sz) {
        const me = this;
        me.count = 0;
        let idArray = new ArrayBuffer(32);
        me.id = new Uint32Array(MAX);
        let szArray = new ArrayBuffer(32);
        me.sz = new Uint32Array(MAX);
    }
    add(p) {
        const me = this;
        if (p == 100) {

        }
        if (me.id[p] === 0) {
            me.id[p] = p;
            // me.count = me.id.length;
        }
        if (me.sz[p] === 0) {
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
        if (sz[i] < sz[j]) {
            id[i] = j;
            sz[i] += sz[i]
        } else {
            id[j] = i;
            sz[i] += sz[j]
        }
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
        me.n2i = new Map();
        me.i2n = [];
        me.count = 1;
        me.uf = new UF();
        // me.outputFolder = `${tempDir}/output`;
        // fileSystem.mkdir(me.outputFolder);
        me.output =  new Map();
        me.outputIds = {};
        me.outputCount = 0;
    }
    Uint162Str(arraybuffer) {
        let str = String.fromCharCode.apply(null, new Uint16Array(arraybuffer));
        debugger;
        return str;
    }
    Str2Uint16(str) {
        //假设字符串”abc“ length=3,使用16位，则每一个字母占据2字节，总字节为length乘以2
        var arraybuffer = new ArrayBuffer(str.length * 2);
        var view = new Uint16Array(arraybuffer);
        for (var i = 0, l = str.length; i < l; i++) {
            view[i] = str.charCodeAt(i);
        }
        // debugger;
        return view;
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

        const output = me.output;
        for (let i = 1; i < count; i++) {
            let id = me.uf.find(i);
            if (!output[id]) {
                output[id] = [];
            }
            output[id].push(i);
        }

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
        return new Promise((resolve) => {

            fileSystem.readLine(filePath, (line) => {
                if (!line) {
                    return;
                }
                const [item1, item2] = line.split(',');
                const p = me.add(item1);
                const q = me.add(item2);
                me.uf.add(p);
                me.uf.add(q);
                me.uf.union(p, q);
            }, () => {
                me.search(addSet);
                resolve();
            })
        })
    }
}

module.exports = Solution;