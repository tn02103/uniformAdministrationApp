import { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type AutocompleteFieldProps = {
    label: string;
    options: AutocompleteOptionType[];
    value: string | null;
    onChange: (value: string | null) => void;
};
export type AutocompleteOptionType = { value: string, label: string };

function stopEvent(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
}

export default function AutocompleteField(props: AutocompleteFieldProps) {
    const { options, onChange, label } = props;

    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<AutocompleteOptionType[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [optionsVisible, setOptionsVisible] = useState(false);

    const handleInputChange = useCallback((value: string) => {
        setInputValue(value);
        setHighlightedIndex(0);

        const option = options.find((option) => option.label === value);
        if (option) {
            onChange(option.value);
        } else {
            onChange(null);
        }
    }, [options, onChange]);

    const handleOptionSelect = useCallback((option: AutocompleteOptionType) => {
        setInputValue(option.label);
        onChange(option.value);
        setHighlightedIndex(0);
    }, [onChange]);

    useEffect(() => {
        if (inputValue.length === 0) {
            setFilteredOptions([...options].splice(0, 10));
        } else {
            setFilteredOptions(options.filter((option) => option.label.includes(inputValue)).splice(0, 10));
        }
    }, [setFilteredOptions, inputValue, options]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                stopEvent(e);
                if (!optionsVisible) {
                    setOptionsVisible(true);
                    break;
                }
                if (highlightedIndex === null) {
                    setHighlightedIndex(0);
                } else {
                    setHighlightedIndex(Math.min(highlightedIndex + 1, filteredOptions.length - 1));
                }
                break;
            case 'ArrowUp':
                stopEvent(e);
                if (highlightedIndex === null) {
                    setHighlightedIndex(filteredOptions.length - 1);
                } else {
                    setHighlightedIndex(Math.max(highlightedIndex - 1, 0));
                }
                break;
            case 'Enter':
                if (highlightedIndex !== null) {
                    stopEvent(e);
                    handleOptionSelect(filteredOptions[highlightedIndex]);
                    setOptionsVisible(false);
                }
                break;
            case "Tab":
                if (optionsVisible) {
                    stopEvent(e);
                    setOptionsVisible(false);
                }
            case 'Escape':
                setOptionsVisible(false);
                break;
            default:
                if (!optionsVisible) {
                    setOptionsVisible(true);
                }
                break;
        }
    }, [filteredOptions, highlightedIndex, setHighlightedIndex, handleOptionSelect, optionsVisible]);

    return (
        <div className="position-relativ" style={{ maxWidth: '200px' }}>
            <Form.Group>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                    type="text"
                    value={inputValue}
                    onFocus={() => { console.log("test"); setOptionsVisible(true) }}
                    onBlur={() => setOptionsVisible(false)}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </Form.Group>
            {optionsVisible &&
                <div style={{ display: "contents" }} >
                    <div className="position-absolute " style={{
                        zIndex: '100',
                        overflow: 'visible',
                        maxHeight: '200px',
                        backgroundColor: 'white',
                        width: '150px'
                    }} >
                        <div style={{ border: '1px solid black' }}>

                            {filteredOptions.map((option, index) => (
                                <div key={option.value}
                                    style={{
                                        backgroundColor: (index === highlightedIndex) ? 'LightGrey' : 'white',
                                        cursor: 'pointer',
                                        padding: '5px'
                                    }}
                                    onMouseDown={() => { console.log("onclickTest"); handleOptionSelect(option) }}
                                >
                                    {option.label}
                                </div>
                            ))}
                            {filteredOptions.length === 0 &&
                                <div style={{ padding: '5px' }}>
                                    No results found
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}