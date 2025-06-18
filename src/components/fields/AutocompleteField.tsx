import React, { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type AutocompleteFieldProps<TOption extends AutocompleteOptionType> = {
    label: string;
    options: TOption[];
    value?: string | null;
    onChange: (value: string | null) => void;
    // call onChange as soon as userimput equals a option
    noImplicitChange?: boolean;
    placeholder?: string;
    resetOnChange?: boolean;
    name?: string;
    renderOption?: (props: RenderOptionProps<TOption>) => React.ReactNode;
    optionDisabled?: (option: TOption) => boolean;
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

export default function AutocompleteField<TOption extends AutocompleteOptionType = AutocompleteOptionType>(props: AutocompleteFieldProps<TOption>) {
    const { options, onChange, label, optionDisabled, resetOnChange, } = props;

    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<TOption[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [optionsVisible, setOptionsVisible] = useState(false);

    const changeHighlightedIndex = useCallback((mode: "up" | "down" | "first" | "last") => {
        if (!filteredOptions.length) return;
        if (!optionDisabled) {
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
                    if (!optionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            if (mode === "last") {
                for (let i = filteredOptions.length - 1; i >= 0; i--) {
                    if (!optionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            if (mode === "up") {
                for (let i = idx - 1; i >= 0; i--) {
                    if (!optionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            if (mode === "down") {
                for (let i = idx + 1; i < filteredOptions.length; i++) {
                    if (!optionDisabled(filteredOptions[i])) return i;
                }
                return idx;
            }
            return idx;
        });
    }, [filteredOptions, optionDisabled]);

    const handleInputChange = useCallback((value: string) => {
        setInputValue(value);
        changeHighlightedIndex("first");

        if (!props.noImplicitChange) {
            const option = options.find((option) => option.label === value);
            if (option) {
                onChange(option.value);
            } else {
                onChange(null);
            }
        }
    }, [options, onChange, props.noImplicitChange, changeHighlightedIndex]);

    const handleOptionSelect = useCallback((option: TOption, e: React.MouseEvent | React.KeyboardEvent) => {
        if (optionDisabled?.(option)) {
            stopEvent(e);
            return false;
        }
        if (resetOnChange) {
            setInputValue('');
        } else {
            setInputValue(option.label);
        }
        onChange(option.value);
        changeHighlightedIndex("first");
        return true;
    }, [onChange, resetOnChange, optionDisabled, changeHighlightedIndex]);

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
            <Form.Group data-testid={`${props.name ?? "autocomplete"}-field-group`}>
                <Form.Label htmlFor="autocomplete">{label}</Form.Label>
                <Form.Control
                    type="text"
                    id="autocomplete"
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
            </Form.Group>
        </div>
    );
}
