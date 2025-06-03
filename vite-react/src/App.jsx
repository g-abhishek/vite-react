import { useState } from "react";
import "./App.css";
import TicTakToe from "./components/TicTacToe";
import { Link, Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <div className="main-container">
        <div className="side-bar">
          <Link to={"/tic-tac-toe"}>Tic Tac Toe</Link>
        </div>
        <div className="content">
          <Routes>
            <Route path="/tic-tac-toe" element={<TicTakToe />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
