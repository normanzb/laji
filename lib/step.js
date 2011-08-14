var steps = function(){
	
	var self = this;
	
	this.callbackWrapper = function(callback){
		return function(){
			if (self.next != null){
				self.next = self.next.next;
			}
			return callback.apply(self, arguments);
		};
	};
	
	this.next = null;
    this.steps = [{callback:this.callbackWrapper(function(){
		this.next.callback();
	}), next: null}];
};
var sp = steps.prototype;
sp.step = function(callback){
    var stepStruct = {callback: this.callbackWrapper(callback), next: null};
    this.steps[this.steps.length - 1].next = stepStruct;
    this.steps.push(stepStruct);
    return this;
};

sp.go = function(){
	
	// if we are just started.
    if (this.next == null){
        this.next = this.steps[0];
    }
    this.next.callback();
    
    return this;
};

exports.steps = steps;