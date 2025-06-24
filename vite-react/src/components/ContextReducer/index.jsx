import Counter from "./Counter";
import { ContextProvider } from "./CounterContext";

const ContextReducer = () => {
  return (
    <>
      <ContextProvider>
        <Counter />
      </ContextProvider>
    </>
  );
};

export default ContextReducer;

/**
 * ✅ useReducer Hook — React Made Simple
 * useReducer is an alternative to useState for managing complex state logic in React, especially when:
 * 1. State depends on previous state.
 * 2. State updates are complex or involve multiple sub-values.
 * 3. You want a Redux-like reducer pattern without installing Redux.
 */