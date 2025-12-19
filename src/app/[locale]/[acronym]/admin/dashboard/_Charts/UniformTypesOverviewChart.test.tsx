import { UniformCountByTypeData } from '@/dal/charts/UniformCounts';
import { getByText, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniformTypesOverviewChart } from './UniformTypesOverviewChart';

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

jest.mock('recharts', () => {
    const exports = {
        Bar: jest.fn(),
        BarChart: jest.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
        CartesianGrid: jest.fn(),
        ResponsiveContainer: jest.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
        Tooltip: jest.fn(),
        XAxis: jest.fn(),
        YAxis: jest.fn()
    };
    return exports;
});

const translations: { [key: string]: string } = {
    'admin.dashboard.charts.available.long': 'Available (Active, Not Issued)',
    'admin.dashboard.charts.issued.long': 'Issued (Active, Currently Issued)',
    'admin.dashboard.charts.reserves.long': 'Reserves (Inactive, Not Issued)',
    'admin.dashboard.charts.issuedReserves.long': 'Issued Reserves (Inactive, Currently Issued)',
    'admin.dashboard.charts.missing.long': 'Missing (Lost or Damaged)',
    'admin.dashboard.charts.available.short': 'Available',
    'admin.dashboard.charts.issued.short': 'Issued',
    'admin.dashboard.charts.reserves.short': 'Reserves',
    'admin.dashboard.charts.issuedReserves.short': 'Issued Reserves',
    'admin.dashboard.charts.missing.short': 'Missing',
    'admin.dashboard.charts.count': 'Count',
    'admin.dashboard.charts.total': 'Total'
};

