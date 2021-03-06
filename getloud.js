var http=require("http");
var fs=require("fs");
var io=require("socket.io");
var chat=require("./loudroom.js");
var sanitizer=require("sanitizer");
function send(data,type,res)
{
	if(type){res.setHeader("Content-Type",type);}
	res.setHeader("Content-Encoding","utf-8");
	res.writeHead(200);
	res.end(data);
}
function badurl(url,res)
{
	res.writeHead(404);
	console.log("Failed query for "+url);
	res.end();
}
function query(file,type,res)
{
	fs.readFile(__dirname+"/"+file,function(err,data){
		if(err){badurl(file,res);}
		else{send(data,type,res);}
	});
}
String.prototype.endsWith=function(s)
{
	return this.lastIndexOf(s)==(this.length-s.length);
};
var server=http.createServer(function(req,res)
{
	if(req.url=="/"){query("getloud.html","text/html",res);}
	else if(req.url.endsWith(".js")){query(req.url,"text/javascript",res);}
	else if(req.url.endsWith(".css")){query(req.url,"text/css",res);}
	else if(req.url.endsWith("/favicon.ico")){query("favicon.ico","image/x-icon",res);}
	//Ends with .txt
	else if(req.url.endsWith(".txt")){query(req.url,false,res);}
	else{badurl(req.url,res);}
});
var sio=io.listen(server);
var posts=Array();
var index=0;
var serial=1;
var guestserial=0;
var active_rooms={};
function random(l,u)
{
	return ((u-l)*Math.random())+l;
}
sio.configure(function(){
	sio.set("transports",["xhr-polling"]);
	sio.set("polling duration",20);
});
server.listen(process.env.PORT || 1776);
socket=
sio.sockets.on("connection",function(socket)
{
	socket.posttime=0;
	socket.chattime=0;
	socket.nickname="Guest"+guestserial;
	guestserial++;
	socket.on("newpost",function(data)
	{
		var t=new Date().getTime();
		if(t-socket.posttime<60000){return;}
		socket.posttime=t;
		data=sanitizer.escape(data);
		var post={"id":index,"rot":random(-45,45),"top":random(10,70),"left":random(0,70),"msg":socket.nickname+": "+data,"serial":serial};
		fs.writeFile(__dirname+"/room"+serial+".txt",data+"\nChat room\n----------\n",function(err)
		{
			if(err)
			{
				socket.emit("failedpost");
			}
			else
			{
				fs.writeFile(__dirname+"/name"+serial,data+" by "+socket.nickname,function(err)
				{
					if(err)
					{
						fs.unlink(__dirname+"/room"+serial+".txt",function(err){});
						socket.emit("failedpost");
					}
					else
					{
						sio.sockets.emit("update",post);
						//if(posts[index]){sio.sockets.emit("remove",index);}
						posts[index]=post;
						index++;
						if(index>19){index=0;}
						serial++;
					}
					
				});
			}
			
		});
	});
	socket.on("enterroom",function(data)
	{
		if(active_rooms[data])
		{
			active_rooms[data].enter(socket);
		}
		else
		{
			active_rooms[data]=chat.create_room(data,socket,sio);
		}
		if(socket.room)
		{
			socket.room.evict(socket);
		}
		socket.room=active_rooms[data];
	});
	socket.on("newnick",function(data)
	{
		data=sanitizer.escape(data);
		if(data!=""){socket.nickname=data;}
	});
	for(var x=0;x<20;x++)
	{
		if(posts[x])
		{
			socket.emit("update",posts[x]);
		}
	}
});
