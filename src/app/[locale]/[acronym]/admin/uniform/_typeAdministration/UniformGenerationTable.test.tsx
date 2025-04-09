import { UniformType, UniformGeneration } from "@/types/globalUniformTypes";
import { render, screen } from "@testing-library/react";
import { UniformGenerationTable } from "./UniformGenerationTable";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";


const testType = testTypes[0];

jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn(async (a) => {return a; });
    return {
        useUniformTypeList: jest.fn(() => ({
            mutate: typeListMutate,
        })),
    };
});
jest.mock("@/dal/uniform/generation/_index", () => {
    return {
        changeUniformGenerationSortOrder: jest.fn(() => "uniform generation sortOrder changed"),
    };
});
jest.mock("./UniformGenerationOffcanvas", () => {
    const mock = jest.fn(({ onHide }) => <div data-testid="generationOffcanvasMock" onClick={onHide}>Generation Offcanvas</div>);
    return {
        UniformgenerationOffcanvas: mock,
    };
});
let onDragEndFunction: undefined | ((newArray: UniformGeneration[], itemId: string) => Promise<any>) = undefined;
jest.mock("@/components/reorderDnD/ReorderableTableBody", () => {
    return {
        ReorderableTableBody: jest.fn(({ items, itemType, onDragEnd, children }) => {
            onDragEndFunction = onDragEnd;
            return (
                <tbody data-testid="reorderable-table-body">
                    {items.map(((item: any) => children({ item, draggableRef: undefined, previewRef: undefined, isDragging: false })))}
                </tbody>
            )
        }),
    };
});

