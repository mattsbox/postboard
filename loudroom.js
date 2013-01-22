var fs=require("fs");
var qs=require("querystring");
exports.create_room=function(n,socket)
{
	var room={logfile:"room"+n+".txt",serial:n,users:Array(socket),enter:function(socket){welcome_user(socket,this.users,this.logfile);}};
	room.enter(socket);
	return room;
}
function welcome_user(socket,users,logfile)
{
	console.log("Welcome");
	fs.readFile(__dirname+"/chatroom.html","utf8",function(err,data)
	{
		console.log("readfile");
		if(err)
		{
			console.log("err");
			dispose_user(socket);
		}
		else
		{
			console.log(data);
			var i=users.indexOf(socket);
			if(i<=-1){users.push(socket);}
			socket.emit("enterroom",data);
			socket.on("newchat",function(data){new_message(data,logfile,users,socket);});
			socket.on("exit",function(data){dispose_user(socket,users);});
		}
	});
}
function dispose_user(socket,users)
{
	var i=users.indexOf(socket);
	if(i>-1){delete users[i];}
}
function new_message(data,logfile,users,socket)
{
	var string=socket.nickname+": "+escape(data);
	fs.appendFile(__dirname+"/"+logfile,string,function(err){});
	for(socket in users)
	{
		console.log(socket);
		users[socket].emit("newchat",string);
	}
}
