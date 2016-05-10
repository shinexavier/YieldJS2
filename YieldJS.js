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


Array.prototype.getEnumerator = function (debugMode) {
    "use strict";
    var inList = this,
        QueryBuilder = function () {
            this.current = null;
            this.index = -1;
            this.moveNext = null;
            this.toArray = null;
            this.reset = null;
            this.where = null;
            this.distinct = null;
            this.skip = null;
            this.skipEvery = null;
            this.skipWhile = skipWhile;
            this.take = null;
            this.takeWhile = null;
            this.order = null;
            this.transform = null;
        },
        it = new QueryBuilder(inList),
        yieldIndex = -1,
        iterStarted = false,//Composition Lock
        outList = [],
        exLog = console.log,
        debug = {},
        getCurrentElement = function () {
            debug.log("getCurrentElement : ", it.current);
            return it.current;
        },
        evalNextElement = getCurrentElement,
        distinct = function () {
            var getDistinctElement = function () {
                debug.log("getDistinctElement : ", it.current);
                return (outList.indexOf(it.current) < 0) ? it.current : null;
            };
            return composeEagerEvalMethods(getDistinctElement);
        },
        skipEvery = function (count) {
            var getSkippedEveryElement = function () {
                debug.log("getSkippedEveryElement : ",it.index, ((it.index % (count + 1)) === 0));
                return ((it.index % (count + 1)) === 0) ? it.current : null;
            };
            return composeEagerEvalMethods(getSkippedEveryElement);
        },
        skip = function (count) {
            var getSkippedElement = function () {
                debug.log("getSkippedElement : ",it.index, (it.index > (count - 1)));
                return (it.index > (count - 1)) ? it.current : null;
            };
            return composeEagerEvalMethods(getSkippedElement);
        },
        skipWhile = function (condition) {
            var predicate = true,
                getSkippedWhileElement = function () {
                    if (predicate) {
                        predicate = condition(it.current);
                    }
                    debug.log("getSkippedWhileElement : ", predicate);
                    return (predicate) ? null : it.current;
                };
            return composeEagerEvalMethods(getSkippedWhileElement);
        },
        take = function (count) {
            var getTakenElement = function () {
                debug.log("getTakenElement : ",it.index, (it.index < (count - 1)));
                return (it.index < (count - 1)) ? it.current : null;
            };
            return composeEagerEvalMethods(getTakenElement);
        },
        takeWhile = function (condition) {
            var predicate = true,
                getTakenWhileElement = function () {
                    if (predicate) {
                        predicate = condition(it.current);
                    }
                    debug.log("getTakenWhileElement : ", predicate);
                    return (predicate) ? it.current : null;
                };
            return composeEagerEvalMethods(getTakenWhileElement);
        },
        transform = function (select) {
            var getTransformedElement = function () {
                debug.log("getTransformedElement : ", select(it.current));
                return select(it.current);
            };
            return composeIterMethods(getTransformedElement);
        },
        where = function (condition) {
            var getFilteredElement = function () {
                debug.log("getFilteredElement : ", condition(it.current));
                return condition(it.current) ? it.current : null;
            };
            return composeIterMethods(getFilteredElement);
        },
        eagerEvaluate = function () {
            debug.log("eagerEvaluate-START >>>>>>>>>>>>>>>>>>>>>>>>>",inList);
            reset();
            inList = toArray();
            reset();
            it.index += 1;
            debug.log("eagerEvaluate-END <<<<<<<<<<<<<<<<<<<<<<<<<<<",inList);
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
                //it.index -= 1;
                return false;
            }
        },
        evalNext = function () {
            it.current = evalNextElement.apply(inList);
            if (it.current !== null) {
                outList.push(it.current);
                return true;
            } else {
                return moveNext();
            }
        },
        composeIterMethods = function (fn, eagerEval) {
            if (!iterStarted) {//Lock Composition to prevent any side effects during Enumeration
                var evalNextElementTmp = evalNextElement,
                    eagerEvalStart = false;
                if (eagerEval === true) {
                    eagerEvalStart = true;
                    evalNextElement = function () {
                        var evalNextElementPrev = evalNextElement,//Saving current state...
                            yieldIndexPrev = yieldIndex,
                            iterStartedPrev = iterStarted;
                        evalNextElement = evalNextElementTmp;
                        if (eagerEvalStart) {
                            eagerEvaluate.apply(inList);
                            eagerEvalStart = false;
                        }
                        evalNextElement = evalNextElementPrev;//Restoring current state...
                        yieldIndex = yieldIndexPrev;
                        iterStarted = iterStartedPrev;
                        if (!isYieldEmpty()) {
                            it.current = inList[yieldIndex];
                        }
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
            return outList.slice();
        },
        reset = function () {
            yieldIndex = -1;
            iterStarted = false;//Release Composition Lock
            it.index = -1;
            outList.length = 0;
            outList = [];
            it.current = null;
        };
    debug.log = function(msg) {
        if (debugMode) {
            exLog.apply(this, arguments);
        }
    };
    it.current = null;//Returns the current Iterator Element
    it.moveNext = moveNext;//Moves the Iterator Record Pointer to the Next Element in the input sequence
    it.toArray = toArray;//Forces One round of Iteration and Returns the output sequence
    it.reset = reset;//Resets the Iterator State to facilitate Re-use
    it.distinct = distinct;//Returns a sequence that excludes duplicates
    it.where = where;//Returns a subset of elements that satisfy a given condition
    it.skip = skip;//Ignores the first count elements and returns the rest
    it.skipEvery = skipEvery;//Ignores every 'n' elements denoted by count
    it.skipWhile = skipWhile;//Ignores elements from the input sequence until the predicate is false, and then emits the rest
    it.take = take;//Returns the first count elements and discards the rest
    it.takeWhile = takeWhile;//Emits elements from the input sequence until the predicate is false
    it.transform = transform;//Transforms the elements in the input sequence
    return it;//Returns the Iterator object
};

//Test Harness
function square(val) {
    "use strict";
    return (val * val);
}

function even(val) {
    "use strict";
    return (val % 2 === 0);
}

function reject4multiples(val) {
    "use strict";
    return (val % 4 !== 0);
}


var x = [1, 7, 5, 11, 2, 4, 3, 200, 1, 2, 3, 8, 6, 200],
    continuation = x.getEnumerator(true).takeWhile(reject4multiples).transform(square).skip(3);

while (continuation.moveNext()) {
    console.log("OUT >> ",continuation.current);
}
console.log(continuation.toArray());


