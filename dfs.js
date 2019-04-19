module.exports = class Dfs {
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