const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'BOT-Univesp' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- Não funciona no Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'Conectando...');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'BOT-Univesp QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', 'BOT-Univesp Dispositivo pronto!');
    socket.emit('message', 'BOT-Univesp Dispositivo pronto!');	
    console.log('BOT-Univesp Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', 'BOT-Univesp Autenticado!');
    socket.emit('message', 'BOT-Univesp Autenticado!');
    console.log('BOT-Univesp Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', 'BOT-Univesp Falha na autenticação, reiniciando...');
    console.error('BOT-Univesp Falha na autenticação');
});

client.on('change_state', state => {
  console.log('BOT-Univesp Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', 'BOT-Univesp Cliente desconectado!');
  console.log('BOT-Univesp Cliente desconectado', reason);
  client.initialize();
});
});

// Envio de Mensagem
app.post('/send-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number + '@c.us';
  const message = req.body.message;


  client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == "") return null;

  if (msg.body !== null && msg.body === "chatbot univesp") {
    
    const saudacaoes = ['Olá ' + nomeContato + ' , tudo bem?', 'Oi ' + nomeContato + ', como vai você?', 'Opa ' + nomeContato + ', tudo certo?'];
    const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
    msg.reply(saudacao + " Escolha uma das opções abaixo para iniciarmos a nossa conversa: \r\n\r\n*1*- Quero saber mais sobre o projeto integrador chatbot univesp \r\n*2*- Gostaria de saber o site da Univesp. \r\n*3*- Apenas quis testar o bot e já estou satisfeito ");
	}
  else if (msg.body !== null && msg.body === "1") {
    msg.reply("Hum " + nomeContato + ", Este projeto ainda está sendo desenvolvido e está em fase de testes")
  }
  else if (msg.body !== null && msg.body === "2") {
    msg.reply("Legal " + nomeContato + "! O site da Univesp é: https://univesp.br")
  }
  else if (msg.body !== null && msg.body === "3") {
    msg.reply("Tá certo " + nomeContato + ", Muito obrigado por testar os nossos serviços")
  }


  
});

    
server.listen(port, function() {
        console.log('App running on *: ' + port);
});
