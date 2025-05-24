import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "@/lib/dayjs";
import { useEffect, useRef, useState } from "react";
import Calendar from 'react-calendar';
import ErrorMessage from "../errorMessage";

type DatePickerProps = {
    onChange: (value: Date) => void;
    value: string | Date;
    error?: string;
    ariaLabel?: string;
};
export default function DatePicker({ onChange, value, error, ariaLabel }: DatePickerProps) {
    const [showCalendar, setShowCalendar] = useState(false);
    const refCalendar = useRef(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (refCalendar.current && !(refCalendar.current as any).contains(e.target)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        }
    });

    function handleOnChangeCalendar(value: any) {
        setShowCalendar(false);
        const date = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
        onChange(dayjs.utc(date).toDate());
    }
    function handleInputOnChange(val: any) {
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(val)) {
            const mom = dayjs(val, ["DD.MM.YYYY", "D.M.YYYY"], true).utc(true);
            if (mom.isValid()) {
                return onChange(mom.toDate());
            }
        }
        return onChange(val);
    }

    return (
        <div className="position-relativ">
            <div className="input-group flex">
                <input
                    type="string"
                    name={"date"}
                    aria-label={ariaLabel}
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    onChange={(e) => handleInputOnChange(e.target.value)}
                    value={(typeof value === "string") ? value : dayjs(value).format('DD.MM.YYYY')}
                />
                <button type="button" className="input-group-text" onClick={() => setShowCalendar(prev => !prev)}>
                    <FontAwesomeIcon icon={faCalendar} />
                </button>
            </div>
            {error &&
                <ErrorMessage error={error} testId={"err_date"} />
            }
            <div style={{ display: "contents" }} >
                <div className="position-absolute" ref={refCalendar as any} style={{ zIndex: 9999 }} >
                    {showCalendar &&
                        <Calendar
                            minDate={dayjs().toDate()}
                            onChange={handleOnChangeCalendar}
                            value={value} />
                    }
                </div>
            </div>
        </div>
    )
}