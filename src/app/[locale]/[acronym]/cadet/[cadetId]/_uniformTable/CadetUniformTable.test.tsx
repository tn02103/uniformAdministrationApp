import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CadetUniformTable } from "./CadetUniformTable";
import { mockTypeList, mockUniformList } from "../../../../../../../tests/_jestConfig/staticMockData";
import type { CadetUniformMap } from "@/types/globalCadetTypes";
import { CadetUniformTableItemRowProps } from "./CadetUniformTableItemRow";
import { CadetUniformTableIssueModalProps } from "./CadetUniformTableIssueModal";

// Mocks
jest.mock("@/components/globalDataProvider", () => ({
    useGlobalData: () => ({ userRole: 2 }), // inspector
}));
jest.mock("@/dataFetcher/uniformAdmin", () => ({
    useUniformTypeList: () => ({
        typeList: mockTypeList,
    }),
}));
jest.mock("@/dataFetcher/cadet", () => ({
    useCadetUniformMap: (_cadetId: string, uniformMap?: CadetUniformMap) => ({
        map: uniformMap,
        mutate: jest.fn(),
    }),
}));
jest.mock("next/navigation", () => ({
    useParams: () => ({ cadetId: "cadet-1", locale: "de" }),
}));


jest.mock("./CadetUniformTableIssueModal", () => ({
    CadetUniformTableIssueModal: jest.fn().mockImplementation(
        (props: CadetUniformTableIssueModalProps) => (
            <div data-testid="issue-modal">
                Modal: {props.type?.name}
                <button onClick={props.onClose}>close</button>
            </div>
        )
    ),
}));
jest.mock("./CadetUniformTableItemRow", () => ({
    CadetUniformTableItemRow: jest.fn().mockImplementation(
        (props: CadetUniformTableItemRowProps) => (
            <div data-testid={`itemrow_${props.uniform.id}`}>
                {props.uniform.number}
                <button data-testid={`replace_${props.uniform.id}`} onClick={props.replaceItem}>replace</button>
            </div>
        )
    ),
}));

// Use mockTypeList and mockUniformList to build a CadetUniformMap
const mockUniformMap: CadetUniformMap = {
    [mockTypeList[0].id]: [ // Typ1
        {
            ...mockUniformList[0],
            id: "u-1",
            number: 2501,
            type: mockTypeList[0],
        },
        {
            ...mockUniformList[1],
            id: "u-2",
            number: 2502,
            type: mockTypeList[0],
        }
    ],
    [mockTypeList[1].id]: [
        {
            ...mockUniformList[2],
            id: "u-3",
            number: 2503,
            type: mockTypeList[1],
        }
    ],
    [mockTypeList[2].id]: [],
    [mockTypeList[3].id]: [],
    [mockTypeList[4].id]: [],
};

function setup(props = {}) {
    return render(<CadetUniformTable uniformMap={mockUniformMap} {...props} />);
}

describe("CadetUniformTable", () => {
    it("renders the table header", () => {
        setup();
        expect(screen.getByText(/cadetDetailPage.header.uniformTable/)).toBeInTheDocument();
    });

    it("renders all uniform types and their items", () => {
        setup();
        expect(screen.getByTestId("div_uniform_typeList")).toBeInTheDocument();
        mockTypeList.forEach(type => {
            expect(screen.getByTestId(`div_utype_${type.id}`)).toBeInTheDocument();
        });
        expect(screen.getByTestId("div_itemList")).toBeInTheDocument();
        expect(screen.getByTestId("itemrow_u-1")).toBeInTheDocument();
        expect(screen.getByTestId("itemrow_u-2")).toBeInTheDocument();
        expect(screen.getByTestId("itemrow_u-3")).toBeInTheDocument();
    });

    it("shows the correct issued count and default for each type", () => {
        setup();
        const amounts = screen.getAllByTestId("div_uitems_amount");
        expect(amounts[0]).toHaveTextContent("(2 common.of 3)");
        expect(amounts[1]).toHaveTextContent("(1 common.of 1)");
        expect(amounts[2]).toHaveTextContent("(0 common.of 1)");
        expect(amounts[3]).toHaveTextContent("(0 common.of 1)");
        expect(amounts[4]).toHaveTextContent("(0 common.of 1)");
    });

    it("marks the issued count yellow if issued < required", () => {
        setup();
        const amounts = screen.getAllByTestId("div_uitems_amount");
        expect(amounts[0]).toHaveClass("text-orange-500");
        expect(amounts[1]).not.toHaveClass("text-orange-500");
    });

    it("shows the issue button for each type", () => {
        setup();
        expect(screen.getAllByTestId("btn_issue")).toHaveLength(mockTypeList.length);
    });

    it("opens the issue modal when issue button is clicked", async () => {
        const { CadetUniformTableIssueModal } = jest.requireMock("./CadetUniformTableIssueModal");
        setup();
        const btns = screen.getAllByTestId("btn_issue");
        await userEvent.click(btns[0]);
        expect(screen.getByTestId("issue-modal")).toBeInTheDocument();
        // Modal should show the correct type name
        expect(screen.getByText(/Modal: Typ1/)).toBeInTheDocument();

        // Open for another type
        await userEvent.click(btns[1]);
        expect(screen.getByTestId("issue-modal")).toBeInTheDocument();
        expect(screen.getByText(/Modal: Typ2/)).toBeInTheDocument();

        expect(CadetUniformTableIssueModal).toHaveBeenCalledWith({
            cadetId: "cadet-1",
            type: mockTypeList[0],
            itemToReplace: undefined,
            onClose: expect.any(Function),
        }, undefined);
    });

    it("closes the issue modal when close is clicked", async () => {
        setup();
        const btns = screen.getAllByTestId("btn_issue");
        await userEvent.click(btns[0]);
        expect(screen.getByTestId("issue-modal")).toBeInTheDocument();
        await userEvent.click(screen.getByText("close"));
        expect(screen.queryByTestId("issue-modal")).not.toBeInTheDocument();
    });

    it("opens the issue modal for replace when replaceItem is called", async () => {
        const { CadetUniformTableIssueModal } = jest.requireMock("./CadetUniformTableIssueModal");
        setup();
        const replaceBtn = screen.getByTestId("replace_u-1");
        await userEvent.click(replaceBtn);
        expect(screen.getByTestId("issue-modal")).toBeInTheDocument();
        // Modal should show the correct type name and item number
        expect(screen.getByText(/Modal: Typ1/)).toBeInTheDocument();

        expect(CadetUniformTableIssueModal).toHaveBeenCalledWith({
            cadetId: "cadet-1",
            type: mockTypeList[0],
            itemToReplace: { id: "u-1", number: 2501 },
            onClose: expect.any(Function),
        }, undefined);
    });
});
