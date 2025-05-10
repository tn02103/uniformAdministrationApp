import { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type AutocompleteFieldProps = {
    label: string;
    options: AutocompleteOptionType[];
    value?: string | null;
    onChange: (value: string | null) => void;
    // call onChange as soon as userimput equals a option
    noImplicitChange?: boolean;
    placeholder?: string;
    resetOnChange?: boolean;
    name?: string;
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

        if (!props.noImplicitChange) {
            const option = options.find((option) => option.label === value);
            if (option) {
                onChange(option.value);
            } else {
                onChange(null);
            }
        }
    }, [options, onChange, props.noImplicitChange]);

    const handleOptionSelect = useCallback((option: AutocompleteOptionType) => {
        if (props.resetOnChange) {
            setInputValue('');
        } else {
            setInputValue(option.label);
        }
        onChange(option.value);
        setHighlightedIndex(0);
    }, [onChange]);

    useEffect(() => {
        if (inputValue.length === 0) {
            setFilteredOptions([...options].splice(0, 10));
        } else {
            setFilteredOptions(options.filter((option) => option.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())).splice(0, 10));
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
            <Form.Group data-testid={`${props.name ?? "autocomplete"}-field-group`}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                    type="text"
                    value={inputValue}
                    onFocus={() => setOptionsVisible(true)}
                    onBlur={() => setOptionsVisible(false)}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={props.placeholder}
                    aria-expanded={optionsVisible}
                    aria-controls="autocomplete-options"
                />
                {optionsVisible &&
                    <div style={{ display: "contents" }} >
                        <div className="position-absolute " style={{
                            zIndex: '100',
                            overflow: 'visible',
                            maxHeight: '200px',
                            backgroundColor: 'white',
                            width: '100%',
                            maxWidth: '200px',
                        }} >
                            <div style={{ border: '1px solid black' }} role="listbox" id="autocomplete-options">
                                {filteredOptions.map((option, index) => (
                                    <div key={option.value}
                                        style={{
                                            backgroundColor: (index === highlightedIndex) ? 'LightGrey' : 'white',
                                            cursor: 'pointer',
                                            padding: '5px'
                                        }}
                                        role="option"
                                        onMouseDown={() => handleOptionSelect(option)}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                                {filteredOptions.length === 0 &&
                                    <div style={{ padding: '5px' }} role="option">
                                        No results found
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </Form.Group>
        </div>
    );
}
