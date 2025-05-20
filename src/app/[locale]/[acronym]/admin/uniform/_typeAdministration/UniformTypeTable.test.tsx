import { UniformType } from "@/types/globalUniformTypes";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";
import { UniformTypeTable } from "./UniformTypeTable";


// ################## MOCKS ##################
jest.mock("@/dal/uniform/type/_index", () => ({
    changeUniformTypeSortOrder: jest.fn(async () => "uniform type sortOrder changed"),
}));

jest.mock("@/dataFetcher/uniformAdmin", () => {
    const mutateMock = jest.fn(async (a,) => await a);
    return {
        useUniformTypeList: jest.fn(() => ({
            mutate: mutateMock,
            typeList: testTypes,
        })),
    }
});
/* eslint-disable @typescript-eslint/no-explicit-any */
let onDragEndFunction: undefined | ((newArray: UniformType[], itemId: string) => Promise<any>) = undefined;
jest.mock("@/components/reorderDnD/ReorderableTableBody", () => {
    return {
        ReorderableTableBody: jest.fn(({ items, onDragEnd, children }) => {
            onDragEndFunction = onDragEnd;
            return (
                <tbody data-testid="reorderable-table-body">
                    {items.map(((item: any) => children({ item, draggableRef: undefined, previewRef: undefined, isDragging: false })))}
                </tbody>
            )
        }),
    };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

jest.mock("./UniformTypeOffcanvas", () => ({
    UniformTypeOffcanvas: jest.fn(({ setSelectedTypeId }) => (
        <div data-testid="uniform-type-offcanvas" onClick={() => setSelectedTypeId(null)}>
            UniformTypeOffcanvas
        </div>
    )),
}));


// ################## TESTS ##################
describe("<UniformTypeTable />", () => {
    const { changeUniformTypeSortOrder } = jest.requireMock("@/dal/uniform/type/_index");
    const { useUniformTypeList } = jest.requireMock("@/dataFetcher/uniformAdmin");
    const { UniformTypeOffcanvas } = jest.requireMock("./UniformTypeOffcanvas");
    const { toast } = jest.requireMock("react-toastify");
    const mockMutate = useUniformTypeList().mutate;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders the component", () => {
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("table").closest('div')).toMatchSnapshot();
    });

    it("calls changeUniformTypeSortOrder when onDragEnd is triggered", async () => {
        changeUniformTypeSortOrder.mockReturnValue("uniform type sortOrder changed");
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        const newArray = [
            testTypes[1],
            testTypes[2],
            testTypes[0],
            testTypes[3],
        ]
        await onDragEndFunction?.(newArray, testTypes[0].id);

        expect(changeUniformTypeSortOrder).toHaveBeenCalledWith({ typeId: testTypes[0].id, newPosition: 2 });
        expect(mockMutate).toHaveBeenCalledWith("uniform type sortOrder changed", { optimisticData: newArray });

        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith("common.success.changeSortorder");
    });

    it('catchs exeption in changeUniformTypeSortOrder', async () => {
        changeUniformTypeSortOrder.mockImplementation(async () => { throw new Error("error") });
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        const newArray = [
            testTypes[1],
            testTypes[2],
            testTypes[0],
            testTypes[3],
        ]
        await onDragEndFunction?.(newArray, testTypes[0].id);


        expect(changeUniformTypeSortOrder).toHaveBeenCalledWith({ typeId: testTypes[0].id, newPosition: 2 });
        expect(mockMutate).not.toHaveBeenCalledWith("uniform type sortOrder changed", { optimisticData: newArray });

        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith("common.error.actions.changeSortorder");
    });

    it("does not call sortOrder function when itemId is not in the list", () => {
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction?.([
            testTypes[1],
            testTypes[2],
            testTypes[0],
            testTypes[3],
        ], "invalid-id");

        expect(changeUniformTypeSortOrder).not.toHaveBeenCalled();
    });
    it("does not call sortOrder function when list has wrong size", () => {
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction?.([
            testTypes[1],
            testTypes[2],
            testTypes[0],
        ], testTypes[0].id);

        expect(changeUniformTypeSortOrder).not.toHaveBeenCalled();
    });

    describe("Render UniformTypeOffcanvas", () => {
        it("opens and closes UniformTypeOffcanvas for the correct element", async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            // open the offcanvas to edit the second type
            const openButtons = screen.getAllByRole('button', { name: 'open' });
            expect(openButtons).toHaveLength(4);
            await user.click(openButtons[1]);

            // check if the offcanvas is opened with the correct type
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                undefined
            );

            // close the offcanvas by calling the setSelectedTypeId function with null
            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setSelectedTypeId(null);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).not.toBeInTheDocument();

            // open the offcanvas for the forth type
            await user.click(openButtons[3]);
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(2);
            expect(UniformTypeOffcanvas).toHaveBeenLastCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[3]
                },
                undefined
            );
        });

        it("opens UniformTypeOffcanvas to create a new type", async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            const createButton = screen.getByRole('button', { name: 'create' });
            await user.click(createButton);

            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: true,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: null
                },
                undefined
            );

            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setSelectedTypeId(null);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).not.toBeInTheDocument();
        });

        it("rerenders when selectedTypeId changes", async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            const createButton = screen.getByRole('button', { name: 'create' });
            await user.click(createButton);

            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);

            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setSelectedTypeId(testTypes[1].id);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(2);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: true,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                undefined
            );

            act(() => {
                UniformTypeOffcanvas.mock.calls[1][0].setSelectedTypeId(null);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).not.toBeInTheDocument();
        });

        it('should change editable when calling function', async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            // open the offcanvas to edit the second type
            const openButtons = screen.getAllByRole('button', { name: 'open' });
            expect(openButtons).toHaveLength(4);

            await user.click(openButtons[1]);
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                undefined
            );

            // call the setEditable function to change the editable state
            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setEditable(true);
            });
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(2);
            expect(UniformTypeOffcanvas).toHaveBeenLastCalledWith(
                {
                    editable: true,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                undefined
            );

            // validate open and create buttons are disabled
            const openButtonsOnEdit = screen.getAllByRole('button', { name: 'open' });
            const createButtonOnEdit = screen.getByRole('button', { name: 'create' });
            openButtonsOnEdit.forEach(button => {
                expect(button).toBeDisabled();
            });
            expect(createButtonOnEdit).toBeDisabled();

            // call the setEditable function to change the editable state back to false
            act(() => {
                UniformTypeOffcanvas.mock.calls[1][0].setEditable(false);
            });
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(3);
            expect(UniformTypeOffcanvas).toHaveBeenLastCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                undefined
            );

            // validate open and create buttons are enabled again
            const openButtonsAfterEdit = screen.getAllByRole('button', { name: 'open' });
            const createButtonAfterEdit = screen.getByRole('button', { name: 'create' });
            openButtonsAfterEdit.forEach(button => {
                expect(button).not.toBeDisabled();
            });
            expect(createButtonAfterEdit).not.toBeDisabled();
        });
    });
});
