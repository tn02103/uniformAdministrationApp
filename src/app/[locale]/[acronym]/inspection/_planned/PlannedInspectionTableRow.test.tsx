import "./jestHelper";

import { render, screen, waitFor } from "@testing-library/react";
import { mockInspectionList } from "./jestHelper";
import { PlannedInspectionTableRow } from "./PlannedInspectionTableRow";
import { format } from "date-fns";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { setTimeout } from "timers/promises";


describe('<PlannedInspectionTableRow />', () => {

    it('should render the component with inspection data', () => {
        render(<PlannedInspectionTableRow inspection={mockInspectionList[0]} />);

        expect(screen.getByTestId('div_name')).toBeInTheDocument();
        expect(screen.getByTestId('div_date')).toBeInTheDocument();
        expect(screen.getByTestId('div_name')).toHaveTextContent('Inspection 1');
        expect(screen.getByTestId('div_date')).toHaveTextContent(format(mockInspectionList[0].date, "dd.MM.yyyy"));
        expect(screen.getByTestId('div_badge')).toBeInTheDocument();
    });

    it('should update the inspection', async () => {
        const { updatePlannedInspection } = jest.requireMock("@/dal/inspection");
        const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

        const user = userEvent.setup();
        render(
            <PlannedInspectionTableRow
                inspection={mockInspectionList[0]}
            />
        );
        await user.click(screen.getByTestId('btn_edit'));

        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(mockInspectionList[0].name);
        expect(screen.getByRole('textbox', { name: /date/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(format(mockInspectionList[0].date, "dd.MM.yyyy"));
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

        const newDate = dayjs.utc().add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
        await user.clear(screen.getByRole('textbox', { name: /name/i }));
        await user.clear(screen.getByRole('textbox', { name: /date/i }));
        await user.type(screen.getByRole('textbox', { name: /name/i }), 'Updated Inspection');
        await user.type(screen.getByRole('textbox', { name: /date/i }), newDate.format("DD.MM.YYYY"));
        await user.click(screen.getByRole('button', { name: /save/i }));

        expect(screen.queryByRole('textbox', { name: /name/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: /date/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

        expect(updatePlannedInspection).toHaveBeenCalledWith({
            id: mockInspectionList[0].id,
            data: {
                name: 'Updated Inspection',
                date: newDate.toDate(),
            }
        });
        expect(mutate).toHaveBeenCalled();
    });

    it('should catch nameDuplication error before submit', async () => {
        const { updatePlannedInspection } = jest.requireMock("@/dal/inspection");
        const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

        const user = userEvent.setup();
        render(
            <PlannedInspectionTableRow
                inspection={mockInspectionList[0]}
            />
        );
        await user.click(screen.getByTestId('btn_edit'));

        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(mockInspectionList[0].name);
        expect(screen.getByRole('textbox', { name: /date/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(format(mockInspectionList[0].date, "dd.MM.yyyy"));
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

        await user.clear(screen.getByRole('textbox', { name: /name/i }));
        await user.type(screen.getByRole('textbox', { name: /name/i }), mockInspectionList[1].name);
        await setTimeout(1000);
        await waitFor(() => {
            expect(screen.queryByText(/error.custom.inspection.nameDuplication/i)).not.toBeNull();
        })
        await user.click(screen.getByRole('button', { name: /save/i }));
        expect(updatePlannedInspection).not.toHaveBeenCalled();
        expect(mutate).not.toHaveBeenCalled();
    });


});