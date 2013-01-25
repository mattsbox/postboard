var http=require("http");
var fs=require("fs");
var io=require("socket.io");
var chat=require("./loudroom.js");
var server=http.createServer(function(req,res)
	{
		if(req.url=="/")
		{
			fs.readFile(__dirname+"/getloud.html",function(err,data)
			{
				if(err)
				{
					res.writeHead(404);
					console.log("Failed query for "+req.url);
					res.end(JSON.stringify(err));
				}
				res.setHeader("Content-Type","text/html");
				res.setHeader("Content-Encoding","utf-8");
				res.writeHead(200);
				console.log("Succesful query for "+req.url);
				res.end(data.replace("%PORT%",process.env.PORT||1776));
			});
		}
	});
server.listen(process.env.PORT || 1776);
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
			active_rooms[data]=chat.create_room(data,socket);
		}
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
