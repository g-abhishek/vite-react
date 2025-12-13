let arr = [1, 2, 3, 4, 5, 6];
// const res = arr.map((item, index, array) => {
//     console.log(item, index, array);
//     return item * 2;
// })

Array.prototype.myMap = function(callback) {
    if (this === null) {
        throw new Error("Map is called with null or undefined");
    }

    if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
    }

    let array = this;

    let result = [];
    for (let i = 0; i < array.length; i++) {
        result.push(callback(array[i], i));
    }

    return result;
}

const multiplier = { factor: 2 };

console.log(arr.myMap((item, index) => {
    return item * multiplier.factor
}));

/**
 * Understanding how "this" becomes the "array" is the key to understanding how prototype methods work.
 * 
 * ✅ Why is this the array in array.map()?
 * Because when you call a method through an object, JavaScript automatically binds this to that object.
 * 
 * Example:
const arr = [1, 2, 3];
arr.map(x => x * 2);
 * 
 * Here, map is called as a method of arr.
 * 🔹 How JS actually rewrites this under the hood:
 * When you call: arr.map(...)
 * 
 * JavaScript implicitly does something like this:
 * Array.prototype.map.call(arr, ...)
 * So the array (arr) becomes the this inside the method.
 * 
 * 
 * 
 * 
 * 
 * 
 */

/**
 * thisArg part is remaining to be done.
 */