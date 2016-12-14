var fs = require('fs');
var resultStr = "";

// 给Set加上union操作 并集操作
Set.prototype.union = function (setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}

// 判断一个集合是另一个集合的超集
Set.prototype.isSuperset = function (subset) {
    for (var elem of subset) {
        if (!this.has(elem)) {
            return false;
        }
    }
    return true;
}


// 判断两个集合是否相等
function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

// 求差集
Set.prototype.difference = function (setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
}


// 判断集合的集合是否有一个集合
Set.prototype.hasSet = function (set) {
    for (var subSet of this) {
        if (eqSet(subSet, set)) {
            return true;
        }
    }
    return false;
}

// 状态机
function StateMachine() {
    // 有限状态集
    this.states = new Set();

    // 输入字母表
    this.letters = new Set();

    // 初始状态
    this.startState = null;

    // 终结状态集
    this.endStates = new Set();

    // 转移函数
    this.Edges = [];

    // 转移函数表
    this.transTable = {};

    // 计算出一个状态对应的epsilon闭包 深度搜索算法
    this.dfsClosure = function (x) {
        var visit = [];
        var closure = new Set();
        var that = this;

        // 得到该状态经过epsilon得到的状态集合
        function getFirstFloorClosure(x) {
            if (that.transTable[x]['~']) {
                return that.transTable[x]['~'];
            } else {
                return false;
            }
        }

        function getClosure(x) {
            closure.add(x);
            var firstFloor = getFirstFloorClosure(x);
            if (firstFloor) {
                for (var item of firstFloor) {
                    if (visit[item] === undefined) {
                        getClosure(item);
                    }
                }
                // 标记为已访问过
                visit[item] = 'visited';
            } else {
                return;
            }
        }

        getClosure(x);
        return closure;
    }

    // 对一个状态集求闭包 可用对每个状态求闭包再并集得出
    this.closureOfSet = function (set) {
        var result = new Set();
        for (var item of set) {
            result = result.union(this.dfsClosure(item));
        }
        return result;
    }

    // 求一个状态集输入一个字符得到的状态集
    this.setMoveByCh = function (set, ch) {
        var result = new Set();
        for (var item of set) {
            if (this.transTable[item][ch]) {
                for (var i of this.transTable[item][ch]) {
                    result.add(i);
                }
            }
        }
        return this.closureOfSet(result);
    }


    // 生成转移函数表
    this.generateTransTable = function () {
        for (var i = 0; i < this.Edges.length; i++) {
            var from = this.Edges[i].from;
            var ch = this.Edges[i].ch;
            var to = this.Edges[i].to;
            if (this.transTable[from] && this.transTable[from][ch]) {
                this.transTable[from][ch].add(to);
            } else if (this.transTable[from]) {
                this.transTable[from][ch] = new Set([to]);
            } else {
                this.transTable[from] = {};
                this.transTable[from][ch] = new Set([to]);
            }
        }

        for (var k of this.endStates) {
            if (!this.transTable[k]) {
                this.transTable[k] = {};
            }
        }
    }

    // 判断两个状态是否等价
    this.equalState = function (stateA, stateB) {
        var isEqual = true;
        for (var ch of this.letters) {
            if (!eqSet(this.transTable[stateA][ch], this.transTable[stateB][ch])) {
                isEqual = false;
            }
        }
        return isEqual;
    }

    // NFA转换为DFA
    this.toDFA = function () {
        var Q = new Set();

        var DFA = new StateMachine();
        DFA.letters = this.letters;

        var startSet = this.dfsClosure(this.startState);
        DFA.startState = startSet;

        Q.add(startSet);
        var workList = [startSet];
        while (workList.length !== 0) {
            var fromSet = workList.shift();
            for (var j of this.letters) {
                toSet = this.setMoveByCh(fromSet, j);
                DFA.Edges.push({
                    from: fromSet,
                    to: toSet,
                    ch: j
                })
                if (!Q.hasSet(toSet)) {
                    Q.add(toSet);
                    workList.push(toSet);
                }
            }
        }

        // 判断终结状态
        for (var set of Q) {
            for (var item of this.endStates) {
                // 如果包含NFA的终结状态
                if (set.has(item)) {
                    DFA.endStates.add(set);
                }
            }
        }

        // 整理DFA
        Q = Array.from(Q);

        // 录入DFA的状态集
        for (i = 0; i < Q.length; i++) {
            DFA.states.add(i);
        }

        DFA.startState = 0;

        // 扫描一遍Edge
        for (i = 0; i < DFA.Edges.length; i++) {
            // 录入输入字符集
            DFA.letters.add(DFA.Edges[i].ch);

            // 重置Edge
            Q.forEach(function (set, index) {
                if (eqSet(DFA.Edges[i].from, set)) {
                    DFA.Edges[i].from = index;
                }
                if (eqSet(DFA.Edges[i].to, set)) {
                    DFA.Edges[i].to = index;
                }
            })
        }

        // 处理终结状态 终结状态也是一个集合
        var newEndStates = new Set();
        for (subSet of DFA.endStates) {
            Q.forEach(function (set, index) {
                if (eqSet(subSet, set)) {
                    newEndStates.add(index);
                }
            })
        }
        DFA.endStates = newEndStates;

        // 重新生成转移函数表
        DFA.generateTransTable();
        console.log(DFA.transTable)

        // 求同法
        DFA.minimize = function () {
            var minimizedDFA = new StateMachine();
            minimizedDFA.letters = this.letters;

            var Q = new Set();

            // 求一般状态得等价状态集
            var Q1 = new Set();
            var that = this;
            var normalStates = DFA.states.difference(DFA.endStates);
            for (var state of normalStates) {
                var equalSet = new Set();
                for (var otherState of normalStates) {
                    if (that.equalState(otherState, state)) {
                        equalSet.add(otherState);
                    }
                }
                if (!Q1.hasSet(equalSet)) {
                    Q1.add(equalSet);
                }
            }






            // 求终结状态得等价状态集
            var acceptStates = DFA.endStates;
            var Q2 = new Set();
            if (acceptStates.size === 1) {
                Q2.add(acceptStates);
            } else {
                for (var state of acceptStates) {
                    var equalSet = new Set();
                    for (var otherState of acceptStates) {
                        if (that.equalState(otherState, state)) {
                            equalSet.add(otherState);
                        }
                    }
                    if (!Q2.hasSet(equalSet)) {
                        Q2.add(equalSet);
                    }
                }
            }

            Q = Q1.union(Q2);

            // 重新生成状态机五元属性
            Q = Array.from(Q);

            // 录入DFA的状态集
            for (i = 0; i < Q.length; i++) {
                minimizedDFA.states.add(i);
            }

            // 录入初始状态
            minimizedDFA.startState = 0;

            // 录入终结状态 终结状态也是一个集合
            // 判断终结状态
            for (var set of Q) {
                for (var item of that.endStates) {
                    // 如果包含DFA的终结状态
                    if (set.has(item)) {
                        minimizedDFA.endStates.add(set);
                    }
                }
            }
            var newEndStates = new Set();
            for (subSet of minimizedDFA.endStates) {
                Q.forEach(function (set, index) {
                    if (eqSet(subSet, set)) {
                        newEndStates.add(index);
                    }
                })
            }
            minimizedDFA.endStates = newEndStates;
            

            minimizedDFA.Edges = that.Edges;
            // 扫描一遍Edge
            for (i = 0; i < that.Edges.length; i++) {
                // 重置Edges
                Q.forEach(function (set, index) {
                    if (set.has(that.Edges[i].from)) {
                        minimizedDFA.Edges[i].from = index;
                    }
                    if (set.has(that.Edges[i].to)) {
                        minimizedDFA.Edges[i].to = index;
                    }
                })
            }

           // 对Edges查重
           // 生成转换函数表可去重，再转换为Edges
           minimizedDFA.generateTransTable();
           minimizedDFA.Edges = [];
           for(var state in minimizedDFA.transTable) {
               for (var ch in minimizedDFA.transTable[state]) {
                    var Edge = {};
                    Edge.from = state;
                    Edge.ch = ch;
                    Edge.to = [...minimizedDFA.transTable[state][ch]].pop();
                    minimizedDFA.Edges.push(Edge);
               }
           }
           
           return minimizedDFA;
        }

        // 给DFA定义最小化的函数 使用Hopcroft算法
        DFA.hopcroft = function () {
            // 标识划分是否还会再改变
            var flag = false;

            var that = this;

            // 初始划分 定义非接受状态集和接收状态集
            var N = DFA.states.difference(DFA.endStates);
            var A = DFA.endStates;

            // 划分集
            var partition = new Set([N, A]);
            console.log(partition);

            function split(partition) {
                // 具体的划分一个集合
                function splitSet(set, ch) {
                    var hash = {};
                    for (var state of set) {
                        ifthat.transTable[state][ch]
                    }
                }


                for (var stateSet of partition) {
                    //只含一个状态的集合就不用检查了
                    if (stateSet.size === 1) {
                        continue;
                    }
                    that.letters.forEach(function (ch) {
                        // 得到一个状态集对一个输入字符得到的状态集
                        var newStateSet = that.setMoveByCh(stateSet, ch);
                        for (var subSet of partition) {
                            // 判断需要再划分
                            if (!subSet.isSuperset(newStateSet)) {
                                // 置为需要划分
                                flag = true;
                                splitSet(subSet, ch);



                            } else {
                                flag = false;
                            }
                        }
                    })


                }
            }


            // while(flag){
            //     split(partition);
            // }
            split(partition);
        }

        return DFA;
    }


    // 读入数据
    this.read = function (data) {
        this.startState = data.startState;
        for (var i = 0; i < data.endStates.length; i++) {
            this.endStates.add(data.endStates[i]);
        }

        for (i = 0; i < data.Edges.length; i++) {
            this.Edges.push(data.Edges[i]);
            this.states.add(data.Edges[i].from).add(data.Edges[i].to);
            if (data.Edges[i].ch !== '~') {
                this.letters.add(data.Edges[i].ch);
            }
        }

        // 生成转移函数表
        this.generateTransTable();

    }


    /* 判断是NFA还是DFA
        1. DFA没有输入空串之上的转换动作；
        2. 对于DFA，一个特定的符号输入，有且只能得到一个状态
    */
    this.checkNFAorDFA = function () {
        // 辅助对象
        var helper = {};
        // 判断第一种情况
        for (var i = 0; i < this.Edges.length; i++) {
            if (this.Edges[i].ch === '~') {
                resultStr += "**********************************\nThis stateMachine is NFA!\n**********************************\n";
                return 0;
            }
        }

        // 判断第二种情况
        for (var i = 0; i < this.Edges.length; i++) {
            var from = this.Edges[i].from;
            var ch = this.Edges[i].ch;
            var to = this.Edges[i].to;

            // 如果一个状态接受一个字符到达的状态和现在处理的函数相同
            if (helper[from] && helper[from][ch] && (helper[from][ch] !== to)) {
                resultStr += "**********************************\nThis stateMachine is DFA!\n**********************************\n";
                return 0;
            }
            helper[from] = {};
            helper[from][ch] = to;
        }
        resultStr += "**********************************\nThis stateMachine is NFA!\n**********************************\n";
    }

    // 状态机接受一个输入字符后转移到的状态
    this.move = function (from, ch) {
        if (!this.transTable[from][ch]) {
            return false;
        } else {
            return [...this.transTable[from][ch]].pop();
        }
    }


    // 状态机测试字符串
    this.test = function (str) {
        var s = this.startState;
        for (var i = 0; i < str.length; i++) {
            s = this.move(s, str[i]);
        }
        // 如果到达终结状态
        if (s && this.endStates.has(s)) {
            resultStr += "yes!\n";
        } else {
            resultStr += "no!\n";
        }
    }

    // 状态机转换为字符串
    this.toString = function () {
        resultStr += `开始状态为: ${this.startState}\n结束状态为 ${[...this.endStates].join(",")}\n`;
        resultStr += "状态\t 输入符号\t结束状态\n";
        for (var i = 0; i < this.Edges.length; i++) {
            resultStr += ' ' + this.Edges[i].from + '\t     ' + this.Edges[i].ch + '\t       ' + this.Edges[i].to + '\n';
        }
    }
}

fs.readFile('/Users/lunaticf/Documents/vscodeWorkSpace/compiler/work2-NFA2DFA/input.json', 'UTF-8', function (err, data) {
    if (err) throw err;
    data = JSON.parse(data);
    var machine = new StateMachine();
    machine.read(data);
    // 检查是NFA还是DFA
    machine.checkNFAorDFA();

    // 转换为DFA
    var dfa = machine.toDFA();
    dfa.toString();

    var minimizedDFA = dfa.minimize();
    minimizedDFA.toString();

    // 测试输入符号串，输出YES OR NO
    resultStr += "********* dfa test start  *********\n"
    dfa.test('babb');
    dfa.test('aba');
    dfa.test('aaabb');

    resultStr += "*********  minimizedDFA test start  *********\n"
    minimizedDFA.test('babb');
    minimizedDFA.test('aba');
    minimizedDFA.test('aaabb');

    // 结果写入output.txt
    fs.writeFile('/Users/lunaticf/Documents/vscodeWorkSpace/compiler/work2-NFA2DFA/output.txt', resultStr, function (err) {
        if (err) throw err;
        console.log('result is saved.');
    });
});