/*
namespace: laji.canned

containing canned responses
*/

/*
    internal error
*/
exports.r500 = function(res, msg){
    res.writeHead(500,{'content-type':'text/plain'});
	res.write(msg);
	res.end();
};

/*
    not found
*/
exports.r404 = function(res, file){
	res.writeHead(404,{'content-type':'text/plain'});
	res.write("not found: " + file);
	res.end();
};

/*
   forbidden
*/
exports.r403 = function(res, msg){
	res.writeHead(403, {'content-type': 'text/plain'});
	res.write(msg);
	res.end();
}

/*
    bad request
*/
exports.r400 = function(res, msg){
	res.writeHead(400,{'content-type':'text/plain'});
	res.write(msg);
	res.end();
};

/*
    not modified
*/
exports.r304 = function(res){
	res.writeHead(304,{'content-type':'text/plain'});
	// must not have a body
	res.end();
};
