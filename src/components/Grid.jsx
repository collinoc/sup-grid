import { useEffect, useState } from 'react';
import Square from './Square';

const generateDefaultGrid = () => {
    return Array(10)
        .fill(null)
        .map(() =>
            Array(10)
                .fill(null)
                .map(() => ({
                    owner: null,
                    winner: false,
                })),
        );
};

const Grid = ({ ws, initials }) => {
    const [grid, setGrid] = useState(generateDefaultGrid);
    const [getIntv, setGetIntv] = useState();

    useEffect(() => {
        if (ws) {
            ws.onmessage = (msg) => {
                switch (msg.data) {
                    case 'rectify':
                        console.error('Invalid operation');
                        break;
                    case 'games':
                        console.log('Operation successful');
                        break;
                    default:
                        let newGrid = JSON.parse(msg.data);
                        setGrid(newGrid);
                }
            };
        }

        if (getIntv) {
            clearInterval(getIntv);
        }

        setGetIntv(
            setInterval(() => {
                ws && ws.readyState == ws.OPEN && ws.send('GET');
            }, 2000),
        );
    }, [ws]);

    return (
        <div className="grid-wrapper">
            <h1 title="A digital frontier...">The Grid.</h1>

            <table className="grid">
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>0</th>
                        <th>1</th>
                        <th>2</th>
                        <th>3</th>
                        <th>4</th>
                        <th>5</th>
                        <th>6</th>
                        <th>7</th>
                        <th>8</th>
                        <th>9</th>
                    </tr>
                </thead>
                <tbody>
                    {grid.map((row, r) => (
                        <tr key={r}>
                            <th>{r}</th>
                            {row.map((_, c) => (
                                <Square
                                    key={r + c}
                                    ws={ws}
                                    setGrid={setGrid}
                                    initials={initials}
                                    grid={grid}
                                    row={r}
                                    col={c}
                                />
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Grid;
