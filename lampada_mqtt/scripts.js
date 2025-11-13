const lampada=document.getElementById("lampada")
const txt_status=document.getElementById("status")

const v_topicoBase="Centro4.0/lampada"
let v_estadoLampada="0"

const BROKER_HOST = 'mqtt-dashboard.com';
const BROKER_PORT = 8884;
const BROKER_USER = '';
const BROKER_PASS = '';
const CLIENT_ID = "meuAppWeb_" + parseInt(Math.random() * 1000);

function conectarMQTT(){
    const connectOptions = {
        useSSL: true,
        userName: BROKER_USER,
        password: BROKER_PASS,
        onSuccess: onConnect, // Função que será chamada no sucesso
        onFailure: onFailure, // Função que será chamada na falha
        timeout: 5
    }
    client.connect(connectOptions);
    txt_status.innerHTML="Conectando..."
}

function onConnect(){
    txt_status.innerHTML="Conectado"
	client.subscribe(v_topicoBase)
}

function onFailure(responseObject){
    txt_status.innerHTML=`Falha: ${responseObject.errorMessage}`
}

function onConnectionLost(responseObject){
	if (responseObject.errorCode !== 0) {
        txt_status.innerHTML=`Conexão perdida: ${responseObject.errorMessage}`
	}
}

const onMessageArrived=(message)=>{
	const topico = message.destinationName;
	const payload = message.payloadString;
    //const topicocompleto=topico.split("/")
    //const topicodado=topicocompleto[topicocompleto.length-1]
    if(payload=="1"){
        lampada.src="lampada_on.png"
    }else if(payload=="0"){
        lampada.src="lampada_off.png"
    }
}

client = new Paho.MQTT.Client(BROKER_HOST, BROKER_PORT, CLIENT_ID);
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

conectarMQTT()