import React, { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import style from "./Autocomplete.module.css";
import { useScopedI18n } from "@/lib/locales/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export type AutocompleteProps<TOption extends AutocompleteOptionType> = {
    /** List of options to choose from */
    options: TOption[];
    /** The value of the selected option */
    value?: string | null;
    /** If true, the input will be marked as invalid */
    invalid?: boolean;
    /** If true loading icon will be shown */
    isLoading?: boolean;
    /** Callback function when an option is selected */
    onChange: (value: string | null) => void;
    /** Optional callback for searchterm changes*/
    onInputChange?: (value: string) => void;
    /** If true, the input will not call onChange when the user types a value that is not in the options */
    noImplicitChange?: boolean;
    /** Placeholder text for the input */
    placeholder?: string;
    /** If true, the input will reset when an option is selected */
    resetOnChange?: boolean;
    /** If true, the options will not be shown when the input is focused */
    renderOption?: (props: RenderOptionProps<TOption>) => React.ReactNode;
    /** Function to determine if an option is disabled */
    isOptionDisabled?: (option: TOption) => boolean;
    /** Custom filter function to filter options based on input value */
    customFilter?: (options: TOption[], inputValue: string) => TOption[];
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
    const { options, onChange, isOptionDisabled, resetOnChange, onInputChange, customFilter, isLoading, value: propValue } = props;
    const maxOptions = 50;
    const t = useScopedI18n("autocomplete");
 
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<TOption[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const optionListRef = React.useRef<HTMLDivElement>(null);

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
            setFilteredOptions([...options].slice(0, maxOptions));
        } else if (customFilter) {
            setFilteredOptions(customFilter(options, inputValue).slice(0, maxOptions));
        } else {
            setFilteredOptions(options
                .filter((option) => option.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase()))
                .slice(0, maxOptions)
            );
        }
    }, [setFilteredOptions, inputValue, options, customFilter]);

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

    useEffect(() => {
        if (!optionsVisible) return;
        const optionList = optionListRef.current;
        if (!optionList) return;
        const optionNodes = optionList.querySelectorAll('[role="option"]');
        if (highlightedIndex != null && optionNodes[highlightedIndex]) {
            (optionNodes[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, optionsVisible]);

    useEffect(() => {
        if (propValue) {
            const selectedOption = options.find(option => option.value === propValue);
            if (selectedOption) {
                setInputValue(selectedOption.label);
            } else {
                setInputValue('');
            }
        }
    }, [propValue, options]);

    return (
        <div className="position-relative" style={{ maxWidth: '200px' }}>
            <Form.Control
                type="text"
                id="autocomplete"
                className={isLoading ? style.loadingInput : ''}
                value={inputValue}
                isInvalid={props.invalid}
                onFocus={() => setOptionsVisible(true)}
                onBlur={() => setOptionsVisible(false)}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={props.placeholder}
                aria-expanded={optionsVisible}
                aria-controls="autocomplete-options"
                aria-invalid={props.invalid}
            />
            {(optionsVisible) &&
                <div style={{ display: "contents" }}>
                    <div className={style.optionListWrapper}>
                        <div className={style.optionList} role="listbox" id="autocomplete-options" ref={optionListRef}>
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
                                    className={(index === highlightedIndex) ? style.selectedOptionItem : style.optionItem}
                                    role="option"
                                    aria-selected={props.value === option.value}
                                    onMouseDown={(e) => handleOptionSelect(option, e)}
                                >
                                    {option.label}
                                </div>
                            ))}
                            {filteredOptions.length === maxOptions &&
                                <div className="p-2 bg-white fst-italic">
                                    {t('optionLimit', { count: maxOptions })}
                                </div>
                            }
                            {(!isLoading && filteredOptions.length === 0) &&
                                <div style={{ padding: '5px' }} role="alert" aria-label="no results">
                                    {t('noOptions')}
                                </div>
                            }
                            {isLoading &&
                                <div style={{ padding: '5px' }} role="status" aria-label="loading results">
                                    <FontAwesomeIcon icon={faSpinner} spin className="text-secondary me-2" />
                                    {t('loading')}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}
