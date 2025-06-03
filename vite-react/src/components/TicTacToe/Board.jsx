const Board = ({ squares, onSquareClick }) => {
  return (
    <>
      <div className="row">
        {squares?.map((val, index) => (
          <div
            key={index}
            className="cell"
            onClick={() => onSquareClick(index)}
          >
            {val}
          </div>
        ))}
      </div>
    </>
  );
};

export default Board;
