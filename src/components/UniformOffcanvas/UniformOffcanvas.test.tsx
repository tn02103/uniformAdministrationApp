import "./UniformOffcanvasJestHelper";

import { AuthRole } from "@/lib/AuthRoles";
import { getAllByRole, getByLabelText, getByText, queryAllByRole, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { typeList } from "../../../tests/_jestConfig/staticMockData";
import { UniformOffcanvas } from "./UniformOffcanvas";
import { mockUniform } from "./UniformOffcanvasJestHelper";

describe('UniformOffcanvas', () => {
    const { useModal } = jest.requireMock('../modals/modalProvider');
    const { simpleWarningModal } = useModal();
    const { deleteUniformItem, updateUniformItem } = jest.requireMock('@/dal/uniform/item/_index');
    const { toast } = jest.requireMock('react-toastify');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', () => {
        render(
            <div>
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            </div>
        );

        expect(screen.getByRole('dialog')).toMatchSnapshot();
    });

    it('should call onClose when close button is clicked', () => {
        const onCloseMock = jest.fn();
        const { getByLabelText } = render(
            <UniformOffcanvas
                uniform={mockUniform}
                uniformType={typeList[0]}
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
                uniform={mockUniform}
                uniformType={typeList[0]}
                onClose={jest.fn()}
                onSave={jest.fn()}
            />
        );

        const editButton = getByRole('button', { name: /edit/i });
        await user.click(editButton);

        expect(editButton).toBeDisabled();
        expect(getByRole('button', { name: /delete/i })).toBeDisabled();
        expect(getByRole('button', { name: /save/i })).toBeEnabled();
        expect(getByRole('button', { name: /cancel/i })).toBeEnabled();

        expect(getByRole('switch', { name: 'common.status' })).toBeEnabled();
        expect(getByRole('combobox', { name: 'common.uniform.size' })).toBeEnabled();
        expect(getByRole('combobox', { name: 'common.uniform.generation.label' })).toBeEnabled();
        expect(getByRole('textbox', { name: /comment/i })).toBeEnabled();
    });

    it('should reset editable if cancel button is clicked', async () => {
        const user = userEvent.setup();
        const { getByRole, queryByRole } = render(
            <UniformOffcanvas
                uniform={mockUniform}
                uniformType={typeList[0]}
                onClose={jest.fn()}
                onSave={jest.fn()}
            />
        );

        const editButton = getByRole('button', { name: /edit/i });
        await user.click(editButton);

        const cancelButton = getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(getByRole('button', { name: /edit/i })).toBeEnabled();
        expect(getByRole('button', { name: /delete/i })).toBeEnabled();

        expect(queryByRole('button', { name: /save/i })).toBeNull();
        expect(queryByRole('button', { name: /cancel/i })).toBeNull();
        expect(getByRole('textbox', { name: /comment/i })).toHaveAttribute('disabled');
    });

    describe('history', () => {
        it('should render history', () => {
            render(
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            );

            const list = screen.getByRole('list', { name: 'uniformOffcanvas.history.header' });
            expect(getAllByRole(list, 'listitem')).toHaveLength(2);

            const firstitem = getAllByRole(list, 'listitem')[0];
            expect(getByLabelText(firstitem, 'dateIssued')).toHaveTextContent('01.10.2023');
            expect(getByLabelText(firstitem, 'dateReturned')).toHaveTextContent('');
            expect(getByLabelText(firstitem, 'person')).toHaveTextContent('John Doe');
            expect(getByLabelText(firstitem, 'person')).not.toHaveClass('text-decoration-line-through');

            const secondItem = getAllByRole(list, 'listitem')[1];
            expect(getByLabelText(secondItem, 'dateIssued')).toHaveTextContent('02.10.2023');
            expect(getByLabelText(secondItem, 'dateReturned')).toHaveTextContent('03.10.2023');
            expect(getByLabelText(secondItem, 'person')).toHaveTextContent('Jane Smith');
            expect(getByLabelText(secondItem, 'person')).toHaveClass('text-decoration-line-through');
        });

        it('should render empty history', () => {
            const { useUniformItemHistory } = jest.requireMock('@/dataFetcher/uniform');
            useUniformItemHistory.mockReturnValue({
                history: [],
            });

            render(
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            );

            const list = screen.getByRole('list', { name: 'uniformOffcanvas.history.header' });
            expect(queryAllByRole(list, 'listitem')).toHaveLength(0);
            expect(getByText(list, 'uniformOffcanvas.history.noEntries')).toBeInTheDocument();
        });
    });

    describe('dal-methods', () => {
        describe('updateUniformItem', () => {
            it('should update item', async () => {
                const user = userEvent.setup();
                const onSaveMock = jest.fn();
                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={mockUniform}
                        uniformType={typeList[0]}
                        onClose={jest.fn()}
                        onSave={onSaveMock}
                    />
                );

                const editButton = getByRole('button', { name: /edit/i });
                await user.click(editButton);

                const saveButton = getByRole('button', { name: /save/i });
                await user.click(saveButton);

                expect(updateUniformItem).toHaveBeenCalledTimes(1);
                expect(updateUniformItem).toHaveBeenCalledWith({
                    id: mockUniform.id,
                    number: mockUniform.number,
                    generation: mockUniform.generation.id,
                    size: mockUniform.size.id,
                    comment: mockUniform.comment,
                    active: mockUniform.active,
                });
                expect(onSaveMock).toHaveBeenCalledTimes(1);

                expect(getByRole('button', { name: /edit/i })).toBeEnabled();
                expect(getByRole('button', { name: /delete/i })).toBeEnabled();
                expect(getByRole('textbox', { name: /comment/i })).toHaveAttribute('disabled');
            });
            it('should catch exception', async () => {
                const user = userEvent.setup();
                const onSaveMock = jest.fn();
                updateUniformItem.mockRejectedValueOnce(new Error('Failed to save item'));

                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={mockUniform}
                        uniformType={typeList[0]}
                        onClose={jest.fn()}
                        onSave={onSaveMock}
                    />
                );

                const editButton = getByRole('button', { name: /edit/i });
                await user.click(editButton);

                const saveButton = getByRole('button', { name: /save/i });
                await user.click(saveButton);

                expect(onSaveMock).toHaveBeenCalledTimes(0);
                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith('common.error.actions.save');

                expect(getByRole('button', { name: /edit/i })).toBeDisabled();
                expect(getByRole('button', { name: /delete/i })).toBeDisabled();
                expect(getByRole('button', { name: /save/i })).toBeInTheDocument();
                expect(getByRole('textbox', { name: /comment/i })).not.toHaveAttribute('disabled');
            });
        });

        describe('deleteUniformItem', () => {
            it('should delete item', async () => {
                const onCloseMock = jest.fn();
                const onSaveMock = jest.fn();

                const user = userEvent.setup();
                const { getByRole } = render(
                    <UniformOffcanvas
                        uniform={mockUniform}
                        uniformType={typeList[0]}
                        onClose={onCloseMock}
                        onSave={onSaveMock}
                    />
                );

                const deleteButton = getByRole('button', { name: /delete/i });
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
                expect(deleteUniformItem).toHaveBeenCalledWith(mockUniform.id);
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
                        uniform={mockUniform}
                        uniformType={typeList[0]}
                        onClose={onCloseMock}
                        onSave={onSaveMock}
                    />
                );

                const deleteButton = getByRole('button', { name: /delete/i });
                await user.click(deleteButton);
                expect(simpleWarningModal).toHaveBeenCalledTimes(1);

                await simpleWarningModal.mock.calls[0][0].primaryFunction!();
                expect(deleteUniformItem).toHaveBeenCalledTimes(1);
                expect(deleteUniformItem).toHaveBeenCalledWith(mockUniform.id);
                expect(onCloseMock).toHaveBeenCalledTimes(0);
                expect(onSaveMock).toHaveBeenCalledTimes(0);
                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith('uniformOffcanvas.deleteAction.failed');
            });
        });
    });
    describe('authRoles', () => {
        afterEach(() => delete global.__ROLE__);

        it('should not render edit & delete button if userRole is user', () => {
            global.__ROLE__ = AuthRole.user;
            const { queryByRole } = render(
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            );

            expect(queryByRole('button', { name: /edit/i })).toBeNull();
            expect(queryByRole('button', { name: /delete/i })).toBeNull();
        });
        it('should render edit & delete button if userRole is higher than user', () => {
            global.__ROLE__ = AuthRole.inspector;
            const { getByRole } = render(
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            );

            expect(getByRole('button', { name: /edit/i })).toBeInTheDocument();
            expect(getByRole('button', { name: /delete/i })).toBeInTheDocument();
        });

        it('should not render deficiency and history Rows if userRole is user', () => {
            global.__ROLE__ = AuthRole.user;
            const { queryByRole } = render(
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            );

            expect(queryByRole('list', { name: /deficiency/i })).toBeNull();
            expect(queryByRole('list', { name: /history/i })).toBeNull();
        });
        it('should render deficiency and history Rows if userRole is higher than user', () => {
            global.__ROLE__ = AuthRole.admin;
            const { getByRole } = render(
                <UniformOffcanvas
                    uniform={mockUniform}
                    uniformType={typeList[0]}
                    onClose={jest.fn()}
                    onSave={jest.fn()}
                />
            );

            expect(getByRole('list', { name: /deficiency/i })).toBeInTheDocument();
            expect(getByRole('list', { name: /history/i })).toBeInTheDocument();
        });
    })
});