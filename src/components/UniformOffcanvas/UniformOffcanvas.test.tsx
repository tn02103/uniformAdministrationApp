import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generationLists, sizeLists, typeList } from "../../../tests/_jestConfig/staticMockData";
import { UniformOffcanvas } from "./UniformOffcanvas";

const testUniform = {
    id: "c227ac23-93d4-42b5-be2e-956ea35c2db9",
    number: 2501,
    generation: generationLists[0][1],
    size: sizeLists[0].uniformSizes[0],
    comment: "Test comment",
    active: true,
    type: {
        id: typeList[0].id,
        name: typeList[0].name,
    },
}

jest.mock('@/dataFetcher/uniformAdmin', () => ({
    useUniformGenerationListByType: jest.fn(() => ({
        generationList: generationLists[0]
    })),
    useUniformTypeList: jest.fn(() => ({
        typeList
    })),
}));
jest.mock('@/dal/uniform/item/_index', () => ({
    updateUniformItem: jest.fn(() => Promise.resolve('Saved item')),
    deleteUniformItem: jest.fn(() => Promise.resolve('Deleted item')),
}));
jest.mock('../globalDataProvider', () => ({
    useGlobalData: jest.fn(() => ({
        sizelists: sizeLists,
    })),
}));

describe('UniformOffcanvas', () => {
    const { useModal } = jest.requireMock('../modals/modalProvider');
    const { simpleWarningModal } = useModal();
    const { deleteUniformItem, updateUniformItem } = jest.requireMock('@/dal/uniform/item/_index');
    const { toast } = jest.requireMock('react-toastify');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', () => {
        const { container } = render(
            <UniformOffcanvas
                uniform={testUniform}
                onClose={jest.fn()}
                onSave={jest.fn()}
            />
        );

        expect(container).toMatchSnapshot();
    });

    it('should call onClose when close button is clicked', () => {
        const onCloseMock = jest.fn();
        const { getByLabelText } = render(
            <UniformOffcanvas
                uniform={testUniform}
                onClose={onCloseMock}
                onSave={jest.fn()}
            />
        );

        const closeButton = getByLabelText('Close');
        closeButton.click();

        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should set editable if edit button is clicked', async () => {
        const user = userEvent.setup();
        const { getByRole } = render(
            <UniformOffcanvas
                uniform={testUniform}
                onClose={jest.fn()}
                onSave={jest.fn()}
            />
        );

        const editButton = getByRole('button', { name: 'common.actions.edit' });
        await user.click(editButton);

        expect(editButton).toBeDisabled();
        expect(getByRole('button', { name: 'common.actions.delete' })).toBeDisabled();
        expect(getByRole('button', { name: 'common.actions.save' })).toBeEnabled();
        expect(getByRole('button', { name: 'common.actions.cancel' })).toBeEnabled();

        expect(getByRole('switch', { name: 'common.status' })).toBeEnabled();
        expect(getByRole('combobox', { name: 'common.uniform.size' })).toBeEnabled();
        expect(getByRole('combobox', { name: 'common.uniform.generation.label' })).toBeEnabled();
        expect(getByRole('textbox', { name: 'common.comment' })).toBeEnabled();
    });

    it('should reset editable if cancel button is clicked', async () => {
        const user = userEvent.setup();
        const { getByRole, queryByRole } = render(
            <UniformOffcanvas
                uniform={testUniform}
                onClose={jest.fn()}
                onSave={jest.fn()}
            />
        );

        const editButton = getByRole('button', { name: 'common.actions.edit' });
        await user.click(editButton);

        const cancelButton = getByRole('button', { name: 'common.actions.cancel' });
        await user.click(cancelButton);

        expect(getByRole('button', { name: 'common.actions.edit' })).toBeEnabled();
        expect(getByRole('button', { name: 'common.actions.delete' })).toBeEnabled();

        expect(queryByRole('button', { name: 'common.actions.save' })).toBeNull();
        expect(queryByRole('button', { name: 'common.actions.cancel' })).toBeNull();
        expect(getByRole('textbox', { name: 'common.comment' })).toHaveAttribute('disabled');
    });


    describe('dal-methods', () => {
        describe('updateUniformItem', () => {
            it('should update item', async () => {
                const user = userEvent.setup();
                const onSaveMock = jest.fn();
                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={testUniform}
                        onClose={jest.fn()}
                        onSave={onSaveMock}
                    />
                );

                const editButton = getByRole('button', { name: 'common.actions.edit' });
                await user.click(editButton);

                const saveButton = getByRole('button', { name: 'common.actions.save' });
                await user.click(saveButton);

                expect(updateUniformItem).toHaveBeenCalledTimes(1);
                expect(updateUniformItem).toHaveBeenCalledWith({
                    id: testUniform.id,
                    number: testUniform.number,
                    generation: testUniform.generation.id,
                    size: testUniform.size.id,
                    comment: testUniform.comment,
                    active: testUniform.active,
                });
                expect(onSaveMock).toHaveBeenCalledTimes(1);
                expect(onSaveMock).toHaveBeenCalledWith('Saved item');

                expect(getByRole('button', { name: 'common.actions.edit' })).toBeEnabled();
                expect(getByRole('button', { name: 'common.actions.delete' })).toBeEnabled();
                expect(getByRole('textbox', { name: 'common.comment' })).toHaveAttribute('disabled');
            });
            it('should catch exception', async () => {
                const user = userEvent.setup();
                const onSaveMock = jest.fn();
                updateUniformItem.mockRejectedValueOnce(new Error('Failed to save item'));

                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={testUniform}
                        onClose={jest.fn()}
                        onSave={onSaveMock}
                    />
                );

                const editButton = getByRole('button', { name: 'common.actions.edit' });
                await user.click(editButton);

                const saveButton = getByRole('button', { name: 'common.actions.save' });
                await user.click(saveButton);

                expect(onSaveMock).toHaveBeenCalledTimes(0);
                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith('common.error.actions.save');

                expect(getByRole('button', { name: 'common.actions.edit' })).toBeDisabled();
                expect(getByRole('button', { name: 'common.actions.delete' })).toBeDisabled();
                expect(getByRole('button', { name: 'common.actions.save' })).toBeInTheDocument();
                expect(getByRole('textbox', { name: 'common.comment' })).not.toHaveAttribute('disabled');
            });
        });

        describe('deleteUniformItem', () => {
            it('should delete item', async () => {
                const onCloseMock = jest.fn();
                const onSaveMock = jest.fn();

                const user = userEvent.setup();
                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={testUniform}
                        onClose={onCloseMock}
                        onSave={onSaveMock}
                    />
                );

                const deleteButton = getByRole('button', { name: 'common.actions.delete' });
                await user.click(deleteButton);

                expect(simpleWarningModal).toHaveBeenCalledTimes(1);
                expect(simpleWarningModal).toHaveBeenCalledWith(
                    expect.objectContaining({
                        header: 'uniformOffcanvas.deleteAction.header',
                        message: expect.anything(),
                        type: 'danger',
                        primaryOption: 'common.actions.delete',
                        primaryFunction: expect.any(Function),
                    })
                );
                expect(deleteUniformItem).toHaveBeenCalledTimes(0);

                expect(simpleWarningModal.mock.calls[0][0].primaryFunction).toBeDefined();
                await simpleWarningModal.mock.calls[0][0].primaryFunction!();

                expect(deleteUniformItem).toHaveBeenCalledTimes(1);
                expect(deleteUniformItem).toHaveBeenCalledWith(testUniform.id);
                expect(onCloseMock).toHaveBeenCalledTimes(1);
                expect(onSaveMock).toHaveBeenCalledTimes(1);
                expect(toast.success).toHaveBeenCalledTimes(1);
                expect(toast.success).toHaveBeenCalledWith('uniformOffcanvas.deleteAction.success');
            });
            it('should catch exception', async () => {
                const onCloseMock = jest.fn();
                const onSaveMock = jest.fn();
                deleteUniformItem.mockRejectedValueOnce(new Error('Failed to delete item'));

                const user = userEvent.setup();
                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={testUniform}
                        onClose={onCloseMock}
                        onSave={onSaveMock}
                    />
                );

                const deleteButton = getByRole('button', { name: 'common.actions.delete' });
                await user.click(deleteButton);
                expect(simpleWarningModal).toHaveBeenCalledTimes(1);

                await simpleWarningModal.mock.calls[0][0].primaryFunction!();
                expect(deleteUniformItem).toHaveBeenCalledTimes(1);
                expect(deleteUniformItem).toHaveBeenCalledWith(testUniform.id);
                expect(onCloseMock).toHaveBeenCalledTimes(0);
                expect(onSaveMock).toHaveBeenCalledTimes(0);
                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith('uniformOffcanvas.deleteAction.failed');
            });
        });
    })
});