import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockTypeList, mockSizeLists } from "../../../../../../../../tests/_jestConfig/staticMockData";
import { UniformListSidePanel } from "./UniformListSidePanel";
import { UniformType } from "@/types/globalUniformTypes";

// Mock useUniformTypeList
jest.mock("@/dataFetcher/uniformAdmin", () => ({
    useUniformTypeList: () => ({
        typeList: mockTypeList,
    }),
}));

// Mock next/navigation
const replaceMock = jest.fn();
const routerGetMock = jest.fn().mockReturnValue(null);
jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: replaceMock }),
    useSearchParams: () => ({
        get: routerGetMock,
        toString: () => "",
    }),
}));
jest.mock("usehooks-ts", () => ({
    useSessionStorage: () => [null, jest.fn()],
}));

// Helper to get sizeList for a type
function getSizeListForType(type: UniformType) {
    if (!type.fk_defaultSizelist) return [];
    return mockSizeLists.find(s => s.id === type.fk_defaultSizelist)?.uniformSizes || [];
}

describe("SidePanel", () => {
    beforeEach(() => {
        replaceMock.mockClear();
    });

    it("renders type select with all types", () => {
        render(<UniformListSidePanel uniformType={mockTypeList[0]} sizeList={getSizeListForType(mockTypeList[0])} />);
        expect(screen.getByTestId("sel_type")).toBeInTheDocument();
        mockTypeList.forEach(type => {
            expect(screen.getByText(`(${type.acronym}) ${type.name}`)).toBeInTheDocument();
        });
    });

    it("calls changeUniformType on select change", async () => {
        render(<UniformListSidePanel uniformType={mockTypeList[0]} sizeList={getSizeListForType(mockTypeList[0])} />);
        const select = screen.getByTestId("sel_type");
        const user = userEvent.setup();
        await user.selectOptions(select, mockTypeList[1].id);
        expect(replaceMock).toHaveBeenCalledWith(`/app/uniform/list/${mockTypeList[1].id}`);
    });

    it("renders SearchFilter and Filter if uniformType is provided", () => {
        render(<UniformListSidePanel uniformType={mockTypeList[0]} sizeList={getSizeListForType(mockTypeList[0])} />);
        expect(screen.getByText("uniformList.search.label")).toBeInTheDocument();
        expect(screen.getByText("uniformList.filter")).toBeInTheDocument();
    });

    it("renders SearchFilter but not Filter if uniformType is not provided", () => {
        render(<UniformListSidePanel sizeList={[]} />);
        expect(screen.getByText("uniformList.search.label")).toBeInTheDocument();
        expect(screen.queryByText("uniformList.filter")).not.toBeInTheDocument();
    });

    it("updates search input from searchParams", () => {
        try {
            routerGetMock.mockImplementation((key: string) => (key === "search" ? "1234" : null));
            render(<UniformListSidePanel uniformType={mockTypeList[0]} sizeList={getSizeListForType(mockTypeList[0])} />);
            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByRole("textbox")).toHaveValue("1234");
        } catch (e) {
            routerGetMock.mockImplementation(() => null); // Reset mock
            throw e; // Re-throw to fail the test if needed
        } finally {
            routerGetMock.mockImplementation(() => null); // Reset mock
        }
    });

    it("calls search with correct params and updates router", async () => {
        render(<UniformListSidePanel uniformType={mockTypeList[0]} sizeList={getSizeListForType(mockTypeList[0])} />);
        const user = userEvent.setup();
        const input = screen.getByRole("textbox");
        await user.type(input, "5678");
        await user.click(screen.getByTestId("btn_search_submit"));
        // Should call router.replace with correct search param
        expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("search=5678"));
    });
});
