var sys=require('sys'),
	fs = require('fs'),
	url = require('url'),
	http = require('http'),
	step = require('./lib/step'),
	path = require('path');

var laji = exports;

laji.helpers = require('./laji.helpers');
laji.handlers = require('./laji.handlers');
laji.canned = require('./laji.canned');
laji.config = require('./laji.config');

laji.port = 80;
laji.webroot = "./webroot";
laji._default = "default.htm";
laji.connectionTimeout = 1000 * 60;
// storing cached node module
laji._loaded = {
};


/* 
function: start

start the server
*/
laji.start = function(){
	// hook to global uncaught in order to prevent crash
	process.addListener('uncaughtException' , function(err){
		sys.log('Uncaught!!!' + err.message);
	});
	var server = http.createServer(function(req, res){
	    // close the connection after timeout
//        setTimeout(function(){
//            if (!res._isEnded){
//                try{
//                    laji.canned.r500(res, 'timeout');
//                }
//                catch(ex){
//                    sys.log('Error' + ex.message);
//                }
//            }
//        }, laji.connectionTimeout);
		laji.router.apply(laji, arguments);
	});
	server.listen(this.port);
	server.addListener('error', function(err){
	    sys.log("error" + err.message);
	});
	sys.puts('Server started on port ' + this.port + '!');
};

/*
function: router

routes the http request
*/
laji.router = function(req, res){
	var rurl = url.parse(req.url);
	var contentType = 'application/octet-stream';
	if (rurl.pathname == null){
	    laji.canned.r400(res, 'bad request, very bad.');
		return;
	}
	var filePath = this.webroot + rurl.pathname;
	var dotIndex = rurl.pathname.lastIndexOf('.');
	var handlerLoadingStep = new step.steps();
	if (dotIndex != -1){
		var ext = rurl.pathname.substr(dotIndex+1, rurl.pathname.length - dotIndex - 1);
		var sPath = rurl.pathname.substr(0, dotIndex);
		var sDir = path.dirname(rurl.pathname);
		var modulePath = laji.webroot + sPath;
		// hard coded redirect for 'node' extension
		if (ext == "node"){
		    handlerLoadingStep
		        .step(function(){
		            req.pause();
		            var data = fs.readFileSync(filePath);
		            this.next.callback(null, data);
		        })
		        .step(function(err, data){
		            req.resume();
		            if (err){
		                laji.canned.r500(res, 'node script ' + filePath + ' cannot be opened: ' + err.message);
		                return;
		            }
    		        
		            var sData = data.toString();
		            try{
		                var srvScript = JSON.parse(sData);
		            }
		            catch(ex){
		                laji.canned.r500(res, ex.message);
		                return;
		            }
		            
		            var handlerPath = laji.webroot + path.join(sDir, srvScript.handler);
    		        
		            // see if it is loaded
		            if (laji._loaded[handlerPath] == null){
		                try{
		                    sys.log('starting to load module:' + handlerPath);
		                    req.pause();
		                    laji._loaded[handlerPath] = require(handlerPath);
		                    req.resume();
		                }
		                catch(ex){
		                    sys.log('exception while loading module:' + ex.message);
		                    laji._loaded[handlerPath] = null;
		                }
		                finally{
		                    //...
		                }
		            }
		            // stop response if the node handle cannot be loaded.
		            if (laji._loaded[handlerPath] == null || laji._loaded[handlerPath].handle == null){
		                laji.canned.r500(res, 'cannot execute specified node handler:' + handlerPath + 
							'. the export object is null or handle function didnot implemented');
		                return;
		            }
		            try{
		                laji._loaded[handlerPath].handle(req, res, laji, srvScript);
		            }
		            catch(ex){
		                laji.canned.r500(res, ex.message);
		                return;
		            }
		            return;
		        })
		        .go();
		    return;
		}
		
		if (laji.config.exts[ext]){
			contentType = laji.config.exts[ext];
		}
		else if(rurl.pathname == "/"){
			contentType = laji.config.exts["htm"];
		}
		
	}
	var staticRoutingStep = new step.steps();
	staticRoutingStep
	    .step(function(){
	        fs.stat(filePath, this.next.callback);
	    })
	    .step(function(err, stat){
	        if(err){
	            laji.canned.r404(res, filePath);
	            return;
	        }
	        var isDir = false;
	        // end with '/' and is directory
	        if (stat.isDirectory() == true && rurl.pathname.lastIndexOf('/') == rurl.pathname.length - 1){
		        contentType = laji.config.exts["htm"];
		        isDir=true;
	        }
	        
	        sys.log("Request:" + rurl.pathname);
	        
	        // if it is dir, we need to access the default file under that dir
	        if (isDir){
		        filePath = laji.webroot + path.join(rurl.pathname, laji._default);
	        }
	        
	        // get file modified time
	        // use client cache if neccessary
	        var mtime = "";
	        
	        if (isDir){
	            // refetch mtime
	            mtime = laji.helpers.getLastModified(fs.statSync(filePath).mtime);
	        }
	        else{
	            mtime = laji.helpers.getLastModified(stat.mtime);
	        }
	        
	        if (laji.handlers.fileCacheHandler(req, res, mtime)){
	            return;
	        }
	        
	        // start to response file
	        
	        var headers = {
	            'Content-Type': contentType,
	            'Last-Modified': mtime
	        };
	        
	        var statusCode = 200;
	        
	        res.writeHead(statusCode, headers);
        	
	        try{
         
		        fs.readFile(filePath,
			        function(err, data){
				        if (err){
							laji.canned.r404(res, filePath);
					        return;
				        }
        				
				        res.write(data);
				        res.end();
			    });
	        }
	        catch(ex){
		        res.write("Error: " + ex.message);
	        }
	    })
	    .go();
};
