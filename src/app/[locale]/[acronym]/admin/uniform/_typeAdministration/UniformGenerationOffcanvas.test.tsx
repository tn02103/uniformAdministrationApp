import { UniformgenerationOffcanvas } from "@/app/[locale]/[acronym]/admin/uniform/_typeAdministration/UniformGenerationOffcanvas";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
]
const uniformTypeId = '2b255769-2154-479f-bfca-c6a49e523334';
const testGeneration = {
    id: "testId",
    name: "Test Generation",
    isReserve: false,
    fk_sizelist: sizeListIds[0],
    sortOrder: 0,
    sizelist: {
        id: sizeListIds[0],
        name: "Test Size List",
    },
}

// ################## MOCKS ##################
jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn(async (a) => a);
    return {
        useUniformSizelists: jest.fn(() => ({
            sizelistList: [{ id: sizeListIds[0], name: "Test Size List" }, { id: sizeListIds[1], name: "Test Size List 2" }, { id: sizeListIds[2], name: "Test Size List 3" }],
        })),
        useUniformTypeList: jest.fn(() => ({
            mutate: typeListMutate,
        })),
    };
});
jest.mock("@/dal/uniform/generation/_index", () => {
    return {
        createUniformGeneration: jest.fn(async () => "uniform generation created"),
        deleteUniformGeneration: jest.fn(async () => "uniform generation deleted"),
        updateUniformGeneration: jest.fn(async () => "uniform generation updated"),
    };
});

