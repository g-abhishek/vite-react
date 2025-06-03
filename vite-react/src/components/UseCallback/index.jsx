import { useState, memo, useCallback } from "react";

/**
 * with memo it only re-renders when props change
 * else whenevr clicked on counter button , this Button component also rerenders along with Counter component
 */

/**
 * Even if you click only the "Increment" button, the console will log Button rendered again and again, because on Couter Component rerender, new instance handleChildButtonClick is getting created
 * to fix this issue, we need to memoize the handleChildButtonClick function, so that no new instance to be created on render
 * it should only be created when dependencies got changed
 */
const Button = memo(({ onClick }) => {
  console.log("Button rendered");
  return <button onClick={onClick}>Click me</button>;
});

const UseCallback = () => {
  const [count, setCount] = useState(0);

  const handleChildButtonClick = useCallback(() => {
    console.log("Button clicked");
  }, []); // pass [count] to check the re-rendering of both parent and child, as this will create new instance on every click, bcoz dependencies are getting changed on every click

  console.log("Counter rendered");
  return (
    <div>
      <Button onClick={handleChildButtonClick} />
      <h2>Count: {count}</h2>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
};

export default UseCallback;

/**
 * useCallback ****
 *
 * useCallback is a React hook that lets us memoize functions — meaning the function won’t be re-created on every render unless its dependencies change.
 * This is useful when we're passing functions to child components that are memoized using React.memo.
 * If we don’t use useCallback, even identical functions get new references each time, which causes unnecessary re-renders.
 */
