"use client"

import { ExpandableDividerArea } from '@/components/ExpandableArea/ExpandableArea';
import { UniformCountBySizeForTypeData } from '@/dal/charts/UniformCounts';
import { useI18n } from '@/lib/locales/client';
import React, { useMemo, useState } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomChartTooltip } from '../_Components/CustomChartTooltip';
import { CustomLegend, LegendItem } from '../_Components/CustomLegend';
import styles from './Chart.module.css';
import clsx from 'clsx';

type UniformTypeChartProps = {
    data: UniformCountBySizeForTypeData[];
}
type QuantityKey = keyof UniformCountBySizeForTypeData["quantities"];
type DataKeys = Omit<LegendItem, "key"> & {
    key: QuantityKey;
    stackId: string;
    label: string;
}

export const UniformCountBySizeForTypeChart = ({ data }: UniformTypeChartProps) => {
    const t = useI18n();

    // Legend items configuration
    const barItems: DataKeys[] = useMemo(() => [
        { key: 'available', color: '#4dacff', description: t('admin.dashboard.charts.available.long'), label: t('admin.dashboard.charts.available.short'), stackId: "active" },
        { key: 'issued', color: '#007be6', description: t('admin.dashboard.charts.issued.long'), label: t('admin.dashboard.charts.issued.short'), stackId: "active" },
        { key: 'reserves', color: '#fd9e4e', description: t('admin.dashboard.charts.reserves.long'), label: t('admin.dashboard.charts.reserves.short'), stackId: "reserve" },
        { key: 'issuedReserves', color: '#e46902', description: t('admin.dashboard.charts.issuedReserves.long'), label: t('admin.dashboard.charts.issuedReserves.short'), stackId: "reserve" }
    ], [t]);

    // State for interactive legend
    const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(barItems.map(item => item.key)));
    const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

    return (
        <div data-testid="uniform-size-chart">
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
                        {barItems.map(item => (
                            <Bar
                                key={item.key}
                                dataKey={`quantities.${item.key}`}
                                stackId={item.stackId}
                                fill={item.color}
                                name={item.label}
                                hide={!visibleSeries.has(item.key)}
                                className={clsx(
                                    styles.bar,
                                    (hoveredSeries && hoveredSeries === item.key) ? styles.hovered : undefined,
                                    (hoveredSeries && hoveredSeries !== item.key) ? styles.dimmed : undefined
                                )}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Independent Custom Legend */}
            <div data-testid="uniform-size-legend">
                <CustomLegend
                    items={barItems}
                    visibleSeries={visibleSeries}
                    hoveredSeries={hoveredSeries}
                    onVisibilityChange={setVisibleSeries}
                    onItemHover={setHoveredSeries}
                    paddingTop="10px"
                    className="mx-4"
                />
            </div>
            <Row className='mb-5 justify-content-center'>
                <Col xs={10}>
                    <ExpandableDividerArea>
                        <Table data-testid="uniform-size-table">
                            <thead>
                                <tr>
                                    <th className='bg-dark-subtle'>{t('admin.dashboard.charts.count')}</th>
                                    {data.map(sizeData => (
                                        <th key={sizeData.sizeId} className='bg-dark-subtle'>{sizeData.size}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {barItems.map(({ key, label }) => (
                                    <tr key={key}>
                                        <th>{label}</th>
                                        {data.map(sizeData => (
                                            <td key={sizeData.sizeId}>{sizeData.quantities[key]}</td>
                                        ))}
                                    </tr>
                                ))}
                                <tr className='bg-secondary-subtle'>
                                    <th className='bg-secondary-subtle'>{t('admin.dashboard.charts.total')}</th>
                                    {data.map(sizeData => (
                                        <td key={sizeData.sizeId} className='bg-secondary-subtle'>
                                            {barItems.reduce((sum, item) => sum + sizeData.quantities[item.key], 0)}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </Table>
                    </ExpandableDividerArea>
                </Col>
            </Row>
        </div>
    );
};