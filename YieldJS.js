/*The MIT License (MIT)

Copyright (c) 2016 Shine Xavier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/


Array.prototype.getEnumerator = function () {
    "use strict";
    var inList = this,
        QueryBuilder = function () {
            this.inList = inList;
            this.outList = [];
            this.current = null;
            this.index = 0;
            this.moveNext = null;
            this.toArray = null;
            this.reset = null;
            this.filter = null;
            this.unique = null;
            this.skip = null;
            this.order = null;
            this.transform = null;
        },
        it = new QueryBuilder(inList),
        yieldIndex = -1,
        iterStarted = false,//Composition Lock
        getCurrentElement = function () {
            console.log("getCurrentElement : ", it.current);
            return it.current;
        },
        evalNextElement = getCurrentElement,
        unique = function () {
            var getUniqueElement = function () {
                console.log("getUniqueElement : ", it.current);
                return (it.outList.indexOf(it.current) < 0) ? it.current : null;
            };
            return composeEagerEvalMethods(getUniqueElement);
        },
        skip = function (count) {
            var getSkippedElement = function () {
                console.log("getSkippedElement : ",it.index, ((it.index % (count + 1)) === 0));
                return ((it.index % (count + 1)) === 0) ? it.current : null;
            };
            return composeIterMethods(getSkippedElement);
        },
        transform = function (select) {
            var getTransformedElement = function () {
                console.log("getTransformedElement : ", select(it.current));
                return select(it.current);
            };
            return composeIterMethods(getTransformedElement);
        },
        filter = function (condition) {
            var getFilteredElement = function () {
                console.log("getFilteredElement : ", condition(it.current));
                return condition(it.current) ? it.current : null;
            };
            return composeIterMethods(getFilteredElement);
        },
        eagerEvaluate = function () {
            console.log("eagerEvaluate-1...............................>",yieldIndex, inList);
            //yieldIndex = -1;
            reset();
            inList = toArray();
            console.log("it.index &&&&&&&&&&&&&&&&&&&&&&&&&&  ", it.index);
            reset();
            console.log("eagerEvaluate-2...............................>",yieldIndex,inList);
        },
        composeEagerEvalMethods = function (fn) {
            if (!iterStarted) {//Lock Composition to prevent any side effects during Enumeration            
                composeIterMethods(fn);
                composeIterMethods(getCurrentElement, true);
            }
            return it;
        },
        isYieldEmpty = function () {
            return ((yieldIndex + 1) > inList.length);
        },
        moveNext = function () {
            iterStarted = true;//Set Composition Lock
            yieldIndex += 1;
            if (!isYieldEmpty()) {
                it.current = inList[yieldIndex];
                it.index += 1;
                return evalNext();
            } else {
                yieldIndex -= 1;//Prevents overflow
                it.index -= 1;
                return false;
            }
        },
        evalNext = function () {
            it.current = evalNextElement.apply(inList);
            if (it.current !== null) {
                it.outList.push(it.current);
                return true;
            }
            return moveNext();
        },
        composeIterMethods = function (fn, eagerEval) {
            if (!iterStarted) {//Lock Composition to prevent any side effects during Enumeration
                var evalNextElementTmp = evalNextElement,
                    eagerEvalStart = false;
                if (eagerEval === true) {
                    eagerEvalStart = true;
                    evalNextElement = function () {
                        var a = evalNextElement,
                            b = yieldIndex,
                            c = iterStarted;
                        evalNextElement = evalNextElementTmp;
                        if (eagerEvalStart) {
                            eagerEvaluate.apply(inList);
                            eagerEvalStart = false;
                        }
                        evalNextElement = a;
                        yieldIndex = b;
                        iterStarted = c;
                        it.current = inList[yieldIndex];
                        return (it.current === null) ? null : fn.apply(inList);
                    };
                } else {
                    evalNextElement = function () {
                        it.current = evalNextElementTmp.apply(inList);
                        return (it.current === null) ? null : fn.apply(inList);
                    };
                }
            }
            return it;
        },
        toArray = function () {
            while (moveNext()) {
                //Force chained evaluation of continuation methods (if any).
            }
            return it.outList.slice();
        },
        reset = function () {
            yieldIndex = -1;
            iterStarted = false;//Release Composition Lock
            it.index = 0;
            it.outList.length = 0;
            it.outList = [];
            it.current = null;
        };
    it.outList = [];
    it.current = null;
    it.moveNext = moveNext;
    it.toArray = toArray;
    it.reset = reset;
    it.unique = unique;
    it.filter = filter;
    it.skip = skip;
    it.transform = transform;
    return it;
};

//Test Harness
function unique(context) {
    "use strict";
    return (context.outList.indexOf(context.current) < 0) ? context.current : null;
}

function square(val) {
    "use strict";
    return (val * val);
}

function filter(condition) {
    "use strict";
    return function (context) {
        return condition(context.current) ? context.current : null;
    };
}

function even(val) {
    "use strict";
    return (val % 2 === 0);
}

function reject4multiples(val) {
    "use strict";
    return (val % 4 !== 0);
}

function skip(count) {
    "use strict";
    return function (context) {
        //console.log(this.index.toString() + " : " + this.current.toString());
        return ((context.index % (count + 1)) === 0) ? context.current : null;
    };
}

var x = [1, 7, 5, 11, 2, 4, 3, 200, 1, 2, 3, 8, 6, 200],
    continuation = x.getEnumerator().skip(2).unique().filter(reject4multiples).unique().transform(square).unique();//.toArray().getEnumerator();
//console.log(continuation.filter(even).unique().toArray());
//continuation.reset();
//console.log(continuation.toArray());
//continuation.reset();
while (continuation.moveNext()) {
    console.log(continuation.current + " [" + continuation.index + "]");
    //console.log(continuation.index);
}
console.log(continuation.toArray());
console.log(continuation.outList);
console.log(continuation.toArray());
console.log(continuation.toArray());

