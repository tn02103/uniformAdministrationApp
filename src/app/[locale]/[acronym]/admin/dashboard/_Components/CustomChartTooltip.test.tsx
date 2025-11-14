import { render, screen } from '@testing-library/react';
import { CustomChartTooltip } from './CustomChartTooltip';

// Mock the i18n hook
jest.mock('@/lib/locales/client', () => ({
    useI18n: jest.fn()
}));

describe('CustomChartTooltip', () => {
    const mockUseI18n = jest.requireMock('@/lib/locales/client').useI18n;
    const mockTranslate = jest.fn();

    // Realistic test data that mirrors actual chart payload structure
    const samplePayload = [
        { dataKey: 'uniform.available', value: 45, color: '#16a34a' },
        { dataKey: 'uniform.issued', value: 23, color: '#475569' },
        { dataKey: 'uniform.reserves', value: 12, color: '#d97706' },
        { dataKey: 'uniform.issuedReserves', value: 8, color: '#b91c1c' }
    ];

    const sampleLabel = 'Uniform Type A';

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseI18n.mockReturnValue(mockTranslate);
        
        // Setup default translation mock behavior
        mockTranslate.mockImplementation((key: string) => {
            const translations: { [key: string]: string } = {
                'admin.dashboard.charts.available.short': 'Verfügbar',
                'admin.dashboard.charts.issued.short': 'Ausgegeben',
                'admin.dashboard.charts.reserves.short': 'Reserven',
                'admin.dashboard.charts.issuedReserves.short': 'Ausgegebene Reserven',
                'admin.dashboard.charts.missing.short': 'Fehlend'
            };
            return translations[key] || key;
        });
    });

    // Group 1: Rendering Tests
    describe('Rendering Tests', () => {
        describe('Basic Rendering', () => {
            it('returns null when active is false', () => {
                const { container } = render(
                    <CustomChartTooltip 
                        active={false}
                        payload={samplePayload}
                        label={sampleLabel}
                    />
                );
                
                // eslint-disable-next-line testing-library/no-node-access
                expect(container.firstChild).toBeNull();
            });

            it('returns null when payload is undefined', () => {
                const { container } = render(
                    <CustomChartTooltip 
                        active={true}
                        payload={undefined}
                        label={sampleLabel}
                    />
                );
                
                // eslint-disable-next-line testing-library/no-node-access
                expect(container.firstChild).toBeNull();
            });

            it('returns null when payload is empty array', () => {
                const { container } = render(
                    <CustomChartTooltip 
                        active={true}
                        payload={[]}
                        label={sampleLabel}
                    />
                );
                
                // eslint-disable-next-line testing-library/no-node-access
                expect(container.firstChild).toBeNull();
            });

            it('renders tooltip content when active with payload', () => {
                render(
                    <CustomChartTooltip 
                        active={true}
                        payload={samplePayload}
                        label={sampleLabel}
                    />
                );
                
                expect(screen.getByText(sampleLabel)).toBeInTheDocument();
                expect(screen.getByText('Verfügbar: 45')).toBeInTheDocument();
                expect(screen.getByText('Ausgegeben: 23')).toBeInTheDocument();
            });

            it('displays label correctly', () => {
                const customLabel = 'Custom Uniform Category';
                render(
                    <CustomChartTooltip 
                        active={true}
                        payload={samplePayload}
                        label={customLabel}
                    />
                );
                
                expect(screen.getByText(customLabel)).toBeInTheDocument();
            });

            it('renders all payload entries', () => {
                render(
                    <CustomChartTooltip 
                        active={true}
                        payload={samplePayload}
                        label={sampleLabel}
                    />
                );
                
                // Check all entries are rendered
                expect(screen.getByText('Verfügbar: 45')).toBeInTheDocument();
                expect(screen.getByText('Ausgegeben: 23')).toBeInTheDocument();
                expect(screen.getByText('Reserven: 12')).toBeInTheDocument();
                expect(screen.getByText('Ausgegebene Reserven: 8')).toBeInTheDocument();
            });

            it('applies correct CSS classes', () => {
                const { container } = render(
                    <CustomChartTooltip 
                        active={true}
                        payload={samplePayload}
                        label={sampleLabel}
                    />
                );
                
                // eslint-disable-next-line testing-library/no-node-access
                const tooltipContainer = container.firstChild as HTMLElement;
                expect(tooltipContainer).toHaveClass('bg-white', 'p-2', 'border', 'border-gray-300', 'rounded', 'shadow-lg');
                
                // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
                const labelElement = container.querySelector('.font-semibold.mb-1');
                expect(labelElement).toBeInTheDocument();
                
                // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
                const entryElements = container.querySelectorAll('.mb-0.text-sm');
                expect(entryElements).toHaveLength(4);
            });
        });
    });

    // Group 2: Translation & Data Processing Tests  
    describe('Translation & Data Processing Tests', () => {
        it('calls translation function with correct keys', () => {
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={samplePayload}
                    label={sampleLabel}
                />
            );
            
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.available.short');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.issued.short');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.reserves.short');
            expect(mockTranslate).toHaveBeenCalledWith('admin.dashboard.charts.issuedReserves.short');
        });

        it('handles malformed dataKey gracefully', () => {
            const malformedPayload = [
                { dataKey: 'invalidkey', value: 10, color: '#16a34a' },
                { dataKey: 'no.dots.here.too.many', value: 5, color: '#475569' }
            ];
            
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={malformedPayload}
                    label={sampleLabel}
                />
            );
            
            // Should not crash and still render
            expect(screen.getByText(sampleLabel)).toBeInTheDocument();
        });

        it('processes payload in reversed order', () => {
            const orderedPayload = [
                { dataKey: 'uniform.first', value: 1, color: '#16a34a' },
                { dataKey: 'uniform.second', value: 2, color: '#475569' },
                { dataKey: 'uniform.third', value: 3, color: '#d97706' }
            ];
            
            // Mock translation to return just the quantity key for easier testing
            mockTranslate.mockImplementation((key: string) => {
                const match = key.match(/admin\.dashboard\.charts\.(\w+)\.short/);
                return match ? match[1] : key;
            });
            
            const { container } = render(
                <CustomChartTooltip 
                    active={true}
                    payload={orderedPayload}
                    label={sampleLabel}
                />
            );
            
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const entries = container.querySelectorAll('.mb-0.text-sm');
            
            // Should be reversed: third, second, first
            expect(entries[0]).toHaveTextContent('third: 3');
            expect(entries[1]).toHaveTextContent('second: 2');
            expect(entries[2]).toHaveTextContent('first: 1');
        });

        it('handles missing translation keys', () => {
            mockTranslate.mockImplementation((key: string) => `[missing: ${key}]`);
            
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={[{ dataKey: 'uniform.unknown', value: 42, color: '#16a34a' }]}
                    label={sampleLabel}
                />
            );
            
            expect(screen.getByText('[missing: admin.dashboard.charts.unknown.short]: 42')).toBeInTheDocument();
        });

        it('displays correct numeric values', () => {
            const numericTestPayload = [
                { dataKey: 'uniform.available', value: 0, color: '#16a34a' },
                { dataKey: 'uniform.issued', value: 999, color: '#475569' },
                { dataKey: 'uniform.reserves', value: 1.5, color: '#d97706' }
            ];
            
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={numericTestPayload}
                    label={sampleLabel}
                />
            );
            
            expect(screen.getByText('Verfügbar: 0')).toBeInTheDocument();
            expect(screen.getByText('Ausgegeben: 999')).toBeInTheDocument();
            expect(screen.getByText('Reserven: 1.5')).toBeInTheDocument();
        });

        it('applies correct colors to entries', () => {
            const colorTestPayload = [
                { dataKey: 'uniform.available', value: 10, color: '#ff0000' },
                { dataKey: 'uniform.issued', value: 20, color: 'rgb(0, 255, 0)' }
            ];
            
            const { container } = render(
                <CustomChartTooltip 
                    active={true}
                    payload={colorTestPayload}
                    label={sampleLabel}
                />
            );
            
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const entryElements = container.querySelectorAll('.mb-0.text-sm');
            
            expect(entryElements[0]).toHaveStyle('color: rgb(0, 255, 0)'); // Reversed order
            expect(entryElements[1]).toHaveStyle('color: #ff0000');
        });
    });

    // Group 3: Edge Cases & Error Handling Tests
    describe('Edge Cases & Error Handling Tests', () => {
        it('handles empty label', () => {
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={samplePayload}
                    label=""
                />
            );
            
            // Should still render tooltip but with empty label
            expect(screen.getByText('Verfügbar: 45')).toBeInTheDocument();
        });

        it('handles undefined label', () => {
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={samplePayload}
                    label={undefined}
                />
            );
            
            // Should still render tooltip entries
            expect(screen.getByText('Verfügbar: 45')).toBeInTheDocument();
        });

        it('handles very long labels and values', () => {
            const longLabel = 'This is a very long label that might cause layout issues in the tooltip component and should be handled gracefully';
            const longValuePayload = [
                { dataKey: 'uniform.available', value: 123456789, color: '#16a34a' }
            ];
            
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={longValuePayload}
                    label={longLabel}
                />
            );
            
            expect(screen.getByText(longLabel)).toBeInTheDocument();
            expect(screen.getByText('Verfügbar: 123456789')).toBeInTheDocument();
        });

        it('handles undefined colors', () => {
            const noColorPayload = [
                { dataKey: 'uniform.available', value: 10, color: '' },
                { dataKey: 'uniform.issued', value: 20, color: 'transparent' }
            ];
            
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={noColorPayload}
                    label={sampleLabel}
                />
            );
            
            // Should not crash and still render content
            expect(screen.getByText('Verfügbar: 10')).toBeInTheDocument();
            expect(screen.getByText('Ausgegeben: 20')).toBeInTheDocument();
        });

        it('handles large payload arrays', () => {
            const largePayload = Array.from({ length: 20 }, (_, i) => ({
                dataKey: `uniform.type${i}`,
                value: i * 10,
                color: `#${i.toString(16).padStart(6, '0')}`
            }));
            
            // Mock to return a consistent translation pattern
            mockTranslate.mockImplementation((key: string) => {
                const match = key.match(/admin\.dashboard\.charts\.(\w+)\.short/);
                return match ? match[1] : 'short';
            });
            
            render(
                <CustomChartTooltip 
                    active={true}
                    payload={largePayload}
                    label={sampleLabel}
                />
            );
            
            // Should render all entries (check for presence of values, not specific text)
            expect(screen.getByText(/: 0$/)).toBeInTheDocument();
            expect(screen.getByText(/: 190$/)).toBeInTheDocument();
        });
    });

    // Group 4: Component Behavior Tests
    describe('Component Behavior Tests', () => {
        it('re-renders correctly when props change', () => {
            const { rerender } = render(
                <CustomChartTooltip 
                    active={true}
                    payload={[{ dataKey: 'uniform.available', value: 10, color: '#16a34a' }]}
                    label="Original Label"
                />
            );
            
            expect(screen.getByText('Original Label')).toBeInTheDocument();
            expect(screen.getByText('Verfügbar: 10')).toBeInTheDocument();
            
            // Re-render with different props
            rerender(
                <CustomChartTooltip 
                    active={true}
                    payload={[{ dataKey: 'uniform.issued', value: 20, color: '#475569' }]}
                    label="Updated Label"
                />
            );
            
            expect(screen.getByText('Updated Label')).toBeInTheDocument();
            expect(screen.getByText('Ausgegeben: 20')).toBeInTheDocument();
            expect(screen.queryByText('Original Label')).not.toBeInTheDocument();
            expect(screen.queryByText('Verfügbar: 10')).not.toBeInTheDocument();
        });

        it('handles prop changes from active to inactive', () => {
            const { rerender, container } = render(
                <CustomChartTooltip 
                    active={true}
                    payload={samplePayload}
                    label={sampleLabel}
                />
            );
            
            expect(screen.getByText(sampleLabel)).toBeInTheDocument();
            
            // Re-render as inactive
            rerender(
                <CustomChartTooltip 
                    active={false}
                    payload={samplePayload}
                    label={sampleLabel}
                />
            );
            
            // eslint-disable-next-line testing-library/no-node-access
            expect(container.firstChild).toBeNull();
        });
    });
});