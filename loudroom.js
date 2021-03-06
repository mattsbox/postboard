var fs=require("fs");
var qs=require("querystring");
var sanitizer=require("sanitizer");
var strftime=require("strftime");
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
			data="<a href=\"/room"+serial+".txt\">Link to chat log</a><br/><hr>"+data;
			fs.readFile(__dirname+"/name"+serial,function(nameerr,namedata)
			{
				if(nameerr){socket.emit("enterroom",data);}
				else
				{
					socket.emit("enterroom","<span style=\"font-weight:bold;\">"+namedata+"</span><br/>"+data);
				}
			});
			socket.join(serial);
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
	var t=new Date().getTime();
	if(t-socket.chattime<1000){return;}
	socket.chattime=t;
	var string=socket.nickname+"["+strftime("%H:%M:%S")+"]: "+sanitizer.sanitize(data);
	fs.appendFile(__dirname+"/"+logfile,string+" ["+strftime("%B %d %y %H:%M:%S")+"]\n",function(err){});
	io.sockets.in(serial).emit("newchat",string);
}
