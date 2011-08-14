/*
*/
exports.getLastModified = function(datetime){
    var str = datetime.toUTCString();
    return str;
};