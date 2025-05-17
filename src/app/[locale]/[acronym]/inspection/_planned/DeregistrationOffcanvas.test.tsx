
import "./jestHelper";

import { getAllByRole, getByRole, getByTestId, queryByRole, render, screen } from "@testing-library/react";
import { mockCadetList, mockInspectionList } from "./jestHelper";
import { DeregistrationOffcanvas } from "./DeregistrationOffcanvas";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";

describe('<DeregistrationOffcanvas/>', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should render', () => {
        const mockInspection = mockInspectionList[0];
        render(
            <DeregistrationOffcanvas
                inspection={mockInspection}
                cadetList={mockCadetList}
                onClose={jest.fn()}
            />
        );

        expect(screen.getByText(/deregistration.header/i)).toBeInTheDocument();

        // validate the table
        const table = screen.getByRole("table");
        const tbody = getByRole(table, "rowgroup", { name: /body/i });
        getAllByRole(tbody, "row").forEach((row, index) => {
            const cells = getAllByRole(row, "cell");
            const deregistration = mockInspection.deregistrations[index];

            expect(row).toHaveClass(/hoverCol/);
            expect(cells).toHaveLength(3);
            expect(getByRole(cells[0], "button")).toHaveAccessibleName(/label.remove/i);
            expect(getByRole(cells[0], "button")).toHaveClass(/hoverColHidden/);
            expect(cells[1]).toHaveTextContent(deregistration.cadet.firstname);
            expect(cells[1]).toHaveTextContent(deregistration.cadet.lastname);
            expect(cells[2]).toHaveTextContent(format(deregistration.date, "dd.MM.yyyy HH:mm"))
        });
        expect(screen.getByTestId(/autocomplete-field-group/)).toBeInTheDocument();
    });

    it('should close the offcanvas with close button', async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        render(
            <DeregistrationOffcanvas
                inspection={mockInspectionList[0]}
                cadetList={mockCadetList}
                onClose={onClose}
            />
        );

        const closeButton = screen.getByRole("button", { name: /close/i });
        expect(closeButton).toBeInTheDocument();
        await user.click(closeButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('should be able to deregister a cadet', async () => {
        const { updateCadetRegistrationForInspection } = jest.requireMock("@/dal/inspection");
        const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();

        const user = userEvent.setup();
        render(
            <DeregistrationOffcanvas
                inspection={mockInspectionList[0]}
                cadetList={mockCadetList}
                onClose={jest.fn()}
            />
        );

        const deregisterFieldGroup = screen.getByTestId("autocomplete-field-group");
        const deregisterField = getByRole(deregisterFieldGroup, "textbox");
        expect(deregisterField).toBeInTheDocument();
        expect(deregisterField).toHaveValue("");
        expect(deregisterField).toHaveAttribute("aria-expanded", "false");
        await user.click(deregisterField);
        expect(deregisterField).toHaveAttribute("aria-expanded", "true");

        const optionListBox = getByRole(deregisterFieldGroup, "listbox");
        expect(optionListBox).toBeInTheDocument();
        expect(getAllByRole(optionListBox, "option")).toHaveLength(mockCadetList.length - 2);
        expect(queryByRole(optionListBox, "option", { name: RegExp(mockCadetList[0].firstname) })).toBeNull();
        expect(queryByRole(optionListBox, "option", { name: RegExp(mockCadetList[1].firstname) })).toBeNull();
        expect(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[2].firstname) })).toBeInTheDocument();
        expect(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[3].firstname) })).toBeInTheDocument();
        expect(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[4].firstname) })).toBeInTheDocument();

        await user.type(deregisterField, "o");
        expect(deregisterField).toHaveValue("o");
        expect(getAllByRole(optionListBox, "option")).toHaveLength(2);
        expect(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[2].firstname) })).toBeInTheDocument();
        expect(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[3].firstname) })).toBeInTheDocument();
        expect(queryByRole(optionListBox, "option", { name: RegExp(mockCadetList[4].firstname) })).toBeNull();

        await user.click(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[3].firstname) }));
        expect(deregisterField).toHaveValue("");
        expect(deregisterField).toHaveAttribute("aria-expanded", "false");
        expect(optionListBox).not.toBeInTheDocument();

        expect(updateCadetRegistrationForInspection).toHaveBeenCalledWith({
            cadetId: mockCadetList[3].id,
            inspectionId: mockInspectionList[0].id,
            deregister: true
        });
        expect(mutate).toHaveBeenCalled();
    });
    it('should catch exceptions when deregistering a cadet', async () => {
        const { updateCadetRegistrationForInspection } = jest.requireMock("@/dal/inspection");
        const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
        const { toast } = jest.requireMock("react-toastify");

        const user = userEvent.setup();
        render(
            <DeregistrationOffcanvas
                inspection={mockInspectionList[0]}
                cadetList={mockCadetList}
                onClose={jest.fn()}
            />
        );

        const deregisterFieldGroup = screen.getByTestId("autocomplete-field-group");
        const deregisterField = getByRole(deregisterFieldGroup, "textbox");
        await user.click(deregisterField);

        const optionListBox = getByRole(deregisterFieldGroup, "listbox");
        await user.click(getByRole(optionListBox, "option", { name: RegExp(mockCadetList[3].firstname) }));

        expect(updateCadetRegistrationForInspection).toHaveBeenCalledWith({
            cadetId: mockCadetList[3].id,
            inspectionId: mockInspectionList[0].id,
            deregister: true
        });
        expect(mutate).toHaveBeenCalled();
        expect(mutate).toHaveReturnedTimes(1);
        expect(toast.error).not.toHaveBeenCalled();

        updateCadetRegistrationForInspection.mockRejectedValueOnce(new Error("test error"));
        expect(deregisterField).toHaveAttribute("aria-expanded", "false");
        await user.click(deregisterField);
        expect(deregisterField).toHaveAttribute("aria-expanded", "true");
        await user.click(getByRole(deregisterFieldGroup, "option", { name: RegExp(mockCadetList[4].firstname) }));

        expect(updateCadetRegistrationForInspection).toHaveBeenCalledTimes(2);
        expect(updateCadetRegistrationForInspection).toHaveBeenCalledWith({
            cadetId: mockCadetList[4].id,
            inspectionId: mockInspectionList[0].id,
            deregister: true
        });
        expect(mutate).toHaveReturnedTimes(1);
        expect(toast.error).toHaveBeenCalled();
    });

    it('should be able to remove a cadet from the deregistration list', async () => {
        const { updateCadetRegistrationForInspection } = jest.requireMock("@/dal/inspection");
        const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
     
        const user = userEvent.setup();
        render(
            <DeregistrationOffcanvas
                inspection={mockInspectionList[0]}
                cadetList={mockCadetList}
                onClose={jest.fn()}
            />
        );

        const removeButtons = screen.getAllByRole("button", { name: /label.remove/i });
        expect(removeButtons).toHaveLength(mockInspectionList[0].deregistrations.length);
        await user.click(removeButtons[0]);
        expect(updateCadetRegistrationForInspection).toHaveBeenCalledWith({
            cadetId: mockInspectionList[0].deregistrations[0].fk_cadet,
            inspectionId: mockInspectionList[0].id,
            deregister: false
        });
        expect(mutate).toHaveBeenCalled();
    });

    it('should catch exceptions when removing a cadet from the deregistration list', async () => {
        const { updateCadetRegistrationForInspection } = jest.requireMock("@/dal/inspection");
        const { mutate } = jest.requireMock("@/dataFetcher/inspection").usePlannedInspectionList();
        const { toast } = jest.requireMock("react-toastify");

        const user = userEvent.setup();
        render(
            <DeregistrationOffcanvas
                inspection={mockInspectionList[0]}
                cadetList={mockCadetList}
                onClose={jest.fn()}
            />
        );

        const removeButtons = screen.getAllByRole("button", { name: /label.remove/i });
        await user.click(removeButtons[0]);
        expect(updateCadetRegistrationForInspection).toHaveBeenCalledWith({
            cadetId: mockInspectionList[0].deregistrations[0].fk_cadet,
            inspectionId: mockInspectionList[0].id,
            deregister: false
        });
        expect(mutate).toHaveBeenCalled();
        expect(mutate).toHaveReturnedTimes(1);
        expect(toast.error).not.toHaveBeenCalled();

        updateCadetRegistrationForInspection.mockRejectedValueOnce(new Error("test error"));
        await user.click(removeButtons[1]);
        expect(updateCadetRegistrationForInspection).toHaveBeenCalledTimes(2);
        expect(updateCadetRegistrationForInspection).toHaveBeenCalledWith({
            cadetId: mockInspectionList[0].deregistrations[1].fk_cadet,
            inspectionId: mockInspectionList[0].id,
            deregister: false
        });
        expect(mutate).toHaveReturnedTimes(1);
        expect(toast.error).toHaveBeenCalled();
    });
});
