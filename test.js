let squares = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
]
console.log(squares);

const combinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 4], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
]

for (let [a, b, c] of combinations) {
    if (squares[a] === squares[b] && squares[a] === squares[c]) {
        console.log([a, b, c]);
        console.log("match");
    }
}

