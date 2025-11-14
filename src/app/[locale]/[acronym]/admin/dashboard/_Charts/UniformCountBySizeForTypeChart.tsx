"use client"

import { ExpandableDividerArea } from '@/components/ExpandableArea/ExpandableArea';
import { UniformCountBySizeForTypeData } from '@/dal/charts/UniformCounts';
import { useI18n } from '@/lib/locales/client';
import React, { useState } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomChartTooltip } from '../_Components/CustomChartTooltip';
import { CustomLegend, LegendItem } from '../_Components/CustomLegend';

type UniformTypeChartProps = {
    data: UniformCountBySizeForTypeData[];
}

export const UniformCountBySizeForTypeChart = ({ data }: UniformTypeChartProps) => {
    const t = useI18n();
    const quantities = React.useMemo(() => 
        ["available", "issued", "reserves", "issuedReserves"] as const,
        []
    );
    
    // State for interactive legend
    const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(quantities));
    const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
    
    // Legend items configuration
    const legendItems: LegendItem[] = [
        { key: 'available', color: '#16a34a', label: t('admin.dashboard.charts.available.long') },
        { key: 'issued', color: '#475569', label: t('admin.dashboard.charts.issued.long') },
        { key: 'reserves', color: '#d97706', label: t('admin.dashboard.charts.reserves.long') },
        { key: 'issuedReserves', color: '#b91c1c', label: t('admin.dashboard.charts.issuedReserves.long') }
    ];
    
    return (
        <div>
            <div style={{ width: '100%', height: '400px', marginTop: '2px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="size"
                            angle={-45}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis />
                        <Tooltip content={<CustomChartTooltip />} />

                        {/* Always render bars in consistent order - Available first */}
                        <Bar
                            dataKey="quantities.available"
                            stackId="uniform"
                            fill="#16a34a"
                            name={t('admin.dashboard.charts.available.long')}
                            hide={!visibleSeries.has('available')}
                        />

                        {/* Issued - Professional slate blue */}
                        <Bar
                            dataKey="quantities.issued"
                            stackId="uniform"
                            fill="#475569"
                            name={t('admin.dashboard.charts.issued.long')}
                            hide={!visibleSeries.has('issued')}
                        />

                        {/* Reserves - Muted amber/orange */}
                        <Bar
                            dataKey="quantities.reserves"
                            stackId="uniform"
                            fill="#d97706"
                            name={t('admin.dashboard.charts.reserves.long')}
                            hide={!visibleSeries.has('reserves')}
                        />

                        {/* Issued Reserves - Professional dark red that stands out */}
                        <Bar
                            dataKey="quantities.issuedReserves"
                            stackId="uniform"
                            fill="#b91c1c"
                            name={t('admin.dashboard.charts.issuedReserves.long')}
                            hide={!visibleSeries.has('issuedReserves')}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            {/* Independent Custom Legend */}
            <CustomLegend
                items={legendItems}
                visibleSeries={visibleSeries}
                hoveredSeries={hoveredSeries}
                onVisibilityChange={setVisibleSeries}
                onItemHover={setHoveredSeries}
                paddingTop="10px"
                className="mx-4"
            />
            <Row className='mb-5 justify-content-center'>
                <Col xs={10}>
                    <ExpandableDividerArea>
                        <Table>
                            <thead>
                                <tr>
                                    <th>{t('admin.dashboard.charts.count')}</th>
                                    {data.map(sizeData => (
                                        <th key={sizeData.sizeId}>{sizeData.size}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {quantities.map((quantity) => (
                                    <tr key={quantity}>
                                        <th>{t(`admin.dashboard.charts.${quantity}.short`)}</th>
                                        {data.map(sizeData => (
                                            <td key={sizeData.sizeId}>{sizeData.quantities[quantity]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </ExpandableDividerArea>
                </Col>
            </Row>
        </div>
    );
};