var data = "";

function init() {
    var input = document.getElementById('input');

    //输入时触发重新渲染
    input.addEventListener('keyup', function (e) {
        data = e.target.value;
        analyze();
    });

    // 粘贴时触发
    input.addEventListener('paste', function (e) {
        data = e.target.value;
        analyze();
    });
}

init();


function analyze() {
    var ch = '',
        text,
        keywords = ['int', 'char', 'void', 'if', 'else', 'switch', 'case', 'default', 'while', 'do', 'for', 'break', 'return', 'continue'],
        delimiters = [',', '(', ')', '{', '}', ';', ':'],
        operators = ['+', '-', '*', '/', '%', '++', '--', '!', '&' , '|' ,'&&', '||', '=', '>', '>=', '<', '<=', '==', '!='],
        result = [],
        resultStr = "",
        found = false,
        tempStr = "",
        j = 0,
        output = document.getElementById('out');

    output.innerHTML = "";



    // utils-create a item and insert it to result
    function createItem(value, category) {
        var item = {};
        item['value'] = value;
        item['category'] = category;
        result.push(item);
    }

    // utils-create a error item and insert it to result
    function createErrItem(value, category) {
        var item = {};
        item['value'] = '<span class="ui red label">' + value + '<span>';
        item['category'] = '<span style="color:red">' + category + '<span>';
        result.push(item);
    }

    //utils-Check whether the str is an operator
    function isOperators(str) {
        for (var i = 0; i < operators.length; i++) {
            if (str === operators[i]) {
                return true;
            }
        }
        return false;
    }

    //渲染
        function render() {
            resultStr = "";
            result.forEach(function (el) {
                resultStr += '<tr>'+'<td>'+ el.value +'</td>'+'<td>'+ el.category +'</td>'+'</tr>';
                output.innerHTML = resultStr;
            })
        }

        text = data.toString().split('');
        // 遍历程序源代码
        for (var i = 0; i < text.length; i++) {
            // 读取一个字符
            ch = text[i];

            // 判断是否是标识符和关键字 
            // 如果读到的字符是字母
            if (/[a-zA-Z]/.test(ch)) {
                tempStr = ch,
                    j = ++i;
                // 继续读入直到下个字符不是字母或者数字
                while (text[j] !== undefined && /[a-zA-Z0-9_]/.test(text[j])) {
                    // tempStr表示截取到的字符串
                    tempStr += text[j];
                    j++;
                }
                i = j - 1;

                // 判断截取到的字符串是关键字还是标识符
                keywords.forEach(function (el) {
                    if (el === tempStr) {
                        createItem(tempStr, '关键字');
                        found = true;
                    }
                })

                // 不是关键字 是标识符
                if (!found) {
                    createItem(tempStr, '标识符');
                }
            }

            // 判断数字 如果读到的字符是数字 
            if (/[0-9]/.test(ch)) {

                // 如果开头数字是0,判断8和16进制
                if (/0/.test(ch)) {
                    j = ++i;

                    if (/[a-wy-zA-Z]/.test(text[j]) && text[j] !== undefined) {
                        tempStr = '0' + text[j]; 
                        createErrItem(tempStr, 'syntax error!变量名不能以数字开头');
                        render();
                        return 0;
                    }
                    if (text[j] === 'x') {
                        tempStr = '0x';
                        j++;
                        // 继续读入
                        while (text[j] !== undefined && /[0-9A-F]/.test(text[j])) {
                            // tempStr表示截取到的字符串
                            tempStr += text[j];
                            j++;
                        }
                        if (/[a-zA-Z_]/.test(text[j]) && text[j] !== undefined) {
                                createErrItem(tempStr,'syntax error!变量名不能以数字开头');
                                render();
                                return 0;
                        }
                        i = j - 1;
                        createItem(tempStr, '十六进制数');
                    } else {
                        if (/[0-7]/.test(text[j])) {
                            tempStr = '0' + text[j];
                            j++;
                            // 继续读入
                            while (text[j] !== undefined && /[0-7]/.test(text[j])) {
                                // tempStr表示截取到的字符串
                                tempStr += text[j];
                                j++;
                            }
                            if (/[a-zA-Z_]/.test(text[j]) && text[j] !== undefined) {
                                createErrItem(tempStr,'syntax error!变量名不能以数字开头');
                                render();
                                return 0;
                            }
                            i = j - 1;
                            createItem(tempStr, '八进制数');
                        } else {
                            createItem('0', '数字');
                        }
                    }
                }

                // 判断十进制数
                if (/[1-9]/.test(ch)) {
                    tempStr = ch,
                        j = ++i;
                    // 继续读入直到下个字符不是字母或者数字或者_
                    while (text[j] !== undefined && /[a-zA-Z0-9_]/.test(text[j])) {
                        // tempStr表示截取到的字符串
                        tempStr += text[j];
                        j++;
                    }
                    console.log(tempStr)
                    i = j - 1;
                    if (Number(tempStr)) {
                        createItem(tempStr, '十进制数');
                    } else {
                        createErrItem(tempStr,'syntax error!变量名不能以数字开头');
                        render();
                        return 0;
                    }
                }
            }

            //判断字符常量和字符串常量
            if (/[\'\"]/.test(ch)) {
                tempStr = ch,
                    j = ++i;
                // 如果是单引号
                if (ch === '\'') {
                    while (text[j] !== undefined && !/[\']/.test(text[j])) {
                        // tempStr表示截取到的字符串
                        tempStr += text[j];
                        j++;
                    }
                    if (text[j] == undefined) {
                        createErrItem(tempStr,'syntax error!expect a \' or \"');
                        render();
                        return 0;
                    }
                    i = j;
                    createItem(tempStr + '\'', '字符常量');
                }
                // 如果是双引号
                else if (ch === '\"') {
                    while (text[j] !== undefined && !/[\"]/.test(text[j])) {
                        // tempStr表示截取到的字符串
                        tempStr += text[j];
                        j++;
                    }
                    if (text[j] == undefined) {
                        createErrItem(tempStr,'syntax error!expect a \' or \"');
                        render();
                        return 0;
                    }
                    i = j;
                    createItem(tempStr + '\"', '字符串常量');
                }
            }

            // 判断分界符
            for (var k = 0; k < delimiters.length; k++) {
                if (ch === delimiters[k]) {
                    createItem(ch, '分界符');
                }
            }

            // 判断注释
            if (ch === '/') {
                if (text[i+1] === '/') {
                    j = i + 1;
                    tempStr = '/';
                    while (text[j] !== undefined && text[j] !== '\n') {
                        tempStr += text[j];
                        j++;
                    }
                    i = j;
                    createItem(tempStr, '注释');
                    found = true;
                }
            } 

            // 判断操作数
            if (isOperators(ch) && !found) {
                j = i + 1;
                tempStr = ch;
                while (text[j] !== undefined && isOperators(text[j])) {
                    tempStr += text[j];
                    j++;
                }
                i = j - 1;
                if (isOperators(tempStr)) {
                    console.log(1)
                    createItem(tempStr, '运算符');
                } else {
                    createErrItem(tempStr,'syntax error!check the operators');
                    render();
                    return 0;
                }
            }

            // c--中不存在的字符
            if (/[@#$?]/.test(ch)) {
                createErrItem(ch,'syntax error!check the letter');
                render();
                return 0;
            }

            // 重置一下found
            found = false;
        }

        render();

       
        
}



