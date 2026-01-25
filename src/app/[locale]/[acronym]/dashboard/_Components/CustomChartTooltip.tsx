import styles from './CustomChartTooltip.module.css';

type TooltipEntry = {
    dataKey: string;
    value: number;
    color: string;
    name: string;
};

type CustomChartTooltipProps = {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
};

export const CustomChartTooltip = ({ active, payload, label }: CustomChartTooltipProps) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className={styles.tooltip}>
            <p className={styles.label}>{label}</p>
            {payload.slice().map((entry, index: number) => (
                <p key={index} className={styles.entry}>
                    {entry.name}: <span style={{ color: entry.color }}>{entry.value}</span>
                </p>
            ))}
        </div>
    );
};