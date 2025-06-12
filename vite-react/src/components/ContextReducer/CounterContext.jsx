import { createContext, useReducer } from "react";

const initialState = {
  count: 0,
};

const reducer = (state, action) => {
  switch (action) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      console.log("Invalid Action");
  }
};

export const CounterContext = createContext();

export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <CounterContext value={{ state, dispatch }}>{children}</CounterContext>
  );
};
