var fs=require("fs");
var qs=require("querystring");
var sanitizer=require("sanitizer");
exports.create_room=function(n,socket,nio)
{
	var room=	{logfile:"room"+n+".txt",
			serial:n,
			io:nio,
			enter:function(socket){welcome_user(socket,this.io,this.serial,this.logfile);},
			evict:function(socket){dispose_user(socket,this.serial);}};
	room.enter(socket);
	return room;
}
function welcome_user(socket,io,serial,logfile)
{
	console.log("Welcome");
	fs.readFile(__dirname+"/chatroom.html","utf8",function(err,data)
	{
		console.log("readfile");
		if(err)
		{
			console.log("err");
			dispose_user(socket,serial);
		}
		else
		{
			console.log(data);
			socket.join(serial);
			socket.emit("enterroom",data);
			socket.on("newchat",function(data){new_message(data,io,logfile,serial,socket);});
			socket.on("exit",function(data){dispose_user(socket,serial);});
		}
	});
}
function dispose_user(socket,serial)
{
	socket.leave(serial);
	socket.removeAllListeners("newchat");	
}
function new_message(data,io,logfile,serial,socket)
{
	var string=socket.nickname+": "+sanitizer.sanitize(data);
	fs.appendFile(__dirname+"/"+logfile,string,function(err){});
	io.sockets.in(serial).emit("newchat",string);
}