describe('<UniformGenerationTable />', () => {
    const { UniformgenerationOffcanvas } = require("./UniformGenerationOffcanvas");
    const { changeUniformGenerationSortOrder } = require("@/dal/uniform/generation/_index");
    const { useUniformTypeList } = require("@/dataFetcher/uniformAdmin");

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render the UniformGenerationTable component', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(screen.getByTestId("uniform-generation-table")).toBeInTheDocument();
        expect(screen.getByTestId("uniform-generation-table")).toMatchSnapshot();
    });

    it('should mark generation as invalid if fk_sizelist is null and usingSizes', () => {
        const testTypeWithInvalidGeneration: UniformType = {
            ...testType,
            uniformGenerationList: [
                ...testType.uniformGenerationList,
                {
                    id: "invalid-generation",
                    name: "Invalid Generation",
                    outdated: false,
                    sortOrder: 4,
                    fk_sizelist: null,
                    sizelist: null,
                },
            ],
        };
        const { unmount } = render(<UniformGenerationTable uniformType={testTypeWithInvalidGeneration} />);

        const invalidGenerationRow = screen.getByText("Invalid Generation").closest("tr");
        expect(invalidGenerationRow?.childNodes[0]).toHaveClass("text-danger");
        expect(invalidGenerationRow?.childNodes[1]).toHaveClass("text-danger");
        expect(invalidGenerationRow?.childNodes[2]).toHaveClass("text-danger");
        expect(invalidGenerationRow?.getElementsByTagName("button")[0]).toHaveClass("text-danger");

        unmount();
        testTypeWithInvalidGeneration.usingSizes = false;
        render(<UniformGenerationTable uniformType={testTypeWithInvalidGeneration} />);

        const validGenerationRow = screen.getByText("Invalid Generation").closest("tr");
        expect(validGenerationRow?.childNodes[0]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.childNodes[1]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.childNodes[2]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.getElementsByTagName("button")[0]).not.toHaveClass("text-danger");
    });

    it('should open the generation offcanvas when clicking the open button', async () => {
        const user = userEvent.setup();
        render(<UniformGenerationTable uniformType={testType} />);

        const openButton = screen.getByText("Test Generation 1").closest("tr")?.getElementsByTagName("button")[0];
        expect(openButton).toBeDefined();
        expect(openButton).not.toBeNull();
        await user.click(openButton!);

        expect(screen.getByTestId("generationOffcanvasMock")).toBeInTheDocument();

        expect(UniformgenerationOffcanvas).toHaveBeenCalledTimes(1);
        expect(UniformgenerationOffcanvas).toHaveBeenCalledWith({
            uniformTypeId: testType.id,
            usingSizes: testType.usingSizes,
            onHide: expect.any(Function),
            generation: testType.uniformGenerationList[0],
        }, {});

        expect(screen.getByTestId("generationOffcanvasMock")).toHaveTextContent("Generation Offcanvas");
        await user.click(screen.getByTestId("generationOffcanvasMock"));

        expect(screen.queryByTestId("generationOffcanvasMock")).not.toBeInTheDocument();
    });

    it('should open the generation offcanvas when clicking the create button', async () => {
        const user = userEvent.setup();
        render(<UniformGenerationTable uniformType={testType} />);

        const createButton = screen.getByTestId("btn_create");
        expect(createButton).toBeDefined();
        expect(createButton).not.toBeNull();
        await user.click(createButton!);

        expect(screen.getByTestId("generationOffcanvasMock")).toBeInTheDocument();

        expect(UniformgenerationOffcanvas).toHaveBeenCalledTimes(1);
        expect(UniformgenerationOffcanvas).toHaveBeenCalledWith({
            uniformTypeId: testType.id,
            usingSizes: testType.usingSizes,
            onHide: expect.any(Function),
            generation: null,
        }, {});

        expect(screen.getByTestId("generationOffcanvasMock")).toHaveTextContent("Generation Offcanvas");
        await user.click(screen.getByTestId("generationOffcanvasMock"));

        expect(screen.queryByTestId("generationOffcanvasMock")).not.toBeInTheDocument();
    });

    it('should call sortOrder function when onDragEnd is triggered', async () => {
        const { toast } = require("react-toastify");
        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        await onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
            testType.uniformGenerationList[2],
        ], testType.uniformGenerationList[0].id);

        expect(changeUniformGenerationSortOrder).toHaveBeenCalledTimes(1);
        expect(changeUniformGenerationSortOrder).toHaveBeenCalledWith({
            id: testType.uniformGenerationList[0].id,
            newPosition: 1
        });
        expect(useUniformTypeList().mutate).toHaveBeenCalledTimes(1);
        expect(useUniformTypeList().mutate).toHaveBeenCalledWith("uniform generation sortOrder changed");

        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith("common.success.changeSortorder");
    });

    it('should catch error when sortOrder function fails', async () => {
        const { toast } = require("react-toastify");
        changeUniformGenerationSortOrder.mockImplementationOnce(async () => { throw new Error("Error") });

        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        await onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
            testType.uniformGenerationList[2],
        ], testType.uniformGenerationList[0].id);

        expect(changeUniformGenerationSortOrder).toHaveBeenCalledTimes(1);
        expect(changeUniformGenerationSortOrder).toHaveBeenCalledWith({
            id: testType.uniformGenerationList[0].id,
            newPosition: 1
        });
        expect(useUniformTypeList().mutate).toHaveBeenCalledTimes(1);
        expect(useUniformTypeList().mutate).not.toHaveBeenCalledWith("uniform generation sortOrder changed");

        expect(toast.success).toHaveBeenCalledTimes(0);
        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith("common.error.actions.changeSortorder");
    });

    it('should not call sortOrder function when itemId is not in the list', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
            testType.uniformGenerationList[2],
        ], "invalid-item-id");

        expect(changeUniformGenerationSortOrder).not.toHaveBeenCalled();
    });

    it('should not call sortOrder function when list has wrong size', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
        ], testType.uniformGenerationList[0].id);

        expect(changeUniformGenerationSortOrder).not.toHaveBeenCalled();
    });

    it('should not show sizeList column when usingSizes is false', () => {
        const testTypeWithoutSizeList: UniformType = {
            ...testType,
            usingSizes: false,
        };
        render(<UniformGenerationTable uniformType={testTypeWithoutSizeList} />);

        expect(screen.queryByText("common.uniform.sizelist.label")).not.toBeInTheDocument();
        const row = screen.getByText("Test Generation 1").closest("tr");
        expect(row).not.toBeNull();
        expect(row!.childNodes).toHaveLength(4); // 3 columns + 1 action column
    });
    it('should show outdated column on Mobile when usingSizes is false ', () => {
        const testTypeWithoutSizeList: UniformType = {
            ...testType,
            usingSizes: false,
        };
        render(<UniformGenerationTable uniformType={testTypeWithoutSizeList} />);

        expect(screen.queryByText("common.uniform.generation.outdated")).toBeInTheDocument();
        expect(screen.queryByText("common.uniform.generation.outdated")).not.toHaveClass("d-none d-sm-table-cell");
        const row = screen.getByText("Test Generation 1").closest("tr");
        expect(row).not.toBeNull();
        expect(row?.childNodes[2]).not.toHaveClass("d-none d-sm-table-cell");
    });
    it('should hide outdated column on Mobile when usingSizes is true ', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(screen.queryByText("common.uniform.generation.outdated")).toBeInTheDocument();
        expect(screen.queryByText("common.uniform.generation.outdated")).toHaveClass("d-none d-sm-table-cell");
        const row = screen.getByText("Test Generation 1").closest("tr");
        expect(row).not.toBeNull();
        expect(row?.childNodes[2]).toHaveClass("d-none d-sm-table-cell");
    });
});