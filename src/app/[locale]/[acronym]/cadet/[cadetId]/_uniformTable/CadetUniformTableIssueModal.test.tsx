import { getAllByRole, getByRole, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockTypeList } from "../../../../../../../tests/_jestConfig/staticMockData";
import { CadetUniformTableIssueModal, CadetUniformTableIssueModalProps } from "./CadetUniformTableIssueModal";

// Mocks
jest.mock("@/dataFetcher/cadet", () => ({
    useCadetUniformMap: jest.fn(),
}));
jest.mock("@/dataFetcher/uniform", () => ({
    useUniformLabels: jest.fn(),
}));

jest.mock("@/dal/uniform/item/_index", () => ({
    issueUniformItem: jest.fn(() => Promise.resolve({})),
}));

const mockMutate = jest.fn();
const mockOnClose = jest.fn();

const defaultProps: CadetUniformTableIssueModalProps = {
    cadetId: "cadet-1",
    type: mockTypeList[0],
    onClose: mockOnClose,
};

const uniformLabels = [
    { id: "item-1", number: 101, typeId: defaultProps.type.id, active: true, owner: { id: "cadet-1", firstname: "Lucas", lastname: "Mustermann" }, storageUnit: null },
    { id: "item-2", number: 102, typeId: defaultProps.type.id, active: false, owner: null, storageUnit: null },
    { id: "item-3", number: 103, typeId: defaultProps.type.id, active: true, owner: { id: "cadet-2", firstname: "Max", lastname: "Mustermann" }, storageUnit: null },
    { id: "item-4", number: 104, typeId: defaultProps.type.id, active: true, owner: null, storageUnit: { name: "Lager 1" } },
    { id: "item-5", number: 105, typeId: defaultProps.type.id, active: false, owner: { id: "cadet-3", firstname: "Anna", lastname: "Musterfrau" }, storageUnit: null },
];

const issuedItemList = [
    { id: "item-1", number: 101, owner: null, active: true, storageUnit: null, typeId: defaultProps.type.id },
];

beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock("@/dataFetcher/cadet").useCadetUniformMap.mockReturnValue({
        map: { [defaultProps.type.id]: issuedItemList },
        mutate: mockMutate,
    });
    jest.requireMock("@/dataFetcher/uniform").useUniformLabels.mockReturnValue({
        uniformLabels,
    });
});

function setup(props: Partial<CadetUniformTableIssueModalProps> = {}) {
    return render(<CadetUniformTableIssueModal {...defaultProps} {...props} />);
}

