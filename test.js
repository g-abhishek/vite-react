let person = {
  name: "abhishek",
  age: "26",
  arr: [1, 2, 4],
  address: {
    street: "test stree",
    city: "test city",
    anc: {
      aa: "aa",
    },
  },
};

const isObject = (value) => value !== null && typeof value === "object";

const deepCopy = (obj) => {
  if (!isObject(obj)) return obj;
  if (Array.isArray(obj)) return obj.map((i) => i);

  const result = {};
  for (let key in obj) {
    result[key] = deepCopy(obj[key]);
  }

  return result;
};

console.log(deepCopy(person));
