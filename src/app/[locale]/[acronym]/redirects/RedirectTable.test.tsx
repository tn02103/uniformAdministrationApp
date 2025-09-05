import { Redirect } from "@prisma/client";
import { getAllByRole, getByDisplayValue, getByRole, getByText, queryByText, render, } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { RedirectTable } from "./RedirectTable";

jest.mock("@/dal/redirects", () => ({
    createRedirect: jest.fn(),
    deleteRedirect: jest.fn(),
    updateRedirect: jest.fn(),
}));

const mockRedirects: Redirect[] = [
    { id: "1", code: "test1", target: "https://example.com/1", active: true, organisationId: '2348ec51-722b-43eb-bc55-31a3e7f456db' },
    { id: "2", code: "test2", target: "https://example.com/2", active: false, organisationId: '2348ec51-722b-43eb-bc55-31a3e7f456db' },
];

describe("RedirectTable", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the table with redirects", () => {
        const { container } = render(<RedirectTable redirects={mockRedirects} />);
        expect(getByText(container, "redirects.code")).toBeInTheDocument();
        expect(getByText(container, "redirects.target")).toBeInTheDocument();
        expect(getByText(container, "redirects.active")).toBeInTheDocument();

        mockRedirects.forEach((redirect) => {
            expect(getByDisplayValue(container, redirect.code)).toBeInTheDocument();
            expect(getByDisplayValue(container, redirect.target)).toBeInTheDocument();
        });

        expect(container).toMatchSnapshot();
    });

    it('disables action-buttons when new row is open', async () => {
        const user = userEvent.setup();
        const { container } = render(<RedirectTable redirects={mockRedirects} />);
        const createButton = getByRole(container, "button", { name: /create/i });
        expect(createButton).toBeEnabled();
        await user.click(createButton);

        const header = getAllByRole(container, "rowgroup")[0];
        const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
        expect(getByRole(header, "button", { name: /create/i })).toBeDisabled();
        expect(getByRole(firstRow, "button", { name: /delete/i })).toBeDisabled();
        expect(getByRole(firstRow, "button", { name: /edit/i })).toBeDisabled();

        const newRow = getByRole(container, "row", { name: /new/i });
        await user.click(getByRole(newRow, "button", { name: /cancel/i }));

        expect(getByRole(header, "button", { name: /create/i })).toBeEnabled();
        expect(getByRole(firstRow, "button", { name: /delete/i })).toBeEnabled();
        expect(getByRole(firstRow, "button", { name: /edit/i })).toBeEnabled();
    });

    it("disables action-buttons when row is editable", async () => {
        const user = userEvent.setup();
        const { container } = render(<RedirectTable redirects={mockRedirects} />);

        const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
        const seccondRow = getByRole(container, "row", { name: mockRedirects[1].code });

        const editButton = getByRole(firstRow, "button", { name: /edit/i });
        await user.click(editButton);

        expect(getByRole(container, 'button', { name: /create/i })).toBeDisabled();
        expect(getByRole(seccondRow, "button", { name: /delete/i })).toBeDisabled();
        expect(getByRole(seccondRow, "button", { name: /edit/i })).toBeDisabled();
        expect(getByRole(firstRow, "button", { name: /save/i })).toBeEnabled();
        expect(getByRole(firstRow, "button", { name: /cancel/i })).toBeEnabled();

        await user.click(getByRole(firstRow, "button", { name: /cancel/i }));

        expect(getByRole(container, 'button', { name: /create/i })).toBeEnabled();
        expect(getByRole(seccondRow, "button", { name: /delete/i })).toBeEnabled();
        expect(getByRole(seccondRow, "button", { name: /edit/i })).toBeEnabled();
    });

    it('copys link to clipboard', async () => {
        const user = userEvent.setup();
        const { container } = render(<RedirectTable redirects={mockRedirects} />);

        const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
        const copyButton = getByRole(firstRow, "button", { name: /sourceUrl/i });
        await user.click(copyButton);

        const clipboardText = await navigator.clipboard.readText();
        expect(clipboardText).toBe(`http://localhost/api/redirects?code=${mockRedirects[0].code}`);
    });

    describe("creating a redirect", () => {
        it("allows adding a new redirect", async () => {
            const createRedirectMock = jest.requireMock("@/dal/redirects").createRedirect;
            createRedirectMock.mockResolvedValueOnce(undefined);

            const user = userEvent.setup();
            const { container } = render(<RedirectTable redirects={mockRedirects} />);
            const createButton = getByRole(container, "button", { name: /create/i });
            await user.click(createButton);

            const row = getByRole(container, "row", { name: /new/i });
            expect(row).toBeInTheDocument();

            const codeInput = getByRole(row, "textbox", { name: "redirects.code" });
            const targetInput = getByRole(row, "textbox", { name: "redirects.target" });
            const activeCheckbox = getByRole(row, "checkbox", { name: "redirects.active" });

            expect(codeInput).toBeInTheDocument();
            expect(targetInput).toBeInTheDocument();
            expect(activeCheckbox).toBeInTheDocument();
            expect(activeCheckbox).toBeChecked();
            expect(container).toMatchSnapshot();

            await user.type(codeInput, "newCode");
            await user.type(targetInput, "https://example.com/new");
            await user.click(getByRole(row, "button", { name: /create/i }));

            expect(createRedirectMock).toHaveBeenCalledWith({
                code: "newCode",
                target: "https://example.com/new",
                active: true,
            });
        });

        it("catches exception from DAL-method", async () => {
            const createRedirectMock = jest.requireMock("@/dal/redirects").createRedirect;
            createRedirectMock.mockRejectedValueOnce(new Error("Test error"));

            const user = userEvent.setup();
            const { container } = render(<RedirectTable redirects={mockRedirects} />);
            const createButton = getByRole(container, "button", { name: /create/i });
            await user.click(createButton);

            const row = getByRole(container, "row", { name: /new/i });
            const codeInput = getByRole(row, "textbox", { name: "redirects.code" });
            const targetInput = getByRole(row, "textbox", { name: "redirects.target" });
            const activeCheckbox = getByRole(row, "checkbox", { name: "redirects.active" });
            const saveButton = getByRole(row, "button", { name: /create/i });

            await user.type(codeInput, "newCode");
            await user.type(targetInput, "https://example.com/new");
            await user.click(activeCheckbox);
            await user.click(saveButton);

            expect(createRedirectMock).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledTimes(1);
        });
    });

    describe("editing a redirect", () => {
        it("allows editing a redirect row", async () => {
            const saveRedirectMock = jest.requireMock("@/dal/redirects").updateRedirect;
            saveRedirectMock.mockResolvedValueOnce(undefined);

            const user = userEvent.setup();
            const { container } = render(
                <RedirectTable
                    redirects={mockRedirects}
                />
            );

            const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
            const editButton = getByRole(firstRow, "button", { name: /edit/i });
            await user.click(editButton);

            const codeInput = getByRole(firstRow, "textbox", { name: "redirects.code" });
            const targetInput = getByRole(firstRow, "textbox", { name: "redirects.target" });
            const activeCheckbox = getByRole(firstRow, "checkbox", { name: "redirects.active" });
            const saveButton = getByRole(firstRow, "button", { name: /save/i });

            expect(codeInput).toBeEnabled();
            expect(targetInput).toBeEnabled();
            expect(activeCheckbox).toBeEnabled();
            expect(container).toMatchSnapshot();

            await user.clear(codeInput);
            await user.type(codeInput, "newCode");
            await user.clear(targetInput);
            await user.type(targetInput, "https://example.com/new");
            await user.click(activeCheckbox);
            await user.click(saveButton);

            expect(saveRedirectMock).toHaveBeenCalledWith({
                id: mockRedirects[0].id,
                data: {
                    code: "newCode",
                    target: "https://example.com/new",
                    active: false,
                }
            });
        });

        it("resets data on Cancel", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <RedirectTable
                    redirects={mockRedirects}
                />
            );
            const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
            const editButton = getByRole(firstRow, "button", { name: /edit/i });
            await user.click(editButton);

            const codeInput = getByRole(firstRow, "textbox", { name: "redirects.code" });
            const targetInput = getByRole(firstRow, "textbox", { name: "redirects.target" });
            const activeCheckbox = getByRole(firstRow, "checkbox", { name: "redirects.active" });
            const cancelButton = getByRole(firstRow, "button", { name: /cancel/i });

            await user.clear(codeInput);
            await user.type(codeInput, "newCode");
            await user.clear(targetInput);
            await user.type(targetInput, "https://example.com/new");
            await user.click(activeCheckbox);
            await user.click(cancelButton);

            expect(codeInput).toHaveValue(mockRedirects[0].code);
            expect(targetInput).toHaveValue(mockRedirects[0].target);
            expect(getByText(firstRow, /active/i)).toBeInTheDocument();
            expect(queryByText(firstRow, /inactive/i)).not.toBeInTheDocument();
        });

        it("catches exception from DAL-method", async () => {
            const saveRedirectMock = jest.requireMock("@/dal/redirects").updateRedirect;
            saveRedirectMock.mockRejectedValueOnce(new Error("Test error"));

            const user = userEvent.setup();
            const { container } = render(
                <RedirectTable
                    redirects={mockRedirects}
                />
            );

            const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
            const editButton = getByRole(firstRow, "button", { name: /edit/i });
            await user.click(editButton);

            const saveButton = getByRole(firstRow, "button", { name: /save/i });
            await user.click(saveButton);

            expect(saveRedirectMock).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledTimes(1);
        });
    });
    describe("deleting a redirect", () => {
        it('allows deleting a redirect row', async () => {
            const deleteRedirectMock = jest.requireMock("@/dal/redirects").deleteRedirect;
            deleteRedirectMock.mockResolvedValueOnce(undefined);

            const user = userEvent.setup();
            const { container } = render(<RedirectTable redirects={mockRedirects} />);

            const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
            const deleteButton = getByRole(firstRow, "button", { name: /delete/i });
            await user.click(deleteButton);

            expect(deleteRedirectMock).toHaveBeenCalledWith(mockRedirects[0].id);

        });
        it("catches exception from DAL-method", async () => {
            const deleteRedirectMock = jest.requireMock("@/dal/redirects").deleteRedirect;
            deleteRedirectMock.mockRejectedValueOnce(new Error("Test error"));

            const user = userEvent.setup();
            const { container } = render(<RedirectTable redirects={mockRedirects} />);

            const firstRow = getByRole(container, "row", { name: mockRedirects[0].code });
            const deleteButton = getByRole(firstRow, "button", { name: /delete/i });
            await user.click(deleteButton);

            expect(deleteRedirectMock).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledTimes(1);
        });
    });
});
