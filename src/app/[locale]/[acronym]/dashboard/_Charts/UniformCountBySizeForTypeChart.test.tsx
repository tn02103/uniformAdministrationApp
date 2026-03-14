import { UniformCountBySizeForTypeData } from '@/dal/charts/UniformCounts';
import { useI18n } from '@/lib/locales/client';
import { getByText, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import { UniformCountBySizeForTypeChart } from './UniformCountBySizeForTypeChart';

// Mock the i18n hook
vi.mock('@/lib/locales/client', () => ({
    useI18n: vi.fn()
}));

// Mock ExpandableDividerArea to control expansion behavior
vi.mock('@/components/ExpandableArea/ExpandableArea', () => ({
    ExpandableDividerArea: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="expandable-area">
            {children}
        </div>
    )
}));

vi.mock('recharts', () => {
    const exports = {
        Bar: vi.fn(),
        BarChart: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
        CartesianGrid: vi.fn(),
        ResponsiveContainer: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
        Tooltip: vi.fn(),
        XAxis: vi.fn(),
        YAxis: vi.fn()
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
    const mockTranslate = vi.fn();
    const mockBar = vi.mocked(Bar);

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
        vi.clearAllMocks();
        vi.mocked(useI18n).mockReturnValue(mockTranslate);

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

            expect(mockBar).toHaveBeenCalledTimes(4);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.available', hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.issued', hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.reserves', hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: 'quantities.issuedReserves', hide: false }), undefined);

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

            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", stackId: "active" }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", stackId: "active" }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", stackId: "reserve" }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", stackId: "reserve" }), undefined);
        });

        it('renders bars with correct names and colors', () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", name: translations['admin.dashboard.charts.available.short'], fill: '#4dacff' }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", name: translations['admin.dashboard.charts.issued.short'], fill: '#007be6' }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", name: translations['admin.dashboard.charts.reserves.short'], fill: '#fd9e4e' }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", name: translations['admin.dashboard.charts.issuedReserves.short'], fill: '#e46902' }), undefined);
        });
    });

    describe('Interactive Legend Functionality', () => {

        it('changes opacity of bars on hover', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);
            expect(mockBar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('hovered') }), undefined);
            expect(mockBar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('dimmed') }), undefined);

            const legend = screen.getByLabelText('legend');
            mockBar.mockClear();
            expect(mockBar).not.toHaveBeenCalled();
            await userEvent.hover(getByText(legend, translations['admin.dashboard.charts.available.long']));

            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('hovered') }), undefined);
            expect(mockBar).not.toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('dimmed') }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('dimmed') }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", className: expect.stringContaining('dimmed') }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", className: expect.stringContaining('dimmed') }), undefined);

            mockBar.mockClear();
            await userEvent.hover(getByText(legend, translations['admin.dashboard.charts.issued.long']));

            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('hovered') }), undefined);
            expect(mockBar).not.toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", className: expect.stringContaining('dimmed') }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", className: expect.stringContaining('dimmed') }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", className: expect.stringContaining('dimmed') }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", className: expect.stringContaining('dimmed') }), undefined);


            mockBar.mockClear();
            await userEvent.unhover(getByText(legend, translations['admin.dashboard.charts.issued.long']));

            expect(mockBar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('hovered') }), undefined);
            expect(mockBar).not.toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('dimmed') }), undefined);
        });

        it('toggles visibility on click', async () => {
            render(<UniformCountBySizeForTypeChart data={sampleData} />);

            const legend = screen.getByLabelText('legend');
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: false }), undefined);

            mockBar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.available.long']));

            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: true }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);

            mockBar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.issued.long']));

            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);

            mockBar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.available.long']));
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: true }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: true }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: true }), undefined);

            mockBar.mockClear();
            await userEvent.click(getByText(legend, translations['admin.dashboard.charts.issued.long']));
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.available", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issued", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.reserves", hide: false }), undefined);
            expect(mockBar).toHaveBeenCalledWith(expect.objectContaining({ dataKey: "quantities.issuedReserves", hide: false }), undefined);
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
