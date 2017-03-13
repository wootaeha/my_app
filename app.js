
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');
var redisInfo={
		host:'127.0.0.1',
		port:6379
};



var socketio=require('socket.io');


var cors=require('cors');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);


var server = http.createServer(app).listen(app.get('port'), function(){
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
});

var io = socketio.listen(server);

var redis=require('socket.io-redis');
io.adapter(redis({host:'127.0.0.1',port:6379}));
console.log('socket.io 요청을 받아들일 준비가 되었습니다.');
var login_ids={};
var login_num=0;
//클라이언트가 연결했을 때의 이벤트 처리 클라이언트 요청한 것을 수신 받음
io.sockets.on('connection', function(socket) {
	
	console.log('connection info :', socket.request.connection._peername);

	// 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
	socket.remoteAddress = socket.request.connection._peername.address;
	socket.remotePort = socket.request.connection._peername.port;
	
	/*socket.on('message',function(message){
		console.log('message 이벤트를 받았습니다.');
		console.dir(message);
		
		if(message.recepient=='ALL'){
			console.dir('나를 포함한 모든 클라이언트에게 message 이벤트를 전송합니다.');
			io.sockets.emit('message',message);
		}else{
			console.log(login_ids[message.recepient]);
			//일대일 채팅 대상에게 메시지 전달
			if(login_ids[message.recepient]){
				io.sockets.connected[login_ids[message.recepient]].emit('message',message);
				io.sockets.connected[login_ids[message.sender]].emit('message',message);
				//응답 메시지 전송
				sendResponse(socket,'message','200','메시지를 전송했습니다.');
			}else{
				io.sockets.connected[login_ids[message.sender]].emit('message',message);
				sendResponse(socket,'message','200','상대방을 찾을 수 없습니다.');
			}
		}
	});*/
	socket.on('adminsend',function(adminsend){
		console.log(adminsend.recepient+" Login");
		//받는 pc가 있으면
		if(login_ids[adminsend.recepient]!=undefined){
			io.sockets.connected[login_ids[adminsend.recepient]].emit('adminsend',adminsend);
		}else{
			io.sockets.connected[login_ids[adminsend.sender]].emit('adminsend',adminsend);
		}
	});
	socket.on('resend',function(resend){
		if(login_ids[resend.recepient]!=undefined){
			io.sockets.connected[login_ids[resend.recepient]].emit('resend',resend);
		}else{
			io.sockets.connected[login_ids[resend.sender]].emit('resend',resend);
		}
	});
	socket.on('keyevent',function(keyevent){
		io.sockets.connected[login_ids[keyevent.sender]].emit('keyevent',keyevent);
	});
	socket.on('keyout',function(keyout){
		io.sockets.connected[login_ids[keyout.sender]].emit('keyout',keyout);
	});
	socket.on('login',function(login){
		console.log('login 이벤트를 받습니다.');
		console.dir(login);
		//기존 클라이언트 ID가 없으면 클라이언트 ID를 맵에 추가
		console.log('접속한 소켓의 ID : '+socket.id);
		login_ids[login.id]=socket.id;
		socket.login_id=login.id;
		console.log('접속한 클라이언트 ID 개수 : %d',Object.keys(login_ids).length);
		io.sockets.connected[login_ids[resend.recepient]].emit('login',login_num);
		//응답메세지 전송
		sendResponse(socket,'login','200','로그인되었습니다.');
		
	});
});
function sendResponse(socket,command,code,message){
	var statusObj={command:command,code:code,message:message};
	socket.emit('response',statusObj);
}


