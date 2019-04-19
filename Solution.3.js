const fs = require('fs');
const path = require('path');
const readline = require('readline');

function mkdir(folder) {
    fs.mkdirSync(folder, {
        recursive: true,
    });
}

function readFile(file) {
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

function writeFile(file, content) {
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

function appendFile(file, content) {
    // return new Promise((resolve, reject) => {
    //     fs.appendFileSync(file, content);
    //     resolve();
    // })
    let fd = fs.openSync(file, 'as');
    fs.appendFileSync(fd, content);
    fs.closeSync(fd);
}

function readLine(file, callback) {
    console.log(file)
    const rl = readline.createInterface({
        input: fs.createReadStream(file, 'utf8'),
    });
    rl.on("close", () => {
        console.log('close')
    })
    rl.on('line', (line) => {
        console.log(line)
        callback && callback(line);
    });
}

class FileGraph {
    constructor(tempDir) {
        const me = this;
        me.tempDir = tempDir;
        me.nodesPath = `${tempDir}/index`;
        mkdir(`${me.tempDir}/nodes`);
        writeFile(me.nodesPath, '');
        me.nodes = [];
        me.nodeMap = {};
        me.list = {};
    }
    getNodePath(node) {
        const me = this;
        return `${me.tempDir}/nodes/${node}`;
    }
    getNodes() {
        const me = this;
        // const content = readFile(me.nodesPath);
        // return content.split(/\n/);
        return me.nodes;
    }
    insertNode(node) {
        // // 待优化
        const me = this;
        // const nodes = me.getNodes();

        // if (!nodes.includes(node)) {
        //     // console.log(me.nodesPath)
        //     appendFile(me.nodesPath, `${node}\n`);
        // }
        // const nodes = me.nodes;
        // if (!nodes.includes(node)) {
        //     me.nodes.push(node);
        // }

        if (!me.nodeMap[node]) {
            me.nodes.push(node);
            me.nodeMap[node] = true;
        }
    }
    addEdge(from, to) {
        const me = this;
        me.insertNode(from);
        me.insertNode(to);
        // console.log('====')
        // const fromPath = me.getNodePath(from);
        // const toPath = me.getNodePath(to);
        // appendFile(fromPath, `${to}\n`);
        // appendFile(toPath, `${from}\n`);

        if (!me.list[from]) {
            me.list[from] = [];
        }
        if (!me.list[to]) {
            me.list[to] = [];
        }
        me.list[from].push(to);
        me.list[to].push(from);
        me.appendToFile();
    }
    nodesFrom(node) {
        const me = this;
        // const nodePath = me.getNodePath(node);
        // const content = readFile(nodePath);
        // return content.split('\n');
        return me.list[node] || [];
    }
}

class FileDfsSearch {
    constructor(graph, tempDir) {
        // marked文件，存储节点是否访问
        // 
        const me = this;
        me.graph = graph;
        me.tempDir = tempDir;
        me.markedFile = `${me.tempDir}/marked`;
        me.outputFolder = `${me.tempDir}/output`;
        me.countFile = `${me.tempDir}/count`;
        mkdir(me.outputFolder);
        writeFile(me.markedFile, '');
        writeFile(me.countFile, '0');

        me.marked = {};
        me.count = 0;
        me.nodeCount = {};
    }

    addListener(callback) {
        this.onOutput = callback;
    }
    getNodes() {
        return this.graph.getNodes();
    }
    nodesFrom(node) {
        return this.graph.nodesFrom(node);
    }
    isMarked(node) {
        const me = this;
        // const content = readFile(me.markedFile);
        // const nodes = content.split('\n');
        // return nodes.includes(node);
        return me.marked[node];
    }
    setMarked(node) {
        const me = this;
        // appendFile(me.markedFile, `${node}\n`)
        me.marked[node] = true;
    }
    getCount() {
        const me = this;
        // const count = readFile(me.countFile);
        // return Number(count);
        return me.count;
    }
    setCount(count) {
        // return writeFile(this.countFile, count);
        this.count = count;
    }
    addOutput(count, node) {
        const me = this;
        // const file = `${me.outputFolder}/${count}`
        // return appendFile(file, `${node}\n`);
        if (!me.nodeCount[count]) {
            me.nodeCount[count] = [];
        }
        me.nodeCount[count].push(node);
    }
    getOutput(count) {
        const me = this;
        // const file = `${me.outputFolder}/${count}`
        // const content = readFile(file);
        // return content.split('\n');
        return me.nodeCount[count];
    }
    search() {
        const me = this;
        me.setCount(0);
        const nodes = me.getNodes();

        for (const node of nodes) {
            if (!node) {
                debugger;
            }
            let count = me.getCount();
            if (!me.isMarked(node)) {
                me.dfs(node);
                debugger;
                let result = me.getOutput(count);
                me.output(result);
                count++;
                me.setCount(count)
            }
        }
    }
    dfs(node) {
        const me = this;
        me.setMarked(node, true);
        const count = me.getCount();
        me.addOutput(count, node);

        const list = me.nodesFrom(node);
        for (const item of list) {
            if (!item) {
                continue;
            }
            if (!me.isMarked(item)) {
                me.dfs(item);
            }
        }
    }
    output(result) {
        if (result)
            this.onOutput && this.onOutput(result);
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
        me.graph = new FileGraph(tempDir);
        me.dfs = new FileDfsSearch(me.graph, tempDir);
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
        me.dfs.addListener(addSet);

        const filePath = path.resolve(__dirname, inputPath);

        // debugger;
        // readLine(filePath, function (line) {
        // 	if (!line) {
        // 		return;
        // 	}
        // 	console.log(line)
        // 	const items = line.split(',');
        // 	me.graph.addEdge(items[0], items[1]);
        // })
        // me.dfs.search();

        const content = readFile(filePath);
        const data = content.split('\n');
        data.forEach((line) => {
            if (!line) {
                return;
            }
            const items = line.split(',');
            me.graph.addEdge(items[0], items[1]);
        })
        await me.dfs.search();
    }
}

module.exports = Solution;