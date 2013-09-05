/*
	图层 manage
	
*/

var layer_function = function(arg){
	for(var a in arg)
			this[a] = arg[a];
}
layer_function.prototype = {
	constructor: layer_function;
	
}