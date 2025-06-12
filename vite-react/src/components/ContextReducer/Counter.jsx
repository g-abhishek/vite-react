import { useContext } from "react";
import { CounterContext } from "./CounterContext";

const Counter = () => {
  const { state, dispatch } = useContext(CounterContext);

  return (
    <>
      <div>
        Context + Reducer
        <div>Count: {state.count}</div>
        <button onClick={() => dispatch("increment")}>Increment</button>
        <button onClick={() => dispatch("decrement")}>Decrement</button>
        <button onClick={() => dispatch("reset")}>Reset</button>
      </div>
    </>
  );
};

export default Counter;
