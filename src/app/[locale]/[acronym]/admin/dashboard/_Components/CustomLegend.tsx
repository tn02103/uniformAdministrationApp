import { clsx } from 'clsx';
import React from 'react';
import styles from './CustomLegend.module.css';

export type LegendItem = {
    key: string;
    color: string;
    description: string;
};

export type CustomLegendProps = {
    items: LegendItem[];
    visibleSeries: Set<string>;
    hoveredSeries: string | null;
    onVisibilityChange: (visibleSeries: Set<string>) => void;
    onItemHover: (key: string | null) => void;
    paddingTop?: string;
    className?: string;
};

export const CustomLegend: React.FC<CustomLegendProps> = ({
    items,
    visibleSeries,
    hoveredSeries,
    onVisibilityChange,
    onItemHover,
    paddingTop = '15px',
    className = ''
}) => {
    // Handle legend click with 3-rule logic
    const handleLegendClick = (dataKey: string) => {
        const newVisible = new Set(visibleSeries);
        const allVisible = items.every(item => visibleSeries.has(item.key));
        const isOnlyVisible = visibleSeries.size === 1 && visibleSeries.has(dataKey);

        if (allVisible) {
            // Rule 1: If everything is visible, show only clicked dataset
            onVisibilityChange(new Set([dataKey]));
        } else if (isOnlyVisible) {
            // Rule 2: If clicked dataset is only visible, show everything
            onVisibilityChange(new Set(items.map(item => item.key)));
        } else {
            // Rule 3: Toggle visibility of clicked dataset
            if (newVisible.has(dataKey)) {
                newVisible.delete(dataKey);
            } else {
                newVisible.add(dataKey);
            }
            // Ensure at least one series remains visible
            onVisibilityChange(newVisible.size > 0 ? newVisible : new Set([dataKey]));
        }
    };
    return (
        <div
            style={{ paddingTop }}
            className={`${styles.container} ${className}`.trim()}
            aria-label='legend'
        >
            {items.map((item: LegendItem) => {
                const isVisible = visibleSeries.has(item.key);
                const isHovered = hoveredSeries === item.key;
                const isDimmed = hoveredSeries && !isHovered;

                return (
                    <div
                        key={item.key}
                        className={clsx([
                            styles.legendItem,
                            isVisible ? (isDimmed ? styles.dimmed : styles.visible) : styles.hidden,
                            isHovered ? styles.hovered : ''
                        ])}
                        onClick={() => handleLegendClick(item.key)}
                        onMouseEnter={() => isVisible ? onItemHover(item.key) : null}
                        onMouseLeave={() => onItemHover(null)}
                        role="button"
                    >
                        <div
                            className={clsx([
                                styles.colorIndicator,
                                isVisible ? styles.visible : styles.hidden
                            ])}
                            style={{ backgroundColor: item.color }}
                        />
                        <span
                            className={clsx([
                                styles.label,
                                isVisible ? styles.visible : styles.hidden
                            ])}
                        >
                            {item.description}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};