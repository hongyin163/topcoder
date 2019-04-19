const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MAX = 100000;

class FileSystem {
    mkdir(folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {
                recursive: true,
            });
        }
    }
    readDir(folder) {
        return new Promise((resolve, reject) => {
            fs.readdir(folder, function (err, files) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(files);
            })
        })
    }
    readFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf-8', function (err, content) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(content);
            })
        })
    }
    writeFile(file, content) {
        return new Promise((resolve, reject) => {

            fs.writeFile(file, content, {
                flag: 'w+'
            }, function (err, content) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(content);
            });
        })
    }
    appendFile(file, content) {
        return new Promise((resolve, reject) => {
            fs.appendFile(file, content, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
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
    exist(file) {
        return new Promise((resolve, reject) => {
            fs.exists(file, (exist) => {
                resolve(exist);
            })
        })
    }
    existsSync(file) {
        return fs.existsSync(file);
    }
    removeFile(file) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(file)) {
                fs.unlink(file, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                })
            }
        })
    }
}

const fileSystem = new FileSystem();


class UF {
    constructor(id, sz) {
        const me = this;
        me.count = 0;
        // let idArray = new ArrayBuffer(32);
        me.id = new Uint32Array(MAX);
        // let szArray = new ArrayBuffer(32);
        me.sz = new Uint32Array(MAX);
    }
    add(p) {
        const me = this;
        if (me.id[p] === 0) {
            me.id[p] = p;
            // me.count = me.id.length;
        }
        if (me.sz[p] === 0) {
            me.sz[p] = 1
        }
    }
    addList(list = []) {
        if (list.length == 0) {
            return;
        }
        const me = this;
        let lid = -1;
        let id = me.id;
        let first = list[0];
        for (let i = 0; i < list.length; i++) {
            const num = list[i];
            if (id[num] > 0) {
                lid = id[num];
                break;
            }
        }
        if (lid > 0) {
            list.forEach((item) => {
                if (me.id[item] > 0 && me.id[item] != lid) {
                    me.union(item, lid);
                } else {
                    me.id[item] = lid;
                }
            })
        } else {
            list.forEach((item) => {
                me.id[item] = first;
            })
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

//创建任务
class Master {
    constructor(tempDir) {
        const me = this;
        me.max = 10;
        me.masterLock = path.resolve(tempDir, 'lock');
        me.locksFolder = path.resolve(tempDir, 'locks');
        me.workersFolder = path.resolve(tempDir, 'workers');
        me.tasksFolder = path.resolve(tempDir, 'tasks');
        me.resultFolder = path.resolve(tempDir, 'result');
        me.statusFolder = path.resolve(tempDir, 'status');
        me.workers = [];

        me.n2i = {};
        me.i2n = [];
        me.count = 1;
        me.lines = [];
        // me.id = []; new Uint32Array(MAX);
        me.idCount = 0;
    }
    async add(node1, node2) {
        const me = this;
        me.log(node1 + ',' + node2);
        let id1 = me.n2i[node1], id2 = me.n2i[node2];
        if (typeof id1 == 'undefined') {
            me.n2i[node1] = me.count;
            me.i2n[me.count] = node1;
            id1 = me.count;
            me.count++;
        }
        if (typeof id2 == 'undefined') {
            me.n2i[node2] = me.count;
            me.i2n[me.count] = node2;
            id2 = me.count;
            me.count++;
        }
        me.lines.push([id1, id2]);
    }
    async  dispatch() {
        const me = this;
        let result = await me.dispatchTask(me.lines);
        if (result !== false) {
            me.lines = [];
        }
    }
    async init() {
        const me = this;
        await fileSystem.writeFile(me.masterLock, '');
        await fileSystem.mkdir(me.workersFolder);
        await fileSystem.mkdir(me.statusFolder);
        await fileSystem.mkdir(me.locksFolder);
        await fileSystem.mkdir(me.tasksFolder);
        await fileSystem.mkdir(me.resultFolder);
    }
    async isLock(worker) {
        const me = this;
        const file = `${me.locksFolder}/${worker}_lock`;
        const exist = await fileSystem.exist(file);
        return exist;
    }
    /**
  *  锁定
  * @param {string} worker id
  * @param {number} isLock 1 是锁定，0是未锁定
  */
    async setLock(worker, isLock) {
        const me = this;
        const file = `${me.locksFolder}/${worker}_lock`;
        const exist = await fileSystem.exist(file);
        try{

            if (isLock) {
                if (!exist) {
                    await fileSystem.writeFile(file, isLock)
                }
            } else {
                if (exist) {
                    await fileSystem.removeFile(file)
                }
            }
        }catch(err){

        }
    }
    async lock(worker) {
        const me = this;
        await me.setLock(worker, true);
    }
    async unlock(worker) {
        const me = this;
        await me.setLock(worker, false);
    }
    log(msg) {
        console.log(`Master:${msg}`);
    }
    start() {
        const me = this;
        me.checkWorkers();
        setInterval(async () => {
            await me.checkWorkers();
            await me.dispatch();
        }, 2000);

        setInterval(async () => {
            const allStop = await me.checkWorkerStop();
            if (allStop) {
                await me.mergeResult();
                await me.complete();
            }
        }, 1000);
    }
    complete() {
        const me = this;
        me.log('退出');
        let file = `${me.resultFolder}/output`
        me.onComplete && me.onComplete(file);
    }
    async checkWorkerStop() {
        const me = this;
        me.log('检查任务是否结束');
        const workers = me.workers;
        if (workers.length == 0) {
            return false;
        }
        let flag = 'stop';
        let count = 0;
        for (const worker of workers) {
            let file = `${me.statusFolder}/${worker}_${flag}`;
            let exist = await fileSystem.exist(file);
            if (exist) {
                count++;
            }
        }
        me.log(`检查任务是否结束:${me.workers.length == count}`)
        return me.workers.length == count;
    }
    async checkWorkers() {
        const me = this;
        me.log('检查workers');
        const files = await fileSystem.readDir(me.workersFolder);
        me.log('检查workers:' + files.join(','));
        me.workers = files;
    }
    async dispatchTask(lines = []) {
        const me = this;
        me.log('开始派发任务：' + lines.length);
        const count = me.workers.length;
        if (count == 0) {
            return Promise.resolve(false);
        }
        me.log('Worker总数：' + count);
        const n = lines.length;
        const avg = Math.ceil(n / count);
        let index = 0;

        // console.log(me.lines);
        let ps = me.workers.map(async (worker) => {
            // console.log(ls)
            return new Promise(async () => {
                let isLock = await me.isLock(worker);
                me.log(`是否锁定:${isLock}`)
                if (isLock) {
                    return;
                }
                me.log('锁定')
                await me.lock(worker);
                let length = lines.length < avg ? lines.length : avg;
                let ls = lines.splice(index, length);
                me.log(`任务:${ls.length}`);
                await me.saveWorkTask(worker, ls);
                me.log('解除锁定')
                await me.unlock(worker);
            })
        });
        return Promise.all(ps);
    }
    async saveWorkTask(worker, lines = []) {
        const me = this;
        if (lines.length == 0) {
            return;
        }
        const content = lines.map((item) => {
            return item.join(',')
        }).join('\n');
        me.log(content);
        me.log('保存任务：' + lines.length);
        await fileSystem.appendFile(`${me.tasksFolder}/${worker}`, content + '\n');
    }
    getResult(worker) {
        const me = this;
        let file = `${me.resultFolder}/${worker}`
        return new Promise((resolve) => {
            const lines = [];
            fileSystem.readLine(file, (line) => {
                if (!line) {
                    return;
                }
                lines.push(line.split(',').map(p => Number(p)));
            }, () => {
                resolve(lines);
            })
        })
    }
    merge(lines = []) {
        const me = this;
        lines.forEach((items) => {
            me.uf.addList(items);
        })
    }
    async mergeResult() {
        const me = this;
        me.log('开始合并结果');
        me.uf = new UF();
        const workers = me.workers;
        for (const worker of workers) {
            let lines = await me.getResult(worker);
            me.merge(lines);
        }
        await me.output();
    }
    async output() {
        const me = this;
        let count = me.count;
        let output = {};
        for (let i = 1; i < count; i++) {
            const j = me.uf.find(i);
            if (j == 0) {
                continue;
            }
            if (!output[j]) {
                output[j] = [];
            }
            output[j].push(i);
        }
        await me.saveOutput(output);
    }
    async saveOutput(output) {
        const me = this;
        me.log('输出结果到output文件');
        const i2n = me.i2n;
        let content = '';
        for (const key in output) {
            let items = output[key];
            content += items.map(p => i2n[p]).join(',') + '\n';
        }
        console.log(content)
        await fileSystem.writeFile(`${me.resultFolder}/output`, content)
    }
}

//执行任务
class Workder {
    constructor(tempDir) {
        const me = this;
        me.max = 5000;
        me.masterLock = path.resolve(tempDir, 'lock');
        me.locksFolder = path.resolve(tempDir, 'locks');
        me.workersFolder = path.resolve(tempDir, 'workers');
        me.tasksFolder = path.resolve(tempDir, 'tasks');
        me.resultFolder = path.resolve(tempDir, 'result');
        me.statusFolder = path.resolve(tempDir, 'status');
        me.workers = [];
        me.lines = [];
        // me.ids = new Uint32Array(MAX);
        me.id = (Math.random() * 10000).toFixed(0);
        me.count = 1;
        me.uf = new UF();
        me.output = {};
    }
    add(num) {
        const me = this;
        if (me.ids[num] == 0) {
            me.ids[num] = 1;
            if (num > me.count) {
                me.count = num;
            }
        }
    }
    async isLock(worker) {
        const me = this;
        const file = `${me.locksFolder}/${worker}_lock`;
        const exist = await fileSystem.exist(file);
        return exist;
    }
    /**
     *  锁定
     * @param {string} worker id
     * @param {number} isLock 1 是锁定，0是未锁定
     */
    async setLock(worker, isLock) {
        const me = this;
        const file = `${me.locksFolder}/${worker}_lock`;
        const exist = await fileSystem.exist(file);
        try{
            if (isLock) {
                if (!exist) {
                    await fileSystem.writeFile(file, isLock)
                }
            } else {
                if (exist) {
                    await fileSystem.removeFile(file)
                }
            }
        }catch(err){

        }
    }
    async lock() {
        const me = this;
        await me.setLock(me.id, true);
    }
    async unlock() {
        const me = this;
        await me.setLock(me.id, false);
    }
    async regist() {
        const me = this;
        me.log('注册');
        let file = `${me.workersFolder}/${me.id}`;
        try {
            await fileSystem.writeFile(file, me.id);
            await me.setRunning(true);
            me.log('注册成功');
        } catch (err) {
            me.log('注册失败' + err.message);

        }
    }
    async unregist() {
        const me = this;
        me.log('退出');
        // let file = `${me.workersFolder}/${me.id}`;
        try {
            // await fileSystem.removeFile(file, me.id);
            await me.setRunning(false);
            me.log('退出成功');
        } catch (err) {
            me.log('退出失败' + err.message);

        }
    }
    async setRunning(running) {
        const me = this;
        me.log('退出');
        let runflag = running == true ? 'runing' : 'stop';
        let file = `${me.statusFolder}/${me.id}_${runflag}`;

        await fileSystem.writeFile(file, '');

        let stopflag = running !== true ? 'runing' : 'stop';
        let stopfile = `${me.statusFolder}/${me.id}_${stopflag}`;
        let exist = await fileSystem.exist(stopfile);
        if (exist) {
            await fileSystem.removeFile(stopfile);
        }
    }
    log(msg) {
        console.log(`Workder[${this.id}]:${msg}`);
    }
    start() {
        const me = this;
        let max = 5;
        let ramain = max;
        setInterval(async () => {
            if (ramain < 0) {
                await me.complete();
                return;
            }
            me.log('任务开始');
            const isLock = await me.isLock(me.id);
            if (isLock) {
                // me.start();
                return;
            }
            await me.lock();
            me.log('获取开始');
            let list = await me.getTask();
            me.log(`获取任务：${list.length}`);
            if (list.length == 0) {
                // me.start();
                await me.unlock();
                ramain--;
                me.log(`未获取任务次数：${ramain}`);
                return;
            }
            ramain = max;
            me.lines = list;
            await me.exeTask();
            await me.unlock();
            me.log('任务结束');
        }, 1000);
    }
    async  complete() {
        const me = this;
        await me.unregist();
        me.onComplete && me.onComplete();
    }
    async getTask() {
        const me = this;
        const file = `${me.tasksFolder}/${me.id}`;
        let exist = await fileSystem.exist(file);
        if (!exist) {
            me.log('暂无任务');
            return [];
        }
        let content = await fileSystem.readFile(file);
        me.log('获取任务后删除任务');
        await fileSystem.removeFile(file);
        if (!content) {
            return [];
        }
        return content.split(/\n+/);
    }
    async exeTask() {
        const me = this;
        console.log('执行任务')
        const lines = me.lines;
        return new Promise(async (resolve) => {
            lines.forEach((line) => {
                if (!line) {
                    return;
                }
                const [p, q] = line.split(',');
                const item1 = Number(p);
                const item2 = Number(q);
                me.add(item1);
                me.add(item2);
                me.uf.add(item1);
                me.uf.add(item2);
                me.uf.union(item1, item2);
            })
            me.lines = [];
            await me.outputResult();
            resolve();
        })
    }
    async outputResult() {
        const me = this;
        const count = me.count;
        const output = {};
        const ids = me.ids;
        for (let i = 1; i <= count; i++) {
            if (ids[i] == 0) {
                continue;
            }
            let id = me.uf.find(i);

            if (!output[id]) {
                output[id] = [];
            }
            output[id].push(i);
        }
        await me.saveResult(output);
    }
    async saveResult(output) {
        const me = this;
        let content = '\n';
        for (const key in output) {
            let items = output[key];
            content += items.join(',') + '\n';
        }
        await fileSystem.appendFile(`${me.resultFolder}/${me.id}`, content);
    }

}




class Solution {
	/**
	 * 初始化
	 * 
	 * @param tempDir 可读写的临时目录
	 */
    async init(tempDir) {
        // TODO: 可以在此处初始化一些数据结构
        const me = this;
        me.tempDir = tempDir;
        let lockFile = path.resolve(tempDir, 'lock');

        let exist = fileSystem.existsSync(lockFile);
        if (!exist) {
            me.master = new Master(tempDir);
        }

        me.n2i = new Map();
        me.i2n = [];
        me.count = 1;
        me.uf = new UF();
        // me.outputFolder = `${tempDir}/output`;
        // fileSystem.mkdir(me.outputFolder);
        me.output = new Map();
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
        //TODO:实现主体逻辑
        const me = this;
        //示例输出: addSet(['aa','bb','cc'])
        const filePath = path.resolve(__dirname, inputPath);
        return new Promise(async (resolveall, reject) => {
            const lines = [];
            fileSystem.readLine(filePath, (line) => {
                const [node1, node2] = line.split(',');
                lines.push([node1, node2]);
            }, async () => {
                if (lines.length > 10000000) {
                    if (me.master) {
                        me.master.id = []; new Uint32Array(MAX);
                        await me.master.init();
                        await me.master.start();
                        me.worker = new Workder(me.tempDir);
                        me.worker.ids = new Uint32Array(MAX);
                        await me.worker.regist();
                        await me.worker.start();
                        me.lines = [];

                        return new Promise((resolve, reject) => {
                            console.log('检查master')
                            if (me.master) {
                                me.master.onComplete = (file) => {
                                    fileSystem.readLine(file, function (line) {
                                        addSet(line.split(','));
                                    }, () => {
                                        resolveall();
                                        resolve();
                                    })
                                }
                                console.log('读取文件');
                                const lines = [];
                                fileSystem.readLine(filePath, (line) => {
                                    const [node1, node2] = line.split(',');
                                    lines.push([node1, node2]);
                                }, () => {
                                    lines.forEach((nodes) => {
                                        me.master.add(nodes[0], nodes[1]);
                                    })
                                    me.master.dispatch();
                                })
                            }
                        })
                    }

                    return new Promise(async (resolve, reject) => {
                        me.worker = new Workder(me.tempDir);
                        me.worker.ids = new Uint32Array(MAX);
                        me.worker.onComplete = () => {
                            resolve();
                        }
                        await me.worker.regist();
                        await me.worker.start();
                    })
                } else {
                    lines.forEach((nodes) => {
                        let item1 = nodes[0];
                        let item2 = nodes[1];
                        const p = me.add(item1);
                        const q = me.add(item2);
                        me.uf.add(p);
                        me.uf.add(q);
                        me.uf.union(p, q);
                    })
                    me.search(addSet);
                    resolveall();
                }
            })

        })



    }
}

module.exports = Solution;