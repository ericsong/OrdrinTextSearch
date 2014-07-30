(function(){

  var http = require("http"),
      express = require("express"),
      menuUtils = require("./utils/menuUtils"),
      app = express(),
      server = http.createServer(app);

  app.configure(function(){
    app.set('port', process.env.PORT || 8000);
    app.set('address', process.env.ADDRESS || 'localhost');
    app.use(express.bodyParser());
  });

  app.get('/TextSearch', function(req, res){
    var rid = req.query.rid;
    var target = req.query.target;
    var size = req.query.size;
    var groupLevelMatching = false;
    
    if(req.query.groupLevelMatching === 'true') {
      groupLevelMatching = true;  
    }

    console.log("Searching for " , target);

    menuUtils.getMatches({
      rid: rid,
      target: target,
      size: size, 
      groupLevelMatching: groupLevelMatching
    }, function(data){
      res.send(data);
    });
  });

  server.listen(app.get('port'), function(){
    console.log("Listening on port " + app.get('port'));
  });
})();
