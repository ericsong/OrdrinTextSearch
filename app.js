(function(){

  var http = require("http"),
      express = require("express"),
      ordrin = require("ordrin-api"),
      ld = require("./utils/menuUtils"),
      app = express(),
      server = http.createServer(app),
      ordrin_api = new ordrin.APIs("8l3kW3pv2UZXOebdQ-YU9qoUeE8GPPzj7_We-WxbKek", ordrin.TEST);

  app.configure(function(){
    app.set('port', process.env.PORT || 8000);
    app.set('address', process.env.ADDRESS || 'localhost');
    app.use(express.bodyParser());
  });

  app.get('/TextSearch', function(req, res){
    var rid = req.query.rid;
    var target = req.query.target;
    var size = req.query.size;

    getMatches(rid, target, size, 
      function(data){
        res.send(data);
      }
    );
  });

  server.listen(app.get('port'), function(){
    console.log("Listening on port " + app.get('port'));
  });
})();
