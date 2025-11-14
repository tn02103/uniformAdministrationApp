"use client"

import { ExpandableDividerArea } from '@/components/ExpandableArea/ExpandableArea';
import { UniformCountByTypeData } from '@/dal/charts/UniformCounts';
import { useI18n } from '@/lib/locales/client';
import React, { useState } from 'react';
import { Col, OverlayTrigger, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomChartTooltip } from '../_Components/CustomChartTooltip';
import { CustomLegend, LegendItem } from '../_Components/CustomLegend';


type UniformTypesOverviewChartProps = {
    data: UniformCountByTypeData[];
}

export const UniformTypesOverviewChart = ({ data }: UniformTypesOverviewChartProps) => {
    const t = useI18n();
    const quantities = React.useMemo(() => 
        ["available", "issued", "reserves", "issuedReserves", "missing"] as const,
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
        { key: 'issuedReserves', color: '#b91c1c', label: t('admin.dashboard.charts.issuedReserves.long') },
        { key: 'missing', color: '#7c3aed', label: t('admin.dashboard.charts.missing.long') }
    ];
    
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
        <div>
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
                        <Bar
                            dataKey="quantities.available"
                            stackId="uniformType"
                            fill="#16a34a"
                            name={t('admin.dashboard.charts.available.long')}
                            hide={!visibleSeries.has('available')}
                        />

                        {/* Issued - Professional slate blue */}
                        <Bar
                            dataKey="quantities.issued"
                            stackId="uniformType"
                            fill="#475569"
                            name={t('admin.dashboard.charts.issued.long')}
                            hide={!visibleSeries.has('issued')}
                        />

                        {/* Reserves - Muted amber/orange */}
                        <Bar
                            dataKey="quantities.reserves"
                            stackId="uniformType"
                            fill="#d97706"
                            name={t('admin.dashboard.charts.reserves.long')}
                            hide={!visibleSeries.has('reserves')}
                        />

                        {/* Issued Reserves - Professional dark red that stands out */}
                        <Bar
                            dataKey="quantities.issuedReserves"
                            stackId="uniformType"
                            fill="#b91c1c"
                            name={t('admin.dashboard.charts.issuedReserves.long')}
                            hide={!visibleSeries.has('issuedReserves')}
                        />

                        {/* Missing - Purple to indicate need for procurement */}
                        <Bar
                            dataKey="quantities.missing"
                            stackId="uniformType"
                            fill="#7c3aed"
                            name={t('admin.dashboard.charts.missing.long')}
                            hide={!visibleSeries.has('missing')}
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
                paddingTop="20px"
                className="mx-5"
            />
            <Row  className='mb-5 justify-content-center'>
                <Col xs={10}>
                    <ExpandableDividerArea>
                        <Table>
                            <thead>
                                <tr>
                                    <th>{t('admin.dashboard.charts.count')}</th>
                                    {data.map(typeData => (
                                        <th key={typeData.id}>{typeData.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {quantities.map((quantityLabel) => (
                                    <tr key={quantityLabel}>
                                        <th>{t(`admin.dashboard.charts.${quantityLabel}.short`)}</th>
                                        {data.map(typeData => getDataCell(typeData, quantityLabel))}
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