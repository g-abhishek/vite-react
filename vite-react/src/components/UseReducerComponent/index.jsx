import { useReducer } from "react";

const initialState = 0;
const counterReducer = (state, action) => {
  switch (action) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    case "reset":
      return initialState;
    default:
      console.log("Invalid Action");
  }
};

const UseReducerComponent = () => {
  const [state, dispatch] = useReducer(counterReducer, initialState);

  return (
    <>
      <div>UseReducer Counter: {state}</div>
      <div>
        <button onClick={() => dispatch("increment")}>Increment</button>
        <button onClick={() => dispatch("decrement")}>Decrement</button>
        <button onClick={() => dispatch("reset")}>Reset</button>
      </div>
    </>
  );
};

export default UseReducerComponent;


/**
 * What is useReducer?
 * A React Hook used for managing complex state logic — especially when state depends on previous state or has multiple sub-values.
 * 
 * Why it exists?
 * It brings the Redux-style reducer pattern into React for situations where useState becomes cumbersome.
 * 
 * 📦 Syntax Breakdown
 * const [state, dispatch] = useReducer(reducer, initialState);
 * 
 * reducer: A pure function (state, action) => newState
 * dispatch: Function you call to trigger state updates
 * initialState: Your default state object
 * 
 * 🧰 When to Use useReduce
 * Use it when:
 * You manage multiple related state variables.
 * The next state depends on the previous state.
 * You want to keep logic out of your JSX.
 * You’re building complex forms, step wizards, or state machines.
 * you want a Redux-like pattern without Redux.
 */