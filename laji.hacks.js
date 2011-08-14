// native hacks
/*
Method: String.macro

Replace specified macro with specified value
*/
String.prototype.macro || (String.prototype.macro = function (macro, value) {
    var re = new RegExp("<%=" + macro + " %>", "g");
    return this.replace(re, value);
});