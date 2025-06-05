import { useState } from "react";
import "./App.css";
import TicTakToe from "./components/TicTacToe";
import { Link, Route, Routes } from "react-router-dom";
import Counter from "./components/Counter";
import UseCallback from "./components/UseCallback";
import UseMemo from "./components/UseMemo";
import UseLayoutEffect from "./components/UseLayoutEffect";

function App() {
  return (
    <>
      <div className="main-layout">
        <div className="side-bar">
          <Link to={"/"}>Home</Link>
          <Link to={"/tic-tac-toe"}>Tic Tac Toe</Link>
          <Link to={"/use-callback"}>Use Callback Example</Link>
          <Link to={"/use-memo"}>Use Memo Example</Link>
          <Link to={"/use-layout-effect"}>Use Layout Effect Example</Link>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/use-layout-effect" element={<UseLayoutEffect />} />
            <Route path="/use-memo" element={<UseMemo />} />
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