// ################## TESTS ##################
describe('<UniformgenerationOffcanvas>', () => {
    const { updateUniformGeneration, createUniformGeneration, deleteUniformGeneration } = jest.requireMock('@/dal/uniform/generation/_index');
    const { mutate } = jest.requireMock('@/dataFetcher/uniformAdmin').useUniformTypeList();
    const { useModal } = jest.requireMock('@/components/modals/modalProvider');
    const { dangerConfirmationModal } = useModal();
    const { toast } = jest.requireMock('react-toastify');

    afterEach(() => jest.clearAllMocks());

    describe('with generation', () => {
        it('renders the component', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            expect(screen.getByRole('dialog')).toMatchSnapshot();
        });
        it('hides sizelist if usingSizes is false', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={false}
                    onHide={() => { }}
                />
            );

            const sizeSelect = screen.queryByText('common.uniform.sizelist.label');
            expect(sizeSelect).not.toBeInTheDocument();
        });
        it('marks sizelist-label if usingSizes and sizelist is null', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={{ ...testGeneration, fk_sizelist: null }}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const sizeSelect = screen.queryByText('common.uniform.sizelist.label');
            expect(sizeSelect).toBeInTheDocument();
            expect(sizeSelect).toHaveClass('text-danger');
        });
        it('sets editable state', async () => {
            const user = userEvent.setup();
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            // get elements
            const editButton = screen.getByText('common.actions.edit');
            const deleteButton = screen.getByText('common.actions.delete');
            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const sizeSelectDiv = screen.getByRole('paragraph', { name: 'common.uniform.sizelist.label' });
            const reserveSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.isReserve' });
            // get variable elements
            let saveButton = screen.queryByText('common.actions.save');
            let cancelButton = screen.queryByText('common.actions.cancel');
            let sizeSelect = screen.queryByRole('combobox', { name: 'common.uniform.sizelist.label' });

            // check form components
            expect(nameInput).toBeVisible();
            expect(nameInput).toHaveClass('form-control-plaintext');
            expect(nameInput).toHaveAttribute('disabled');
            expect(reserveSwitch).toBeVisible();
            expect(reserveSwitch).toHaveAttribute('aria-disabled', 'true');
            expect(sizeSelect).toBeNull();
            expect(sizeSelectDiv).toBeVisible();

            // check buttons
            expect(editButton).toBeVisible();
            expect(deleteButton).toBeVisible();
            expect(saveButton).toBeNull();
            expect(cancelButton).toBeNull();
            expect(editButton).not.toHaveAttribute('disabled');
            expect(deleteButton).not.toHaveAttribute('disabled');

            // click edit button
            await user.click(editButton);
            saveButton = screen.queryByText('common.actions.save');
            cancelButton = screen.queryByText('common.actions.cancel');
            sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });

            // check form components
            expect(nameInput).toHaveClass('form-control');
            expect(nameInput).not.toHaveAttribute('disabled');
            expect(reserveSwitch).toHaveAttribute('aria-disabled', 'false');
            expect(sizeSelect).toBeVisible();
            expect(sizeSelect).not.toHaveAttribute('disabled');
            expect(sizeSelectDiv).not.toBeVisible();

            // check buttons
            expect(editButton).toBeVisible();
            expect(deleteButton).toBeVisible();
            expect(saveButton).toBeVisible();
            expect(cancelButton).toBeVisible();
            expect(editButton).toHaveAttribute('disabled');
            expect(deleteButton).toHaveAttribute('disabled');
        });

        it('resets on cancel', async () => {
            const user = userEvent.setup();
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            // set editable
            const editButton = screen.getByText('common.actions.edit');
            await user.click(editButton);

            // get elements
            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const reserveSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.isReserve' });
            const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
            const cancelButton = screen.getByText('common.actions.cancel');

            // change values
            await user.clear(nameInput);
            await user.type(nameInput, 'New Name');
            await user.click(reserveSwitch);
            await user.selectOptions(sizeSelect, sizeListIds[1]);

            // check values
            expect(nameInput).toHaveValue('New Name');
            expect(reserveSwitch).toHaveAttribute('aria-checked', 'true');
            expect(sizeSelect).toHaveValue(sizeListIds[1]);

            // cancel and check for resetet values again
            await user.click(cancelButton);
            expect(nameInput).toHaveValue(testGeneration.name);
            expect(reserveSwitch).toHaveAttribute('aria-checked', String(testGeneration.isReserve));
            expect(sizeSelect).not.toBeInTheDocument();
            const sizeSelectDiv = screen.getByRole('paragraph', { name: 'common.uniform.sizelist.label' });
            expect(sizeSelectDiv).toHaveTextContent(testGeneration.sizelist.name);
        });
    });
    describe('without generation', () => {
        it('renders in editable state if no generation is passed', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            expect(screen.getByRole('dialog')).toMatchSnapshot();
        });

        it('hides on Cancel', async () => {
            const user = userEvent.setup();
            const onHide = jest.fn();
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={onHide}
                />
            );

            const cancelButton = screen.getByText('common.actions.cancel');
            await user.click(cancelButton);
            expect(onHide).toHaveBeenCalledTimes(1);
            expect(onHide).toHaveBeenCalledWith();
        });
    });
    describe('dal methods', () => {
        describe('delete', () => {
            it('deletes generation', async () => {
                const { dangerConfirmationModal } = useModal();
                // change mocks
                deleteUniformGeneration.mockReturnValue('uniform generation deleted');
                const onHide = jest.fn();

                // render component
                const user = userEvent.setup();
                render(
                    <UniformgenerationOffcanvas
                        generation={testGeneration}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={onHide}
                    />
                );

                // open danger confirmation modal
                const deleteButton = screen.getByText('common.actions.delete');
                await user.click(deleteButton);

                // validate parameters of dangerConfirmationModal
                expect(dangerConfirmationModal).toHaveBeenCalledTimes(1);
                expect(dangerConfirmationModal).toHaveBeenCalledWith({
                    header: 'admin.uniform.generationList.deleteModal.header',
                    message: expect.anything(),
                    confirmationText: 'admin.uniform.generationList.deleteModal.confirmationText',
                    dangerOption: {
                        option: 'common.actions.delete',
                        function: expect.any(Function),
                    },
                });

                // call delete function and validate actions
                await dangerConfirmationModal.mock.calls[0][0].dangerOption.function();
                expect(deleteUniformGeneration).toHaveBeenCalledTimes(1);
                expect(deleteUniformGeneration).toHaveBeenCalledWith(testGeneration.id);
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform generation deleted");
                expect(onHide).toHaveBeenCalledTimes(1);
            });
            it('catches DAL-Exceptions', async () => {

                // set mocks
                deleteUniformGeneration.mockImplementationOnce(async () => { throw new Error("custom.error") });
                const onHide = jest.fn();

                // render component
                const user = userEvent.setup();
                render(
                    <UniformgenerationOffcanvas
                        generation={testGeneration}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={onHide}
                    />
                );

                // open danger confirmation modal
                const deleteButton = screen.getByText('common.actions.delete');
                await user.click(deleteButton);

                // validate parameters of dangerConfirmationModal
                expect(dangerConfirmationModal).toHaveBeenCalledTimes(1);

                // call delete function and validate actions                
                await dangerConfirmationModal.mock.calls[0][0].dangerOption.function();
                expect(deleteUniformGeneration).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(onHide).not.toHaveBeenCalled();

                // validate error toast
                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.delete");
            });
        });
        describe('create', () => {
            it('creates succefully', async () => {
                const user = userEvent.setup();
                const onHide = jest.fn();

                render(
                    <UniformgenerationOffcanvas
                        generation={null}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={onHide}
                    />
                );

                // get elements
                const nameInput = screen.getByRole('textbox', { name: 'common.name' });
                const reserveSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.isReserve' });
                const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
                const createButton = screen.getByText('common.actions.create');

                // set values
                await user.type(nameInput, 'New Name');
                await user.click(reserveSwitch);
                await user.selectOptions(sizeSelect, sizeListIds[1]);

                // check values
                expect(nameInput).toHaveValue('New Name');
                expect(reserveSwitch).toHaveAttribute('aria-checked', 'true');
                expect(sizeSelect).toHaveValue(sizeListIds[1]);

                // create and validate actions
                await user.click(createButton);
                expect(createUniformGeneration).toHaveBeenCalledTimes(1);
                expect(createUniformGeneration).toHaveBeenCalledWith({
                    name: 'New Name',
                    isReserve: true,
                    fk_sizelist: sizeListIds[1],
                    uniformTypeId: uniformTypeId,
                });

                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform generation created");
                expect(onHide).toHaveBeenCalledTimes(1);
            });
            it('catches form-errors', async () => {
                const user = userEvent.setup();
                createUniformGeneration.mockImplementationOnce(async () => {
                    return {
                        error: {
                            message: "custom.uniform.generation.nameDuplication",
                            formElement: "name",
                        }
                    };
                });

                render(
                    <UniformgenerationOffcanvas
                        generation={null}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={() => { }}
                    />
                );

                // get elements
                const nameInput = screen.getByRole('textbox', { name: 'common.name' });
                const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
                const createButton = screen.getByText('common.actions.create');

                // set values
                await user.type(nameInput, 'New Name');
                await user.selectOptions(sizeSelect, sizeListIds[0]);

                // creaet and validate error handling
                await user.click(createButton);
                expect(createUniformGeneration).toHaveBeenCalledTimes(1);
                expect(createUniformGeneration).toHaveBeenCalledWith({
                    name: 'New Name',
                    isReserve: false,
                    fk_sizelist: sizeListIds[0],
                    uniformTypeId: uniformTypeId,
                });

                const errorMessage = await screen.findByText('custom.uniform.generation.nameDuplication');
                expect(errorMessage).toBeInTheDocument();
            });
            it('catches DAL-Exception', async () => {
                createUniformGeneration.mockImplementationOnce(async () => { throw new Error("custom.error") });
                const user = userEvent.setup();
                const onHide = jest.fn();

                render(
                    <UniformgenerationOffcanvas
                        generation={null}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={onHide}
                    />
                );

                // get elements
                const nameInput = screen.getByRole('textbox', { name: 'common.name' });
                const reserveSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.isReserve' });
                const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
                const createButton = screen.getByText('common.actions.create');

                // set values and create
                await user.type(nameInput, 'New Name');
                await user.click(reserveSwitch);
                await user.selectOptions(sizeSelect, sizeListIds[1]);
                await user.click(createButton);

                // validation exception handling
                expect(createUniformGeneration).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalledTimes(1);
                expect(onHide).not.toHaveBeenCalled();
                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.create");
            });
        });
        describe('update', () => {
            it('updates succefully', async () => {
                const user = userEvent.setup();
                const onHide = jest.fn();

                render(
                    <UniformgenerationOffcanvas
                        generation={testGeneration}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={onHide}
                    />
                );

                // set editable
                const editButton = screen.getByText('common.actions.edit');
                await user.click(editButton);

                // get elements
                const nameInput = screen.getByRole('textbox', { name: 'common.name' });
                const reserveSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.isReserve' });
                const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
                const saveButton = screen.getByText('common.actions.save');

                // change values
                await user.clear(nameInput);
                await user.type(nameInput, 'New Name');
                await user.click(reserveSwitch);
                await user.selectOptions(sizeSelect, sizeListIds[1]);

                // check values
                expect(nameInput).toHaveValue('New Name');
                expect(reserveSwitch).toHaveAttribute('aria-checked', 'true');
                expect(sizeSelect).toHaveValue(sizeListIds[1]);

                // save and validate actions
                await user.click(saveButton);
                expect(updateUniformGeneration).toHaveBeenCalledTimes(1);
                expect(updateUniformGeneration).toHaveBeenCalledWith({
                    data: {
                        name: 'New Name',
                        isReserve: true,
                        fk_sizelist: sizeListIds[1],
                    },
                    id: testGeneration.id,
                });

                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform generation updated");
                expect(onHide).toHaveBeenCalledTimes(0);
            });
            it('catches form-errors', async () => {
                const user = userEvent.setup();
                updateUniformGeneration.mockImplementationOnce(async () => {
                    return {
                        error: {
                            message: "custom.uniform.generation.nameDuplication",
                            formElement: "name",
                        }
                    };
                });

                render(
                    <UniformgenerationOffcanvas
                        generation={testGeneration}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={() => { }}
                    />
                );

                // set editable
                const editButton = screen.getByText('common.actions.edit');
                await user.click(editButton);

                // get elements
                const nameInput = screen.getByRole('textbox', { name: 'common.name' });
                const saveButton = screen.getByText('common.actions.save');

                // setValues and save
                await user.clear(nameInput);
                await user.type(nameInput, 'New Name');
                await user.click(saveButton);

                // validate error handling
                expect(updateUniformGeneration).toHaveBeenCalledTimes(1);
                expect(updateUniformGeneration).toHaveBeenCalledWith({
                    data: {
                        name: 'New Name',
                        isReserve: false,
                        fk_sizelist: sizeListIds[0],
                    },
                    id: testGeneration.id,
                });

                const errorMessage = await screen.findByText('custom.uniform.generation.nameDuplication');
                expect(errorMessage).toBeInTheDocument();
            });
            it('catches DAL-Exceptions', async () => {
                updateUniformGeneration.mockImplementationOnce(async () => { throw new Error("custom.error") });
                const user = userEvent.setup();
                const onHide = jest.fn();

                render(
                    <UniformgenerationOffcanvas
                        generation={testGeneration}
                        uniformTypeId={uniformTypeId}
                        usingSizes={true}
                        onHide={onHide}
                    />
                );

                // set editable and save
                await user.click(screen.getByText('common.actions.edit'));
                await user.click(screen.getByText('common.actions.save'));

                // validate exception handling
                expect(updateUniformGeneration).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalled();
                expect(onHide).not.toHaveBeenCalled();

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.save");
            });
        });
    });
    describe('form validation', () => {
        it('shows error if name is empty', async () => {
            const user = userEvent.setup();
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );
            // set editable
            const editButton = screen.getByText('common.actions.edit');
            await user.click(editButton);

            // clears name and clicks save
            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const saveButton = screen.getByText('common.actions.save');
            await user.clear(nameInput);
            await user.click(saveButton);

            // validate error handling
            expect(updateUniformGeneration).toHaveBeenCalledTimes(0);
            const errorMessage = await screen.findByRole('alert', { name: 'error message name' });
            expect(errorMessage).toBeVisible();
            expect(errorMessage).toHaveTextContent('string.required');
        });

        it('should show error if sizelist is empty and usingSizes', async () => {
            const user = userEvent.setup();
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const createButton = screen.getByText('common.actions.create');
            await user.type(nameInput, 'New Name');
            await user.click(createButton);

            const sizelistError = screen.getByRole('alert', { name: 'error message fk_sizelist' });
            expect(sizelistError).toBeVisible();
            expect(sizelistError).toHaveTextContent('pleaseSelect');
        });
        it('should allow sizelist empty if not usingSizes', async () => {
            const user = userEvent.setup();
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={false}
                    onHide={() => { }}
                />
            );

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const createButton = screen.getByText('common.actions.create');
            await user.type(nameInput, 'New Name');
            await user.click(createButton);

            expect(createUniformGeneration).toHaveBeenCalledTimes(1);
        });
    });
});
