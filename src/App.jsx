import EditableInput from './components/EditableInput';
import Grid from './components/Grid';
import { useEffect, useState } from 'react';

function App() {
    const [initials, setInitials] = useState();
    const [ws, setWs] = useState(null);

    const getInitials = (name) => {
        if (!name?.trim()) return;

        if (
            name.toUpperCase() === 'FLYNN' &&
            confirm('Am I still the creator of the perfect system?')
        ) {
            ws?.send('FLYNN_MODE');
        }

        let first = name.charAt(0);
        let last = name.charAt(name.length - 1);

        let initials =
            first.toLowerCase() === last.toLowerCase()
                ? first.toUpperCase()
                : `${first.toUpperCase()}${last}`;

        setInitials(initials);
    };

    useEffect(() => {
        if (!ws) {
            setWs(new WebSocket(`ws://${window.location.hostname}:8081`));
        }
    }, []);

    return (
        <>
            <header>
                <EditableInput
                    prompt="Enter your name here"
                    stateMod={getInitials}
                    ckey="superbowl_user_name"
                />
            </header>
            <main>
                <Grid initials={initials} ws={ws} />
            </main>
        </>
    );
}

export default App;
