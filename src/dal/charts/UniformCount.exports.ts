"use server";

import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { __unsecuredGetUniformTypeList } from "../uniform/type/get";
import { getUniformCountBySizeForType, getUniformCountByType } from "./UniformCounts";
import { generateUniformCountXLSX } from "@/lib/fileCreations/uniformCount";

export const exportUniformCount = async (): Promise<{ buffer: number[]; filename: string }> => 
    genericSANoDataValidator(AuthRole.materialManager).then(async ([{ assosiation }]) => {
        const uniformTypeList = (await __unsecuredGetUniformTypeList(assosiation)).filter(type => type.usingSizes);

        const [byTypeData, bySizeDataArrays] = await Promise.all([
            getUniformCountByType(),
            Promise.all(uniformTypeList.map(type => getUniformCountBySizeForType(type.id))),
        ]);

        // Transform size data to include uniform type names
        const countBySizeForTypeList = uniformTypeList.map((type, index) => ({
            uniformTypeName: type.name,
            data: bySizeDataArrays[index]
        }));

        // Generate Excel workbook
        const workbook = await generateUniformCountXLSX({
            countByType: byTypeData,
            countBySizeForTypeList
        });

        // Convert workbook to buffer
        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        
        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `uniform-count-report-${currentDate}.xlsx`;

        return { 
            buffer: Array.from(buffer), // Convert to array for JSON serialization
            filename 
        };
    });
