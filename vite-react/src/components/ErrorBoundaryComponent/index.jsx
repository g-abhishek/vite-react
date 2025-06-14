import { useState } from "react";
import ErrorBoundary from "./ErrorBoundary";
import TestComponent from "./TestComponent";

const ErrorBoundaryComponent = () => {
  const [render, setRender] = useState(false);

  return (
    <>
      <p>Test Error Boundary Component</p>
      <p>
        Click here to throw error:{" "}
        <button onClick={() => setRender(true)}>Throw Error</button>
      </p>
      <ErrorBoundary>{render && <TestComponent />}</ErrorBoundary>
    </>
  );
};

export default ErrorBoundaryComponent;
