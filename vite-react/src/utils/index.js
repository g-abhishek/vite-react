const debounce = (fn, timer = 300) => {
  let timenout = null;

  return (...rest) => {
    if (timenout) clearTimeout(timenout);

    timenout = setTimeout(() => {
      fn(...rest);
    }, timer);
  };
};

const isObject = (value) => value !== null && typeof value === "object";

const cloneDeep = (obj) => {
  if (!isObject(obj)) return obj;
  if (Array.isArray(obj)) return obj.map((i) => cloneDeep(i));

  const result = {};
  for (let key in obj) {
    result[key] = cloneDeep(obj[key]);
  }

  return result;
};

export { debounce, cloneDeep };
