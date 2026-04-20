import { TooltipIconButton } from '@/components/Buttons/TooltipIconButton';
import { useInspectedCadetIdList, useInspectionState } from '@/dataFetcher/inspection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import { Button } from 'react-bootstrap';
import CadetInspectionCardHeader from './CadetInspectionCardHeader';

// Mock dataFetcher hooks
vi.mock('@/dataFetcher/inspection', () => ({
    useInspectionState: vi.fn(),
    useInspectedCadetIdList: vi.fn()
}));

vi.mock('@/components/Buttons/TooltipIconButton', () => ({
    TooltipIconButton: vi.fn().mockImplementation((props) => {
        return <Button variant={props.variant} disabled={props.disabled} onClick={props.onClick} data-testid={props.dataTestId} />;
    }),
    TooltipActionButton: vi.fn().mockImplementation(({variantKey, disabled, onClick, testId, ...props}) => {
        return <Button variant={variantKey} disabled={disabled} onClick={onClick} data-testid={testId} {...props} />;
    }),
}))

describe('<CadetInspectionCardHeader />', () => {
    const mockStartInspecting = vi.fn();
    const defaultProps = {
        step: 0,
        startInspecting: mockStartInspecting
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ cadetId: '123' });
        vi.mocked(useInspectionState).mockReturnValue({ inspectionState: { active: true, state: 'active', id: 'test-inspection-id', date: '2024-01-01', inspectedCadets: 0, activeCadets: 0, deregistrations: 0 } });
        vi.mocked(useInspectedCadetIdList).mockReturnValue({ inspectedIdList: ['234', '23'] });
    });

    /*
       InspectionState: Active | Inactive
       CadetInspection: Inspected | Not Inspected
       Step: 0 | 1 | 2
    */
    it('shows correct header for inactive inspection', () => {
        vi.mocked(useInspectionState).mockReturnValue({ inspectionState: { active: false, state: 'planned' } });

        render(<CadetInspectionCardHeader {...defaultProps} />);

        expect(screen.getByTestId('div_header')).toHaveTextContent(/header.noInspection/i);
        expect(screen.queryByRole('button')).toBeNull();
    });

    describe('active inspection', () => {

        it('disables button when not step 0', () => {
            const { rerender } = render(<CadetInspectionCardHeader {...defaultProps} step={0} />);
            expect(screen.getByRole('button')).toBeEnabled();
            rerender(<CadetInspectionCardHeader {...defaultProps} step={1} />);
            expect(screen.getByRole('button')).toBeDisabled();
            rerender(<CadetInspectionCardHeader {...defaultProps} step={2} />);
            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('shows correct header text depending on step', () => {
            const { rerender } = render(<CadetInspectionCardHeader {...defaultProps} step={0} />);
            expect(screen.getByTestId('div_header')).toHaveTextContent(/header.inspection/i);
            rerender(<CadetInspectionCardHeader {...defaultProps} step={1} />);
            expect(screen.getByTestId('div_header')).toHaveTextContent(/header.inspecting/i);
            rerender(<CadetInspectionCardHeader {...defaultProps} step={2} />);
            expect(screen.getByTestId('div_header')).toHaveTextContent(/header.inspecting/i);
        });

        it('changes button when cadet is inspected', () => {
            const { rerender } = render(<CadetInspectionCardHeader {...defaultProps} />);

            expect(vi.mocked(TooltipIconButton)).toHaveBeenLastCalledWith(expect.objectContaining({
                variant: "outline-warning",
                disabled: false,
                tooltipText: expect.stringMatching(/tooltip.notInspected/i),
                icon: expect.objectContaining({ iconName: "clipboard-question" }),
            }), undefined);

            vi.mocked(useInspectedCadetIdList).mockReturnValue({ inspectedIdList: ['234', '23', '123'] });
            rerender(<CadetInspectionCardHeader {...defaultProps} />);

            expect(vi.mocked(TooltipIconButton)).toHaveBeenLastCalledWith(expect.objectContaining({
                variant: "outline-success",
                disabled: false,
                tooltipText: expect.stringMatching(/tooltip.inspected/i),
                icon: expect.objectContaining({ iconName: "clipboard-check" }),
            }), undefined);
        });
    });

    describe('new deficiency button', () => {
        it('shows button when no active inspection and calls onNewDeficiency when clicked', async () => {
            const mockOnNewDeficiency = vi.fn();
            vi.mocked(useInspectionState).mockReturnValue({ inspectionState: { active: false, state: 'planned' } });
            
            const user = userEvent.setup();
            render(<CadetInspectionCardHeader {...defaultProps} onNewDeficiency={mockOnNewDeficiency} />);

            const button = screen.getByTestId('btn_new_deficiency');
            expect(button).toBeInTheDocument();
            expect(button).toBeEnabled();

            await user.click(button);
            expect(mockOnNewDeficiency).toHaveBeenCalled();
        });

        it('disables button when showCreateCard is true', () => {
            const mockOnNewDeficiency = vi.fn();
            vi.mocked(useInspectionState).mockReturnValue({ inspectionState: { active: false, state: 'planned' } });
            
            render(<CadetInspectionCardHeader {...defaultProps} onNewDeficiency={mockOnNewDeficiency} showCreateCard />);

            const button = screen.getByTestId('btn_new_deficiency');
            expect(button).toBeInTheDocument();
            expect(button).toBeDisabled();
        });

        it('does not show button when there is an active inspection', () => {
            const mockOnNewDeficiency = vi.fn();
            vi.mocked(useInspectionState).mockReturnValue({ inspectionState: { active: true, state: 'active', id: 'test-inspection-id', date: '2024-01-01', inspectedCadets: 0, activeCadets: 0, deregistrations: 0 } });
            
            render(<CadetInspectionCardHeader {...defaultProps} onNewDeficiency={mockOnNewDeficiency} />);

            const button = screen.queryByTestId('btn_new_deficiency');
            expect(button).toBeNull();
        });
    });
});
