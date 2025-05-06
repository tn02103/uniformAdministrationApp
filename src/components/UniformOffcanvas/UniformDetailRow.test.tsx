import "./UniformOffcanvasJestHelper";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generationLists, sizeLists, typeList } from "../../../tests/_jestConfig/staticMockData";
import { UniformDetailRow, UniformDetailRowProps } from "./UniformDetailRow";
import { mockUniform } from "./UniformOffcanvasJestHelper";

describe('UniformDetailRow', () => {
    const defaultProps: UniformDetailRowProps = {
        uniform: mockUniform,
        uniformType: typeList[0],
        editable: false,
        setEditable: jest.fn(),
        onSave: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', () => {
        const { container } = render(<UniformDetailRow {...defaultProps} />);
        expect(container).toMatchSnapshot();
    });

    it('should render correctly when editable', async () => {
        const { container, rerender } = render(<UniformDetailRow {...defaultProps} />);
        rerender(<UniformDetailRow {...defaultProps} editable />);

        const generationSelect = screen.getByRole('combobox', { name: /generation/i });
        const sizeSelect = screen.getByRole('combobox', { name: /size/i });
        const commentInput = screen.getByRole('textbox', { name: /comment/i });
        const activeCheckbox = screen.getByRole('switch', { name: /status/i });

        expect(generationSelect).toBeInTheDocument();
        expect(sizeSelect).toBeInTheDocument();
        expect(commentInput).toBeInTheDocument();
        expect(activeCheckbox).toBeInTheDocument();

        expect(generationSelect).toHaveValue(mockUniform.generation.id);
        expect(sizeSelect).toHaveValue(mockUniform.size.id);
        expect(commentInput).toHaveValue(mockUniform.comment);
        expect(activeCheckbox).toBeChecked();

        expect(generationSelect).toBeEnabled();
        expect(sizeSelect).toBeEnabled();
        expect(commentInput).toBeEnabled();
        expect(activeCheckbox).toBeEnabled();

        expect(container).toMatchSnapshot();
    });


    it('should show size if not in sizelist', async () => {
        const uniform = {
            ...mockUniform,
            size: {
                id: 'nonexistent-size',
                name: 'Nonexistent Size',
            },
        };

        const { rerender } = render(<UniformDetailRow {...defaultProps} uniform={uniform} />);

        expect(screen.getByText('Nonexistent Size')).toBeInTheDocument();

        rerender(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);
        const sizeSelect = screen.getByRole('combobox', { name: /size/i });
        expect(sizeSelect).toBeInTheDocument();
        expect(sizeSelect).toHaveValue('');
        expect(sizeSelect).toHaveTextContent('common.error.pleaseSelect');
    });

    it('should show correct size options', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<UniformDetailRow {...defaultProps} />);
        rerender(<UniformDetailRow {...defaultProps} editable />);

        const sizeSelect = screen.getByRole('combobox', { name: /size/i });
        const generationSelect = screen.getByRole('combobox', { name: /generation/i });
        expect(sizeSelect).toBeInTheDocument();

        // initial state with sizelist
        const options = sizeSelect.querySelectorAll('option');
        expect(options.length).toBe(sizeLists[0].uniformSizes.length + 1); // +1 for the default "please select" option
        sizeLists[0].uniformSizes.forEach(size => {
            expect(screen.getByText(size.name)).toBeInTheDocument();
        });

        // different generation with sizelist
        await user.selectOptions(generationSelect, generationLists[0][2].id);
        const seccondOptions = sizeSelect.querySelectorAll('option');
        expect(seccondOptions.length).toBe(sizeLists[1].uniformSizes.length + 1); // +1 for the default "please select" option
        sizeLists[1].uniformSizes.forEach(size => {
            expect(screen.getByText(size.name)).toBeInTheDocument();
        });

        // different generation without sizelist
        await user.selectOptions(generationSelect, generationLists[0][3].id);
        const thirdOptions = sizeSelect.querySelectorAll('option');
        expect(thirdOptions.length).toBe(sizeLists[2].uniformSizes.length + 1); // +1 for the default "please select" option
        sizeLists[2].uniformSizes.forEach(size => {
            expect(screen.getByText(size.name)).toBeInTheDocument();
        });
    });

    it('should only keep size if in new sizelist', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<UniformDetailRow {...defaultProps} />);
        rerender(<UniformDetailRow {...defaultProps} editable />);

        const sizeSelect = screen.getByRole('combobox', { name: /size/i });
        const generationSelect = screen.getByRole('combobox', { name: /generation/i });

        // initial state with sizelist
        expect(sizeSelect).toHaveValue(mockUniform.size.id);

        // different generation with sizelist
        await user.selectOptions(generationSelect, generationLists[0][2].id);
        expect(sizeSelect).toHaveValue(mockUniform.size.id);

        // different generation without sizelist
        await user.selectOptions(generationSelect, generationLists[0][3].id);
        expect(sizeSelect).toHaveValue('');
        expect(sizeSelect).toHaveTextContent('common.error.pleaseSelect');
    });

    it('should hide sizeField if !usingSizes', () => {
        render(<UniformDetailRow {...defaultProps} uniformType={typeList[1]} />);

        expect(screen.queryByLabelText('common.uniform.size')).not.toBeInTheDocument();
        expect(screen.queryByText(defaultProps.uniform.size?.name!)).not.toBeInTheDocument();
    });

    it('should hide generationField if !usingGenerations', () => {
        render(<UniformDetailRow {...defaultProps} uniformType={typeList[2]} />);

        expect(screen.queryByLabelText('common.uniform.generation.label')).not.toBeInTheDocument();
        expect(screen.queryByText(defaultProps.uniform.generation?.name!)).not.toBeInTheDocument();
    });

    describe('handle update to uniform', () => {
        const newUniform = {
            ...mockUniform,
            generation: generationLists[0][0],
            size: sizeLists[0].uniformSizes[1],
            comment: 'New comment',
            active: false,
        };
        it('should reset form when uniform prop changes', () => {
            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            const generationSelect = screen.getByLabelText('common.uniform.generation.label');
            const sizeSelect = screen.getByLabelText('common.uniform.size');
            const commentInput = screen.getByLabelText('common.comment');
            const activeCheckbox = screen.getByLabelText('common.status');

            expect(generationSelect).toHaveTextContent(mockUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(mockUniform.size.name);
            expect(commentInput).toHaveTextContent(mockUniform.comment);
            expect(activeCheckbox).toHaveTextContent('common.uniform.active.true');

            rerender(<UniformDetailRow {...defaultProps} uniform={newUniform} />);

            expect(generationSelect).toHaveTextContent(newUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(newUniform.size.name);
            expect(commentInput).toHaveTextContent(newUniform.comment);
            expect(activeCheckbox).toHaveTextContent('common.uniform.active.false');
        });

        it('should not reset if editable', () => {
            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            rerender(<UniformDetailRow {...defaultProps} editable />);

            const generationSelect = screen.getByLabelText('common.uniform.generation.label');
            const sizeSelect = screen.getByLabelText('common.uniform.size');
            const commentInput = screen.getByLabelText('common.comment');
            const activeCheckbox = screen.getByLabelText('common.status');

            expect(generationSelect).toHaveTextContent(mockUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(mockUniform.size.name);
            expect(commentInput).toHaveTextContent(mockUniform.comment);
            expect(activeCheckbox).toBeChecked();

            rerender(<UniformDetailRow {...defaultProps} uniform={newUniform} editable />);

            expect(generationSelect).toHaveTextContent(mockUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(mockUniform.size.name);
            expect(commentInput).toHaveTextContent(mockUniform.comment);
            expect(activeCheckbox).toBeChecked();
        });
    });
    describe('edit uniform', () => {
        it('should call updateUniformItem', async () => {
            const { updateUniformItem } = jest.requireMock('@/dal/uniform/item/_index');
            const user = userEvent.setup();
            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            rerender(<UniformDetailRow {...defaultProps} editable />);

            const generationSelect = screen.getByRole('combobox', { name: /generation/i });
            const sizeSelect = screen.getByRole('combobox', { name: /size/i });
            const commentInput = screen.getByRole('textbox', { name: /comment/i });
            const activeCheckbox = screen.getByRole('switch', { name: /status/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            await user.selectOptions(generationSelect, generationLists[0][0].id);
            await user.selectOptions(sizeSelect, sizeLists[0].uniformSizes[1].id);
            await user.clear(commentInput);
            await user.type(commentInput, 'New comment');
            await user.click(activeCheckbox);

            expect(generationSelect).toHaveValue(generationLists[0][0].id);
            expect(sizeSelect).toHaveValue(sizeLists[0].uniformSizes[1].id);
            expect(commentInput).toHaveValue('New comment');
            expect(activeCheckbox).not.toBeChecked();

            await user.click(saveButton);
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
            expect(defaultProps.onSave).toHaveBeenCalledWith('Saved item');
            expect(defaultProps.setEditable).toHaveBeenCalledTimes(1);
            expect(defaultProps.setEditable).toHaveBeenCalledWith(false);

            expect(updateUniformItem).toHaveBeenCalledTimes(1);
            expect(updateUniformItem).toHaveBeenCalledWith({
                number: mockUniform.number,
                id: mockUniform.id,
                generation: generationLists[0][0].id,
                size: sizeLists[0].uniformSizes[1].id,
                comment: 'New comment',
                active: false,
            });
        });

        it('should reset form on cancel', async () => {
            const user = userEvent.setup();

            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            rerender(<UniformDetailRow {...defaultProps} editable />);

            const generationSelect = screen.getByRole('combobox', { name: /generation/i });
            const sizeSelect = screen.getByRole('combobox', { name: /size/i });
            const commentInput = screen.getByRole('textbox', { name: /comment/i });
            const activeCheckbox = screen.getByRole('switch', { name: /status/i });
            const cancelButton = screen.getByRole('button', { name: /cancel/i });

            await user.selectOptions(generationSelect, generationLists[0][0].id);
            await user.selectOptions(sizeSelect, sizeLists[0].uniformSizes[1].id);
            await user.clear(commentInput);
            await user.type(commentInput, 'New comment');
            await user.click(activeCheckbox);

            expect(generationSelect).toHaveValue(generationLists[0][0].id);
            expect(sizeSelect).toHaveValue(sizeLists[0].uniformSizes[1].id);
            expect(commentInput).toHaveValue('New comment');
            expect(activeCheckbox).not.toBeChecked();

            await user.click(cancelButton);
            expect(defaultProps.setEditable).toHaveBeenCalledTimes(1);
            expect(defaultProps.setEditable).toHaveBeenCalledWith(false);

            expect(generationSelect).toHaveValue(mockUniform.generation.id);
            expect(sizeSelect).toHaveValue(mockUniform.size.id);
            expect(commentInput).toHaveValue(mockUniform.comment);
            expect(activeCheckbox).toBeChecked();
        });

        it('should not allow null value for generation', async () => {
            const props = {
                ...defaultProps,
                uniform: {
                    ...mockUniform,
                    generation: null,
                }
            }
            const user = userEvent.setup();
            const { rerender } = render(<UniformDetailRow {...props} />);
            rerender(<UniformDetailRow {...props} editable />);

            const generationSelect = screen.getByRole('combobox', { name: /generation/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            expect(generationSelect).toHaveValue('');

            await user.click(saveButton);
            expect(defaultProps.onSave).not.toHaveBeenCalled();
            expect(generationSelect).toBeInvalid();
            expect(generationSelect).toHaveTextContent('common.error.pleaseSelect');
        });

        it('should not allow null value for size', async () => {
            const props = {
                ...defaultProps,
                uniform: {
                    ...mockUniform,
                    size: null,
                }
            }
            const user = userEvent.setup();
            const { rerender } = render(<UniformDetailRow {...props} />);
            rerender(<UniformDetailRow {...props} editable />);

            const sizeSelect = screen.getByRole('combobox', { name: /size/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            expect(sizeSelect).toHaveValue('');

            await user.click(saveButton);
            expect(defaultProps.onSave).not.toHaveBeenCalled();
            expect(sizeSelect).toBeInvalid();
            expect(sizeSelect).toHaveTextContent('common.error.pleaseSelect');
        });
        it('should allow null values if not using sizes or generations', async () => {
            const props = {
                ...defaultProps,
                uniformType: typeList[3],
                uniform: {
                    ...mockUniform,
                    generation: null,
                    size: null,
                }
            }
            const user = userEvent.setup();
            const { rerender } = render(<UniformDetailRow {...props} />);
            rerender(<UniformDetailRow {...props} editable />);

            const generationSelect = screen.queryByRole('combobox', { name: /generation/i });
            const sizeSelect = screen.queryByRole('combobox', { name: /size/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            expect(generationSelect).toBeNull();
            expect(sizeSelect).toBeNull();

            await user.click(saveButton);
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
        });

        it('should not allow size not in sizelist', async () => {
            const props = {
                ...defaultProps,
                uniform: {
                    ...mockUniform,
                    size: {
                        id: 'nonexistent-size',
                        name: 'Nonexistent Size',
                    },
                }
            }
            const user = userEvent.setup();
            const { rerender } = render(<UniformDetailRow {...props} />);
            rerender(<UniformDetailRow {...props} editable />);

            const sizeSelect = screen.getByRole('combobox', { name: /size/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            expect(sizeSelect).toHaveValue('');

            await user.click(saveButton);
            expect(defaultProps.onSave).not.toHaveBeenCalled();
            expect(sizeSelect).toBeInvalid();
            expect(sizeSelect).toHaveTextContent('common.error.pleaseSelect');
        });
    });
});
