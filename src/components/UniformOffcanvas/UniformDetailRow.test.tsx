import { render, screen } from "@testing-library/react";
import { generationLists, sizeLists, typeList } from "../../../tests/_jestConfig/staticMockData";
import { UniformDetailRow, UniformDetailRowProps } from "./UniformDetailRow";
import { useState } from "react";
import userEvent from "@testing-library/user-event";

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
}));
jest.mock('../globalDataProvider', () => ({
    useGlobalData: jest.fn(() => ({
        sizelists: sizeLists,
    })),
}));

describe('UniformDetailRow', () => {
    const { updateUniformItem } = require('@/dal/uniform/item/_index');
    const defaultProps = {
        uniform: testUniform,
        editable: false,
        setEditable: jest.fn(),
        onSave: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', () => {
        const { container } = render(<UniformDetailRow {...defaultProps} />);
        expect(container).toMatchSnapshot();
    });

    it('should render correctly when editable', async () => {
        const { container, rerender } = render(<UniformDetailRow {...defaultProps} />);
        rerender(<UniformDetailRow {...defaultProps} editable />);

        const generationSelect = screen.getByRole('combobox', { name: 'common.uniform.generation.label' });
        const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.size' });
        const commentInput = screen.getByRole('textbox', { name: 'common.comment' });
        const activeCheckbox = screen.getByRole('switch', { name: 'common.status' });

        expect(generationSelect).toBeInTheDocument();
        expect(sizeSelect).toBeInTheDocument();
        expect(commentInput).toBeInTheDocument();
        expect(activeCheckbox).toBeInTheDocument();

        expect(generationSelect).toHaveValue(testUniform.generation.id);
        expect(sizeSelect).toHaveValue(testUniform.size.id);
        expect(commentInput).toHaveValue(testUniform.comment);
        expect(activeCheckbox).toBeChecked();

        expect(generationSelect).toBeEnabled();
        expect(sizeSelect).toBeEnabled();
        expect(commentInput).toBeEnabled();
        expect(activeCheckbox).toBeEnabled();

        expect(container).toMatchSnapshot();
    });

    it('should handle save', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<UniformDetailRow {...defaultProps} />);
        rerender(<UniformDetailRow {...defaultProps} editable />);

        const generationSelect = screen.getByRole('combobox', { name: 'common.uniform.generation.label' });
        const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.size' });
        const commentInput = screen.getByRole('textbox', { name: 'common.comment' });
        const activeCheckbox = screen.getByRole('switch', { name: 'common.status' });
        const saveButton = screen.getByRole('button', { name: 'common.actions.save' });

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
            number: testUniform.number,
            id: testUniform.id,
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

        const generationSelect = screen.getByRole('combobox', { name: 'common.uniform.generation.label' });
        const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.size' });
        const commentInput = screen.getByRole('textbox', { name: 'common.comment' });
        const activeCheckbox = screen.getByRole('switch', { name: 'common.status' });
        const cancelButton = screen.getByRole('button', { name: 'common.actions.cancel' });

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

        expect(generationSelect).toHaveValue(testUniform.generation.id);
        expect(sizeSelect).toHaveValue(testUniform.size.id);
        expect(commentInput).toHaveValue(testUniform.comment);
        expect(activeCheckbox).toBeChecked();
    });

    it('should show size if not in sizelist', async () => {
        const uniform = {
            ...testUniform,
            size: {
                id: 'nonexistent-size',
                name: 'Nonexistent Size',
            },
        };

        const { rerender } = render(<UniformDetailRow {...defaultProps} uniform={uniform} />);

        expect(screen.getByText('Nonexistent Size')).toBeInTheDocument();

        rerender(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);
        const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.size' });
        expect(sizeSelect).toBeInTheDocument();
        expect(sizeSelect).toHaveValue('common.error.pleaseSelect');
    });

    it('should show correct size options', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<UniformDetailRow {...defaultProps} />);
        rerender(<UniformDetailRow {...defaultProps} editable />);

        const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.size' });
        const generationSelect = screen.getByRole('combobox', { name: 'common.uniform.generation.label' });
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

        const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.size' });
        const generationSelect = screen.getByRole('combobox', { name: 'common.uniform.generation.label' });

        // initial state with sizelist
        expect(sizeSelect).toHaveValue(testUniform.size.id);

        // different generation with sizelist
        await user.selectOptions(generationSelect, generationLists[0][2].id);
        expect(sizeSelect).toHaveValue(testUniform.size.id);

        // different generation without sizelist
        await user.selectOptions(generationSelect, generationLists[0][3].id);
        expect(sizeSelect).toHaveValue('common.error.pleaseSelect');
    });
    describe('handle update to uniform', () => {
        const newUniform = {
            ...testUniform,
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

            expect(generationSelect).toHaveTextContent(testUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(testUniform.size.name);
            expect(commentInput).toHaveTextContent(testUniform.comment);
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

            expect(generationSelect).toHaveTextContent(testUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(testUniform.size.name);
            expect(commentInput).toHaveTextContent(testUniform.comment);
            expect(activeCheckbox).toBeChecked();

            rerender(<UniformDetailRow {...defaultProps} uniform={newUniform} editable />);

            expect(generationSelect).toHaveTextContent(testUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(testUniform.size.name);
            expect(commentInput).toHaveTextContent(testUniform.comment);
            expect(activeCheckbox).toBeChecked();
        });
    });
});
