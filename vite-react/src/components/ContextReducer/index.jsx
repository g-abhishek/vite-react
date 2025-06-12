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
