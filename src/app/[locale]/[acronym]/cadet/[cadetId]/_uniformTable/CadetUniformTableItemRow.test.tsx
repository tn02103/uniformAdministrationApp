import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CadetUniformTableItemRow } from "./CadetUniformTableItemRow";
import type { UniformWithOwner, UniformType } from "@/types/globalUniformTypes";

// Mocks
jest.mock("@/components/globalDataProvider", () => ({
    useGlobalData: () => ({ userRole: 2 }), // inspector
}));
jest.mock("@/components/UniformOffcanvas/UniformOffcanvas", () => ({
    __esModule: true,
    UniformOffcanvas: (props: { onClose: () => void }) => (
        <div data-testid="offcanvas">
            <button onClick={props.onClose}>Close</button>
        </div>
    ),
}));
jest.mock("@/dal/uniform/item/_index", () => ({
    returnUniformItem: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/dataFetcher/cadet", () => ({
    useCadetUniformMap: () => ({ mutate: jest.fn(async (x) => x) }),
}));
jest.mock("next/navigation", () => ({
    useParams: () => ({ cadetId: "cadet-1", locale: "de" }),
}));


const mockReplaceItem = jest.fn();
const mockSetOpenUniformId = jest.fn();

const mockUniformType: UniformType = {
    id: "type-1",
    name: "Hose",
    acronym: "HS",
    issuedDefault: 1,
    usingGenerations: true,
    usingSizes: true,
    fk_defaultSizelist: "sizelist-1",
    defaultSizelist: { id: "sizelist-1", name: "Standard" },
    uniformGenerationList: [],
    sortOrder: 1,
};

const mockUniform: UniformWithOwner = {
    id: "u-1",
    number: 42,
    active: true,
    comment: "Testkommentar",
    type: mockUniformType,
    generation: { id: "gen-1", name: "Gen1", outdated: false },
    size: { id: "size-1", name: "M" },
    issuedEntries: [],
    storageUnit: null,
};

function setup(props = {}) {
    return render(
        <CadetUniformTableItemRow
            uniform={mockUniform}
            uniformType={mockUniformType}
            replaceItem={mockReplaceItem}
            openUniformId={null}
            setOpenUniformId={mockSetOpenUniformId}
            {...props}
        />
    );
}

