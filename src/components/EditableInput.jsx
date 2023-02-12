import { useState, useEffect } from 'react';

const EditableInput = ({ prompt, stateMod, ckey }) => {
    const [value, setValue] = useState();
    const [editMode, setEditMode] = useState(true);

    const updateValue = (e) => {
        e.preventDefault();

        let newValue = e.target.value.trim();

        setValue(newValue);
    };

    const changeMode = () => {
        if (editMode && value != null) {
            document.cookie = `${ckey}=${value?.trim()}`;
            stateMod(value);
        }

        setEditMode((m) => !m);
    };

    useEffect(() => {
        const cookieValue = document.cookie
            .split(';')
            .find((row) => row.trim().startsWith(`${ckey}=`))
            ?.split('=')[1];

        if (cookieValue) {
            setEditMode(false);
            setValue(cookieValue);
            stateMod(cookieValue);
        }
    }, []);

    if (editMode) {
        return (
            <input
                className="editable-input"
                type="text"
                placeholder={prompt}
                defaultValue={value}
                onChange={updateValue}
                onBlur={changeMode}
                autoFocus={true}
            />
        );
    } else {
        return (
            <span className="editable-input" onClick={changeMode}>
                {value || prompt}
            </span>
        );
    }
};

export default EditableInput;
