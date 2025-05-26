import dayjs from "@/lib/dayjs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DatePicker, DatePickerProps, INVALID_DATE } from "./DatePicker";

describe('DatePicker', () => {

    const DatePickerTestField = (props: Partial<DatePickerProps>) => {
        const [value, setValue] = useState<string | null | typeof INVALID_DATE>(null);
        const handleChange = (date: string | null | typeof INVALID_DATE) => {
            setValue(date);
            props.onChange?.(date);
        }

        return (
            <DatePicker
                value={value}
                {...props}
                onChange={handleChange}
            />
        );
    };

    it('should render without crashing', () => {
        const onChange = jest.fn();
        const { container } = render(<DatePicker onChange={onChange} value={null} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });

    it('should open and close calendar', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<DatePickerTestField onChange={onChange} />);

        const button = screen.getByRole('button', { name: /calendar/i });
        await user.click(button);

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /15/ }));
        expect(screen.queryByRole('dialog')).toBeNull();

        await user.click(button);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.click(screen.getByRole('textbox'));
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should handle input change', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<DatePickerTestField onChange={onChange} />);

        const input = screen.getByRole('textbox');
        await user.type(input, '01.01');
        expect(input).toHaveValue('01.01');
        expect(onChange).toHaveBeenLastCalledWith(INVALID_DATE);

        await user.type(input, '.2020');
        expect(input).toHaveValue('01.01.2020');

        expect(onChange).toHaveBeenLastCalledWith('2020-01-01');

        await user.clear(input);
        expect(input).toHaveValue('');
        expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it('should handle select via calendar', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<DatePickerTestField onChange={onChange} />);

        const button = screen.getByRole('button', { name: /calendar/i });
        await user.click(button);

        const dayButton = screen.getByText('15');
        await user.click(dayButton);

        const expectedDate = dayjs().date(15);
        expect(onChange).toHaveBeenLastCalledWith(expectedDate.format('YYYY-MM-DD'));
        expect(screen.getByRole('textbox')).toHaveValue(expectedDate.format('DD.MM.YYYY'));
    });

    it('should handle minDate', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const minDate = dayjs().date(15);
        render(<DatePickerTestField onChange={onChange} minDate={minDate.toDate()} />);

        const button = screen.getByRole('button', { name: /calendar/i });
        await user.click(button);

        const prevDayButton = screen.getByRole('button', { name: /14/ });
        expect(prevDayButton).toBeDisabled();
        await user.click(prevDayButton);
        expect(onChange).not.toHaveBeenCalled();

        const minDayButton = screen.getByRole('button', { name: /15/ });
        expect(minDayButton).toMatchSnapshot();
        await user.click(minDayButton);

        expect(onChange).toHaveBeenLastCalledWith(minDate.format('YYYY-MM-DD'));
        expect(screen.getByRole('textbox')).toHaveValue(minDate.format('DD.MM.YYYY'));
    });
});
