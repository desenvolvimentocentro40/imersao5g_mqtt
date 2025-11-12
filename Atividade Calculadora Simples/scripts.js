const num1 = document.getElementById("num1");
const num2 = document.getElementById("num2");
const res = document.getElementById("res");

function somar(){
    const resultado= Number(num1.value) + Number(num2.value);
    res.value = resultado;
}