describe("CadetUniformTableItemRow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders all main fields", () => {
        setup();
        expect(screen.getByTestId("div_number")).toHaveTextContent("42");
        expect(screen.getByTestId("div_generation")).toHaveTextContent("Gen1");
        expect(screen.getByTestId("div_size")).toHaveTextContent("M");
        expect(screen.getByTestId("div_comment")).toHaveTextContent("Testkommentar");
    });

    it("calls replaceItem when switch button is clicked", async () => {
        setup();
        const btn = screen.getByTestId("btn_switch");
        await userEvent.click(btn);
        expect(mockReplaceItem).toHaveBeenCalled();
    });

    it("calls setOpenUniformId when open button is clicked", async () => {
        setup();
        const btn = screen.getByTestId("btn_open");
        await userEvent.click(btn);
        expect(mockSetOpenUniformId).toHaveBeenCalledWith("u-1");
    });

    it("calls sa and opens modal when withdraw button is clicked", async () => {
        const { simpleWarningModal } = jest.requireMock("@/components/modals/modalProvider").useModal();
        const { returnUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
        setup();
        const btn = screen.getByTestId("btn_withdraw");
        await userEvent.click(btn);
        expect(simpleWarningModal).toHaveBeenCalled();
        expect(returnUniformItem).not.toHaveBeenCalled();

        await act(async () => {
            await simpleWarningModal.mock.calls[0][0].primaryFunction();
        });
        expect(returnUniformItem).toHaveBeenCalledWith({ uniformId: "u-1", cadetId: "cadet-1" });
    });

    it("catches errors when returnUniformItem fails", async () => {
        const { simpleWarningModal } = jest.requireMock("@/components/modals/modalProvider").useModal();
        const { returnUniformItem } = jest.requireMock("@/dal/uniform/item/_index");
        returnUniformItem.mockRejectedValue(new Error("Test error"));
        const { toast } = jest.requireMock("react-toastify");
        setup();

        const btn = screen.getByTestId("btn_withdraw");
        await userEvent.click(btn);
        await act(async () => {
            await simpleWarningModal.mock.calls[0][0].primaryFunction();
        });

        expect(toast.error).toHaveBeenCalled();
    });

    it("shows UniformOffcanvas when openUniformId matches", () => {
        setup({ openUniformId: "u-1" });
        expect(screen.getByTestId("offcanvas")).toBeInTheDocument();
    });

    it("calls setOpenUniformId(null) when UniformOffcanvas is closed", async () => {
        setup({ openUniformId: "u-1" });
        const closeBtn = screen.getByText("Close");
        await userEvent.click(closeBtn);
        expect(mockSetOpenUniformId).toHaveBeenCalledWith(null);
    });

    it("toggles row selection on click (except on buttons)", async () => {
        setup();
        const row = screen.getByTestId("div_uitem_u-1");
        expect(row).not.toHaveClass("bg-primary-subtle");
        await userEvent.click(row!);
        expect(row).toHaveClass("bg-primary-subtle");
        await userEvent.click(row!);
        expect(row).not.toHaveClass("bg-primary-subtle");
    });

    it("does not toggle selection when clicking a button", async () => {
        setup();
        const row = screen.getByTestId("div_uitem_u-1");
        const btn = screen.getByTestId("btn_switch");
        await userEvent.click(btn);
        expect(row).not.toHaveClass("bg-primary-subtle");
    });
    it("shows number in red if uniform is not active", () => {
        setup({ uniform: { ...mockUniform, active: false } });
        const numberDiv = screen.getByTestId("div_number");
        expect(numberDiv).toHaveClass("text-danger");
    });

    it("does not show number in red if uniform is active", () => {
        setup({ uniform: { ...mockUniform, active: true } });
        const numberDiv = screen.getByTestId("div_number");
        expect(numberDiv).not.toHaveClass("text-danger");
    });

    it("does not call setOpenUniformId if open button is disabled", async () => {
        setup({ openUniformId: "u-1" });
        // The open button should be disabled when openUniformId matches
        const openBtn = screen.getByTestId("btn_open");
        expect(openBtn).toBeDisabled();
        await userEvent.click(openBtn);
        expect(mockSetOpenUniformId).not.toHaveBeenCalledWith("u-1");
    });

    it("renders with minimal props (no generation/size/comment)", () => {
        setup({
            uniform: {
                ...mockUniform,
                generation: undefined,
                size: undefined,
                comment: "",
            },
        });
        expect(screen.getByTestId("div_generation")).toBeInTheDocument();
        expect(screen.getByTestId("div_size")).toBeInTheDocument();
        expect(screen.getByTestId("div_comment")).toBeInTheDocument();
    });

    it("does not render UniformOffcanvas if openUniformId does not match", () => {
        setup({ openUniformId: "other-id" });
        expect(screen.queryByTestId("offcanvas")).not.toBeInTheDocument();
    });

    it("calls setOpenUniformId when dropdown open is clicked", async () => {
        setup();
        const btnMenu = screen.getByTestId("btn_menu");
        await userEvent.click(btnMenu);
        const btnMenuOpen = screen.getByTestId("btn_menu_open");
        await userEvent.click(btnMenuOpen);
        expect(mockSetOpenUniformId).toHaveBeenCalledWith("u-1");
    });
    it("shows correct text color for missing generation", () => {
        setup({ uniform: { ...mockUniform, generation: undefined } });
        expect(screen.getByTestId("div_generation")).toHaveClass("text-danger");
    });

    it("shows correct text color for outdated generation", () => {
        setup({ uniform: { ...mockUniform, generation: { id: "gen-1", name: "Gen1", outdated: true } } });
        expect(screen.getByTestId("div_generation")).toHaveClass("text-warning");
    });

    it("shows correct text color for missing size", () => {
        setup({ uniform: { ...mockUniform, size: undefined } });
        expect(screen.getByTestId("div_size")).toHaveClass("text-danger");
    });

    it("shows secondary text color for generation if not usingGenerations", () => {
        setup({ uniformType: { ...mockUniformType, usingGenerations: false } });
        expect(screen.getByTestId("div_generation")).toHaveClass("text-secondary");
    });

    it("shows secondary text color for size if not usingSizes", () => {
        setup({ uniformType: { ...mockUniformType, usingSizes: false } });
        expect(screen.getByTestId("div_size")).toHaveClass("text-secondary");
    });

    it("shows '---' for generation and size if not usingGenerations or usingSizes", () => {
        setup({
            uniformType: { ...mockUniformType, usingGenerations: false, usingSizes: false },
            uniform: { ...mockUniform, generation: undefined, size: undefined }
        });
        expect(screen.getByTestId("div_generation")).toHaveTextContent("---");
        expect(screen.getByTestId("div_size")).toHaveTextContent("---");
    });
    it("shows 'K.A.' in danger color for missing generation/size if usingGenerations/usingSizes", () => {
        setup({ uniform: { ...mockUniform, generation: undefined, size: undefined } });
        expect(screen.getByTestId("div_generation")).toHaveTextContent("K.A.");
        expect(screen.getByTestId("div_generation")).toHaveClass("text-danger");
        expect(screen.getByTestId("div_size")).toHaveTextContent("K.A.");
        expect(screen.getByTestId("div_size")).toHaveClass("text-danger");
    });
    it("shows 'K.A.' for missing generation/size if usingGenerations/usingSizes", () => {
        setup({ uniform: { ...mockUniform, generation: undefined, size: undefined } });
        expect(screen.getByTestId("div_generation")).toHaveTextContent("K.A.");
        expect(screen.getByTestId("div_size")).toHaveTextContent("K.A.");
    });

    it("shows dropdown menu and triggers actions on mobile", async () => {
        setup();
        const btnMenu = screen.getByTestId("btn_menu");
        await userEvent.click(btnMenu);
        const btnMenuSwitch = screen.getByTestId("btn_menu_switch");
        const btnMenuWithdraw = screen.getByTestId("btn_menu_withdraw");
        const btnMenuOpen = screen.getByTestId("btn_menu_open");
        await userEvent.click(btnMenuSwitch);
        expect(mockReplaceItem).toHaveBeenCalled();
        await userEvent.click(btnMenuWithdraw);
        const modalMock = jest.requireMock("@/components/modals/modalProvider").useModal();
        expect(modalMock.simpleWarningModal).toHaveBeenCalled();
        await userEvent.click(btnMenuOpen);
        expect(mockSetOpenUniformId).toHaveBeenCalledWith("u-1");
    });
});
