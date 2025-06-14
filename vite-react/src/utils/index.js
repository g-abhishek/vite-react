const debounce = (fn, timer = 300) => {
  let timenout = null;

  return (...rest) => {
    if (timenout) clearTimeout(timenout);

    timenout = setTimeout(() => {
      fn(...rest);
    }, timer);
  };
};

export { debounce };
