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
            this.outList = [];
            this.current = null;
            this.index = -1;
            this.moveNext = null;
            this.toArray = null;
            this.reset = null;
            this.filter = null;
            this.unique = null;
            this.skip = null;
            this.order = null;
            this.transform = null;
        },
        it = new QueryBuilder(),
        yieldIndex = -1,
        iterStarted = false,//Composition Lock
        getCurrentElement = function () {
            console.log("getCurrentElement : ", this.current);
            return this.current;
        },
        evalNextElement = getCurrentElement,
        unique = function () {
            var getUniqueElement = function () {
                console.log("getUniqueElement : ", this.current);
                return (this.outList.indexOf(this.current) < 0) ? this.current : null;
            };
            return eagerEvaluate(getUniqueElement);
        },
        transform = function (select) {
            var getTransformedElement = function () {
                console.log("getTransformedElement : ", select(this.current));
                return select(this.current);
            };
            return composeIterMethods(getTransformedElement);
        },
        filter = function (condition) {
            var getFilteredElement = function () {
                console.log("getFilteredElement : ", condition(this.current));
                return condition(this.current) ? this.current : null;
            };
            return composeIterMethods(getFilteredElement);
        },
        eagerEvaluate = function (composeFunction) {
            var cFunc = composeIterMethods(composeFunction);
            if (!iterStarted) {//Lock Composition to prevent any side effects during Enumeration
                inList = toArray().slice();
                reset();
                evalNextElement = getCurrentElement;
                //console.log("After: ", inList, yieldIndex, evalNextElement);
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
                return evalNext();
            } else {
                yieldIndex -= 1;//Prevents overflow
                return false;
            }
        },
        evalNext = function () {
            it.current = evalNextElement.apply(it);
            if (it.current !== null) {
                it.index += 1;
                it.outList.push(it.current);
                return true;
            }
            return moveNext();
        },
        composeIterMethods = function (fn) {
            if (!iterStarted) {//Lock Composition to prevent any side effects during Enumeration
                var evalNextElementTmp = evalNextElement;
                evalNextElement = function () {
                    this.current = evalNextElementTmp.apply(this);
                    return (this.current === null) ? null : fn.apply(this);
                };
            }
            return it;
        },
        toArray = function () {
            while (moveNext()) {
                //Force chained evaluation of continuation methods (if any).
            }
            return it.outList;
        },
        reset = function () {
            yieldIndex = -1;
            iterStarted = false;//Release Composition Lock
            it.index = -1;
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
    it.transform = transform;
    return it;
};