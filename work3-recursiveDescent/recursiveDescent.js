var fs = require('fs');
fs.readFile('/Users/lunaticf/Documents/vscodeWorkSpace/compiler/work3-recursiveDescent/input.txt', 'UTF-8', function (err, data) {
    if (err) throw err;
    
    // 字符串的存入
    var source = data.toString().split('');

    // 字符串下标
    var advance = 0;

    var resultStr = "";

    function E() {
        resultStr += "E->TE'\n";
        T();
        E1();
    }

    function T() {
        resultStr += "T->FT'\n";
        F();
        T1();
    }

    function E1() {
        if (source[advance] === '+') {
            resultStr += "E'->+TE'\n";
            advance++;
            T();
            E1();
        } else {
            resultStr += "E'->ε\n";
        }
    }
    
    function T1() {
        // 如果是”*“,则读取下一字符
        if (source[advance] === '*') {
            resultStr += "T'->*FT'\n";
            advance++;
            F();
            T1();
        } else {
            resultStr += "T'->ε\n";
        }
    }
    
    function F() {
        if (source[advance] === 'i') {
            resultStr += "F->i\n";
            advance++;
        } else if (source[advance] === '(') {
            // 如果是'(',继续读取下一个字符
            advance++;
            E();
            if (source[advance] === ')') {
                resultStr += "F->(E)\n";
                advance++;
            } else {
                resultStr += "\ncan't match. error!\n";
                saveResultToFile(resultStr);
                process.exit();
            }
        } else {
            resultStr += "\ncan't match. error!\n";
            saveResultToFile(resultStr);
            process.exit();
        }
    }
    
    resultStr += "please input the sentence(end with #)\n";

    // 从首个推导式E开始
    E();
    if ((source[advance] === '#')) {
        resultStr += "the sentence is right!\n";
    } else {
        resultStr += "\ncan't match. error!\n";
    }
    saveResultToFile(resultStr);
})

function saveResultToFile(resultStr) {
    fs.writeFileSync('/Users/lunaticf/Documents/vscodeWorkSpace/compiler/work3-recursiveDescent/result.txt', resultStr, function (err) {
        if (err) throw err;
        console.log("saved the results to file successfully");
    });
}

