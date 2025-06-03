import { useState } from "react";
import "./App.css";
import TicTakToe from "./components/TicTacToe";
import { Link, Route, Routes } from "react-router-dom";
import Counter from "./components/Counter";
import UseCallback from "./components/UseCallback";

function App() {
  return (
    <>
      <div className="main-layout">
        <div className="side-bar">
          <Link to={"/tic-tac-toe"}>Tic Tac Toe</Link>
          <Link to={"/use-callback"}>Use Callback Example</Link>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/use-callback" element={<UseCallback />} />
            <Route path="/tic-tac-toe" element={<TicTakToe />} />
            <Route path="/" element={<Counter />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
