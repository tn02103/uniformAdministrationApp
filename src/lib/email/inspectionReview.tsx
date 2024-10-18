import { InspectionReview } from "@/types/deficiencyTypes";
import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import dayjs from "@/lib/dayjs";
import { generateInspectionReviewXLSX } from "../fileCreations/inspectionReview";
import { getMailAgend } from "./mailagend";

export async function sendInspectionReviewMail(emails: string[], inspreview: InspectionReview) {

    const workbook = generateInspectionReviewXLSX(inspreview);
    const buffer = await workbook.xlsx.writeBuffer();
    getMailAgend().sendMail({
        to: emails,
        subject: 'Test Email',
        html: await render(InspectionReviewMailBody(inspreview)),
        attachments: [{
            filename: `${inspreview.name}-${dayjs(inspreview.date).format('DD.MM.YYYY')}.xlsx`,
            content: buffer as any,
        }]
    });
}

function InspectionReviewMailBody(inspreview: InspectionReview) {
    return (
        <Html>
            <h1>Uniformkontrolle: {inspreview.name}</h1>
            <span>Die Uniformkontrolle wurde erfolgreich beendet. <br/></span>
            <table>
                <tr>
                    <th style={{textAlign: 'right'}}>Name:</th>
                    <td>{inspreview.name}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'right'}}>Datum:</th>
                    <td>{dayjs(inspreview.date).format('DD.MM.YYYY')}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'right'}}>Startzeit:</th>
                    <td>{dayjs(inspreview.timeStart).format('HH:mm')}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>Endzeit:</th>
                    <td>{dayjs(inspreview.timeEnd).format('HH:mm')}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>Kontrolierte VK:</th>
                    <td>{inspreview.cadetsInspected}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>Nicht erschienen:</th>
                    <td>{inspreview.activeCadets - inspreview.cadetsInspected - inspreview.deregisteredCadets}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>Abgemeldet:</th>
                    <td>{inspreview.deregisteredCadets}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>Aktive Mängel</th>
                    <td>{inspreview.activeDeficiencies}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>neue Mängel</th>
                    <td>{inspreview.newDeficiencies}</td>
                </tr>
                <tr>
                    <th style={{textAlign: 'end'}}>gelöste Mängel</th>
                    <td>{inspreview.resolvedDeficiencies}</td>
                </tr>
            </table>
        </Html>
    )
}
