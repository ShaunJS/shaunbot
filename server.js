var app = require ('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const fs = require('fs');
const mtgdatafile = "mtgCurrent.json";
const scriptfile = "serverscript.html";

app.get('/', (req, res) => {
	if (req.url === '/') {
		res.setHeader('Content-Type', 'text/html');
		var responsestring = "<div id=mtgdata>" + "..loading data.." + "</div>";
		responsestring += fs.readFileSync(scriptfile);
		res.end(responsestring);
		console.log(responsestring);
	}
	console.log(req.url);
})



http.listen(8080, function() {
	console.log('Im listening on port 8080');
});


io.on('connection', (socket) => {
  console.log('a user connected');
  io.emit('data change',  "<div id=mtgdata>" + mtgString(JSON.parse(fs.readFileSync(mtgdatafile))) + "</div>");


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

	let fsWait = false
	fs.watch(mtgdatafile, (event, filename) => {
		if (filename){
			if (fsWait) return;
			fsWait = setTimeout(() => {
				fsWait = false;
			}, 50);
			console.log("changes detected");
			io.emit('data change',  "<div id=mtgdata>" + mtgString(JSON.parse(fs.readFileSync(mtgdatafile))) + "</div>");
		}
	});

});


function mtgString(_data){
	var _string = "";
	for (var _player in _data)
	{
		_string += _data[_player].name;
		_string += " - ";
		_string += _data[_player].life;
		_string += "</br>";
	}
	return _string;
}
