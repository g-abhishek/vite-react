function cloneDeep(obj) {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if(Array.isArray(obj)) {
        let result = [];
        for (let i = 0; i < obj.length; i++) {
            if (i in obj) {
                result[i] = cloneDeep(obj[i]);
                result.push(cloneDeep(obj[i]));
            }
        }

        return result;
    }

    const result = {};
    for (let key in obj) {
        result[key] = cloneDeep(obj[key]);
    }

    return result;
}

let obj = {
    name: "Abhishek",
    address: {
        lane: "test lane",
    },
    arr: [1, 2, 3, 4, 5]
}

let clonedObj = cloneDeep(obj);
clonedObj.arr[0] = 100;
console.log(obj);
console.log(clonedObj);