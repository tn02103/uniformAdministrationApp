import dayjs from "@/lib/dayjs";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import Calendar from 'react-calendar';
import ErrorMessage from "../errorMessage";

export const INVALID_DATE = Symbol("INVALID_DATE");

export type DatePickerProps = {
    value: string | typeof INVALID_DATE | null;
    error?: string;
    ariaLabel?: string;
    minDate?: Date;
    onChange: (value: string | typeof INVALID_DATE | null) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
};

const InnerDatePicker = ({ onChange, onBlur, value, error, ariaLabel, minDate }: DatePickerProps, ref: React.ForwardedRef<HTMLInputElement>) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [internalInputValue, setInternalInputValue] = useState<string>("");
    const refCalendar = useRef(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (refCalendar.current && !(refCalendar.current as HTMLElement).contains(e.target as HTMLElement)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        }
    });

    useEffect(() => {
        if (value === INVALID_DATE) {
            return;
        }
        if (value) {
            setInternalInputValue(dayjs(value).format('DD.MM.YYYY'));
            return;
        }
        setInternalInputValue("");
    }, [value]);

    function handleOnChangeCalendar(value: Date | null | (Date | null)[]) {
        if (Array.isArray(value)) return;

        if (value) {
            setShowCalendar(false);
            const date = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
            setInternalInputValue(dayjs(date).format('DD.MM.YYYY'));
            onChange(dayjs(date).format("YYYY-MM-DD"));
        } else {
            onChange(null);
            setInternalInputValue("");
        }
    }
    function handleInputOnChange(event: React.ChangeEvent<HTMLInputElement>) {
        const val = event.target.value;

        if (val === "") {
            setInternalInputValue("");
            onChange(null);
            return;
        }

        const date = dayjs(val, ["DD.MM.YYYY", "D.M.YYYY"], true);
        if (date.isValid()) {
            setInternalInputValue(date.format('DD.MM.YYYY'));
            onChange(date.format("YYYY-MM-DD"));
        } else {
            setInternalInputValue(val);
            onChange(INVALID_DATE);
        }
    }

    return (
        <div className="position-relativ">
            <div className="input-group flex">
                <input
                    ref={ref}
                    type="string"
                    name={"date"}
                    aria-label={ariaLabel}
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    onChange={handleInputOnChange}
                    onBlur={onBlur}
                    placeholder="01.01.2020"
                    value={internalInputValue}
                />
                <button type="button" className="input-group-text" aria-label="open calendar" onClick={() => setShowCalendar(prev => !prev)}>
                    <FontAwesomeIcon icon={faCalendar} />
                </button>
            </div>
            {error &&
                <ErrorMessage error={error} testId={"err_date"} />
            }
            <div style={{ display: "contents" }} >
                {showCalendar &&
                    <div className="position-absolute" ref={refCalendar} style={{ zIndex: 9999 }} role="dialog" aria-label="chose date">
                        <Calendar
                            minDate={minDate}
                            onChange={handleOnChangeCalendar}
                            value={(value === INVALID_DATE) ? null : value} />
                    </div>
                }
            </div>
        </div>
    )
}

InnerDatePicker.displayName = "DatePicker";
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(InnerDatePicker);
