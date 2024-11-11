import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import Calendar from 'react-calendar';

export default function DatePicker({ onChange, value, error }: { onChange: any, value: string | Date, error?: string }) {
    const [showCalendar, setShowCalendar] = useState(false);
    const refCalendar = useRef();

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

    function handleOnChangeCalendar(value: any, event: React.MouseEvent) {
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
                    className={`form-control ${error ? "isInvaild" : ""}`}
                    onChange={(e) => handleInputOnChange(e.target.value)}
                    value={(typeof value === "string") ? value : dayjs(value).format('DD.MM.YYYY')}
                />
                <button type="button" className="input-group-text" onClick={() => setShowCalendar(prev => !prev)}>
                    <FontAwesomeIcon icon={faCalendar} />
                </button>
            </div>
            {error &&
                <div className="text-danger fs-7">
                    {error}
                </div>
            }
            <div style={{ display: "contents" }} >
                <div className="position-absolute " ref={refCalendar as any} style={{ zIndex: 9999 }} >
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