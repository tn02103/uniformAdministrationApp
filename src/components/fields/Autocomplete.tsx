import React, { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type AutocompleteProps<TOption extends AutocompleteOptionType> = {
    options: TOption[];
    value?: string | null;
    invalid?: boolean;
    onChange: (value: string | null) => void;
    /** Optional callback for searchterm changes*/
    onInputChange?: (value: string) => void;
    // call onChange as soon as userimput equals a option
    noImplicitChange?: boolean;
    placeholder?: string;
    resetOnChange?: boolean;
    renderOption?: (props: RenderOptionProps<TOption>) => React.ReactNode;
    isOptionDisabled?: (option: TOption) => boolean;
};
export type AutocompleteOptionType = { value: string, label: string };
export type RenderOptionProps<TOption extends AutocompleteOptionType> = {
    option: TOption;
    onMouseDown: (e: React.MouseEvent) => void;
    highlighted: boolean;
    selected: boolean;
}

function stopEvent(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
}

export function Autocomplete<TOption extends AutocompleteOptionType = AutocompleteOptionType>(props: AutocompleteProps<TOption>) {
    const { options, onChange, isOptionDisabled, resetOnChange, onInputChange } = props;

    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<TOption[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [optionsVisible, setOptionsVisible] = useState(false);

    const changeHighlightedIndex = useCallback((mode: "up" | "down" | "first" | "last") => {
        if (!filteredOptions.length) return;
        if (!isOptionDisabled) {
            setHighlightedIndex(idx => {
                if (mode === "first") return 0;
                if (mode === "last") return filteredOptions.length - 1;
                if (mode === "up") return Math.max(0, idx - 1);
                if (mode === "down") return Math.min(filteredOptions.length - 1, idx + 1);
                return idx;
            });
            return;
        }
        setHighlightedIndex(idx => {
            if (mode === "first") {
                for (let i = 0; i < filteredOptions.length; i++) {
                    if (!isOptionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            if (mode === "last") {
                for (let i = filteredOptions.length - 1; i >= 0; i--) {
                    if (!isOptionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            if (mode === "up") {
                for (let i = idx - 1; i >= 0; i--) {
                    if (!isOptionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            if (mode === "down") {
                for (let i = idx + 1; i < filteredOptions.length; i++) {
                    if (!isOptionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            return idx;
        });
    }, [filteredOptions, isOptionDisabled]);

    const handleInputChange = useCallback((value: string) => {
        setInputValue(value);
        onInputChange?.(value);

        changeHighlightedIndex("first");

        if (!props.noImplicitChange) {
            const option = options.find((option) => option.label === value);
            if (option) {
                onChange(option.value);
            } else {
                onChange(null);
            }
        }
    }, [options, onChange, props.noImplicitChange, changeHighlightedIndex, onInputChange]);

    const handleOptionSelect = useCallback((option: TOption, e: React.MouseEvent | React.KeyboardEvent) => {
        if (isOptionDisabled?.(option)) {
            stopEvent(e);
            return false;
        }
        if (resetOnChange) {
            setInputValue('');
            onInputChange?.('');
        } else {
            setInputValue(option.label);
            onInputChange?.(option.label);
        }
        onChange(option.value);
        changeHighlightedIndex("first");
        return true;
    }, [onChange, resetOnChange, isOptionDisabled, changeHighlightedIndex, onInputChange]);

    useEffect(() => {
        if (inputValue.length === 0) {
            setFilteredOptions([...options].splice(0, 7));
        } else {
            setFilteredOptions(options.filter((option) => option.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())).splice(0, 7));
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
                    changeHighlightedIndex("first");
                } else {
                    changeHighlightedIndex("down");
                }
                break;
            case 'ArrowUp':
                stopEvent(e);
                if (highlightedIndex === null) {
                    changeHighlightedIndex("last");
                } else {
                    changeHighlightedIndex("up");
                }
                break;
            case 'Enter':
                if (highlightedIndex !== null) {
                    stopEvent(e);
                    const allowedOption = handleOptionSelect(filteredOptions[highlightedIndex], e);
                    if (allowedOption) {
                        setOptionsVisible(false);
                    }
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
    }, [filteredOptions, highlightedIndex, handleOptionSelect, optionsVisible, changeHighlightedIndex]);

    return (
        <div className="position-relative" style={{ maxWidth: '200px' }}>
            <Form.Control
                type="text"
                id="autocomplete"
                value={inputValue}
                isInvalid={props.invalid}
                onFocus={() => setOptionsVisible(true)}
                onBlur={() => setOptionsVisible(false)}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={props.placeholder}
                aria-expanded={optionsVisible}
                aria-controls="autocomplete-options"
            />
            {optionsVisible &&
                <div style={{ display: "contents" }}>
                    <div className="position-absolute " style={{
                        zIndex: '100',
                        overflow: 'visible',
                        maxHeight: '200px',
                        backgroundColor: 'white',
                        width: '100%',
                        maxWidth: '200px',
                    }} >
                        <div style={{ border: '1px solid black' }} role="listbox" id="autocomplete-options">
                            {props.renderOption && filteredOptions.map((option) =>
                                props.renderOption!({
                                    option,
                                    onMouseDown: (e: React.MouseEvent) => handleOptionSelect(option, e),
                                    highlighted: highlightedIndex === filteredOptions.indexOf(option),
                                    selected: props.value === option.value
                                })
                            )}
                            {!props.renderOption && filteredOptions.map((option, index) => (
                                <div key={option.value}
                                    style={{
                                        backgroundColor: (index === highlightedIndex) ? 'LightGrey' : 'white',
                                        cursor: 'pointer',
                                        padding: '5px'
                                    }}
                                    role="option"
                                    aria-selected={props.value === option.value}
                                    onMouseDown={(e) => handleOptionSelect(option, e)}
                                >
                                    {option.label}
                                </div>
                            ))}
                            {filteredOptions.length === 0 &&
                                <div style={{ padding: '5px' }} role="alert">
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
