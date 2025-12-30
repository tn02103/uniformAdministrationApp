"use client"

import { ExpandableDividerArea } from '@/components/ExpandableArea/ExpandableArea';
import { UniformCountByTypeData } from '@/dal/charts/UniformCounts';
import { useI18n } from '@/lib/locales/client';
import React, { useMemo, useState } from 'react';
import { Col, OverlayTrigger, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomChartTooltip } from '../_Components/CustomChartTooltip';
import { CustomLegend, LegendItem } from '../_Components/CustomLegend';
import styles from './Chart.module.css';
import { clsx } from 'clsx';


type UniformTypesOverviewChartProps = {
    data: UniformCountByTypeData[];
}

type QuantityKey = keyof UniformCountByTypeData["quantities"];
type DataKeys = Omit<LegendItem, "key"> & {
    key: QuantityKey;
    stackId: string;
    label: string;
}

export const UniformTypesOverviewChart = ({ data }: UniformTypesOverviewChartProps) => {
    const t = useI18n();

    // Legend items configuration
    const barItems: DataKeys[] = useMemo(() => [
        { key: 'available', color: '#4dacff', description: t('admin.dashboard.charts.available.long'), label: t('admin.dashboard.charts.available.short'), stackId: "active" },
        { key: 'issued', color: '#007be6', description: t('admin.dashboard.charts.issued.long'), label: t('admin.dashboard.charts.issued.short'), stackId: "active" },
        { key: 'reserves', color: '#fd9e4e', description: t('admin.dashboard.charts.reserves.long'), label: t('admin.dashboard.charts.reserves.short'), stackId: "reserves" },
        { key: 'issuedReserves', color: '#e46902', description: t('admin.dashboard.charts.issuedReserves.long'), label: t('admin.dashboard.charts.issuedReserves.short'), stackId: "reserves" },
        { key: 'missing', color: '#b91c1c', description: t('admin.dashboard.charts.missing.long'), label: t('admin.dashboard.charts.missing.short'), stackId: "missing" }
    ], [t]);

    // State for interactive legend
    const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(barItems.map(item => item.key)));
    const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

    const getDataCell = (typeData: UniformCountByTypeData, quantityLabel: keyof UniformCountByTypeData["quantities"]) => {
        if (quantityLabel === "missing" || quantityLabel === "issuedReserves") {
            const cadetList = quantityLabel === "missing" ? typeData.missingCadets : typeData.issuedReserveCadets;
            return (
                <OverlayTrigger
                    placement="bottom-start"
                    delay={{ show: 100, hide: 150 }}
                    overlay={
                        <span className="bg-white p-2 border border-1 border-gray">
                            {cadetList.map(c => <React.Fragment key={c.id}>{c.firstname} {c.lastname} <br /></React.Fragment>)}
                        </span>
                    }
                >
                    <td key={typeData.id} style={{ cursor: "pointer" }}>
                        {typeData.quantities[quantityLabel]}
                    </td>
                </OverlayTrigger>
            )
        }

        return (
            <td key={typeData.id} >{typeData.quantities[quantityLabel]}</td>
        )
    }

    return (
        <div data-testid="uniform-types-overview-chart">
            <div style={{ width: '100%', height: '500px', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis />
                        <Tooltip content={<CustomChartTooltip />} />

                        {/* Always render bars in consistent order - Available first */}
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
            <div data-testid="uniform-types-legend">
                <CustomLegend
                    items={barItems}
                    visibleSeries={visibleSeries}
                    hoveredSeries={hoveredSeries}
                    onVisibilityChange={setVisibleSeries}
                    onItemHover={setHoveredSeries}
                    paddingTop="20px"
                    className="mx-5"
                />
            </div>
            <Row className='mb-5 justify-content-center'>
                <Col xs={10}>
                    <ExpandableDividerArea>
                        <Table data-testid="uniform-types-table">
                            <thead>
                                <tr>
                                    <th className='bg-dark-subtle'>{t('admin.dashboard.charts.count')}</th>
                                    {data.map(typeData => (
                                        <th key={typeData.id} className='bg-dark-subtle'>
                                            {typeData.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {barItems.map(({ key, label }) => (
                                    <tr key={key}>
                                        <th>{label}</th>
                                        {data.map(typeData => getDataCell(typeData, key))}
                                    </tr>
                                ))}
                                <tr className='bg-secondary-subtle'>
                                    <th className='bg-secondary-subtle'>{t('admin.dashboard.charts.total')}</th>
                                    {data.map(typeData => (
                                        <td key={typeData.id} className='bg-secondary-subtle'>
                                            {barItems
                                                .filter(item => item.key !== "missing")
                                                .reduce(
                                                    (sum, item) => sum + typeData.quantities[item.key],
                                                    0
                                                )
                                            }
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