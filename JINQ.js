var JINQ = {};

JINQ.from = function (data) {
	var dataSource = data,
		that = null;
	//that.dataSource = dataSource;
	
	var func = function (transformFunc) {
		return function (transformFunc) {
			return JINQ.from(transformFunc(dataSource));
		};
	}();
	
	var where = function (predicate) {
		return function (predicate) {
			var orgdataSource = dataSource;
			var newdataSource = [];
			for (var i = 0; i < orgdataSource.length; i++) {
				var item = orgdataSource[i];
				if (predicate(item)) {
					newdataSource.push(item);
				}
			}
			return JINQ.from(newdataSource);
		};
	}();
	
	var select = function () {
		return function () {
			return dataSource;
		};
	}();

	var sortASCPredicate = function (a, b) {
		if (typeof a === typeof b) {
			return a < b ? -1 : 1;
		}
		return typeof a < typeof b ? -1 : 1;
	};
	
	var sortDESCPredicate = function (a, b) {
		if (typeof a === typeof b) {
			return a > b ? -1 : 1;
		}
		return typeof a > typeof b ? -1 : 1;
	};
	
	var by = function (name, sortPredicate, minor) {
		return function (o, p) {
			var a, b;
			if (o && p && typeof o === 'object' && typeof p === 'object') {
				a = o[name];
				b = p[name];
				if (a === b) {
					return typeof minor === 'function' ? minor(o, p) : 0;
				}
				return sortPredicate(a, b);
			} else {
				throw {
					name: 'Sort Error',
					message: 'Expected an object when sorting by ' + name
				};
			}
		};
	};

	var sortBy = function() {
		var argsCount = arguments.length - 1;
		var sortFunc = by(arguments[argsCount], sortASCPredicate);
		for (var i = argsCount - 1; i >= 0; i--) {
			sortFunc = by(arguments[i], sortASCPredicate, sortFunc);
		}
		return JINQ.from(dataSource.sort(sortFunc));
	};

	var sortByDescending = function() {
		var argsCount = arguments.length - 1;
		var sortFunc = by(arguments[argsCount], sortDESCPredicate);
		for (var i = argsCount - 1; i >= 0; i--) {
			sortFunc = by(arguments[i], sortDESCPredicate, sortFunc);
		}
		return JINQ.from(dataSource.sort(sortFunc));
	};
	
	var curry = function (fn) {
		var slice = Array.prototype.slice,
			args = slice.apply(arguments);
		return function () {
			return fn.apply(null, args.concat(slice.apply(arguments)));
		};
	};
	
//	by.prototype.curry = curry;
/*	Function.prototype.curry = function() {
		var fn = this, args = Array.prototype.slice.call(arguments);
		return function() {
		  return fn.apply(this, args.concat(
			Array.prototype.slice.call(arguments)));
		};
	  };
*/	  
//	that.
    that = {
        "select" : select,
        "where" : where,
        "func" : func,
		"sortBy" : curry(sortBy),
		"sortByDescending" : curry(sortByDescending)
    };
    return that;
};

var square = function (p) {
	for (var i = 0; i < p.length; i ++) {
		p[i] =  p[i]*p[i];
	}
	return p;
};

var smallNumbers = function (p) {
	return p < 5;
}

var largeNumbers = function (p) {
	return p > 5;
}

	var by = function (name, minor) {
		return function (o, p) {
			var a, b;
			if (o && p && typeof o === 'object' && typeof p === 'object') {
				a = o[name];
				b = p[name];
				if (a === b) {
					return typeof minor === 'function' ? minor(o, p) : 0;
				}
				if (typeof a === typeof b) {
					return a > b ? -1 : 1;
				}
				return typeof a > typeof b ? -1 : 1;
			} else {
				throw {
					name: 'Sort Error',
					message: 'Expected an object when sorting by ' + name
				};
			}
		};
	};
var s = [
    {
        "first": "C",
        "middle": "B",
        "last": "A"
    },
    {
        "first": "C",
        "middle": "C",
        "last": "A"
    },
    {
        "first": "C",
        "middle": "A",
        "last": "A"
    },
    {
        "first": "B",
        "middle": "C",
        "last": "A"
    },
    {
        "first": "C",
        "middle": "B",
        "last": "A"
    },
    {
        "first": "A",
        "middle": "C",
        "last": "B"
    },
    {
        "first": "B",
        "middle": "A",
        "last": "C"
    }
];

// console.log(s.sort(by('last', by('first', by('middle')))));
function copy(o){
  var copy = Object.create( Object.getPrototypeOf(o) );
  var propNames = Object.getOwnPropertyNames(o);
 
  propNames.forEach(function(name){
    var desc = Object.getOwnPropertyDescriptor(o, name);
    Object.defineProperty(copy, name, desc);
  });
 
  return copy;
}

function join(o,o2){
  var copy = {};
  var propNames1 = Object.getOwnPropertyNames(o);
  var propNames2 = Object.getOwnPropertyNames(o2);
  var desc;
  propNames1.forEach(function(name){
    desc = Object.getOwnPropertyDescriptor(o, name);
	 console.log(desc);
    Object.defineProperty(copy, name, desc);
  });
  console.log(copy);
	propNames2.forEach(function(name){
	desc = Object.getOwnPropertyDescriptor(o2, name);
	console.log(desc);
	Object.defineProperty(copy, name, desc);
	});
 
  return copy;
} 
//x = [0,1,2,3,4,5,6,7,8,9];
var x = JINQ.from(copy(s));
console.log(x.select());
console.log(x.sortByDescending('last', 'first', 'middle').select());
console.log(s.sort(by('last', by('first', by('middle')))));
function logArrayElements(element, index, array) {
    console.log("a[" + index + "] = " + element);
}
[2, 5, 9].forEach(logArrayElements);
copy([2, 5, 9]).forEach(logArrayElements);
console.log(Array.isArray([2, 5, 9]));
console.log(Array.isArray(copy([2, 5, 9])));

// console.log(x.where(smallNumbers).select());
// console.log(x.where(largeNumbers).select());
// console.log(x.func(square).where(largeNumbers).select());


var s1 = [
    {
        "Name": "Shine",
        "Age": 35,
        "Dept": 3
    },
    {
        "Name": "Sreejai",
        "Age": 35,
        "Dept": 2
    },
    {
        "Name": "Abhilash",
        "Age": 35,
        "Dept": 2
    },
    {
        "Name": "Pai",
        "Age": 35,
        "Dept": 3
    }
];

var s2 = [
    {
        "Dept": 2,
        "Name": "COE"
    },
    {
        "Dept": 3,
        "Name": "COO"
    }
];

var joins1s2 = function(element) {
	return copy(element).prototype.DeptName = "COO";
};
console.log(s1.map(copy));
console.log(join(s1,s2));
