import { useI18n } from '@/lib/locales/client';
import de from '@/../public/locales/de';

type TooltipEntry = {
    dataKey: string;
    value: number;
    color: string;
};

type CustomChartTooltipProps = {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
};

export const CustomChartTooltip = ({ active, payload, label }: CustomChartTooltipProps) => {
    const t = useI18n();

    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
            <p className="font-semibold mb-1">{label}</p>
            {payload.slice().reverse().map((entry, index: number) => {
                const quantityKey = entry.dataKey.split('.')[1] as keyof Omit<typeof de.admin.dashboard.charts, "count">;
                return (
                    <p key={index} className="mb-0 text-sm" style={{ color: entry.color }}>
                        {t(`admin.dashboard.charts.${quantityKey}.short`)}: {entry.value}
                    </p>
                );
            })}
        </div>
    );
};