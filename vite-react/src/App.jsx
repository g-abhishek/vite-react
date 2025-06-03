import { useState } from "react";
import "./App.css";
import TicTakToe from "./components/TicTacToe";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <TicTakToe />
    </>
  );
}

export default App;