describe('UniformTypesOverviewChart', () => {
    const mockUseI18n = jest.requireMock('@/lib/locales/client').useI18n;
    const mockTranslate = jest.fn();
    const { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid } = jest.requireMock('recharts');

    // Realistic test data matching actual uniform type structure
    const sampleData: UniformCountByTypeData[] = [
        {
            name: 'Combat Jacket',
            id: 'type-1-uuid',
            quantities: {
                available: 45,
                issued: 32,
                reserves: 18,
                issuedReserves: 5,
                missing: 2
            },
            issuedReserveCadets: [
                { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' },
                { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' },
                { id: 'cadet-4', firstname: 'Alice', lastname: 'Johnson' },
                { id: 'cadet-5', firstname: 'Tom', lastname: 'Brown' }
            ],
            missingCadets: [
                { id: 'cadet-6', firstname: 'Sarah', lastname: 'Davis' },
                { id: 'cadet-7', firstname: 'Mike', lastname: 'Thompson' }
            ]
        },
        {
            name: 'Combat Trousers',
            id: 'type-2-uuid',
            quantities: {
                available: 38,
                issued: 28,
                reserves: 12,
                issuedReserves: 3,
                missing: 1
            },
            issuedReserveCadets: [
                { id: 'cadet-8', firstname: 'Lisa', lastname: 'Garcia' },
                { id: 'cadet-9', firstname: 'David', lastname: 'Martinez' },
                { id: 'cadet-10', firstname: 'Emma', lastname: 'Anderson' }
            ],
            missingCadets: [
                { id: 'cadet-11', firstname: 'James', lastname: 'Taylor' }
            ]
        },
        {
            name: 'Combat Boots',
            id: 'type-3-uuid',
            quantities: {
                available: 62,
                issued: 41,
                reserves: 25,
                issuedReserves: 7,
                missing: 3
            },
            issuedReserveCadets: [
                { id: 'cadet-12', firstname: 'Chris', lastname: 'Lee' },
                { id: 'cadet-13', firstname: 'Anna', lastname: 'White' },
                { id: 'cadet-14', firstname: 'Mark', lastname: 'Harris' },
                { id: 'cadet-15', firstname: 'Sophie', lastname: 'Clark' },
                { id: 'cadet-16', firstname: 'Ryan', lastname: 'Lewis' },
                { id: 'cadet-17', firstname: 'Grace', lastname: 'Walker' },
                { id: 'cadet-18', firstname: 'Ben', lastname: 'Hall' }
            ],
            missingCadets: [
                { id: 'cadet-19', firstname: 'Zoe', lastname: 'Young' },
                { id: 'cadet-20', firstname: 'Jake', lastname: 'King' },
                { id: 'cadet-21', firstname: 'Maya', lastname: 'Wright' }
            ]
        }
    ];

    const emptyData: UniformCountByTypeData[] = [];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseI18n.mockReturnValue(mockTranslate);

        // Setup translation mocks
        mockTranslate.mockImplementation((key: string) => {
            return translations[key] || key;
        });
    });

    describe('Recharts Integration', () => {
        it('displays correct chart structure', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            expect(BarChart).toHaveBeenCalled();
            expect(BarChart).toHaveBeenCalledWith(expect.objectContaining({ data: sampleData }), undefined);

            expect(Bar).toHaveBeenCalledTimes(5);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.available', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.issued', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.reserves', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.issuedReserves', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.missing', hide: false }), undefined);

            expect(XAxis).toHaveBeenCalledWith(expect.objectContaining({ 
                dataKey: 'name',
                angle: -45,
                textAnchor: 'end',
                height: 60
            }), undefined);
            expect(YAxis).toHaveBeenCalled();
            expect(Tooltip).toHaveBeenCalled();
            expect(CartesianGrid).toHaveBeenCalledWith(expect.objectContaining({ strokeDasharray: '3 3' }), undefined);

            // Check table headers
            expect(screen.getByText('Count')).toBeInTheDocument();
            expect(screen.getByText('Combat Jacket')).toBeInTheDocument();
            expect(screen.getByText('Combat Trousers')).toBeInTheDocument();
            expect(screen.getByText('Combat Boots')).toBeInTheDocument();
        });

        it('sorts bars into correct stacks', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", stackId: "active" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", stackId: "active" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", stackId: "reserves" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", stackId: "reserves" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", stackId: "missing" }), undefined);
        });

        it('renders bars with correct names and colors', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);
            
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ 
                dataKey: "quantities.available", 
                name: translations['admin.dashboard.charts.available.short'], 
                fill: '#4dacff' 
            }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ 
                dataKey: "quantities.issued", 
                name: translations['admin.dashboard.charts.issued.short'], 
                fill: '#007be6' 
            }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ 
                dataKey: "quantities.reserves", 
                name: translations['admin.dashboard.charts.reserves.short'], 
                fill: '#fd9e4e' 
            }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ 
                dataKey: "quantities.issuedReserves", 
                name: translations['admin.dashboard.charts.issuedReserves.short'], 
                fill: '#e46902' 
            }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ 
                dataKey: "quantities.missing", 
                name: translations['admin.dashboard.charts.missing.short'], 
                fill: '#b91c1c' 
            }), undefined);
        });
    });

    describe('Real Component Integration', () => {
        it('uses real CustomLegend component', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // CustomLegend should render with correct labels
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued (Active, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Reserves (Inactive, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves (Inactive, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Missing (Lost or Damaged)')).toBeInTheDocument();
        });

        it('uses real CustomChartTooltip component', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // Tooltip integration is tested by verifying the chart renders without error
            // CustomChartTooltip is passed as a component to Recharts
            expect(Tooltip).toHaveBeenCalledWith(expect.objectContaining({
                content: expect.any(Object)
            }), undefined);
        });
    });

    describe('Interactive Legend Functionality', () => {
        it('changes opacity of bars on hover', async () => {
            render(<UniformTypesOverviewChart data={sampleData} />);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('hovered') }), undefined);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('dimmed') }), undefined);

            const legend = screen.getByLabelText('legend');
            Bar.mockClear();
            expect(Bar).not.toHaveBeenCalled();
            await userEvent.hover(getByText(legend, translations['admin.dashboard.charts.available.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('hovered') }), undefined);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", className: expect.stringContaining('dimmed') }), undefined);

            Bar.mockClear();
            await userEvent.hover(getByText(legend, translations['admin.dashboard.charts.missing.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", className: expect.stringContaining('hovered') }), undefined);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", className: expect.stringContaining('dimmed') }), undefined);

            Bar.mockClear();
            await userEvent.unhover(getByText(legend, translations['admin.dashboard.charts.missing.long']));

            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('hovered') }), undefined);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('dimmed') }), undefined);
        });

        it('toggles visibility on click', async () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            const legend = screen.getByLabelText('legend');
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", hide: false }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.available.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", hide: true }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.missing.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", hide: false }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.available.long']));
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", hide: false }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.missing.long']));
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.missing", hide: false }), undefined);
        });

        it('initial legend state shows all quantities', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // All legend items should be visible initially
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued (Active, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Reserves (Inactive, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves (Inactive, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Missing (Lost or Damaged)')).toBeInTheDocument();
        });

        it('legend state changes persist across interactions', async () => {
            render(<UniformTypesOverviewChart data={sampleData} />);
            const user = userEvent.setup();

            const availableLegendItem = screen.getByText('Available (Active, Not Issued)');
            const missingLegendItem = screen.getByText('Missing (Lost or Damaged)');

            // Perform multiple clicks
            await user.click(availableLegendItem);
            await user.click(missingLegendItem);

            // Legend should still be responsive
            expect(availableLegendItem).toBeInTheDocument();
            expect(missingLegendItem).toBeInTheDocument();
        });
    });

    describe('Data Transformation & Display', () => {
        it('chart displays all quantity types correctly', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // Legend should display all quantity types
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued (Active, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Reserves (Inactive, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves (Inactive, Currently Issued)')).toBeInTheDocument();
            expect(screen.getByText('Missing (Lost or Damaged)')).toBeInTheDocument();
        });

        it('table displays all data correctly', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // Check specific unique data values in table
            expect(screen.getByText('45')).toBeInTheDocument(); // Combat Jacket - Available (unique)
            expect(screen.getByText('38')).toBeInTheDocument(); // Combat Trousers - Available (unique) 
            expect(screen.getByText('62')).toBeInTheDocument(); // Combat Boots - Available (unique)
            expect(screen.getByText('102')).toBeInTheDocument(); // Combat Jacket - Total (45+32+18+5+2)
            expect(screen.getByText('82')).toBeInTheDocument(); // Combat Trousers - Total (38+28+12+3+1)
            expect(screen.getByText('138')).toBeInTheDocument(); // Combat Boots - Total (62+41+25+7+3)

            // Check all category row labels
            expect(screen.getByText('Available')).toBeInTheDocument();
            expect(screen.getByText('Issued')).toBeInTheDocument();
            expect(screen.getByText('Reserves')).toBeInTheDocument();
            expect(screen.getByText('Issued Reserves')).toBeInTheDocument();
            expect(screen.getByText('Missing')).toBeInTheDocument();
            expect(screen.getByText('Total')).toBeInTheDocument();
        });

        it('handles empty data gracefully', () => {
            render(<UniformTypesOverviewChart data={emptyData} />);

            // Should render without crashing
            expect(screen.getByText('Count')).toBeInTheDocument();
            
            // Legend should still be present with no data
            expect(screen.getByText('Available (Active, Not Issued)')).toBeInTheDocument();
            expect(screen.getByText('Missing (Lost or Damaged)')).toBeInTheDocument();
        });
    });

    describe('Component Integration', () => {
        it('translation integration works', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // Verify translation calls were made
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.available.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.issued.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.reserves.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.issuedReserves.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.missing.long');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.count');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.total');
        });

        it('responsive container maintains chart sizing', () => {
            const { container } = render(<UniformTypesOverviewChart data={sampleData} />);

            // Check chart container has correct styling
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const chartDiv = container.querySelector('div[style*="height: 500px"]');
            expect(chartDiv).toBeInTheDocument();
        });
    });

    describe('ExpandableArea & Tooltip Integration', () => {
        it('table is visible when expandable area is extended', () => {
            render(<UniformTypesOverviewChart data={sampleData} />);

            // Table should be visible within the expandable area
            expect(screen.getByTestId('expandable-area')).toBeInTheDocument();
            
            const insideExpandableArea = screen.getByTestId('expandable-area');
            expect(getByText(insideExpandableArea, 'Count')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'Combat Jacket')).toBeInTheDocument();
        });
    });

    describe('Edge Cases & Error Handling', () => {
        it('handles malformed data without crashing - missing quantities', () => {
            const malformedData = [
                {
                    name: 'Test Type',
                    id: 'test-id',
                    quantities: {
                        available: 10
                        // Missing other quantities
                    },
                    issuedReserveCadets: [],
                    missingCadets: []
                }
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render(<UniformTypesOverviewChart data={malformedData as any} />);

            // Should not crash
            expect(screen.getByText('Count')).toBeInTheDocument();
        });

        it('handles data with empty cadet arrays', () => {
            const dataWithEmptyArrays = [
                {
                    name: 'Test Type',
                    id: 'test-id',
                    quantities: {
                        available: 10,
                        issued: 5,
                        reserves: 3,
                        issuedReserves: 2,
                        missing: 1
                    },
                    issuedReserveCadets: [],
                    missingCadets: []
                }
            ];

            render(<UniformTypesOverviewChart data={dataWithEmptyArrays} />);

            // Should not crash and display the data
            expect(screen.getByText('Test Type')).toBeInTheDocument();
        });
    });
});