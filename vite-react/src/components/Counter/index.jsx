import { useState } from "react";

const Counter = () => {
  let [counter, setCounter] = useState(0);

  const onIncrement = () => {
    setCounter(() => counter + 1);
  };
  const onDecrement = () => {
    setCounter(() => counter - 1);
  };

  return (
    <>
      <div className="wrapper">
        <p className="counter-number">{counter}</p>
        <div>
          <button onClick={onIncrement}>Increament</button>
          <button onClick={onDecrement}>Decrement</button>
        </div>
      </div>
    </>
  );
};

export default Counter;
