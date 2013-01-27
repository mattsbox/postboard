var http=require("http");
var fs=require("fs");
var io=require("socket.io");
var chat=require("./loudroom.js");
function send(data,type,res)
{
	if(type){res.setHeader("Content-Type","text/"+type);}
	res.setHeader("Content-Encoding","utf-8");
	res.writeHead(200);
	res.end(data);
}
function badurl(url,res)
{
	res.writeHead(404);
	console.log("Failed query for "+req.url);
}
var server=http.createServer(function(req,res)
	{
		var txttest=/room[0-9]+.txt/;
		if(req.url=="/")
		{
			fs.readFile(__dirname+"/getloud.html",function(err,data)
			{
				if(err){badurl(req.url,res);}
				data=(""+data).replace("%PORT%",process.env.PORT||1776);
				send(data,"html",res);
			});
		}
		else if(req.url=="/jquery")
		{
			fs.readFile(__dirname+"/jquery.min.js",function(err,data)
			{
				if(err){badurl(req.url,res);}
				send(data,"javascript",res);
			});
		}
		else if(txttest.exec(req.url))
		{
			fs.readFile(__dirname+"/"+req.url,function(err,data)
			{
				if(err){badurl(req.url,res);}
				send(data,false,res);
			});
		}
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
	socket.nickname="Guest"+guestserial;
	guestserial++;
	socket.on("newpost",function(data)
	{
		console.log(data);
		var post={"id":index,"rot":random(-45,45),"top":random(10,70),"left":random(0,70),"msg":data,"serial":serial};
		sio.sockets.emit("update",post);
		if(posts[index]){sio.sockets.emit("remove",index);}
		posts[index]=post;
		index++;
		if(index>19){index=0;}
		serial++;
	});
	socket.on("enterroom",function(data)
	{
		console.log("data is here: "+active_rooms[data]);
		if(active_rooms[data])
		{
			console.log("Good news");
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
		console.log("later it's here: "+active_rooms[data]);
	});
	for(var x=0;x<20;x++)
	{
		if(posts[x])
		{
			socket.emit("update",posts[x]);
		}
	}
});
