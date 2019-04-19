
module.exports = class Graph {
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