const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Journalctl = require('@seydx/journalctl');
let opts = {
   identifier: ['systemd', 'homebridge'],
   unit: ['homebridge-instances-platform', 'homebridge'],
   filter: ['Stopped Node.js HomeKit Server', 'Started Node.js HomeKit Server']
}
const journalctl = new Journalctl();

var history = [];

const Syslog = require('simple-syslog-server');
var syslogServer = Syslog.UDP({type: 'udp4'});
syslogServer.on('msg', data => {
	console.log(data);
	history.push(data);
	console.log(history.length);
	while(history.length > 3000)
		history.shift();
	io.emit('chat message', data.msg);
});
syslogServer.on('invalid', err => {
	console.warn('Invalid message format received: %o\n', err) ;
});
syslogServer.on('error', err => {
	console.warn('Client disconnected abruptly: %o\n', err) ;
});
syslogServer.listen({host: '0.0.0.0', port: 10514});

//journalctl.on('event', (event) => {
//	console.log(event);
//	io.emit('chat message', `${event["_HOSTNAME"]} - ${event["_MACHINE_ID"]} - ${event["_SYSTEMD_UNIT"]}: ${event["MESSAGE"]}`);
//});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', socket => {
	console.log('a user has connected');
	//socket.broadcast.emit('connected');
	io.emit('chat message', 'connected');
	for(let line of history)
		socket.emit('chat message', line.msg);
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

server.listen(3001, () => {
	console.log('listening on *:3001');
});
