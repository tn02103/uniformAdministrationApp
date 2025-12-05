import { UniformCountBySizeForTypeData } from '@/dal/charts/UniformCounts';
import { getByText, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniformCountBySizeForTypeChart } from './UniformCountBySizeForTypeChart';

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
    }
    return exports;
})

const translations: { [key: string]: string } = {
    'admin.dashboard.charts.available.long': 'Available (Active, Not Issued)',
    'admin.dashboard.charts.issued.long': 'Issued (Active, Currently Issued)',
    'admin.dashboard.charts.reserves.long': 'Reserves (Inactive, Not Issued)',
    'admin.dashboard.charts.issuedReserves.long': 'Issued Reserves (Inactive, Currently Issued)',
    'admin.dashboard.charts.available.short': 'Available',
    'admin.dashboard.charts.issued.short': 'Issued',
    'admin.dashboard.charts.reserves.short': 'Reserves',
    'admin.dashboard.charts.issuedReserves.short': 'Issued Reserves',
    'admin.dashboard.charts.count': 'Count',
    'admin.dashboard.charts.total': 'Total'
};

describe('UniformCountBySizeForTypeChart', () => {
    const mockUseI18n = jest.requireMock('@/lib/locales/client').useI18n;
    const mockTranslate = jest.fn();
    const { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid } = jest.requireMock('recharts');

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

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseI18n.mockReturnValue(mockTranslate);

        // Setup translation mocks
        mockTranslate.mockImplementation((key: string) => {

            return translations[key] || key;
        });
    });

    describe('rechart integration', () => {
        it('displays correct chart structure', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);

            expect(BarChart).toHaveBeenCalled();
            expect(BarChart).toHaveBeenCalledWith(expect.objectContaining({ data: sampleData }), undefined);

            expect(Bar).toHaveBeenCalledTimes(4);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.available', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.issued', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.reserves', hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.issuedReserves', hide: false }), undefined);

            expect(XAxis).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'size' }), undefined);
            expect(YAxis).toHaveBeenCalled();
            expect(Tooltip).toHaveBeenCalled();
            expect(CartesianGrid).toHaveBeenCalledWith(expect.objectContaining({ strokeDasharray: '3 3' }), undefined);

            // Check table headers
            expect(screen.getByText('Count')).toBeInTheDocument();
            expect(screen.getByText('S')).toBeInTheDocument();
            expect(screen.getByText('M')).toBeInTheDocument();
            expect(screen.getByText('L')).toBeInTheDocument();
            expect(screen.getByText('XL')).toBeInTheDocument();
        });

        it('sorts bars into correct stacks', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", stackId: "active" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", stackId: "active" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", stackId: "reserve" }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", stackId: "reserve" }), undefined);
        });

        it('renders bars with correct names and colors', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", name: translations['admin.dashboard.charts.available.short'], fill: '#4dacff' }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", name: translations['admin.dashboard.charts.issued.short'], fill: '#007be6' }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", name: translations['admin.dashboard.charts.reserves.short'], fill: '#fd9e4e' }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", name: translations['admin.dashboard.charts.issuedReserves.short'], fill: '#e46902' }), undefined);
        });
    });

    describe('Interactive Legend Functionality', () => {

        it('changes opacity of bars on hover', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
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

            Bar.mockClear();
            await userEvent.hover(getByText(legend, translations['admin.dashboard.charts.issued.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('hovered') }), undefined);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", className: expect.stringContaining('dimmed') }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", className: expect.stringContaining('dimmed') }), undefined);


            Bar.mockClear();
            await userEvent.unhover(getByText(legend, translations['admin.dashboard.charts.issued.long']));

            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('hovered') }), undefined);
            expect(Bar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('dimmed') }), undefined);
        });

        it('toggles visibility on click', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);

            const legend = screen.getByLabelText('legend');
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: false }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.available.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.issued.long']));

            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.available.long']));
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);

            Bar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.issued.long']));
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: false }), undefined);
            expect(Bar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: false }), undefined);
        });
    });

    describe('Data Display', () => {
        it('renders data table with correct structure', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            const insideExpandableArea = screen.getByTestId('expandable-area');

            // Check legend headers
            expect(getByText(insideExpandableArea, 'Count')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'S')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'M')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'L')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'XL')).toBeInTheDocument();

            expect(getByText(insideExpandableArea, 'Available')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'Issued')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'Reserves')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'Issued Reserves')).toBeInTheDocument();
            expect(getByText(insideExpandableArea, 'Total')).toBeInTheDocument();
        });
    });
});
