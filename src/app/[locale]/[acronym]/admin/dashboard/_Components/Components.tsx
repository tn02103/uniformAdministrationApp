"use client";
import { exportUniformCount } from "@/dal/charts/UniformCount.exports";
import { UniformType } from "@/types/globalUniformTypes";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormSelect } from "react-bootstrap";
import { toast } from "react-toastify";


export const TypeSelect = (props: { initialValue: string, uniformTypeList: UniformType[], paramName: string }) => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const [value, setValue] = useState<string>(props.initialValue);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTypeId = event.target.value;
        setValue(selectedTypeId);
        const currentSearchParams = new URLSearchParams(searchParams.toString());
        currentSearchParams.set(props.paramName, selectedTypeId);
        router.replace(`/${params.locale}/app/admin/dashboard?${currentSearchParams.toString()}`, { scroll: false });
    }
    return (
        <div className="d-flex ms-5">
            Ausgewählter Typ:&nbsp;
            <FormSelect
                name="uniformTypeSelect"
                onChange={handleChange}
                value={value}
                className="w-auto fw-bold"
            >
                {props.uniformTypeList.filter(t => t.usingSizes).map(type => (
                    <option key={type.id} value={type.id}>
                        {type.name}
                    </option>
                ))}
            </FormSelect>
        </div>
    )
}


export const ExportLinks = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleUniformOverviewExport = async () => {
        if (isExporting) return;
        
        setIsExporting(true);
        try {
            // Call server action to generate Excel data
            const { buffer, filename } = await exportUniformCount();
            
            // Convert array back to Uint8Array for blob creation
            const uint8Array = new Uint8Array(buffer);
            
            // Create blob and download link
            const blob = new Blob([uint8Array], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            
            // Create download link and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Excel file downloaded successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export Excel file');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mx-5">
            <a 
                className={`link ${isExporting ? 'text-muted' : ''}`} 
                role="button" 
                onClick={handleUniformOverviewExport}
                style={{ 
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    opacity: isExporting ? 0.6 : 1
                }}
            >
                {isExporting ? 'Exportiere...' : 'Uniformübersicht Exportieren'}
            </a>
        </div>
    );
}
