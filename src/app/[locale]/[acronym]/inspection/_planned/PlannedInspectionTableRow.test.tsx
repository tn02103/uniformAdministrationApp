import "./jestHelper";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { mockInspectionList } from "./jestHelper";
import { PlannedInspectionTableRow } from "./PlannedInspectionTableRow";


describe('<PlannedInspectionTableRow />', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render the component with inspection data', () => {
        render(<PlannedInspectionTableRow inspection={mockInspectionList[0]} />);

        expect(screen.getByTestId('div_name')).toBeInTheDocument();
        expect(screen.getByTestId('div_date')).toBeInTheDocument();
        expect(screen.getByTestId('div_name')).toHaveTextContent('Inspection 1');
        expect(screen.getByTestId('div_date')).toHaveTextContent(format(mockInspectionList[0].date, "dd.MM.yyyy"));
        expect(screen.getByTestId('lbl_badge')).toBeInTheDocument();
    });

    it('should open deregistration offcanvas', async () => {
        const openOffcanvas = jest.fn();
        const inspection = mockInspectionList[0];
        const user = userEvent.setup();
        render(
            <PlannedInspectionTableRow
                inspection={inspection}
                openDeregistrationOffcanvas={openOffcanvas}
            />
        );

        await user.click(screen.getByRole('button', { name: /open deregistration list/i }));
        expect(openOffcanvas).toHaveBeenCalledWith(inspection.id);
    });
    describe('edit inspection', () => {
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

            const nameField = screen.getByRole('textbox', { name: /name/i });
            const dateField = screen.getByRole('textbox', { name: /date/i });
            const saveButton = screen.getByRole('button', { name: /save/i });
            const cancelButton = screen.getByRole('button', { name: /cancel/i });

            expect(nameField).toBeInTheDocument();
            expect(nameField).toHaveValue(mockInspectionList[0].name);
            expect(dateField).toBeInTheDocument();
            expect(dateField).toHaveValue(format(mockInspectionList[0].date, "dd.MM.yyyy"));
            expect(saveButton).toBeInTheDocument();
            expect(cancelButton).toBeInTheDocument();

            const newDate = dayjs.utc().startOf('day');
            await user.clear(nameField);
            await user.clear(dateField);
            await user.type(nameField, 'Updated Inspection');
            await user.type(dateField, newDate.format("DD.MM.YYYY"));
            await user.click(saveButton);

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
        it('should cancel editing and reset data', async () => {
            const user = userEvent.setup();
            const inspection = mockInspectionList[0];
            render(
                <PlannedInspectionTableRow
                    inspection={inspection}
                />
            );
            await user.click(screen.getByTestId('btn_edit'));

            const nameField = screen.getByRole('textbox', { name: /name/i });
            const dateField = screen.getByRole('textbox', { name: /date/i });
            const saveButton = screen.getByRole('button', { name: /save/i });
            const cancelButton = screen.getByRole('button', { name: /cancel/i });

            expect(nameField).toHaveValue(inspection.name);
            expect(dateField).toHaveValue(format(inspection.date, "dd.MM.yyyy"));
            expect(cancelButton).toBeInTheDocument();
            await user.click(cancelButton);

            expect(nameField).not.toBeInTheDocument();
            expect(dateField).not.toBeInTheDocument();
            expect(cancelButton).not.toBeInTheDocument();
            expect(saveButton).not.toBeInTheDocument();

            expect(screen.getByLabelText(/name/i)).toHaveTextContent(inspection.name);
            expect(screen.getByLabelText(/date/i)).toHaveTextContent(format(inspection.date, "dd.MM.yyyy"));

            await user.click(screen.getByTestId('btn_edit'));
            expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(inspection.name);
            expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(format(inspection.date, "dd.MM.yyyy"));
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
            expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(mockInspectionList[1].name);
            expect(screen.getByText(/custom.inspection.nameDuplication/i)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();
        });

        it('should catch dateDuplication error before submit', async () => {
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

            await user.clear(screen.getByRole('textbox', { name: /date/i }));
            await user.type(screen.getByRole('textbox', { name: /date/i }), format(mockInspectionList[1].date, "dd.MM.yyyy"));
            expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(format(mockInspectionList[1].date, "dd.MM.yyyy"));
            expect(screen.getByText(/custom.inspection.dateDuplication/i)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();
        });
        it('should not allow date before today', async () => {
            const { updatePlannedInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
            const testDay = dayjs().subtract(1, "day").startOf("day").format("DD.MM.YYYY");

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspectionList[0]}
                />
            );
            await user.click(screen.getByTestId('btn_edit'));
            await user.clear(screen.getByRole('textbox', { name: /date/i }));
            await user.type(screen.getByRole('textbox', { name: /date/i }), testDay);

            expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(testDay);
            expect(screen.getByText(/date.minIncluded#today/i)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();

        });

        it('should catch exception from dal-method', async () => {
            const { updatePlannedInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
            updatePlannedInspection.mockRejectedValueOnce(new Error("error"));

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspectionList[0]}
                />
            );
            await user.click(screen.getByTestId('btn_edit'));
            await user.click(screen.getByRole('button', { name: /save/i }));

            expect(updatePlannedInspection).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalled();
            expect(mutate).toHaveBeenCalled();
            expect(screen.queryByText(/actions.save/i)).toBeInTheDocument();
        });
    });

    describe('create inspection', () => {
        it('should create a new inspection', async () => {
            const { createInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

            const user = userEvent.setup();
            const closeNewLine = jest.fn();
            render(
                <PlannedInspectionTableRow
                    inspection={null}
                    closeNewLine={closeNewLine}
                />
            );

            const dateField = screen.getByRole('textbox', { name: /date/i });
            const nameField = screen.getByRole('textbox', { name: /name/i });
            const saveButton = screen.getByRole('button', { name: /save/i });
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            expect(nameField).toBeInTheDocument();
            expect(dateField).toBeInTheDocument();
            expect(saveButton).toBeInTheDocument();
            expect(cancelButton).toBeInTheDocument();

            const newDate = dayjs.utc().add(3, "day").startOf('day');
            await user.clear(nameField);
            await user.clear(dateField);
            await user.type(nameField, 'New Inspection');
            await user.type(dateField, newDate.format("DD.MM.YYYY"));
            await user.click(saveButton);

            expect(createInspection).toHaveBeenCalledWith({
                name: 'New Inspection',
                date: newDate.toDate(),
            });
            expect(mutate).toHaveBeenCalled();
            expect(closeNewLine).toHaveBeenCalled();
        });

        it('should close new line on cancel', async () => {
            const user = userEvent.setup();
            const closeNewLine = jest.fn();
            render(
                <PlannedInspectionTableRow
                    inspection={null}
                    closeNewLine={closeNewLine}
                />
            );

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            await user.click(cancelButton);

            expect(closeNewLine).toHaveBeenCalled();
        });

        it('should catch nameDuplication error before submit', async () => {
            const { createInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={null}
                    closeNewLine={jest.fn()}
                />
            );

            const dateField = screen.getByRole('textbox', { name: /date/i });
            const nameField = screen.getByRole('textbox', { name: /name/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            const newDate = dayjs.utc().add(3, "day").startOf('day');
            await user.clear(dateField);
            await user.type(dateField, newDate.format("DD.MM.YYYY"));

            await user.clear(nameField);
            await user.type(nameField, mockInspectionList[1].name);
            expect(nameField).toHaveValue(mockInspectionList[1].name);
            expect(screen.getByText(/custom.inspection.nameDuplication/i)).toBeInTheDocument();

            await user.click(saveButton);
            expect(createInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();
        });
        it('should catch dateDuplication error before submit', async () => {
            const { createInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={null}
                    closeNewLine={jest.fn()}
                />
            );

            const dateField = screen.getByRole('textbox', { name: /date/i });
            const nameField = screen.getByRole('textbox', { name: /name/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            await user.clear(nameField);
            await user.clear(dateField);
            await user.type(nameField, 'New Inspection');
            await user.type(dateField, format(mockInspectionList[1].date, "dd.MM.yyyy"));
            expect(dateField).toHaveValue(format(mockInspectionList[1].date, "dd.MM.yyyy"));
            expect(screen.getByText(/custom.inspection.dateDuplication/i)).toBeInTheDocument();

            await user.click(saveButton);
            expect(createInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();
        });
        it('should catch exception from dal-method', async () => {
            const { createInspection } = jest.requireMock("@/dal/inspection");
            createInspection.mockRejectedValueOnce(new Error("error"));

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={null}
                    closeNewLine={jest.fn()}
                />
            );
            const dateField = screen.getByRole('textbox', { name: /date/i });
            const nameField = screen.getByRole('textbox', { name: /name/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            const newDate = dayjs.utc().add(3, "day").startOf('day');
            await user.clear(nameField);
            await user.clear(dateField);
            await user.type(nameField, 'New Inspection');
            await user.type(dateField, newDate.format("DD.MM.YYYY"));
            await user.click(saveButton);

            expect(createInspection).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalled();
        });
    });
    describe('delete inspection', () => {
        it('should delete the inspection', async () => {
            const { deleteInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
            const { simpleWarningModal } = jest.requireMock("@/components/modals/modalProvider").useModal();

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspectionList[0]}
                />
            );

            await user.click(screen.getByTestId('btn_delete'));
            expect(deleteInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();

            expect(simpleWarningModal).toHaveBeenCalledTimes(1);
            act(() => {
                simpleWarningModal.mock.calls[0][0].primaryFunction();
            })

            expect(deleteInspection).toHaveBeenCalledWith(mockInspectionList[0].id);
            expect(mutate).toHaveBeenCalled();
        });
        /* it('should catch DAL-Exception', async () => {
             const { deleteInspection } = jest.requireMock("@/dal/inspection");
             const { simpleWarningModal } = jest.requireMock("@/components/modals/modalProvider").useModal();
             deleteInspection.mockRejectedValueOnce(new Error("error"));
 
             const user = userEvent.setup();
             render(
                 <PlannedInspectionTableRow
                     inspection={mockInspectionList[0]}
                 />
             );
 
             await user.click(screen.getByTestId('btn_delete'));
             expect(deleteInspection).not.toHaveBeenCalled();
 
             expect(simpleWarningModal).toHaveBeenCalledTimes(1);
             act(() => {
                 simpleWarningModal.mock.calls[0][0].primaryFunction();
             });
 
             expect(deleteInspection).toHaveBeenCalledWith(mockInspectionList[0].id);
             expect(toast.error).toHaveBeenCalled();
         }); */
    });
});