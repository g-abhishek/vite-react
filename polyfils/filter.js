const arr = [1, 2, 3, 4, 5, 6];
const res = arr.filter((item, index) => {
    return item % 2 === 0;
})

// console.log(res);

Array.prototype.myFilter = function(callback) {
    if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
    }

    let result = [];
    for (let i = 0; i < this.length; i++) {
        // "i in this" => it checks if the array index actually exists (not a hole / empty slot).
        if (i in this && callback(this[i], i, this)) {
            result.push(this[i]);
        }
    }

    return result;
}

let res2 = arr.myFilter((item, index, array) => {
    return item % 2 === 0;
})
console.log(res2);