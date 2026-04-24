import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as nextNavigation from 'next/navigation';
import * as dalDeficiency from '@/dal/inspection/deficiency';
import * as swr from 'swr';
import * as reactToastify from 'react-toastify';
import { Deficiency } from '@/types/deficiencyTypes';
import { DeficiencyStandaloneRow } from './DeficiencyStandaloneRow';

vi.mock('@/dal/inspection/deficiency', () => ({
    updateDeficiency: vi.fn(),
    resolveDeficiency: vi.fn(),
}));

vi.mock('swr', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return { ...actual, mutate: vi.fn() };
});

const mockDeficiency: Deficiency = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    typeId: '987fcdeb-51a2-43d1-b123-456789abcdef',
    typeName: 'Uniform',
    description: 'Missing button on jacket',
    comment: 'Left chest button is loose',
    dateCreated: new Date('2024-01-15T10:30:00Z'),
    dateUpdated: new Date('2024-01-15T10:30:00Z'),
    dateResolved: null,
    userCreated: 'inspector1',
    userUpdated: 'inspector1',
    userResolved: null,
};

describe('DeficiencyStandaloneRow', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(nextNavigation.useParams).mockReturnValue({ cadetId: 'test-cadet-id' });
        vi.mocked(dalDeficiency.updateDeficiency).mockResolvedValue(undefined);
        vi.mocked(dalDeficiency.resolveDeficiency).mockResolvedValue(undefined);
        vi.mocked(swr.mutate).mockResolvedValue(undefined);
    });

    describe('View mode', () => {
        it('renders deficiency data and action buttons', () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            expect(screen.getByTestId(`div_olddef_${mockDeficiency.id}`)).toBeInTheDocument();
            expect(screen.getByTestId('div_description')).toHaveTextContent(mockDeficiency.description);
            expect(screen.getByTestId('div_type')).toHaveTextContent(mockDeficiency.typeName);
            expect(screen.getByTestId('div_created')).toBeInTheDocument();
            expect(screen.getByTestId('div_comment')).toHaveTextContent(mockDeficiency.comment!);
            expect(screen.getByTestId(`btn_edit_${mockDeficiency.id}`)).toBeInTheDocument();
            expect(screen.getByTestId(`btn_resolve_${mockDeficiency.id}`)).toBeInTheDocument();
        });

        it('formats dateCreated correctly', () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);
            expect(screen.getByTestId('div_created')).toHaveTextContent('15.01.2024');
        });
    });

    describe('Edit mode toggle (bug fix: no duplication)', () => {
        it('switches to edit form and hides read-only display when Edit is clicked', async () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            // View mode: read-only content and action buttons are present
            expect(screen.getByTestId('div_description')).toBeInTheDocument();
            expect(screen.getByTestId(`btn_edit_${mockDeficiency.id}`)).toBeInTheDocument();

            await user.click(screen.getByTestId(`btn_edit_${mockDeficiency.id}`));

            // Edit mode: form is shown
            expect(screen.getByTestId(`btn_save_edit_${mockDeficiency.id}`)).toBeInTheDocument();
            expect(screen.getByTestId(`btn_cancel_edit_${mockDeficiency.id}`)).toBeInTheDocument();

            // Read-only display content and action buttons are hidden (no duplication)
            expect(screen.queryByTestId('div_description')).not.toBeInTheDocument();
            expect(screen.queryByTestId(`btn_edit_${mockDeficiency.id}`)).not.toBeInTheDocument();
            expect(screen.queryByTestId(`btn_resolve_${mockDeficiency.id}`)).not.toBeInTheDocument();
        });

        it('returns to view mode and shows read-only content when Cancel is clicked', async () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            await user.click(screen.getByTestId(`btn_edit_${mockDeficiency.id}`));
            expect(screen.getByTestId(`btn_save_edit_${mockDeficiency.id}`)).toBeInTheDocument();

            await user.click(screen.getByTestId(`btn_cancel_edit_${mockDeficiency.id}`));

            expect(screen.queryByTestId(`btn_save_edit_${mockDeficiency.id}`)).not.toBeInTheDocument();
            expect(screen.getByTestId('div_description')).toBeInTheDocument();
            expect(screen.getByTestId(`btn_edit_${mockDeficiency.id}`)).toBeInTheDocument();
        });
    });

    describe('Edit form — description field', () => {
        it('shows editable description input for non-auto-generated deficiency', async () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);
            await user.click(screen.getByTestId(`btn_edit_${mockDeficiency.id}`));

            expect(screen.getByLabelText(/common.description/i)).toBeInTheDocument();
        });

        it('shows read-only description for uniform-linked deficiency', async () => {
            const uniformLinked = { ...mockDeficiency, fk_uniform: 'some-uniform-id' } as Deficiency;
            render(<DeficiencyStandaloneRow deficiency={uniformLinked} />);
            await user.click(screen.getByTestId(`btn_edit_${uniformLinked.id}`));

            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.getByText(uniformLinked.description)).toBeInTheDocument();
        });

        it('shows read-only description for material-linked deficiency', async () => {
            const materialLinked = { ...mockDeficiency, fk_material: 'some-material-id' } as Deficiency;
            render(<DeficiencyStandaloneRow deficiency={materialLinked} />);
            await user.click(screen.getByTestId(`btn_edit_${materialLinked.id}`));

            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.getByText(materialLinked.description)).toBeInTheDocument();
        });
    });

    describe('Save action', () => {
        it('calls updateDeficiency, mutates cache, shows success toast, and returns to view mode', async () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            await user.click(screen.getByTestId(`btn_edit_${mockDeficiency.id}`));
            await user.click(screen.getByTestId(`btn_save_edit_${mockDeficiency.id}`));

            await waitFor(() => {
                expect(dalDeficiency.updateDeficiency).toHaveBeenCalledWith({
                    id: mockDeficiency.id,
                    data: expect.objectContaining({ comment: mockDeficiency.comment }),
                });
            });
            expect(swr.mutate).toHaveBeenCalled();
            expect(reactToastify.toast.success).toHaveBeenCalled();
            expect(screen.queryByTestId(`btn_save_edit_${mockDeficiency.id}`)).not.toBeInTheDocument();
        });

        it('shows error toast when updateDeficiency fails', async () => {
            vi.mocked(dalDeficiency.updateDeficiency).mockRejectedValueOnce(new Error('fail'));
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            await user.click(screen.getByTestId(`btn_edit_${mockDeficiency.id}`));
            await user.click(screen.getByTestId(`btn_save_edit_${mockDeficiency.id}`));

            await waitFor(() => expect(reactToastify.toast.error).toHaveBeenCalled());
        });
    });

    describe('Resolve action', () => {
        it('calls resolveDeficiency, mutates cache, and shows success toast', async () => {
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            await user.click(screen.getByTestId(`btn_resolve_${mockDeficiency.id}`));

            await waitFor(() => {
                expect(dalDeficiency.resolveDeficiency).toHaveBeenCalledWith(mockDeficiency.id);
            });
            expect(swr.mutate).toHaveBeenCalled();
            expect(reactToastify.toast.success).toHaveBeenCalled();
        });

        it('shows error toast when resolveDeficiency fails', async () => {
            vi.mocked(dalDeficiency.resolveDeficiency).mockRejectedValueOnce(new Error('fail'));
            render(<DeficiencyStandaloneRow deficiency={mockDeficiency} />);

            await user.click(screen.getByTestId(`btn_resolve_${mockDeficiency.id}`));

            await waitFor(() => expect(reactToastify.toast.error).toHaveBeenCalled());
        });
    });
});
