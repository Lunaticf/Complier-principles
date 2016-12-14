var data = "",
    output = document.getElementById('out'),
    flag = false;

function init() {
    var input = document.getElementById('input');

    //输入时触发重新渲染
    input.addEventListener('keyup', function (e) {
        data = e.target.value;
        main();
    });

    // 粘贴时触发
    input.addEventListener('paste', function (e) {
        data = e.target.value;
        main();
    });
}

init();

function main() {
    output.innerHTML = "";

    // 字符串的存入
    var source = data.toString().split('');
    
    // 如果输入为空
    if (data === "") {
       return 0;  
    }

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
                render();
                flag = true;
                return 0;
            }
        } else {
            resultStr += "\ncan't match. error!\n";
            render();
            flag = true;
            return 0;
        }
    }


    resultStr += "please input the sentence(end with #)\n";


    // 从首个推导式E开始
    E();
    if (!flag) {
        if ((source[advance] === '#')) {
            resultStr += "<label class='ui green label'>the sentence is right!<label>\n";
        } else {
            resultStr += "<label class='ui red label'>can't match. error!<label>\n";
        }
        render();
    }

    flag = false;
    
    function render() {
        var result = resultStr.split('\n');
        var content = "";
        result.forEach(function (el) {
            content += '<tr>' + '<td>' + el + '</td>' + '</tr>';
        })
        output.innerHTML = content;
    }

}




