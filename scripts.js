const txt_status=document.getElementById("status")
const topico=document.getElementById("topico")
const inputTmpProgramado=document.getElementById("inputTmpProgramado")
const selCelula=document.getElementById("selCelula")
const btnConectar=document.getElementById("btnConectar")
const btnDesconectar=document.getElementById("btnDesconectar")
const mensagens=document.getElementById("mensagens")
const disponibilidade=document.getElementById("disponibilidade")
const performance=document.getElementById("performance")
const qualidade=document.getElementById("qualidade")
const oee=document.getElementById("oee")
const txt_tmpProgramado=document.getElementById("tmpProgramado")
const txt_tmpProduzindo=document.getElementById("tmpProduzindo")
const txt_prodTeorica=document.getElementById("prodTeorica")
const txt_prodReal=document.getElementById("prodReal")
const txt_pecasBoas=document.getElementById("pecasBoas")
const txt_pecasRuins=document.getElementById("pecasRuins")

const v_topicoBase="Centro4.0"
let v_celula="Preparacao"
let v_topico=""

let v_disponibilidade=0
let v_performance=0
let v_qualidade=0
let v_oee=v_disponibilidade*v_performance*v_qualidade/10000

const BROKER_HOST = 'mqtt-dashboard.com';
const BROKER_PORT = 8884;
const BROKER_USER = '';
const BROKER_PASS = '';
const CLIENT_ID = "meuAppWeb_" + parseInt(Math.random() * 1000);

let client = new Paho.MQTT.Client(BROKER_HOST, BROKER_PORT, CLIENT_ID);

const v_dados={
    tmpProgramado:0,
    tmpProduzindo:0,
    prodTeorica:0,
    prodReal:0,
    pecasBoas:0,
    pecasRuins:0
}

function conectarMQTT(){
    if(selCelula.value==""){
        alert("Selecione uma célula de produção!")
        return
    }
    if(inputTmpProgramado.value<=0 || inputTmpProgramado.value==""){
        alert("Informe o Tempo programado para produzir: em segundos")
        return
    } 
    const connectOptions = {
        useSSL: true,
        userName: BROKER_USER,
        password: BROKER_PASS,
        onSuccess: onConnect, // Função que será chamada no sucesso
        onFailure: onFailure, // Função que será chamada na falha
        timeout: 5
    }
    v_dados.tmpProgramado=parseInt(inputTmpProgramado.value)
    client.connect(connectOptions);
    v_celula=selCelula.value
    v_topico=`${v_topicoBase}/${v_celula}/Processo/#`
    topico.innerHTML=v_topico
    txt_status.innerHTML="Conectando..."
    txt_status.style.color="#f80"
}

const desconectarMQTT=()=>{
    try{
        if (client && client.isConnected && client.isConnected()) {
            client.disconnect()
            txt_status.innerHTML="Desconectado"
            txt_status.style.color="#a00"
            mensagens.innerHTML=""
            btnConectar.disabled=false
            btnDesconectar.disabled=true
            btnConectar.classList.remove("btnDesabilitado")
            btnDesconectar.classList.add("btnDesabilitado")
            v_dados.tmpProgramado=0
            v_dados.tmpProduzindo=0
            v_dados.prodTeorica=0
            v_dados.prodReal=0
            v_dados.pecasBoas=0
            v_dados.pecasRuins=0
            calcOEE()
            atualizarFrontend()
        }
    }catch(err){}
}

function onConnect(){
    txt_status.innerHTML="Conectado"
    txt_status.style.color="#0a0"    
	const topicoPadrao = v_topico
	client.subscribe(topicoPadrao)
    btnConectar.disabled=true
    btnDesconectar.disabled=false
    btnConectar.classList.add("btnDesabilitado")
    btnDesconectar.classList.remove("btnDesabilitado")
}

function onFailure(responseObject){
    console.log("Falha ao conectar ao MQTT...")
    txt_status.innerHTML=`Falha: ${responseObject.errorMessage}`
    txt_status.style.color="#a00"  
}

function onConnectionLost(responseObject){
	if (responseObject.errorCode !== 0) {
        txt_status.innerHTML=`Conexão perdida: ${responseObject.errorMessage}`
        txt_status.style.color="#a00"  
	}
}

const onMessageArrived=(message)=>{
	const topico = message.destinationName;
	const payload = message.payloadString;
    const topicocompleto=topico.split("/")
    const topicodado=topicocompleto[topicocompleto.length-1]
    switch(topicodado){
        case "Tempo_Robo_ON":
            v_dados.tmpProduzindo=parseInt(payload)
            break
        case "Quantidade_de_Producao":
            v_dados.prodTeorica=parseInt(payload)
            break
        case "Quantidade_Peca_boa":
            v_dados.pecasBoas=parseInt(payload)
            break
        case "Quantidade_Peca_Ruim":
            v_dados.pecasRuins=parseInt(payload)
            break
    }
    v_dados.prodReal=v_dados.pecasBoas+v_dados.pecasRuins
    criarLinhaMensagem(topico,payload)
    calcOEE()
    atualizarFrontend()
}

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

const calcDisponibilidade=()=>{
    v_disponibilidade=((v_dados.tmpProduzindo/v_dados.tmpProgramado)*100 || 0).toFixed(2)
}

const calcPerformance=()=>{
    v_performance=((v_dados.prodReal/v_dados.prodTeorica)*100 || 0).toFixed(2)
}

const calcQualidade=()=>{
    v_qualidade=((v_dados.pecasBoas/(v_dados.pecasBoas+v_dados.pecasRuins) || 0)*100).toFixed(2)
}

const calcOEE=()=>{
    calcDisponibilidade()
    calcPerformance()
    calcQualidade()
    v_oee=((v_disponibilidade*v_performance*v_qualidade)/10000).toFixed(2)
}

const calcularCor=(valor)=>{
    const hue = (valor / 100) * 120
    return `hsl(${hue}, 90%, 45%)`
}

const atualizarFrontend=()=>{
    txt_tmpProgramado.innerHTML=`${inputTmpProgramado.value} seg`
    txt_tmpProduzindo.innerHTML=`${v_dados.tmpProduzindo} seg`
    txt_prodTeorica.innerHTML=`${v_dados.prodTeorica} peças`
    txt_prodReal.innerHTML=`${v_dados.prodReal} peças`
    txt_pecasBoas.innerHTML=`${v_dados.pecasBoas} peças`
    txt_pecasRuins.innerHTML=`${v_dados.pecasRuins} peças`

    disponibilidade.innerHTML=`${v_disponibilidade}%`
    disponibilidade.style.width=`${v_disponibilidade}%`
    disponibilidade.style.backgroundColor = calcularCor(v_disponibilidade)

    performance.innerHTML=`${v_performance}%`
    performance.style.width=`${v_performance}%`
    performance.style.backgroundColor = calcularCor(v_performance)

    qualidade.innerHTML=`${v_qualidade}%`
    qualidade.style.width=`${v_qualidade}%`
    qualidade.style.backgroundColor = calcularCor(v_qualidade)

    oee.innerHTML=`${v_oee}%`
    oee.style.width=`${v_oee}%`

    oee.style.backgroundColor = calcularCor(v_oee)
}

const criarLinhaMensagem=(topico,mensagem)=>{
    const topicocompleto=topico.split("/")
    const topicodado=topicocompleto[topicocompleto.length-1]
    const msg=document.createElement("p")
    msg.innerHTML=`<span class="topico">${topicodado}:</span> <span class="mensagem">${mensagem}</span>`
    mensagens.appendChild(msg)
}
