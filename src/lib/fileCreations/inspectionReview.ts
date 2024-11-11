import { InspectionReview, InspectionReviewCadet, InspectionReviewDeficiency } from "@/types/deficiencyTypes";
import { Worksheet } from "exceljs";
import ExcelJS from 'exceljs';

export const generateInspectionReviewXLSX = (inspectionReview: InspectionReview) => {

    const { activeDeficiencyList, cadetList, ...inspection } = inspectionReview
    // create Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();

    // create and fill worksheets
    const cadetSheet: Worksheet = workbook.addWorksheet('Kadetten');
    const deficiencySheet = workbook.addWorksheet('aktive Mängel');
    createCadetTable(cadetSheet, cadetList);
    createDeficiencyTable(deficiencySheet, activeDeficiencyList);
    return workbook;
}


function createCadetTable(workSheet: Worksheet, cadetList: InspectionReviewCadet[]) {
    workSheet.addTable({
        // general data and configuration
        name: 'Liste Verkehrskadetten',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        // column definition
        columns: [
            { name: 'Nachname', filterButton: true },
            { name: 'Vorname', filterButton: true },
            { name: 'Letze Kontrolle', filterButton: true },
            { name: 'uniform Vollständig (bei der Letzten Kontrolle)', filterButton: true },
            { name: 'Anzahl Aktiver Mängel', filterButton: true },
            { name: 'Anzahl Mängel geschlossen (Diese Kontrolle)', filterButton: true },
            { name: 'Anzahl Mängel geschlossen (Insgesammt)', filterButton: true },
        ],
        // DATA
        rows: cadetList.map(revCad => {
            return [
                revCad.cadet.lastname,
                revCad.cadet.firstname,
                revCad.lastInspection?.date ? revCad.lastInspection.date : 'nicht kontrolliert',
                revCad.lastInspection ? (revCad.lastInspection.uniformComplete !== null) ? revCad.lastInspection.uniformComplete ? 'Vollständig' : 'Unvollständig' : '?' : '?',
                +revCad.activeDeficiencyCount ?? 0,
                +revCad.newlyClosedDeficiencyCount ?? 0,
                +revCad.overalClosedDeficiencyCount ?? 0,
            ]
        }),
    });
}

function createDeficiencyTable(workSheet: Worksheet, deficiencyList: InspectionReviewDeficiency[]) {
    workSheet.addTable({
        // general data and config
        name: 'Aktive Mängel',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        // column definition
        columns: [
            { name: 'Neu' },
            { name: 'Typ' },
            { name: 'Abhängig von' },
            { name: 'Bezieht sich auf' },
            { name: 'Kadet' },
            { name: 'Beschreibung' },
            { name: 'Kommentar' },
            { name: 'erstellt am' }
        ],
        // DATA
        rows: deficiencyList.map(def => [
            def.new ? 'Neu' : 'Alt',
            def.deficiencyType.name,
            def.deficiencyType.dependent,
            def.deficiencyType.relation,
            def.cadet ? `${def.cadet.firstname} ${def.cadet.lastname}` : null,
            def.description,
            def.comment,
            def.dateCreated
        ])
    });
}
