// const Graph = require('./graph');
// const Dfs = require('./dfs');
const fs = require('fs');
const path = require('path');

class Graph {
    constructor() {
        const me = this;
        me.list = {};
        me.E = 0;
    }
    allPoints() {
        return Object.keys(this.list);
    }
    /**
     * 获取顶点v连接的顶点集合
     */
    pointsFrom(from) {
        return this.list[from] || [];
    }
    /**
     * 添加一条边
     * @param {string} from 
     * @param {string} to 
     */
    addEdge(from, to) {
        const me = this;
        if (!me.list[from]) {
            me.list[from] = [];
        }
        if (!me.list[to]) {
            me.list[to] = [];
        }
        me.list[from].push(to);
        me.list[to].push(from);
        me.E++;
    }
}


class Dfs {
    constructor(graph) {
        const me = this;
        me.graph = graph;
        me.marked = {};
        me.result = {};
        me.count = 0;
    }
    search() {
        const me = this;
        const points = me.graph.allPoints();
        for (const point of points) {
            if (!me.marked[point]) {
                me.dfs(me.graph, point);
                me.count++;
            }
        }
        console.log(this.result)
    }
    dfs(graph, point) {
        const me = this;
        me.marked[point] = true;
        me.result[point] = me.count;
        const list = graph.pointsFrom(point);
        for (const point of list) {
            if (!me.marked[point]) {
                me.dfs(graph, point);
            }
        }
    }
    connect(from, to) {
        return this.result[from] === this.result[to];
    }
    id(point) {
        return this.result[point];
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
		console.log(tempDir);

		const me = this;
		me.graph = new Graph(0);
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
		const graph = me.graph;
		const filePath = path.resolve(__dirname, inputPath);
		const content = fs.readFileSync(filePath, 'utf-8');
		const data = content.split(/\n/).map((row) => {
			return row.split(',');
		});
		data.forEach((item) => {
			graph.addEdge(item[0], item[1]);
		})
		const dfs = new Dfs(graph);
		dfs.search();
		const result = [];
		const allPoints = graph.allPoints();
		for (const point of allPoints) {
			const pid = dfs.id(point);
			if (!result[pid]) {
				result[pid] = [];
			}
			result[pid].push(point);
		}
		result.forEach((item) => {
			addSet(item);
		})
	}
}

module.exports = Solution;