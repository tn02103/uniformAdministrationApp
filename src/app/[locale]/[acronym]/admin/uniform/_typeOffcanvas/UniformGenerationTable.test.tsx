import { UniformType, UniformGeneration } from "@/types/globalUniformTypes";
import { render, screen } from "@testing-library/react";
import { UniformGenerationTable } from "./UniformGenerationTable";
import userEvent from "@testing-library/user-event";

const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
];
const testType: UniformType = {
    id: "fbe495ec-799e-46c9-8aa5-ca34e1447bf4",
    name: "Test Type",
    acronym: "TT",
    sortOrder: 1,
    usingSizes: true,
    usingGenerations: true,
    issuedDefault: 2,
    fk_defaultSizelist: sizeListIds[0],
    defaultSizelist: {
        id: sizeListIds[0],
        name: "Test Size List",
    },
    uniformGenerationList: [
        {
            id: "ab5d155c-49cf-4019-831e-ca7b3e0bd51c",
            name: "Test Generation 1",
            outdated: false,
            sortOrder: 1,
            fk_sizelist: sizeListIds[0],
            sizelist: {
                id: sizeListIds[0],
                name: "Test Size List 1",
            },
        },
        {
            id: "7feb435c-ee23-486d-af9f-b7c874383e22",
            name: "Test Generation 2",
            outdated: false,
            sortOrder: 2,
            fk_sizelist: sizeListIds[1],
            sizelist: {
                id: sizeListIds[1],
                name: "Test Size List 2",
            },
        },
        {
            id: "c46adb18-1a04-4dda-884d-972a7aa0e0da",
            name: "Test Generation 3",
            outdated: true,
            sortOrder: 3,
            fk_sizelist: sizeListIds[1],
            sizelist: {
                id: sizeListIds[1],
                name: "Test Size List 2",
            },
        },
    ],
}


jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn();
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
let onDragEndFunction: undefined | ((newArray: UniformGeneration[], itemId: string) => void) = undefined;
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

    it('should call sortOrder function when onDragEnd is triggered', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction!([
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