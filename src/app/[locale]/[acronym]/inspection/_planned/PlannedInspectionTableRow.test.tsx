import "./jestHelper";

import dayjs from "@/lib/dayjs";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
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

            await user.clear(nameField);
            await user.type(nameField, 'TestName');
            await user.clear(dateField);
            await user.type(dateField, dayjs().add(23, "days").format('dd.MM.yyyy'));
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


            // DUPLICATION
            // Edit name to duplicate
            await user.click(screen.getByTestId('btn_edit'));
            const nameField = screen.getByRole('textbox', { name: /name/i });

            await user.clear(nameField);
            await user.type(nameField, mockInspectionList[1].name);

            // validate edit
            expect(nameField).toHaveValue(mockInspectionList[1].name);
            expect(screen.getByText(/custom.inspection.nameDuplication/i)).toBeInTheDocument();

            // trying to save
            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();

            // ORIGINAL
            // edit name to original
            expect(screen.queryByTestId('btn_edit')).toBeNull();
            await user.clear(nameField);
            await user.type(nameField, mockInspectionList[0].name);

            // validate edit
            expect(nameField).toHaveValue(mockInspectionList[0].name);
            expect(screen.queryByText(/custom.inspection.nameDuplication/i)).toBeNull();

            // trying to save
            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).toHaveBeenCalled();
            expect(mutate).toHaveBeenCalled();
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

            // DUPLICATION
            // edit name
            await user.click(screen.getByTestId('btn_edit'));
            await user.clear(screen.getByRole('textbox', { name: /date/i }));
            await user.type(screen.getByRole('textbox', { name: /date/i }), format(mockInspectionList[1].date, "dd.MM.yyyy"));

            // validate edit
            expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(format(mockInspectionList[1].date, "dd.MM.yyyy"));
            expect(screen.getByText(/custom.inspection.dateDuplication/i)).toBeInTheDocument();

            // trying to save
            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();

            // ORIGINAL
            // edit name to original
            expect(screen.queryByTestId('btn_edit')).toBeNull();
            await user.clear(screen.getByRole('textbox', { name: /date/i }));
            await user.type(screen.getByRole('textbox', { name: /date/i }), format(mockInspectionList[0].date, "dd.MM.yyyy"));

            // validate edit
            expect(screen.getByRole('textbox', { name: /date/i })).toHaveValue(format(mockInspectionList[0].date, "dd.MM.yyyy"));
            expect(screen.queryByText(/custom.inspection.dateDuplication/i)).toBeNull();
           
            // trying to save
            await user.click(screen.getByRole('button', { name: /save/i }));
            expect(updatePlannedInspection).toHaveBeenCalled();
            expect(mutate).toHaveBeenCalled();
        });
        it('should not allow date before today', async () => {
            const { updatePlannedInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
            const testDay = dayjs().subtract(1, "day").format("DD.MM.YYYY");

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
            });

            expect(deleteInspection).toHaveBeenCalledWith(mockInspectionList[0].id);
            expect(mutate).toHaveBeenCalled();
        });
        it('should catch DAL-Exception', async () => {
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
            await act(async () => {
                await simpleWarningModal.mock.calls[0][0].primaryFunction();
            });

            expect(deleteInspection).toHaveBeenCalledWith(mockInspectionList[0].id);
            expect(toast.error).toHaveBeenCalled();
        });
    });
    describe('start inspection', () => {
        it('should start the inspection', async () => {
            const { startInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspectionList[0]}
                />
            );

            await user.click(screen.getByTestId('btn_start'));
            expect(startInspection).toHaveBeenCalled();
            expect(mutate).toHaveBeenCalled();
        });

        it('should not start inspection if other hasnt finished', async () => {
            const { startInspection } = jest.requireMock("@/dal/inspection");
            const { usePlannedInspectionList } = jest.requireMock("@/dataFetcher/inspection");
            const { simpleErrorModal } = jest.requireMock("@/components/modals/modalProvider").useModal();
            const mutate = usePlannedInspectionList().mutate;
            usePlannedInspectionList.mockReturnValueOnce({
                inspectionList: [
                    mockInspectionList[0], mockInspectionList[1],
                    {
                        ...mockInspectionList[2],
                        timeStart: dayjs.utc().startOf('day').hour(2).toDate(),
                    }
                ],
                mutate,
            });

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspectionList[0]}
                />
            );

            await user.click(screen.getByTestId('btn_start'));
            expect(startInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();
            expect(simpleErrorModal).toHaveBeenCalledTimes(1);
        });

        it('should catch exception from dal-method', async () => {
            const { startInspection } = jest.requireMock("@/dal/inspection");
            const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
            startInspection.mockRejectedValueOnce(new Error("error"));

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspectionList[0]}
                />
            );
            await user.click(screen.getByTestId('btn_start'));
            expect(startInspection).toHaveBeenCalledTimes(1);
            expect(mutate).not.toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();
        });
    });
    describe('stop inspection', () => {
        const { stopInspection } = jest.requireMock("@/dal/inspection");
        const { usePlannedInspectionList } = jest.requireMock("@/dataFetcher/inspection");
        const { simpleFormModal } = jest.requireMock("@/components/modals/modalProvider").useModal();
        const { mutate } = usePlannedInspectionList();

        it('should stop passed inspection', async () => {
            usePlannedInspectionList.mockReturnValueOnce({
                inspectionList: [
                    mockInspectionList[0], mockInspectionList[1],
                    {
                        ...mockInspectionList[2],
                        timeStart: "07:00",
                    }
                ],
                mutate,
            });

            const mockInspection = {
                ...mockInspectionList[2],
                timeStart: "07:00",
            }

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspection}
                />
            );
            await user.click(screen.getByTestId('btn_complete'));
            expect(simpleFormModal).toHaveBeenCalledTimes(1);
            expect(simpleFormModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    header: expect.stringContaining("inspection.planned.label.finishInspection"),
                    elementLabel: expect.stringContaining("inspection.planned.label.time.finished"),
                    elementValidation: expect.objectContaining({
                        validate: expect.any(Function),
                    }),
                    save: expect.any(Function),
                    type: "time",
                    defaultValue: { input: "" },
                })
            );
            expect(stopInspection).not.toHaveBeenCalled();
            expect(mutate).not.toHaveBeenCalled();

            const validate = simpleFormModal.mock.calls[0][0].elementValidation.validate;
            expect(validate('6:59')).toEqual("inspection.planned.errors.endBeforStart");
            expect(validate('7:00')).toEqual("inspection.planned.errors.endBeforStart");
            expect(validate('7:01')).toBeTruthy();

            await act(async () => {
                await simpleFormModal.mock.calls[0][0].save({ input: "12:00" });
            });
            expect(stopInspection).toHaveBeenCalledWith({
                id: mockInspection.id,
                time: "12:00",
            });
            expect(mutate).toHaveBeenCalled();
        });
        it('should stop active inspection', async () => {
            const newDate = dayjs().hour(14).minute(10).toDate();
            jest.useFakeTimers({ advanceTimers: true, now: newDate });

            usePlannedInspectionList.mockReturnValueOnce({
                inspectionList: [
                    {
                        ...mockInspectionList[0],
                        timeStart: "07:00",
                    },
                    mockInspectionList[1],
                    mockInspectionList[2],
                ],
                mutate,
            });
            const mockInspection = {
                ...mockInspectionList[0],
                timeStart: "07:00",
            }

            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspection}
                />
            );

            await user.click(screen.getByTestId('btn_complete'));

            expect(simpleFormModal).toHaveBeenCalledTimes(1);
            expect(simpleFormModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    header: expect.stringContaining("inspection.planned.label.finishInspection"),
                    elementLabel: expect.stringContaining("inspection.planned.label.time.finished"),
                    elementValidation: expect.objectContaining({
                        validate: expect.any(Function),
                    }),
                    save: expect.any(Function),
                    type: "time",
                    defaultValue: { input: "14:10" },
                })
            );
            const validate = simpleFormModal.mock.calls[0][0].elementValidation.validate;
            expect(validate('6:59')).toEqual("inspection.planned.errors.endBeforStart");
            expect(validate('7:00')).toEqual("inspection.planned.errors.endBeforStart");
            expect(validate('7:01')).toBeTruthy();

            await act(async () => {
                await simpleFormModal.mock.calls[0][0].save({ input: "12:00" });
            });
            expect(stopInspection).toHaveBeenCalledWith({
                id: mockInspectionList[0].id,
                time: "12:00",
            });
            expect(mutate).toHaveBeenCalled();

            jest.useRealTimers();
        });
        it('should catch exception from dal-method', async () => {
            stopInspection.mockRejectedValueOnce(new Error("error"));
            usePlannedInspectionList.mockReturnValueOnce({
                inspectionList: [
                    {
                        ...mockInspectionList[0],
                        timeStart: "07:00",
                    },
                    mockInspectionList[1],
                    mockInspectionList[2],
                ],
                mutate,
            });
            const mockInspection = {
                ...mockInspectionList[0],
                timeStart: "07:00",
            }
            const user = userEvent.setup();
            render(
                <PlannedInspectionTableRow
                    inspection={mockInspection}
                />
            );
            await user.click(screen.getByTestId('btn_complete'));
            await act(async () => {
                await simpleFormModal.mock.calls[0][0].save({ input: "12:00" });
            });
            expect(stopInspection).toHaveBeenCalledTimes(1);
            expect(mutate).not.toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();
        });
    });
});
