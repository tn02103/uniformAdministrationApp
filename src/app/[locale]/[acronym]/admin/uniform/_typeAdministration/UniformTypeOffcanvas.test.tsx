import { UniformType } from "@/types/globalUniformTypes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";
import { UniformTypeOffcanvas } from "./UniformTypeOffcanvas";

const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
];

const testType: UniformType = testTypes[0]

jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn(async (a) => a);
    return {
        useUniformSizelists: jest.fn(() => ({
            sizelistList: [{ id: sizeListIds[0], name: "Test Size List" }, { id: sizeListIds[1], name: "Test Size List 2" }, { id: sizeListIds[2], name: "Test Size List 3" }],
        })),
        useUniformTypeList: jest.fn(() => ({
            mutate: typeListMutate,
            typeList: testTypes,
        })),
    };
});

jest.mock("@/dal/uniform/type/_index", () => {
    return {
        createUniformType: jest.fn(async () => ({ id: 'new-type-id' })),
        deleteUniformType: jest.fn(() => "uniform type deleted"),
        updateUniformType: jest.fn(async () => "uniform type updated"),
    };
});
jest.mock("@/dal/uniform/item/_index", () => {
    const mock = jest.fn(async () => ({ count: 10 }));
    return {
        getUniformItemCountByType: mock,
    };
});

jest.mock("./UniformGenerationTable", () => {
    const mock = jest.fn(() => <div data-testid="generationTableMock">Generation Table</div>);
    return {
        UniformGenerationTable: mock,
    };
});

