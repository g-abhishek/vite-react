import { useEffect, useRef } from "react";

const useDebounceCallback = (fn, delay) => {
  const timeout = useRef();

  useEffect(() => {
    // Cleanup on unmount, to clear memory leak
    return () => clearTimeout(timeout.current);
  }, []);

  return (...rest) => {
    if (timeout.current) clearTimeout(timeout.current);

    timeout.current = setTimeout(() => {
      // console.log("vlaue >>>>", ...rest); // uncomment this and comment useEffect to check memmory leak and
      fn(...rest);
    }, delay);
  };
};
export default useDebounceCallback;

/**
 * If want to test the memory leak, steps to produce
 * 1. add console.log() before  fn(...rest);
 * 2. comment useEffect()
 * 3. Type something in the input.
 * 4. Quickly navigate away or unmount the component.
 * 5. Wait for the debounce delay to pass.
 * 6. You will see the logs in console, this is memory leak.
 */
