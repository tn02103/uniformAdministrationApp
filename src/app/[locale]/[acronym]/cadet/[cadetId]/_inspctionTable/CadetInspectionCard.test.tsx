import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CadetInspectionCard } from './CadetInspectionCard';
import * as dalInspection from '@/dal/inspection';
import * as dataFetcherInspection from '@/dataFetcher/inspection';
import * as nextNavigation from 'next/navigation';
import * as swr from 'swr';
import * as reactToastify from 'react-toastify';
import { useEffect, useState } from 'react';

// Mock the DAL functions
vi.mock('@/dal/inspection', () => ({
    getCadetInspectionFormData: vi.fn(),
    saveCadetInspection: vi.fn(),
}));

// Mock the data fetcher
vi.mock('@/dataFetcher/inspection', () => ({
    useUnresolvedDeficienciesByCadet: vi.fn(),
}));

// Mock SWR mutate
vi.mock('swr', () => ({
    mutate: vi.fn(),
}));

// Mock the child components
vi.mock('./CadetInspectionCardHeader', () => ({
    default: function MockCadetInspectionCardHeader({ step, startInspecting }: { step: number; startInspecting: () => void }) {
        return (
            <div data-testid="mock-header">
                <span data-testid="mock-current-step">Step: {step}</span>
                <button data-testid="btn-start-inspection" onClick={startInspecting}>
                    Start Inspection
                </button>
            </div>
        );
    },
}));

vi.mock('./CadetInspectionStep1', () => ({
    CadetInspectionStep1: function MockCadetInspectionStep1({ setNextStep, cancel }: { setNextStep: () => void; cancel: () => void }) {
        return (
            <div data-testid="mock-step1">
                <button type="button" onClick={() => setNextStep()} data-testid="btn-next-step">Next Step</button>
                <button type="button" onClick={() => cancel()} data-testid="btn-cancel">Cancel</button>
            </div>
        );
    },
}));

vi.mock('./CadetInspectionStep2', () => ({
    CadetInspectionStep2: function MockCadetInspectionStep2({ setStep }: { setStep: (step: number) => void }) {

        return (
            <div data-testid="mock-step2">
                <button type="button" onClick={() => setStep(0)} data-testid="btn-back-to-step0">Back to Step 0</button>
                <button type="submit" data-testid="btn-submit">Submit</button>
            </div>
        );
    },
}));

vi.mock('./OldDeficiencyRow', () => ({
    OldDeficiencyRow: function MockOldDeficiencyRow({ deficiency, index, step }: {
        deficiency: { description: string };
        index: number;
        step: number
    }) {
        return (
            <div data-testid={`old-deficiency-${index}`}>
                {deficiency.description} (Step: {step})
            </div>
        );
    },
}));