describe("CadetUniformTableIssueModal", () => {
    it("renders modal with correct header for add", () => {
        setup();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText(/cadetDetailPage.issueModal.header.add/)).toBeInTheDocument();
    });

    it("renders modal with correct header for replace", () => {
        setup({ itemToReplace: { id: "item-1", number: 101 } });
        expect(screen.getByText(/cadetDetailPage.issueModal.header.replace/)).toBeInTheDocument();
    });

    it("disables issueBtn when input is empty", async () => {
        setup();
        const issueBtn = screen.getByRole("button", { name: /issue/i });
        expect(issueBtn).toBeDisabled();
    });

    it("shows error for invalid input", async () => {
        setup();
        const input = screen.getByLabelText(/input.label/i);
        await userEvent.type(input, "abc");
        expect(await screen.findByText(/cadetDetailPage.issueModal.error.invalidNumber/)).toBeInTheDocument();
    });

    it("calls onClose when cancel is clicked", async () => {
        setup();
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        await userEvent.click(cancelBtn);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls mutate and onClose on successful issue", async () => {
        setup();
        const input = screen.getByLabelText(/input.label/i);
        await userEvent.clear(input);
        await userEvent.type(input, "104");
        const issueBtn = screen.getByRole("button", { name: /issue|create|replace|changeOwner/i });
        await userEvent.click(issueBtn);

        expect(mockMutate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    describe("issue uniform item", () => {
        it("calls issueUniformItem with correct values for issuing a new item (not in options)", async () => {
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "999");
            const issueBtn = screen.getByRole("button", { name: /create/i });
            await userEvent.click(issueBtn);

            expect(issueUniformItem).toHaveBeenCalledWith({
                cadetId: "cadet-1",
                number: 999,
                uniformTypeId: defaultProps.type.id,
                idToReplace: undefined,
                options: {
                    ignoreInactive: false,
                    force: false,
                    create: true,
                }
            });
        });

        it("calls issueUniformItem with correct values for issuing an available item", async () => {
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");
            const issueBtn = screen.getByRole("button", { name: /issue/i });
            await userEvent.click(issueBtn);

            expect(issueUniformItem).toHaveBeenCalledWith({
                cadetId: "cadet-1",
                number: 104,
                uniformTypeId: defaultProps.type.id,
                idToReplace: undefined,
                options: {
                    ignoreInactive: false,
                    force: false,
                    create: false,
                }
            });
        });

        it("calls issueUniformItem with correct values for replacing an item", async () => {
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            setup({ itemToReplace: { id: "item-2", number: 102 } });
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");
            const issueBtn = screen.getByRole("button", { name: /replace/i });
            await userEvent.click(issueBtn);

            expect(issueUniformItem).toHaveBeenCalledWith({
                cadetId: "cadet-1",
                number: 104,
                uniformTypeId: defaultProps.type.id,
                idToReplace: "item-2",
                options: {
                    ignoreInactive: false,
                    force: false,
                    create: false,
                }
            });
        });

        it("calls issueUniformItem with correct values for issuing an inactive (reserve) item", async () => {
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "102");
            const issueBtn = screen.getByRole("button", { name: /issue/i });
            await userEvent.click(issueBtn);

            expect(issueUniformItem).toHaveBeenCalledWith({
                cadetId: "cadet-1",
                number: 102,
                uniformTypeId: defaultProps.type.id,
                idToReplace: undefined,
                options: {
                    ignoreInactive: true,
                    force: false,
                    create: false,
                }
            });
        });

        it("calls issueUniformItem with correct values for changing owner (item owned by another cadet)", async () => {
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "103");
            const issueBtn = screen.getByRole("button", { name: /changeOwner/i });
            await userEvent.click(issueBtn);

            expect(issueUniformItem).toHaveBeenCalledWith({
                cadetId: "cadet-1",
                number: 103,
                uniformTypeId: defaultProps.type.id,
                idToReplace: undefined,
                options: {
                    ignoreInactive: false,
                    force: true,
                    create: false,
                }
            });
        });

        it("calls issueUniformItem with correct values for issuing a reserve item with owner", async () => {
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "105");
            const issueBtn = screen.getByRole("button", { name: /changeOwner/i });
            await userEvent.click(issueBtn);

            expect(issueUniformItem).toHaveBeenCalledWith({
                cadetId: "cadet-1",
                number: 105,
                uniformTypeId: defaultProps.type.id,
                idToReplace: undefined,
                options: {
                    ignoreInactive: true,
                    force: true,
                    create: false,
                }
            });
        });

        it('catches error when issueUniform fails', async () => {
            const { toast } = jest.requireMock("react-toastify");
            const { issueUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
            issueUniformItem.mockRejectedValue(new Error("Issue failed"));

            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");
            const issueBtn = screen.getByRole("button", { name: /issue/i });
            await userEvent.click(issueBtn);

            expect(toast.error).toHaveBeenCalled();
        });
    });

    describe("alerts", () => {
        it("shows warning if item is already owned by cadet", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.type(input, "101");
            expect(await screen.findByText(/cadetDetailPage.issueModal.alert.itemAlreadyOwned/)).toBeInTheDocument();
        });

        it("shows warning if item does not exist", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.type(input, "999");
            expect(await screen.findByText(/cadetDetailPage.issueModal.alert.noItemFound/)).toBeInTheDocument();
        });

        it("shows danger alert if item is owned by another cadet", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            // Select item-3 (owned by another cadet)
            await userEvent.clear(input);
            await userEvent.type(input, "103");
            expect(await screen.findByText(/cadetDetailPage.issueModal.alert.owner.1/)).toBeInTheDocument();
            expect(screen.getByText(/Max Mustermann/)).toBeInTheDocument();

            // Select item-1 (owned by the cadet themself)
            await userEvent.clear(input);
            await userEvent.type(input, "101");
            // The danger alert for another owner should NOT be shown
            expect(screen.queryByText(/cadetDetailPage.issueModal.alert.owner.1/)).not.toBeInTheDocument();
        });

        it("shows warning if item is inactive (reserve)", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "102");
            expect(await screen.findByText(/cadetDetailPage.issueModal.alert.reserve/)).toBeInTheDocument();
        });

        it("shows alert if item is assigned to a storage unit", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");
            expect(await screen.findByText(/cadetDetailPage.issueModal.alert.storageUnit/)).toBeInTheDocument();
        });
    });
    describe("options", () => {
        it("shows storage unit icon for storage item", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");

            const option = screen.getByRole("option", { name: /104/i });
            expect(option).toBeVisible();
            expect(getByRole(option, "img", { hidden: true })).toBeVisible();
            expect(getByRole(option, "img", { hidden: true })).toHaveAttribute("class", expect.stringContaining("fa-box-open"));
        });

        it("shows 'R' icon for inactive (reserve) item in option", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "102");

            const option = screen.getByRole("option", { name: /102/i });
            expect(option).toBeVisible();
            // faRegistered is the warning icon for inactive
            const warningIcon = getByRole(option, "img", { hidden: true });
            expect(warningIcon).toHaveAttribute("class", expect.stringContaining("fa-registered"));
            // The text color is set on the option, not the icon
            expect(option).toHaveClass("text-warning");
        });

        it("shows person icon for item owned by another cadet in option", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "103");

            const option = screen.getByRole("option", { name: /103/i });
            expect(option).toBeVisible();
            // faPerson is the icon for items owned by another cadet
            const personIcon = getByRole(option, "img", { hidden: true });
            expect(personIcon).toHaveAttribute("class", expect.stringContaining("fa-user"));
            // The text color is set on the option, not the icon
            expect(option).toHaveClass("text-danger");
        });

        it("shows both person and warning icons for a reserve item with an owner", async () => {
            // Use item-5: reserve (inactive) and has an owner
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "105");

            const option = screen.getByRole("option", { name: /105/i });
            expect(option).toBeVisible();
            const icons = getAllByRole(option, "img", { hidden: true });
            // Should have fa-user and fa-registered (reserve warning)
            const userIcon = Array.from(icons).find(icon =>
                icon.classList.contains("fa-user")
            );
            const warningIcon = Array.from(icons).find(icon =>
                icon.classList.contains("fa-registered")
            );
            expect(userIcon).toBeTruthy();
            expect(warningIcon).toBeTruthy();
            // The text color is set on the option, not the icon
            expect(option).toHaveClass("text-danger");
        });

        it("renders the option for an already issued item as disabled and with not-allowed cursor", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "101");

            const option = screen.getByRole("option", { name: /101/i });
            expect(option).toBeVisible();
            expect(option).toHaveClass("text-secondary");
            expect(option).toHaveAttribute("aria-disabled", "true");
            expect(option).toHaveStyle({ cursor: "not-allowed" });
        });
    });

    describe("issue button", () => {
        it("disables issue button if item is already owned", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.type(input, "101");
            const issueBtn = screen.getByRole("button", { name: /issue|create|replace|changeOwner/i });
            expect(issueBtn).toBeDisabled();
        });

        it("shows 'changeOwner' text and danger variant if item is owned by another cadet", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "103");
            const issueBtn = screen.getByRole("button", { name: /changeOwner/i });
            expect(issueBtn).toBeEnabled();
            expect(issueBtn).toHaveClass("btn-danger");
            expect(issueBtn.textContent).toMatch(/changeOwner/i);
        });

        it("shows 'create' text and primary variant if input is a valid number not in options and not owned", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "999");
            const issueBtn = screen.getByRole("button", { name: /create/i });
            expect(issueBtn).toBeEnabled();
            expect(issueBtn).toHaveClass("btn-primary");
            expect(issueBtn.textContent).toMatch(/create/i);
        });

        it("shows 'replace' text if itemToReplace is set and valid item selected", async () => {
            setup({ itemToReplace: { id: "item-2", number: 102 } });
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");
            const issueBtn = screen.getByRole("button", { name: /replace/i });
            expect(issueBtn).toBeEnabled();
            expect(issueBtn.textContent).toMatch(/replace/i);
        });

        it("shows 'issue' text and primary variant for a normal available item", async () => {
            setup();
            const input = screen.getByLabelText(/input.label/i);
            await userEvent.clear(input);
            await userEvent.type(input, "104");
            const issueBtn = screen.getByRole("button", { name: /issue/i });
            expect(issueBtn).toBeEnabled();
            expect(issueBtn).toHaveClass("btn-primary");
            expect(issueBtn.textContent).toMatch(/issue/i);
        });
    });
});
