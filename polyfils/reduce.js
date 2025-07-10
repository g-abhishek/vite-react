let arr = [1, 2, 3, 4, 5, 6];
// reduce(callback, initialvalue)
// calback = (acc, curr)
let res = arr.reduce((acc, curr) => acc + curr, 5);

Array.prototype.myReduce = function (callback, initialvalue) {
  if (typeof callback !== "function") {
    throw new Error("Callback must be a function");
  }

  const arr = this;
  let accumulator = 0;
  let startIndex = 0;
  if (initialvalue !== undefined) {
    accumulator = initialvalue;
  } else {
    if (arr.length <= 0) {
      throw new Error("reduce with empty array and no initial value");
    }

    accumulator = arr[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < arr.length; i++) {
    if (i in arr) {
      accumulator = callback(accumulator, arr[i], i, arr);
    }
  }

  return accumulator;
};

let res2 = arr.myReduce((acc, curr) => acc + curr, 5);

console.log(res);
console.log(res2);