import useCounter from "../../hooks/useCounter";

const CustomHook = () => {
  const { count, increment, decrement, reset } = useCounter(5);
  return (
    <>
      <div>
        <p>Custom Hooks</p>
        <div>
          <p>Count: {count}</p>
          <button onClick={increment}>Increment</button>
          <button onClick={decrement}>Decrement</button>
          <button onClick={reset}>Reset</button>
        </div>

        <br />
        <br />
        <code>
          A custom hook in React is a reusable function that lets you extract
          and share logic using built-in hooks like useState and useEffect. For
          example, if I need a counter or a debounced input across many
          components, I can create a custom hook like useCounter or useDebounce,
          which helps keep my components clean and logic reusable.
        </code>

        <br />
        <br />
        <div>
          🧠 What is a Custom Hook in React?
          <p>A custom hook is a JavaScript function that:</p>
          <ul>
            <li>
              Uses React's built-in hooks (like useState, useEffect, etc.)
            </li>
            <li>
              And allows you to extract and reuse logic across multiple
              components.
            </li>
          </ul>
          It always starts with use (like useAuth, useForm, useDebounce, etc.)
        </div>

        <br />
        <div>
          ⚠️ Rules of Hooks (Still Apply!)
          <ul>
            <li>Must start with use</li>
            <li>
              Can only be called inside React function components or other
              custom hooks
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default CustomHook;
