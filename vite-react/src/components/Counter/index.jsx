import { useState } from "react";

const Counter = () => {
  let [counter, setCounter] = useState(0);

  const onIncrement = () => {
    setCounter(() => counter + 1);
  };
  const onDecrement = () => {
    setCounter(() => counter - 1);
  };

  const saveToLocalStorage = () => {
    localStorage.setItem("user", JSON.stringify({ _id: 1 }));
  };
  const removeFromLocalStorage = () => {
    localStorage.removeItem("user");
  };

  return (
    <>
      <div className="wrapper">
        <p className="counter-number">{counter}</p>
        <div>
          <button onClick={onIncrement}>Increament</button>
          <button onClick={onDecrement}>Decrement</button>
        </div>

        <div>
          Click Here to add/remove in localstorage to test HOC:{" "}
          <button onClick={saveToLocalStorage}>Add</button>
          <button onClick={removeFromLocalStorage}>Remove</button>
        </div>
      </div>
    </>
  );
};

export default Counter;
