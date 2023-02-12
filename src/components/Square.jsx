const Square = ({ ws, initials, grid, row, col, setGrid }) => {
    const getSquareClasses = () => {
        let sq = grid[row][col];
        let classes = 'square';

        classes += sq.owner ? ' taken' : ' free';
        classes += sq.winner ? ' winner' : ' avail';

        return classes;
    };

    const updateSquare = (e) => {
        const newGrid = grid.slice();
        let success = false;

        if (e.shiftKey) {
            if (newGrid[row][col].owner) {
                newGrid[row][col].winner = !newGrid[row][col].winner;

                ws?.send(`WIN:${row}:${col}:${newGrid[row][col].winner}`);
                success = true;
            }
        } else if (e.altKey || e.detail === 2) {
            if (newGrid[row][col].owner == initials) {
                newGrid[row][col].owner = null;

                ws?.send(`UNSET:${row}:${col}:${initials}`);
                success = true;
            }
        } else {
            if (initials) {
                newGrid[row][col].owner = initials;

                ws?.send(`CLAIM:${row}:${col}:${initials}`);
                success = true;
            }
        }

        if (success) setGrid(newGrid);
    };

    return (
        <td className={getSquareClasses()} onClick={updateSquare}>
            {grid[row][col].owner ?? '🏈'}
        </td>
    );
};

export default Square;
