import "./UniformOffcanvasJestHelper";

import { getAllByRole, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGenerationLists, mockSizeLists, mockTypeList } from "../../../tests/_jestConfig/staticMockData";
import { UniformDetailRow, UniformDetailRowProps } from "./UniformDetailRow";
import { mockUniform } from "./UniformOffcanvasJestHelper";

describe('UniformDetailRow', () => {
    const defaultProps: UniformDetailRowProps = {
        uniform: mockUniform,
        uniformType: mockTypeList[0],
        editable: false,
        setEditable: jest.fn(),
        onSave: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Render Components", () => {

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
            const reserveCheckbox = screen.getByRole('switch', { name: /status/i });

            expect(generationSelect).toBeInTheDocument();
            expect(sizeSelect).toBeInTheDocument();
            expect(commentInput).toBeInTheDocument();
            expect(reserveCheckbox).toBeInTheDocument();

            expect(generationSelect).toHaveValue(mockUniform.generation.id);
            expect(sizeSelect).toHaveValue(mockUniform.size.id);
            expect(commentInput).toHaveValue(mockUniform.comment);
            expect(reserveCheckbox).not.toBeChecked();

            expect(generationSelect).toBeEnabled();
            expect(sizeSelect).toBeEnabled();
            expect(commentInput).toBeEnabled();
            expect(reserveCheckbox).toBeEnabled();

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
            const options = getAllByRole(sizeSelect, "option")
            expect(options).toHaveLength(mockSizeLists[0].uniformSizes.length + 1); // +1 for the default "please select" option
            mockSizeLists[0].uniformSizes.forEach(size => {
                expect(screen.getByText(size.name)).toBeInTheDocument();
            });

            // different generation with sizelist
            await user.selectOptions(generationSelect, mockGenerationLists[0][2].id);
            const seccondOptions = getAllByRole(sizeSelect, "option");
            expect(seccondOptions.length).toBe(mockSizeLists[1].uniformSizes.length + 1); // +1 for the default "please select" option
            mockSizeLists[1].uniformSizes.forEach(size => {
                expect(screen.getByText(size.name)).toBeInTheDocument();
            });

            // different generation without sizelist
            await user.selectOptions(generationSelect, mockGenerationLists[0][3].id);
            const thirdOptions = getAllByRole(sizeSelect, 'option');
            expect(thirdOptions.length).toBe(mockSizeLists[2].uniformSizes.length + 1); // +1 for the default "please select" option
            mockSizeLists[2].uniformSizes.forEach(size => {
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
            await user.selectOptions(generationSelect, mockGenerationLists[0][2].id);
            expect(sizeSelect).toHaveValue(mockUniform.size.id);

            // different generation without sizelist
            await user.selectOptions(generationSelect, mockGenerationLists[0][3].id);
            expect(sizeSelect).toHaveValue('');
            expect(sizeSelect).toHaveTextContent('common.error.pleaseSelect');
        });

        it('should hide sizeField if !usingSizes', () => {
            render(<UniformDetailRow {...defaultProps} uniformType={mockTypeList[1]} />);

            expect(screen.queryByLabelText('common.uniform.size')).not.toBeInTheDocument();
            expect(screen.queryByText(defaultProps.uniform.size!.name!)).not.toBeInTheDocument();
        });

        it('should hide generationField if !usingGenerations', () => {
            render(<UniformDetailRow {...defaultProps} uniformType={mockTypeList[2]} />);

            expect(screen.queryByLabelText('common.uniform.generation.label')).not.toBeInTheDocument();
            expect(screen.queryByText(defaultProps.uniform.generation!.name!)).not.toBeInTheDocument();
        });
    });

    describe('handle update to uniform', () => {
        const newUniform = {
            ...mockUniform,
            generation: mockGenerationLists[0][0],
            size: mockSizeLists[0].uniformSizes[1],
            comment: 'New comment',
            isReserve: true,
        };
        it('should reset form when uniform prop changes', () => {
            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            const generationSelect = screen.getByLabelText('common.uniform.generation.label');
            const sizeSelect = screen.getByLabelText('common.uniform.size');
            const commentInput = screen.getByLabelText('common.comment');
            const reserveCheckbox = screen.getByLabelText('common.status');

            expect(generationSelect).toHaveTextContent(mockUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(mockUniform.size.name);
            expect(commentInput).toHaveTextContent(mockUniform.comment);
            expect(reserveCheckbox).toHaveTextContent('common.uniform.state.active');

            rerender(<UniformDetailRow {...defaultProps} uniform={newUniform} />);

            expect(generationSelect).toHaveTextContent(newUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(newUniform.size.name);
            expect(commentInput).toHaveTextContent(newUniform.comment);
            expect(reserveCheckbox).toHaveTextContent('common.uniform.state.isReserve');
        });

        it('should not reset if editable', () => {
            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            rerender(<UniformDetailRow {...defaultProps} editable />);

            const generationSelect = screen.getByLabelText('common.uniform.generation.label');
            const sizeSelect = screen.getByLabelText('common.uniform.size');
            const commentInput = screen.getByLabelText('common.comment');
            const reserveCheckbox = screen.getByLabelText('common.status');

            expect(generationSelect).toHaveTextContent(mockUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(mockUniform.size.name);
            expect(commentInput).toHaveTextContent(mockUniform.comment);
            expect(reserveCheckbox).not.toBeChecked();

            rerender(<UniformDetailRow {...defaultProps} uniform={newUniform} editable />);

            expect(generationSelect).toHaveTextContent(mockUniform.generation.name);
            expect(sizeSelect).toHaveTextContent(mockUniform.size.name);
            expect(commentInput).toHaveTextContent(mockUniform.comment);
            // Reserve checkbox should be checked because newUniform has reserve generation and isReserve: true
            expect(reserveCheckbox).toBeChecked();
        });
    });

    describe('isReserve handling', () => {
        describe('initial uneditable state', () => {
            it('generation isReserved while usingGenerations', () => {
                const uniform = {
                    ...mockUniform,
                    isReserve: false,
                    generation: { ...mockUniform.generation, isReserve: true }
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} />);
                const reserveToggle = screen.getByLabelText('common.status');
                expect(reserveToggle).toHaveTextContent('common.uniform.state.isReserve');
            });
            it('generation isReserved while not usingGenerations', () => {
                const uniform = {
                    ...mockUniform,
                    isReserve: false,
                    generation: { ...mockUniform.generation, isReserve: true }
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} uniformType={mockTypeList[2]} />);
                const reserveToggle = screen.getByLabelText('common.status');
                expect(reserveToggle).toHaveTextContent('common.uniform.state.active');
            });
            it('shows reserved if item isReserved', () => {
                const uniform = {
                    ...mockUniform,
                    isReserve: true
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} />);
                const reserveToggle = screen.getByLabelText('common.status');
                expect(reserveToggle).toHaveTextContent('common.uniform.state.isReserve');
            });
        });

        describe('editable state', () => {
            const reserveGeneration = mockGenerationLists[0][0];
            const nonReserveGeneration = mockGenerationLists[0][1];
            const nonReserveGeneration2 = mockGenerationLists[0][2];

            it('generation isReserve & usingGenerations', async () => {
                const uniform = {
                    ...mockUniform,
                    isReserve: false,
                    generation: reserveGeneration
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);
                const reserveToggle = screen.getByRole('switch', { name: /status/i });
                expect(reserveToggle).toHaveAttribute("aria-disabled", "true");
                expect(reserveToggle).toBeChecked();
            });
            it('generation isReserved & !usingGenerations', async () => {
                const uniform = {
                    ...mockUniform,
                    isReserve: false,
                    generation: reserveGeneration
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} uniformType={mockTypeList[2]} editable />);
                const reserveToggle = screen.getByRole('switch', { name: /status/i });
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");
                expect(reserveToggle).not.toBeChecked();
            });

            it('toggles disabled state with generation isReserved change', async () => {
                const user = userEvent.setup();
                const uniform = {
                    ...mockUniform,
                    isReserve: false
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);

                const generationSelect = screen.getByRole('combobox', { name: /generation/i });
                const reserveToggle = screen.getByRole('switch', { name: /status/i });

                // Initially should be enabled (current generation is not reserve)
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");

                // Change to a generation that is reserve
                await user.selectOptions(generationSelect, reserveGeneration.id);
                expect(reserveToggle).toHaveAttribute("aria-disabled", "true");
                expect(reserveToggle).toBeChecked();


                // Change back to non-reserve generation
                await user.selectOptions(generationSelect, nonReserveGeneration.id);
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");
            });

            it('handles generation selection isReserved to !isReserved', async () => {
                const user = userEvent.setup();

                const uniform = {
                    ...mockUniform,
                    isReserve: false,
                    generation: reserveGeneration
                };
                const { rerender } = render(<UniformDetailRow {...defaultProps} uniform={uniform} />);
                rerender(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);

                const generationSelect = screen.getByRole('combobox', { name: /generation/i });
                const reserveToggle = screen.getByRole('switch', { name: /status/i });

                // Initially should be checked and disabled due to generation being reserve
                expect(reserveToggle).toBeChecked();
                expect(reserveToggle).toHaveAttribute("aria-disabled", "true");

                // Change to non-reserve generation
                await user.selectOptions(generationSelect, nonReserveGeneration.id);
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");
                expect(reserveToggle).not.toBeChecked(); // Should reset to uniform's original isReserve state
            });

            it('handles generation selection !isReserved to isReserved', async () => {
                const user = userEvent.setup();

                const uniform = {
                    ...mockUniform,
                    isReserve: true, // uniform itself is reserve
                    generation: nonReserveGeneration
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);

                const generationSelect = screen.getByRole('combobox', { name: /generation/i });
                const reserveToggle = screen.getByRole('switch', { name: /status/i });

                // Initially should reflect uniform's reserve state
                expect(reserveToggle).toBeChecked();
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");

                // Change to reserve generation
                await user.selectOptions(generationSelect, reserveGeneration.id);
                expect(reserveToggle).toBeChecked();
                expect(reserveToggle).toHaveAttribute("aria-disabled", "true");
            });

            it('handles generation selection !isReserved to !isReserved', async () => {
                const user = userEvent.setup();

                const uniform = {
                    ...mockUniform,
                    isReserve: false,
                    generation: nonReserveGeneration
                };
                render(<UniformDetailRow {...defaultProps} uniform={uniform} editable />);

                const generationSelect = screen.getByRole('combobox', { name: /generation/i });
                const reserveToggle = screen.getByRole('switch', { name: /status/i });

                // Initially not checked and enabled
                expect(reserveToggle).not.toBeChecked();
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");

                // Manually toggle the reserve state
                await user.click(reserveToggle);
                expect(reserveToggle).toBeChecked();

                // Change to another non-reserve generation
                await user.selectOptions(generationSelect, nonReserveGeneration2.id);
                expect(reserveToggle).toHaveAttribute("aria-disabled", "false");
                expect(reserveToggle).toBeChecked(); // Should maintain the manually set state, not reset
            });
        });
    });
    describe('save/reset form', () => {
        it('should call updateUniformItem', async () => {
            const { updateUniformItem } = jest.requireMock('@/dal/uniform/item/_index');
            const user = userEvent.setup();
            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            rerender(<UniformDetailRow {...defaultProps} editable />);

            const generationSelect = screen.getByRole('combobox', { name: /generation/i });
            const sizeSelect = screen.getByRole('combobox', { name: /size/i });
            const commentInput = screen.getByRole('textbox', { name: /comment/i });
            const reserveCheckbox = screen.getByRole('switch', { name: /status/i });
            const saveButton = screen.getByRole('button', { name: /save/i });

            await user.selectOptions(generationSelect, mockGenerationLists[0][2].id);
            await user.selectOptions(sizeSelect, mockSizeLists[0].uniformSizes[1].id);
            await user.clear(commentInput);
            await user.type(commentInput, 'New comment');
            await user.click(reserveCheckbox);

            expect(generationSelect).toHaveValue(mockGenerationLists[0][2].id);
            expect(sizeSelect).toHaveValue(mockSizeLists[0].uniformSizes[1].id);
            expect(commentInput).toHaveValue('New comment');
            expect(reserveCheckbox).toBeChecked();

            await user.click(saveButton);
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
            expect(defaultProps.setEditable).toHaveBeenCalledTimes(1);
            expect(defaultProps.setEditable).toHaveBeenCalledWith(false);

            expect(updateUniformItem).toHaveBeenCalledTimes(1);
            expect(updateUniformItem).toHaveBeenCalledWith({
                number: mockUniform.number,
                id: mockUniform.id,
                generation: mockGenerationLists[0][2].id,
                size: mockSizeLists[0].uniformSizes[1].id,
                comment: 'New comment',
                isReserve: true,
            });
        });

        it('should reset form on cancel', async () => {
            const user = userEvent.setup();

            const { rerender } = render(<UniformDetailRow {...defaultProps} />);
            rerender(<UniformDetailRow {...defaultProps} editable />);

            const generationSelect = screen.getByRole('combobox', { name: /generation/i });
            const sizeSelect = screen.getByRole('combobox', { name: /size/i });
            const commentInput = screen.getByRole('textbox', { name: /comment/i });
            const reserveCheckbox = screen.getByRole('switch', { name: /status/i });
            const cancelButton = screen.getByRole('button', { name: /cancel/i });

            await user.selectOptions(generationSelect, mockGenerationLists[0][2].id);
            await user.selectOptions(sizeSelect, mockSizeLists[0].uniformSizes[1].id);
            await user.clear(commentInput);
            await user.type(commentInput, 'New comment');
            await user.click(reserveCheckbox);

            expect(generationSelect).toHaveValue(mockGenerationLists[0][2].id);
            expect(sizeSelect).toHaveValue(mockSizeLists[0].uniformSizes[1].id);
            expect(commentInput).toHaveValue('New comment');
            expect(reserveCheckbox).toBeChecked();

            await user.click(cancelButton);
            expect(defaultProps.setEditable).toHaveBeenCalledTimes(1);
            expect(defaultProps.setEditable).toHaveBeenCalledWith(false);

            expect(generationSelect).toHaveValue(mockUniform.generation.id);
            expect(sizeSelect).toHaveValue(mockUniform.size.id);
            expect(commentInput).toHaveValue(mockUniform.comment);
            expect(reserveCheckbox).not.toBeChecked();
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
                uniformType: mockTypeList[3],
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
