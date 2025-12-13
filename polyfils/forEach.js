let arr = [1, 2, 3, 4, 5, 6];
arr.forEach((item, index, array) => {
    console.log(item, index, array);
})

Array.prototype.myForEach = function(callback) {
    if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
    }

    for (let i = 0; i < this.length; i++) {
        if(i in this) {
            callback(this[i], i, this)
        }
    }
};
