import { UniformCountByTypeData, UniformCountBySizeForTypeData } from "@/dal/charts/UniformCounts";
import ExcelJS from 'exceljs';

export const generateUniformCountXLSX = async (data: {
    countByType: UniformCountByTypeData[], 
    countBySizeForTypeList: { uniformTypeName: string; data: UniformCountBySizeForTypeData[] }[]
}) => {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Uniform Administration System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create worksheet for uniform counts by type
    const typeCountSheet = workbook.addWorksheet('Uniform Counts by Type');
    
    // Set up headers for type count sheet
    typeCountSheet.columns = [
        { header: 'Uniform Type', key: 'name', width: 20 },
        { header: 'Available', key: 'available', width: 12 },
        { header: 'Issued', key: 'issued', width: 12 },
        { header: 'Reserves', key: 'reserves', width: 12 },
        { header: 'Issued Reserves', key: 'issuedReserves', width: 15 },
        { header: 'Missing', key: 'missing', width: 12 },
        { header: 'Cadets with Issued Reserves', key: 'issuedReserveCadets', width: 30 },
        { header: 'Cadets Missing Items', key: 'missingCadets', width: 30 }
    ];

    // Add data to type count sheet
    data.countByType.forEach(type => {
        typeCountSheet.addRow({
            name: type.name,
            available: type.quantities.available,
            issued: type.quantities.issued,
            reserves: type.quantities.reserves,
            issuedReserves: type.quantities.issuedReserves,
            missing: type.quantities.missing,
            issuedReserveCadets: type.issuedReserveCadets.map(c => `${c.firstname} ${c.lastname}`).join(', '),
            missingCadets: type.missingCadets.map(c => `${c.firstname} ${c.lastname}`).join(', ')
        });
    });

    // Style the header row for type count sheet
    const typeHeaderRow = typeCountSheet.getRow(1);
    typeHeaderRow.font = { bold: true };
    typeHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
    };

    // Create worksheets for each uniform type's size breakdown
    data.countBySizeForTypeList.forEach(({ uniformTypeName, data: sizeData }) => {
        const sizeSheet = workbook.addWorksheet(`${uniformTypeName} - By Size`);
        
        // Set up headers for size breakdown sheet
        sizeSheet.columns = [
            { header: 'Size', key: 'size', width: 15 },
            { header: 'Available', key: 'available', width: 12 },
            { header: 'Issued', key: 'issued', width: 12 },
            { header: 'Reserves', key: 'reserves', width: 12 },
            { header: 'Issued Reserves', key: 'issuedReserves', width: 15 },
            { header: 'Cadets with Issued Reserves', key: 'issuedReserveCadets', width: 30 }
        ];

        // Add data to size breakdown sheet
        sizeData.forEach(size => {
            sizeSheet.addRow({
                size: size.size,
                available: size.quantities.available,
                issued: size.quantities.issued,
                reserves: size.quantities.reserves,
                issuedReserves: size.quantities.issuedReserves,
                issuedReserveCadets: size.issuedReserveCadets.map(c => `${c.firstname} ${c.lastname}`).join(', ')
            });
        });

        // Style the header row for size breakdown sheet
        const sizeHeaderRow = sizeSheet.getRow(1);
        sizeHeaderRow.font = { bold: true };
        sizeHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
        };

        // Add totals row
        if (sizeData.length > 0) {
            const totals = sizeData.reduce((acc, size) => ({
                available: acc.available + size.quantities.available,
                issued: acc.issued + size.quantities.issued,
                reserves: acc.reserves + size.quantities.reserves,
                issuedReserves: acc.issuedReserves + size.quantities.issuedReserves
            }), { available: 0, issued: 0, reserves: 0, issuedReserves: 0 });

            const totalRow = sizeSheet.addRow({
                size: 'TOTAL',
                available: totals.available,
                issued: totals.issued,
                reserves: totals.reserves,
                issuedReserves: totals.issuedReserves,
                issuedReserveCadets: ''
            });
            totalRow.font = { bold: true };
            totalRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFD700' }
            };
        }
    });

    return workbook;
}
