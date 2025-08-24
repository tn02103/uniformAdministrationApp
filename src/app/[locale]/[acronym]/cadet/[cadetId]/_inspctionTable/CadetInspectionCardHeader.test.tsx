import { render, screen } from '@testing-library/react';
import { Button } from 'react-bootstrap';
import CadetInspectionCardHeader from './CadetInspectionCardHeader';

// Mock dataFetcher hooks
jest.mock('@/dataFetcher/inspection', () => ({
    useInspectionState: jest.fn(),
    useInspectedCadetIdList: jest.fn()
}));

jest.mock('@/components/Buttons/TooltipIconButton', () => ({
    TooltipIconButton: jest.fn().mockImplementation((props) => {
        return <Button variant={props.variant} disabled={props.disabled} onClick={props.onClick} data-testid={props.dataTestId} />;
    })
}))

describe('<CadetInspectionCardHeader />', () => {
    const { useInspectionState, useInspectedCadetIdList } = jest.requireMock('@/dataFetcher/inspection');
    const { TooltipIconButton } = jest.requireMock('@/components/Buttons/TooltipIconButton');
    const { useParams } = jest.requireMock('next/navigation');

    const mockStartInspecting = jest.fn();
    const defaultProps = {
        step: 0,
        startInspecting: mockStartInspecting
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useParams.mockReturnValue({ cadetId: '123' });
        useInspectionState.mockReturnValue({ inspectionState: { active: true } });
        useInspectedCadetIdList.mockReturnValue({ inspectedIdList: ['234', '23'] });
    });

    /*
       InspectionState: Active | Inactive
       CadetInspection: Inspected | Not Inspected
       Step: 0 | 1 | 2
    */
    it('shows correct header for inactive inspection', () => {
        useInspectionState.mockReturnValue({ active: false });

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

            expect(TooltipIconButton).toHaveBeenLastCalledWith(expect.objectContaining({
                variant: "outline-warning",
                disabled: false,
                tooltipText: expect.stringMatching(/tooltip.notInspected/i),
                icon: expect.objectContaining({ iconName: "clipboard-question" }),
            }), undefined);

            useInspectedCadetIdList.mockReturnValue({ inspectedIdList: ['234', '23', '123'] });
            rerender(<CadetInspectionCardHeader {...defaultProps} />);

            expect(TooltipIconButton).toHaveBeenLastCalledWith(expect.objectContaining({
                variant: "outline-success",
                disabled: false,
                tooltipText: expect.stringMatching(/tooltip.inspected/i),
                icon: expect.objectContaining({ iconName: "clipboard-check" }),
            }), undefined);
        });
    });
});
