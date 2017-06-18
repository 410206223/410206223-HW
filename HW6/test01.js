//npm install express @types/express    安裝一下server express是一個伺服器模組

var express = require('express');

var app = express();//express()是新建一個server


var fs = require('fs');

app.get('/', function (req, res) {//app.get('/') 的意思是說 你發送get到'/'路徑底下就會進到這個函數 也就是說 回傳 hello world的字

  //var filenames = fs.readdirSync('data');
  if(req.query.name != null){
    var content = fs.readFileSync('data/' + req.query.name + '.txt', 'utf8');
    res.send(content);
  }
  else
    fs.writeFileSync('data/' + req.query.dataname + '.txt', req.query.data, {encoding: 'utf8'});
});

app.use('/page', express.static('.'));

app.listen(10086, function () {//app.listen是把那個server架在port 10086上
  console.log('listening on port 10086');
});
