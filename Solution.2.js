const fs = require('fs');
const path = require('path');

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
		me.list = {};
		me.output = {};
		me.marked = {};
		me.count = 0;
		// fs.writeFileSync(path.resolve(__dirname,tempDir),'./list')
	}
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
	}
	pointsFrom(from) {
		return this.list[from] || [];
	}
	clear(count) {
		const me=this;
		for (const p of me.output[count]) {
			delete me.list[p];
			delete me.list[me.pointsFrom(p)];
			delete me.marked[p];
		}
		delete me.output[count];
	}
	search(addSet) {
		const me = this;
		for (const point in me.list) {
			if (!me.marked[point]) {
				me.dfs(point);
				addSet(me.output[me.count]);
				me.clear(me.count);
				me.count++;
			}
		}
	}
	dfs(point) {
		const me = this;
		me.marked[point] = true;
		if (!me.output[me.count]) {
			me.output[me.count] = [];
		}
		me.output[me.count].push(point);
		const list = me.pointsFrom(point);
		for (const point of list) {
			if (!me.marked[point]) {
				me.dfs(point);
			}
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
		// console.log(inputPath)
		//示例输出: addSet(['aa','bb','cc'])
		const filePath = path.resolve(__dirname, inputPath);
		const content = fs.readFileSync(filePath, 'utf-8');
		// console.log(content);
		const data = [];
		content.split(/\n/).map((row) => {
			if (row) {
				data.push(row.split(','));
			}
		});
		// console.log(data)
		data.forEach((item) => {
			me.addEdge(item[0], item[1]);
		})
		me.search(addSet);
	}
}

module.exports = Solution;