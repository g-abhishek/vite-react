import React, { useState } from "react";
import Board from "./Board";
import "./index.css";

const TicTacToe = () => {
  const [squares, setSquares] = useState(new Array(9).fill(""));
  const [isNextTurn, setNextTurn] = useState(false);
  const [winner, setWinner] = useState(null);

  const onSquareClick = (index) => {
    if (squares[index] || winner) return;

    const sq = [...squares];
    sq[index] = !isNextTurn ? "X" : "O";
    setSquares(sq);

    setWinner(calculateWinner(sq));

    setNextTurn(!isNextTurn);
  };

  const calculateWinner = (squares) => {
    const combinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let [a, b, c] of combinations) {
      if (squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
  };

  return (
    <>
      <div className="wrapper">
        {winner && <div className="winner-text">Winner is {winner}</div>}

        <Board squares={squares} onSquareClick={onSquareClick} />

        <button
          onClick={() => {
            setSquares(new Array(9).fill(""));
            setWinner(false);
            setNextTurn(false);
          }}
        >
          Reset
        </button>
      </div>
    </>
  );
};

export default TicTacToe;
