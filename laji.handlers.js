var sys = require('sys'),
	step = require('./lib/step'),
	fs = require('fs'),
	url = require('url'),
	path = require('path');

var laji = {};

laji.helpers = require('./laji.helpers');
laji.canned = require('./laji.canned');
laji.config = require('./laji.config');
laji.handlers = exports;

/*
    return: true for handled, means the response is ended, no further handling required.
*/
exports.fileCacheHandler = function(req, res, mtime){
    var ims = req.headers["if-modified-since"];
    var dtIms = null;
    var dtLm = new Date(mtime);
    
    if (ims != null && ims != ""){
        dtIms = new Date(ims);
    }
    
    if (dtIms != null && 
        (dtIms > dtLm || dtIms.getTime() == dtLm.getTime())){
        
        laji.canned.r304(res);
        
        return true;
    }
    
    return false;
}

exports.fileHandler = function(req, res, absPath){
	var resStep = new step.steps;
	var rurl = url.parse(req.url);
	
	resStep.step(function(){
			fs.stat(absPath, this.next.callback);
		})
		.step(function(err, stat){
			if(err){
	            laji.canned.r404(res, rurl.query);
	            return;
	        }
			
			// we don't serv default page
			if (stat.isDirectory() == true){
				laji.canned.r404(res. rurl.query);
				return;
			}
			var ext = path.extname(absPath).replace('.','');
			var contentType = laji.config.exts[ext];
			
			sys.log('trying to get: ' + absPath);
			
			if (laji.handlers.fileCacheHandler(req, res, stat.mtime)){
			    return;
			}
			
			res.writeHead(200, {
			        'Content-Type': contentType,
			        'Content-Disposition': 'inline; filename=' + path.basename(absPath),
			        'Content-Length': stat.size,
			        'Last-Modified': laji.helpers.getLastModified(stat.mtime)
			    });
			try{
		        fs.readFile(absPath, this.next.callback);
	        }
	        catch(ex){
		        res.write("Error: " + ex.message);
	        }
			
		})
		.step(function(err, data){
			if (err){
				laji.canned.r404(res, rurl.query);
				return;
			}
			
			res.write(data);
			res.end();
		})
		.go();
};