describe('<UniformTypeOffcanvas />', () => {
    const { createUniformType, deleteUniformType, updateUniformType } = require('@/dal/uniform/type/_index');
    const mutate = require('@/dataFetcher/uniformAdmin').useUniformTypeList().mutate;;
    const { getUniformItemCountByType } = require('@/dal/uniform/item/_index');
    const { UniformGenerationTable } = require('./UniformGenerationTable');
    const { useModal } = require('@/components/modals/modalProvider');
    const { toast } = require('react-toastify');

    afterEach(() => jest.clearAllMocks());

    it('should render the component and handle setEditable', async () => {
        const user = userEvent.setup();
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();

        const editButton = screen.getByRole('button', { name: 'common.actions.edit' });
        await user.click(editButton);
        expect(setEditable).toHaveBeenCalledWith(true);
    });

    it('should handle editable states correctly', async () => {
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();
    });

    it('should reset the form values and call setEditable with false on cancel', async () => {
        const user = userEvent.setup();
        const setEditable = jest.fn();
        const setSelectedTypeId = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={setSelectedTypeId}
            />
        );

        const nameInput = screen.getByRole('textbox', { name: 'common.name *' });
        const acronymInput = screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' });

        // Modify form values
        await user.clear(nameInput);
        await user.type(nameInput, 'Modified Name');
        await user.clear(acronymInput);
        await user.type(acronymInput, 'MN');

        // Trigger cancel
        const cancelButton = screen.getByRole('button', { name: 'common.actions.cancel' });
        await user.click(cancelButton);

        // Assert form reset
        expect(nameInput).toHaveValue(testType.name);
        expect(acronymInput).toHaveValue(testType.acronym);

        // Assert setEditable called with false
        expect(setEditable).toHaveBeenCalledWith(false);
    });

    it('should render correct layout when no uniformType is provided', () => {
        render(
            <UniformTypeOffcanvas
                uniformType={null}
                editable={true}
                setEditable={jest.fn()}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();
        expect(screen.queryByRole('textbox', { name: 'common.name' })).not.toBeInTheDocument();
    });

    it('should hide default sizelist if usingSizes is false', async () => {
        const user = userEvent.setup();
        const setEditable = jest.fn();
        const { unmount } = render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingSizes: false,
                }}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.queryByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

        unmount();
        render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingSizes: false,
                }}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.queryByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

        await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
        expect(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'true');
    });

    it('should not show generation table if not usingGenerations', () => {
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingGenerations: false,
                }}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.queryByTestId('generationTableMock')).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should pass uniformType to UniformGenerationTable', () => {
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByTestId('generationTableMock')).toBeInTheDocument();
        expect(UniformGenerationTable).toHaveBeenCalledWith({ uniformType: testType }, {});
    });

    describe('dal-Methods', () => {
        describe('deleteUniformType', () => {
            it('delete successfuly', async () => {
                const user = userEvent.setup();
                const setSelectedTypeId = jest.fn();

                let dangerOption;
                const { dangerConfirmationModal } = useModal();
                dangerConfirmationModal.mockImplementation((option: any) => { dangerOption = option.dangerOption });

                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={false}
                        setEditable={jest.fn()}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                const deleteButton = screen.getByRole('button', { name: 'common.actions.delete' });
                await user.click(deleteButton);

                expect(getUniformItemCountByType).toHaveBeenCalledTimes(1);
                expect(getUniformItemCountByType).toHaveBeenCalledWith(testType.id);
                expect(dangerConfirmationModal).toHaveBeenCalledWith({
                    header: 'admin.uniform.type.deleteModal.header',
                    message: expect.anything(),
                    confirmationText: 'admin.uniform.type.deleteModal.confirmationText',
                    dangerOption: {
                        option: 'common.actions.delete',
                        function: expect.any(Function),
                    },
                });
                expect(dangerOption).toBeDefined();
                await dangerOption!.function();

                expect(deleteUniformType).toHaveBeenCalledTimes(1);
                expect(deleteUniformType).toHaveBeenCalledWith(testType.id);
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform type deleted");
                expect(setSelectedTypeId).toHaveBeenCalledWith(null);
            });

            it('catch DAL-Error', async () => {
                const user = userEvent.setup();
                const setSelectedTypeId = jest.fn();
                deleteUniformType.mockImplementationOnce(async () => { throw new Error("custom.error") });

                let dangerOption;
                const { dangerConfirmationModal } = useModal();
                dangerConfirmationModal.mockImplementation((option: any) => dangerOption = option.dangerOption);

                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={false}
                        setEditable={jest.fn()}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                const deleteButton = screen.getByRole('button', { name: 'common.actions.delete' });
                await user.click(deleteButton);

                expect(getUniformItemCountByType).toHaveBeenCalledTimes(1);
                expect(dangerConfirmationModal).toHaveBeenCalled();

                expect(dangerOption).toBeDefined();
                await dangerOption!.function();

                expect(deleteUniformType).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalledWith("uniform type deleted");

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.delete");
            });
        });

        describe('createUniformType', () => {
            it('creates successfuly', async () => {
                const user = userEvent.setup();
                const setEditable = jest.fn();
                const setSelectedTypeId = jest.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={null}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
                await user.selectOptions(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' }), sizeListIds[0]);
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

                expect(createUniformType).toHaveBeenCalledTimes(1);
                expect(createUniformType).toHaveBeenCalledWith({
                    name: 'New Type',
                    acronym: 'NT',
                    usingSizes: true,
                    usingGenerations: true,
                    issuedDefault: 3,
                    fk_defaultSizelist: sizeListIds[0],
                });
                expect(updateUniformType).not.toHaveBeenCalled();
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith();
                expect(setEditable).toHaveBeenCalledWith(false);
                expect(setSelectedTypeId).toHaveBeenCalledWith('new-type-id');
            });
            it('should catch name and acronym errors', async () => {
                const user = userEvent.setup();
                const setEditable = jest.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={null}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={jest.fn()}
                    />
                );

                createUniformType.mockImplementationOnce(async() => ({
                    error: {
                        message: "custom.uniform.type.nameDuplication",
                        formElement: "name",
                    }
                }));

                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));


                expect(createUniformType).toHaveBeenCalled();
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                expect(screen.getByRole('alert', { name: 'error message name' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message name' })).toHaveTextContent('custom.uniform.type.nameDuplication');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveAttribute('aria-invalid', 'true');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveClass('is-invalid');


                createUniformType.mockImplementationOnce(async() => ({
                    error: {
                        message: "custom.uniform.type.acronymDuplication;name:Test Type",
                        formElement: "acronym",
                    }
                }));
                await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

                expect(createUniformType).toHaveBeenCalledTimes(2);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                expect(screen.getByRole('alert', { name: 'error message acronym' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message acronym' })).toHaveTextContent('custom.uniform.type.acronymDuplication;name:Test Type');
                expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveAttribute('aria-invalid', 'true');
                expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveClass('is-invalid');
            });

            it('should catch DAL-Error', async () => {
                createUniformType.mockImplementationOnce(async () => { throw new Error("custom.error") });
                const user = userEvent.setup();
                const setEditable = jest.fn();
                const setSelectedTypeId = jest.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={null}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
                await user.selectOptions(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' }), sizeListIds[0]);
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

                expect(createUniformType).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();
                expect(setSelectedTypeId).not.toHaveBeenCalled();

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.create");
            });
        });

        describe('updateUniformType', () => {
            it('updates successfully', async () => {
                const user = userEvent.setup();
                const setEditable = jest.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={jest.fn()}
                    />
                );

                await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'Updated');
                await user.clear(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }));
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'UT');
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
                await user.clear(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }));
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '5');

                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

                expect(updateUniformType).toHaveBeenCalledTimes(1);
                expect(updateUniformType).toHaveBeenCalledWith({
                    id: testType.id,
                    data: {
                        name: 'Updated',
                        acronym: 'UT',
                        usingSizes: false,
                        usingGenerations: false,
                        issuedDefault: 5,
                        fk_defaultSizelist: testType.fk_defaultSizelist,
                    },
                });
                expect(createUniformType).not.toHaveBeenCalled();
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform type updated");
                expect(setEditable).toHaveBeenCalledWith(false);
            });

            it('catches name and acronym errors', async () => {
                const user = userEvent.setup();
                const setEditable = jest.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={jest.fn()}
                    />
                );

                updateUniformType.mockImplementationOnce(async () => ({
                    error: {
                        message: "custom.uniform.type.nameDuplication",
                        formElement: "name",
                    }
                }));
                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

                expect(updateUniformType).toHaveBeenCalled();
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                expect(screen.getByRole('alert', { name: 'error message name' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message name' })).toHaveTextContent('custom.uniform.type.nameDuplication');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveAttribute('aria-invalid', 'true');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveClass('is-invalid');


                updateUniformType.mockImplementationOnce(async () => ({
                    error: {
                        message: "custom.uniform.type.acronymDuplication;name:Test Type",
                        formElement: "acronym",
                    }
                }));
                await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

                expect(updateUniformType).toHaveBeenCalledTimes(2);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                expect(screen.getByRole('alert', { name: 'error message acronym' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message acronym' })).toHaveTextContent('custom.uniform.type.acronymDuplication;name:Test Type');
                expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveAttribute('aria-invalid', 'true');
                expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveClass('is-invalid');
            });
            it('catches DAL-Errors', async () => {
                updateUniformType.mockImplementationOnce(async () => { throw new Error("custom.error") });
                const user = userEvent.setup();
                const setEditable = jest.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={jest.fn()}
                    />
                );

                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

                expect(updateUniformType).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.save");
            });
        });
        it('should only allow defaultSizelist null if usingSizes is false', async () => {
            const user = userEvent.setup();
            render(
                <UniformTypeOffcanvas
                    uniformType={null}
                    editable={true}
                    setEditable={jest.fn()}
                    setSelectedTypeId={jest.fn()}
                />
            );

            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');

            expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'true');

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            expect(createUniformType).not.toHaveBeenCalled();
            expect(screen.getByRole('alert', { name: 'error message fk_defaultSizelist' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message fk_defaultSizelist' })).toHaveTextContent('pleaseSelect');
            expect(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).toHaveAttribute('aria-invalid', 'true');

            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            expect(createUniformType).toHaveBeenCalledTimes(1);
        });
    });
});
