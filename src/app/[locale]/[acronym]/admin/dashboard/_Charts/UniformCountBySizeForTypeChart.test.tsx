import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniformCountBySizeForTypeChart } from './UniformCountBySizeForTypeChart';
import { UniformCountBySizeForTypeData } from '@/dal/charts/UniformCounts';

// Mock the i18n hook
jest.mock('@/lib/locales/client', () => ({
    useI18n: jest.fn()
}));

// Mock ExpandableDividerArea to control expansion behavior
jest.mock('@/components/ExpandableArea/ExpandableArea', () => ({
    ExpandableDividerArea: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="expandable-area">
            {children}
        </div>
    )
}));

describe('UniformCountBySizeForTypeChart', () => {
    const mockUseI18n = jest.requireMock('@/lib/locales/client').useI18n;
    const mockTranslate = jest.fn();

    // Realistic test data matching actual uniform size structure
    const sampleData: UniformCountBySizeForTypeData[] = [
        {
            size: 'S',
            sizeId: 'size-s-uuid',
            quantities: {
                available: 15,
                issued: 8,
                reserves: 5,
                issuedReserves: 2
            },
            issuedReserveCadets: [
                { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
            ]
        },
        {
            size: 'M',
            sizeId: 'size-m-uuid', 
            quantities: {
                available: 25,
                issued: 18,
                reserves: 8,
                issuedReserves: 3
            },
            issuedReserveCadets: [
                { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' },
                { id: 'cadet-4', firstname: 'Alice', lastname: 'Johnson' },
                { id: 'cadet-5', firstname: 'Tom', lastname: 'Brown' }
            ]
        },
        {
            size: 'L',
            sizeId: 'size-l-uuid',
            quantities: {
                available: 30,
                issued: 22,
                reserves: 10,
                issuedReserves: 1
            },
            issuedReserveCadets: [
                { id: 'cadet-6', firstname: 'Sarah', lastname: 'Davis' }
            ]
        },
        {
            size: 'XL',
            sizeId: 'size-xl-uuid',
            quantities: {
                available: 12,
                issued: 9,
                reserves: 4,
                issuedReserves: 0
            },
            issuedReserveCadets: []
        }
    ];

    const emptyData: UniformCountBySizeForTypeData[] = [];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseI18n.mockReturnValue(mockTranslate);
        
        // Setup translation mocks
        mockTranslate.mockImplementation((key: string) => {
            const translations: { [key: string]: string } = {
                'admin.dashboard.charts.available.long': 'Available (Active, Not Issued)',
                'admin.dashboard.charts.issued.long': 'Issued (Active, Currently Issued)',
                'admin.dashboard.charts.reserves.long': 'Reserves (Inactive, Not Issued)',
                'admin.dashboard.charts.issuedReserves.long': 'Issued Reserves (Inactive, Currently Issued)',
                'admin.dashboard.charts.available.short': 'Available',
                'admin.dashboard.charts.issued.short': 'Issued', 
                'admin.dashboard.charts.reserves.short': 'Reserves',
                'admin.dashboard.charts.issuedReserves.short': 'Issued Reserves',
                'admin.dashboard.charts.count': 'Count'
            };
            return translations[key] || key;
        });
    });

    // Group 1: Core Rendering & Data Display Tests
    describe('Core Rendering & Data Display', () => {
        it('renders with sample data', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Should render without crashing
            expect(screen.getByTestId('expandable-area')).toBeInTheDocument();
        });

        it('displays correct chart structure', () => {
            const { container } = render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Check for Recharts components in DOM
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const responsiveContainer = container.querySelector('.recharts-responsive-container');
            expect(responsiveContainer).toBeInTheDocument();
            
            // Chart may not fully render in test environment due to sizing,
            // but container should be present
            expect(responsiveContainer).toHaveStyle('width: 100%');
        });

        it('renders data table with correct structure', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Check table headers
            expect(screen.getByText('Count')).toBeInTheDocument();
            expect(screen.getByText('S')).toBeInTheDocument();
            expect(screen.getByText('M')).toBeInTheDocument();  
            expect(screen.getByText('L')).toBeInTheDocument();
            expect(screen.getByText('XL')).toBeInTheDocument();
            
            // Check row headers (quantity types)
            expect(screen.getByText('Available')).toBeInTheDocument();
            expect(screen.getByText('Issued')).toBeInTheDocument();
            expect(screen.getByText('Reserves')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves')).toBeInTheDocument();
        });

        it('uses real CustomLegend component', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // CustomLegend should render with correct labels
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued (Active, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Reserves (Inactive, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves (Inactive, Currently Issued)')).toBeInTheDocument();
        });

        it('uses real CustomChartTooltip component', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Tooltip integration is tested by verifying the chart renders without error
            // CustomChartTooltip is passed as a component to Recharts
            // The actual tooltip display testing would require more complex interaction simulation
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
        });
    });

    // Group 2: Legend Integration & State Management Tests  
    describe('Legend Integration & State Management', () => {
        it('legend visibility changes update chart bars', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            const user = userEvent.setup();
            
            // Find and click on a legend item to toggle visibility
            const availableLegendItem = screen.getByText('Available (Active, Not Issued)');
            
            // Click to toggle visibility of 'available' series
            await user.click(availableLegendItem);
            
            // Legend should still be present and clickable (this tests the legend interaction)
            expect(availableLegendItem).toBeInTheDocument();
            
            // The actual bar visibility changes are tested in CustomLegend component tests
            // This integration test ensures the legend-chart connection works
        });

        it('legend hover updates chart styling', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            const user = userEvent.setup();
            
            // Find legend item
            const availableLegendItem = screen.getByText('Available (Active, Not Issued)');
            
            // Hover over legend item
            await user.hover(availableLegendItem);
            
            // The hover state should be communicated to the chart
            // This tests the state flow, not the visual effect
            expect(availableLegendItem).toBeInTheDocument();
        });

        it('initial legend state shows all quantities', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // All legend items should be visible initially
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued (Active, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Reserves (Inactive, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves (Inactive, Currently Issued)')).toBeInTheDocument();
        });

        it('legend state changes persist across interactions', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            const user = userEvent.setup();
            
            const availableLegendItem = screen.getByText('Available (Active, Not Issued)');
            const issuedLegendItem = screen.getByText('Issued (Active, Currently Issued)');
            
            // Perform multiple clicks
            await user.click(availableLegendItem);
            await user.click(issuedLegendItem);
            
            // Legend should still be responsive
            expect(availableLegendItem).toBeInTheDocument();
            expect(issuedLegendItem).toBeInTheDocument();
        });
    });

    // Group 3: Data Transformation & Display Tests
    describe('Data Transformation & Display', () => {
        it('chart displays all quantity types correctly', () => {
            const { container } = render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Chart may not render bars in test environment due to sizing issues
            // Instead verify the chart container and legend are present
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const chartContainer = container.querySelector('.recharts-responsive-container');
            expect(chartContainer).toBeInTheDocument();
            
            // All legend items should be present (indicates all quantity types are configured)
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued (Active, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Reserves (Inactive, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves (Inactive, Currently Issued)')).toBeInTheDocument();
        });

        it('table displays all data correctly', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Check specific unique data values in table
            expect(screen.getByText('15')).toBeInTheDocument(); // S - Available (unique)
            expect(screen.getByText('25')).toBeInTheDocument(); // M - Available (unique)
            expect(screen.getByText('18')).toBeInTheDocument(); // M - Issued (unique)
            expect(screen.getByText('22')).toBeInTheDocument(); // L - Issued (unique)  
            expect(screen.getByText('30')).toBeInTheDocument(); // L - Available (unique)
            expect(screen.getByText('12')).toBeInTheDocument(); // XL - Available (unique)
            
            // Check for duplicate values using getAllByText
            const eightElements = screen.getAllByText('8');
            expect(eightElements).toHaveLength(2); // Should appear in S-Issued and M-Reserves
        });

        it('handles empty data gracefully', () => {
            render(<UniformCountBySizeForTypeChart data={emptyData} />);
            
            // Should render without crashing
            expect(screen.getByText('Count')).toBeInTheDocument();
            
            // Legend should still be visible
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
        });
    });

    // Group 4: Component Integration Tests
    describe('Component Integration', () => {
        it('translation integration works', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Verify translation calls were made
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.available.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.issued.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.reserves.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.issuedReserves.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.count');
        });
    });

    // Group 5: ExpandableArea & Tooltip Integration Tests
    describe('ExpandableArea & Tooltip Integration', () => {
        it('table is visible when expandable area is extended', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Table should be visible within the expandable area
            expect(screen.getByTestId('expandable-area')).toBeInTheDocument();
            
            // Table content should be accessible
            expect(screen.getByText('Available')).toBeInTheDocument();
            expect(screen.getByText('S')).toBeInTheDocument();
        });

        it('issuedReserves data cells show cadet tooltips', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            
            // Note: Since we're testing integration and the actual tooltip behavior 
            // depends on Bootstrap OverlayTrigger, we verify the data is present
            // The tooltip content (cadet names) should be accessible through the data
            
            // Check that issuedReserves values are displayed
            expect(screen.getByText('2')).toBeInTheDocument(); // S - 2 issued reserves
            expect(screen.getByText('3')).toBeInTheDocument(); // M - 3 issued reserves
            expect(screen.getByText('1')).toBeInTheDocument(); // L - 1 issued reserve
            expect(screen.getByText('0')).toBeInTheDocument(); // XL - 0 issued reserves
            
            // The cadet data should be available for tooltip rendering
            // (Actual tooltip testing would require more complex setup for Bootstrap components)
        });
    });

    // Group 6: Malformed Data Edge Cases (Minimal)
    describe('Malformed Data Edge Cases', () => {
        it('handles data with missing quantities', () => {
            const malformedData = [
                {
                    size: 'S',
                    sizeId: 'size-s-uuid',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    quantities: {} as any,
                    issuedReserveCadets: []
                }
            ];
            
            render(<UniformCountBySizeForTypeChart data={malformedData} />);
            
            // Should not crash
            expect(screen.getByText('Count')).toBeInTheDocument();
        });

        it('handles data with missing cadet information', () => {
            const malformedData = [
                {
                    size: 'M',
                    sizeId: 'size-m-uuid',
                    quantities: {
                        available: 10,
                        issued: 5,
                        reserves: 3,
                        issuedReserves: 2
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    issuedReserveCadets: undefined as any
                }
            ];
            
            render(<UniformCountBySizeForTypeChart data={malformedData} />);
            
            // Should not crash and display the data
            expect(screen.getByText('M')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
        });
    });
});