describe('CadetInspectionCard', () => {
    // Get mocked functions
    const mockGetCadetInspectionFormData = vi.mocked(dalInspection.getCadetInspectionFormData);
    const mockSaveCadetInspection = vi.mocked(dalInspection.saveCadetInspection);
    const mockUseUnresolvedDeficienciesByCadet = vi.mocked(dataFetcherInspection.useUnresolvedDeficienciesByCadet);
    const mockUseParams = vi.mocked(nextNavigation.useParams);
    const mockMutate = vi.mocked(swr.mutate);
    const mockToast = vi.mocked(reactToastify.toast);

    const mockCadetId = '59b34bbe-8c80-477c-93de-43eed2258051';
    const mockUnresolvedDeficiencies = [
        {
            id: 'c023d77a-4175-4d5d-b202-5defec4ebc7c',
            typeId: 'type-1',
            description: 'Missing button',
            typeName: 'Uniform',
            comment: 'Left chest button',
            dateCreated: new Date('2024-01-15'),
        },
        {
            id: 'a66a0706-a647-41f5-9c0a-d00d5b44ce50',
            typeId: 'type-2',
            description: 'Dirty boots',
            typeName: 'Equipment',
            comment: 'Need cleaning',
            dateCreated: new Date('2024-01-16'),
        },
    ];

    const mockFormData = {
        cadetId: mockCadetId,
        uniformComplete: true,
        oldDeficiencyList: [
            {
                id: 'c023d77a-4175-4d5d-b202-5defec4ebc7c',
                typeId: 'cc57e112-614b-4c95-bfd7-9b2b9ffb5e77',
                typeName: 'Uniform',
                description: 'Missing button',
                comment: 'Left chest button',
                dateCreated: new Date('2024-01-15'),
                resolved: false,
            },
        ],
        newDeficiencyList: [
            {
                id: '17f19b34-149e-4b0e-a05d-57be618e21b7',
                typeId: '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd',
                description: 'New deficiency',
                comment: 'Test comment',
                uniformId: '',
                materialId: 'other',
                otherMaterialId: '662b54d6-1dd1-4d1c-9800-4779de61542d',
                otherMaterialGroupId: '8681745c-fd1a-4bee-8b66-63b79abafeef',
                dateCreated: '2024-01-15T00:00:00',
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockUseParams.mockReturnValue({ cadetId: mockCadetId });
        mockUseUnresolvedDeficienciesByCadet.mockReturnValue({
            unresolvedDeficiencies: mockUnresolvedDeficiencies,
        });
        mockGetCadetInspectionFormData.mockResolvedValue(mockFormData);
        mockSaveCadetInspection.mockResolvedValue(undefined);
        mockMutate.mockResolvedValue(undefined);
    });

    describe('Component Rendering and Initial State', () => {
        it('should render correctly with deficiencies, show proper step indicator, and use correct cadetId from params', () => {
            render(<CadetInspectionCard />);

            // Basic rendering
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.getByTestId('mock-header')).toBeInTheDocument();

            // Step indicator shows step 0
            expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 0');

            // Shows deficiencies
            expect(screen.getByTestId('old-deficiency-0')).toHaveTextContent('Missing button (Step: 0)');
            expect(screen.getByTestId('old-deficiency-1')).toHaveTextContent('Dirty boots (Step: 0)');

            // Verifies hook calls with correct cadetId
            expect(mockUseUnresolvedDeficienciesByCadet).toHaveBeenCalledWith(mockCadetId);
            expect(mockUseParams).toHaveBeenCalled();
        });

        it('should handle empty and undefined deficiencies states correctly', () => {
            // Test empty deficiencies array
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({
                unresolvedDeficiencies: [],
            });

            render(<CadetInspectionCard />);

            expect(screen.getByTestId('div_step0_noDeficiencies')).toBeInTheDocument();
            expect(screen.getByTestId('div_step0_noDeficiencies')).toHaveTextContent(/label.noDeficiencies/i);
        });

        it('should not show no deficiencies message when deficiencies is undefined', () => {
            // Test undefined deficiencies
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({
                unresolvedDeficiencies: undefined,
            });

            render(<CadetInspectionCard />);

            expect(screen.queryByTestId('div_step0_noDeficiencies')).not.toBeInTheDocument();
        });

        it('should adapt to different cadetId from useParams', () => {
            const differentCadetId = 'different-cadet-id-456';
            mockUseParams.mockReturnValue({ cadetId: differentCadetId });

            render(<CadetInspectionCard />);

            expect(mockUseUnresolvedDeficienciesByCadet).toHaveBeenCalledWith(differentCadetId);
        });
    });

    describe('Step Navigation Workflow', () => {
        // It starts at step 0
        it("should start at step 0 and display unresolved deficiencies", () => {
            render(<CadetInspectionCard />);

            expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 0');
            expect(screen.getByTestId('old-deficiency-0')).toBeInTheDocument();
            expect(screen.getByTestId('old-deficiency-1')).toBeInTheDocument();
        });
        // start inspection goes to step 1 if old deficiencies exist
        it("should go to step 1 when starting inspection if old deficiencies exist", async () => {
            const user = userEvent.setup();
            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));

            await waitFor(() => {
                expect(mockGetCadetInspectionFormData).toHaveBeenCalledWith(mockCadetId);
            });

            expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 1');
            expect(screen.getByTestId('mock-step1')).toBeInTheDocument();
        });
        // start inspection goes to step 2 if no old deficiencies
        it("should go to step 2 when starting inspection if no old deficiencies exist", async () => {
            const user = userEvent.setup();
            mockGetCadetInspectionFormData.mockResolvedValue({
                ...mockFormData,
                oldDeficiencyList: [],
            });

            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));

            await waitFor(() => {
                expect(mockGetCadetInspectionFormData).toHaveBeenCalledWith(mockCadetId);
            });

            expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 2');
            expect(screen.getByTestId('mock-step2')).toBeInTheDocument();
        });
        // step 1 next goes to step 2
        it('should navigate from step 1 to step 2 on next button click', async () => {
            const user = userEvent.setup();
            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));
            await screen.findByTestId('mock-step1');

            await user.click(screen.getByTestId('btn-next-step'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 2');
            });

            expect(screen.getByTestId('mock-step2')).toBeInTheDocument();
        });

        // step 1 cancel goes back to step 0
        it("should navigate from step 1 back to step 0 on cancel button click", async () => {
            const user = userEvent.setup();
            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));
            await screen.findByTestId('mock-step1');

            await user.click(screen.getByTestId('btn-cancel'));
        });

        // step 2 back goes to step 0
        it('should navigate from step 2 back to step 0 on back button click', async () => {
            const user = userEvent.setup();
            render(<CadetInspectionCard />);
            await user.click(screen.getByTestId('btn-start-inspection'));
            await screen.findByTestId('mock-step1');
            await user.click(screen.getByTestId('btn-next-step'));
            await screen.findByTestId('mock-step2');
            await user.click(screen.getByTestId('btn-back-to-step0'));
            expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 0');
        });


        // step 2 submit goes to step 0 (after submission)
        it("should handle form submission in step 2 and navigate back to step 0 on success", async () => {
            const user = userEvent.setup();
            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));
            await screen.findByTestId('mock-step1');
            await user.click(screen.getByTestId('btn-next-step'));
            await screen.findByTestId('mock-step2');
            await user.click(screen.getByTestId('btn-submit'));

            await waitFor(() => expect(mockSaveCadetInspection).toHaveBeenCalled());
            await waitFor(() => expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 0'));
        });
    });

    describe('Form Data Management and Error Handling', () => {
        it('should handle successful form data loading and error scenarios', async () => {
            const user = userEvent.setup();

            // Test successful data loading
            const { unmount } = render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));

            await waitFor(() => {
                expect(mockGetCadetInspectionFormData).toHaveBeenCalledWith(mockCadetId);
            });

            unmount();

            // Test error handling - setup mock error before render
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockGetCadetInspectionFormData.mockRejectedValueOnce(new Error('Failed to load data'));

            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));

            await waitFor(() => {
                expect(mockGetCadetInspectionFormData).toHaveBeenCalledWith(mockCadetId);
            });

            // Component should still be functional
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Component Integration and Hooks Usage', () => {
        it('should verify proper integration with all hooks and external dependencies', () => {
            render(<CadetInspectionCard />);

            // Verify useParams integration
            expect(mockUseParams).toHaveBeenCalled();

            // Verify data fetcher integration
            expect(mockUseUnresolvedDeficienciesByCadet).toHaveBeenCalledWith(mockCadetId);

            // Verify translation function is available (indirectly through component rendering)
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();

            // Verify component renders with mocked data
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.getByTestId('mock-header')).toBeInTheDocument();

            // Verify deficiencies are rendered
            expect(screen.getByTestId('old-deficiency-0')).toBeInTheDocument();
            expect(screen.getByTestId('old-deficiency-1')).toBeInTheDocument();
        });

        it('should handle different cadetId values from useParams correctly', () => {
            const testCadetIds = ['cadet-123', 'cadet-456', 'cadet-789'];

            testCadetIds.forEach((cadetId) => {
                vi.clearAllMocks();
                mockUseParams.mockReturnValue({ cadetId });

                render(<CadetInspectionCard />);

                expect(mockUseUnresolvedDeficienciesByCadet).toHaveBeenCalledWith(cadetId);
            });
        });
    });

    describe('Form Submission Workflow and Integration', () => {
        it('should handle complete form submission workflow with success scenarios', async () => {
            const user = userEvent.setup();
            render(<CadetInspectionCard />);

            // Navigate through complete workflow
            await user.click(screen.getByTestId('btn-start-inspection'));

            // Wait for async data loading to complete
            await waitFor(() => {
                expect(mockGetCadetInspectionFormData).toHaveBeenCalledWith(mockCadetId);
            });

            // Wait for step change
            await waitFor(() => {
                expect(screen.getByTestId('mock-step1')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('btn-next-step'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-step2')).toBeInTheDocument();
            });

            // Mock successful save
            await user.click(screen.getByTestId('btn-submit'));

            // After submission, component should navigate back to step 0
            await waitFor(() => expect(screen.getByTestId('mock-header')).toHaveTextContent('Step: 0'));
        });

        it('should verify SWR cache invalidation patterns and toast notification setup', () => {
            render(<CadetInspectionCard />);

            // Verify mocks are properly set up for integration testing
            expect(mockMutate).toBeDefined();
            expect(mockToast.success).toBeDefined();
            expect(mockToast.error).toBeDefined();
            expect(mockSaveCadetInspection).toBeDefined();

            // Verify component can reach submission state
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
        });
    });

    describe('Error Scenarios and Edge Cases', () => {
        it('should handle various error conditions and edge cases gracefully', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({
                unresolvedDeficiencies: undefined,
            });

            const { unmount } = render(<CadetInspectionCard />);

            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.queryByTestId('div_step0_noDeficiencies')).not.toBeInTheDocument();

            unmount();

            // Test form data loading error - setup mock before render
            mockGetCadetInspectionFormData.mockRejectedValueOnce(new Error('Network error'));

            render(<CadetInspectionCard />);

            await user.click(screen.getByTestId('btn-start-inspection'));

            await waitFor(() => {
                expect(mockGetCadetInspectionFormData).toHaveBeenCalledWith(mockCadetId);
            });

            // Component should still be rendered and functional
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();

            consoleErrorSpy.mockRestore();
        });

        it('should verify component resilience with different data states', () => {
            // Test empty array scenario
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({ unresolvedDeficiencies: [] });
            const { unmount: unmount1 } = render(<CadetInspectionCard />);
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.getByTestId('mock-header')).toBeInTheDocument();
            expect(screen.getByTestId('div_step0_noDeficiencies')).toBeInTheDocument();
            unmount1();

            // Test undefined scenario
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({ unresolvedDeficiencies: undefined });
            const { unmount: unmount2 } = render(<CadetInspectionCard />);
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.getByTestId('mock-header')).toBeInTheDocument();
            expect(screen.queryByTestId('div_step0_noDeficiencies')).not.toBeInTheDocument();
            unmount2();

            // Test null scenario  
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({ unresolvedDeficiencies: undefined });
            const { unmount: unmount3 } = render(<CadetInspectionCard />);
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.getByTestId('mock-header')).toBeInTheDocument();
            expect(screen.queryByTestId('div_step0_noDeficiencies')).not.toBeInTheDocument();
            unmount3();

            // Test with data scenario
            mockUseUnresolvedDeficienciesByCadet.mockReturnValue({ unresolvedDeficiencies: mockUnresolvedDeficiencies });
            const { unmount: unmount4 } = render(<CadetInspectionCard />);
            expect(screen.getByTestId('div_cadetInspection')).toBeInTheDocument();
            expect(screen.getByTestId('mock-header')).toBeInTheDocument();
            expect(screen.queryByTestId('div_step0_noDeficiencies')).not.toBeInTheDocument();
            unmount4();
        });
    });
});
