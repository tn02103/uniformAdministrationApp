import { OrganisationConfiguration, Deregistration, Inspection, Prisma, Redirect, StorageUnit, Uniform } from "@prisma/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { v4 as uuid } from "uuid";
dayjs.extend(utc);
dayjs.extend(customParseFormat);

const uuidArray = (i: number) => Array(i).fill("").map(() => uuid());

export type StaticDataIdType = {
    organisationId: string;
    userIds: string[];
    cadetIds: string[];
    deficiencyIds: string[];
    deficiencyTypeIds: string[];
    inspectionIds: string[];
    materialGroupIds: string[];
    materialIds: string[];
    sizeIds: string[];
    sizelistIds: string[];
    uniformGenerationIds: string[];
    uniformIds: string[][];
    uniformTypeIds: string[];
    storageUnitIds: string[];
    redirectIds: string[];
    deviceIds: string[];
    refreshTokenIds: string[];
    dynamic: {
        firstInspection: {
            id: string;
            newDefIds: string[];
        };
        seccondInspection: {
            newDefId: string;
        }
    }
};
export function getStaticDataIds(): StaticDataIdType {
    return {
        organisationId: uuid(),
        userIds: uuidArray(5),
        cadetIds: uuidArray(10),
        sizeIds: uuidArray(21),
        sizelistIds: uuidArray(4),
        uniformTypeIds: uuidArray(5),
        uniformGenerationIds: uuidArray(8),
        uniformIds: [87, 16, 66, 13].map((value) => uuidArray(value)),
        storageUnitIds: uuidArray(5),
        materialGroupIds: uuidArray(5),
        materialIds: uuidArray(12),
        deficiencyTypeIds: uuidArray(8),
        deficiencyIds: uuidArray(16),
        inspectionIds: uuidArray(6),
        redirectIds: uuidArray(4),
        deviceIds: uuidArray(6), // 2 devices per admin (id 0), manager (id 1), and inspector (id 2) 
        refreshTokenIds: uuidArray(10), // Mix of active, expired, and used tokens
        dynamic: {
            firstInspection: {
                id: uuid(),
                newDefIds: uuidArray(5),
            },
            seccondInspection: {
                newDefId: uuid(),
            }
        }
    }
}

export default class StaticDataGenerator {
    readonly ids: StaticDataIdType;
    constructor(ids: StaticDataIdType) {
        this.ids = ids;
    }

    organisationConfiguration() {
        return {
            organisationId: this.ids.organisationId,
            sendEmailAfterInspection: true,
            inspectionReportEmails: [process.env.EMAIL_ADRESS_TESTS ?? 'admin@example.com'],
            twoFactorAuthRule: "optional",
        } satisfies OrganisationConfiguration
    }

    cadet() {
        const { cadetIds, organisationId } = this.ids
        return [
            { id: cadetIds[0], organisationId, firstname: 'Antje', lastname: 'Fried', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[1], organisationId, firstname: 'Marie', lastname: 'Becker', active: true, comment: 'Bemerkung Test', recdelete: null, recdeleteUser: null },
            { id: cadetIds[2], organisationId, firstname: 'Sven', lastname: 'Keller', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[3], organisationId, firstname: 'Lucas', lastname: 'Schwartz', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[4], organisationId, firstname: 'Uwe', lastname: 'Luft', active: true, comment: 'initial-comment', recdelete: null, recdeleteUser: null },
            { id: cadetIds[5], organisationId, firstname: 'Maik', lastname: 'Finkel', active: true, comment: 'initial-comment', recdelete: null, recdeleteUser: null },
            { id: cadetIds[6], organisationId, firstname: 'Tim', lastname: 'Weissmuller', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[7], organisationId, firstname: 'Juliane', lastname: 'Unger', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[8], organisationId, firstname: 'Simone', lastname: 'Osterhagen', active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: cadetIds[9], organisationId, firstname: 'Christina', lastname: 'Faber', active: true, comment: '', recdelete: null, recdeleteUser: null },
        ]
    }

    uniformSize() {
        return [
            { id: this.ids.sizeIds[0], name: '0', sortOrder: 1, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[1], name: '1', sortOrder: 2, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[2], name: '2', sortOrder: 3, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[3], name: '3', sortOrder: 4, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[4], name: '4', sortOrder: 5, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[5], name: '5', sortOrder: 6, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[6], name: '6', sortOrder: 7, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[7], name: '7', sortOrder: 8, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[8], name: '8', sortOrder: 9, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[9], name: '9', sortOrder: 10, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[10], name: '10', sortOrder: 11, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[11], name: '11', sortOrder: 12, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[12], name: '12', sortOrder: 13, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[13], name: '13', sortOrder: 14, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[14], name: '14', sortOrder: 15, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[15], name: '15', sortOrder: 16, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[16], name: 'Größe16', sortOrder: 17, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[17], name: 'Größe17', sortOrder: 18, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[18], name: 'Größe18', sortOrder: 19, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[19], name: 'Größe19', sortOrder: 20, organisationId: this.ids.organisationId },
            { id: this.ids.sizeIds[20], name: 'Größe20', sortOrder: 21, organisationId: this.ids.organisationId },
        ]
    }

    uniformType() {
        return [
            { id: this.ids.uniformTypeIds[0], organisationId: this.ids.organisationId, name: 'Typ1', acronym: 'AA', issuedDefault: 3, usingGenerations: true, usingSizes: true, fk_defaultSizelist: this.ids.sizelistIds[0], sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformTypeIds[1], organisationId: this.ids.organisationId, name: 'Typ2', acronym: 'AB', issuedDefault: 1, usingGenerations: true, usingSizes: false, fk_defaultSizelist: null, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformTypeIds[2], organisationId: this.ids.organisationId, name: 'Typ3', acronym: 'AC', issuedDefault: 1, usingGenerations: false, usingSizes: true, fk_defaultSizelist: this.ids.sizelistIds[1], sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformTypeIds[3], organisationId: this.ids.organisationId, name: 'Typ4', acronym: 'AD', issuedDefault: 1, usingGenerations: false, usingSizes: false, fk_defaultSizelist: null, sortOrder: 3, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformTypeIds[4], organisationId: this.ids.organisationId, name: 'Typ5', acronym: 'AE', issuedDefault: 1, usingGenerations: false, usingSizes: false, fk_defaultSizelist: null, sortOrder: 2, recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
        ]
    }

    uniformGeneration() {
        return [
            { id: this.ids.uniformGenerationIds[0], fk_uniformType: this.ids.uniformTypeIds[0], name: 'Generation1-1', fk_sizelist: this.ids.sizelistIds[0], outdated: true, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformGenerationIds[1], fk_uniformType: this.ids.uniformTypeIds[0], name: 'Generation1-2', fk_sizelist: this.ids.sizelistIds[0], outdated: false, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformGenerationIds[2], fk_uniformType: this.ids.uniformTypeIds[0], name: 'Generation1-3', fk_sizelist: this.ids.sizelistIds[1], outdated: false, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformGenerationIds[3], fk_uniformType: this.ids.uniformTypeIds[0], name: 'Generation1-4', fk_sizelist: this.ids.sizelistIds[2], outdated: false, sortOrder: 3, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformGenerationIds[4], fk_uniformType: this.ids.uniformTypeIds[1], name: 'Generation2-1', fk_sizelist: null, outdated: true, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformGenerationIds[5], fk_uniformType: this.ids.uniformTypeIds[1], name: 'Generation2-2', fk_sizelist: null, outdated: false, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: this.ids.uniformGenerationIds[6], fk_uniformType: this.ids.uniformTypeIds[1], name: 'Generation2-3', fk_sizelist: null, outdated: true, sortOrder: 2, recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
            { id: this.ids.uniformGenerationIds[7], fk_uniformType: this.ids.uniformTypeIds[0], name: 'Generation1-5', fk_sizelist: null, outdated: true, sortOrder: 2, recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
        ]
    }

    storageUnits() {
        return [
            { id: this.ids.storageUnitIds[0], organisationId: this.ids.organisationId, name: 'Kiste 01', description: 'Für Typ1 Uniformteile in Reserve', capacity: 5, isReserve: true },
            { id: this.ids.storageUnitIds[1], organisationId: this.ids.organisationId, name: 'Kiste 02', description: 'Für Typ1 Uniformteile in Reserve', capacity: 5, isReserve: true },
            { id: this.ids.storageUnitIds[2], organisationId: this.ids.organisationId, name: 'Kiste 03', description: 'Für Typ3 Uniformteile in Reserve', capacity: 10, isReserve: true },
            { id: this.ids.storageUnitIds[3], organisationId: this.ids.organisationId, name: 'Kiste 04', description: 'Für Typ3 aktive Uniformteile', capacity: 10, isReserve: false },
            { id: this.ids.storageUnitIds[4], organisationId: this.ids.organisationId, name: 'Kiste 05', description: 'Für Typ2 aktive Uniformteile', capacity: null, isReserve: false },
        ] satisfies StorageUnit[]
    }

    uniform() {
        return [
            { id: this.ids.uniformIds[0][0], number: 1100, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][1], number: 1101, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[1], active: true, comment: 'AABBCC', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][2], number: 1102, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][3], number: 1103, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][4], number: 1104, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][5], number: 1105, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[2], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][6], number: 1106, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[2], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][7], number: 1107, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[2], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][8], number: 1108, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[3], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[0] },
            { id: this.ids.uniformIds[0][9], number: 1109, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[3], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[0] },
            { id: this.ids.uniformIds[0][10], number: 1110, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][11], number: 1111, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][12], number: 1112, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][13], number: 1113, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][14], number: 1114, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][15], number: 1115, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[4], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[1] },
            { id: this.ids.uniformIds[0][16], number: 1116, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[4], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[1] },
            { id: this.ids.uniformIds[0][17], number: 1117, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[5], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[1] },
            { id: this.ids.uniformIds[0][18], number: 1118, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[5], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[1] },
            { id: this.ids.uniformIds[0][19], number: 1119, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[0], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[1] },
            { id: this.ids.uniformIds[0][20], number: 1120, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[0], fk_size: this.ids.sizeIds[0], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][21], number: 1121, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[1], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][22], number: 1122, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[1], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][23], number: 1123, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[1], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][24], number: 1124, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][25], number: 1125, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][26], number: 1126, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][27], number: 1127, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[3], active: true, comment: 'Comment 2', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][28], number: 1128, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][29], number: 1129, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][30], number: 1130, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[0][31], number: 1131, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[0][32], number: 1132, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[0][33], number: 1133, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[0][34], number: 1134, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[0][35], number: 1135, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][36], number: 1136, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][37], number: 1137, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][38], number: 1138, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[1], fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][39], number: 1139, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][40], number: 1140, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][41], number: 1141, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][42], number: 1142, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][43], number: 1143, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][44], number: 1144, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][45], number: 1145, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][46], number: 1146, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][47], number: 1147, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][48], number: 1148, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][49], number: 1149, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][50], number: 1150, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: null, fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][51], number: 1151, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: null, fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][52], number: 1152, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: null, fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][53], number: 1153, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][54], number: 1154, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][55], number: 1155, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][56], number: 1156, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][57], number: 1157, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][58], number: 1158, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][59], number: 1159, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][60], number: 1160, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][61], number: 1161, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][62], number: 1162, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][63], number: 1163, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][64], number: 1164, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][65], number: 1165, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][66], number: 1166, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][67], number: 1167, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][68], number: 1168, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][69], number: 1169, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][70], number: 1170, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][71], number: 1171, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][72], number: 1172, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[2], fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][73], number: 1173, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[16], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][74], number: 1174, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[16], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][75], number: 1175, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[16], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][76], number: 1176, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[17], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][77], number: 1177, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[17], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][78], number: 1178, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[17], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][79], number: 1179, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[18], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][80], number: 1180, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[18], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][81], number: 1181, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[18], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][82], number: 1182, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[19], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][83], number: 1183, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[19], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][84], number: 1184, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[20], active: true, comment: 'Bemerkung 1', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][85], number: 1185, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[20], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[0][86], number: 1186, fk_uniformType: this.ids.uniformTypeIds[0], fk_generation: this.ids.uniformGenerationIds[3], fk_size: this.ids.sizeIds[20], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][0], number: 1200, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][1], number: 1201, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][2], number: 1202, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][3], number: 1203, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][4], number: 1204, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][5], number: 1205, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][6], number: 1206, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][7], number: 1207, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][8], number: 1208, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][9], number: 1209, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][10], number: 1210, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][11], number: 1211, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][12], number: 1212, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[1][13], number: 1213, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[1][14], number: 1214, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[1][15], number: 1215, fk_uniformType: this.ids.uniformTypeIds[1], fk_generation: this.ids.uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', storageUnitId: null },
            { id: this.ids.uniformIds[2][0], number: 1300, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][1], number: 1301, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][2], number: 1302, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][3], number: 1303, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][4], number: 1304, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][5], number: 1305, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][6], number: 1306, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][7], number: 1307, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][8], number: 1308, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][9], number: 1309, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][10], number: 1310, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][11], number: 1311, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][12], number: 1312, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][13], number: 1313, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][14], number: 1314, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][15], number: 1315, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][16], number: 1316, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[2] },
            { id: this.ids.uniformIds[2][17], number: 1317, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][18], number: 1318, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][19], number: 1319, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][20], number: 1320, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[4], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[3] },
            { id: this.ids.uniformIds[2][21], number: 1321, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[4], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[3] },
            { id: this.ids.uniformIds[2][22], number: 1322, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[4], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[3] },
            { id: this.ids.uniformIds[2][23], number: 1323, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[4], active: false, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: this.ids.storageUnitIds[3] },
            { id: this.ids.uniformIds[2][24], number: 1324, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][25], number: 1325, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][26], number: 1326, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][27], number: 1327, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][28], number: 1328, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][29], number: 1329, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][30], number: 1330, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][31], number: 1331, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][32], number: 1332, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][33], number: 1333, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][34], number: 1334, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][35], number: 1335, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][36], number: 1336, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][37], number: 1337, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][38], number: 1338, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][39], number: 1339, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][40], number: 1340, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][41], number: 1341, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][42], number: 1342, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][43], number: 1343, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][44], number: 1344, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][45], number: 1345, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][46], number: 1346, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][47], number: 1347, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][48], number: 1348, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][49], number: 1349, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][50], number: 1350, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][51], number: 1351, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][52], number: 1352, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][53], number: 1353, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][54], number: 1354, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][55], number: 1355, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][56], number: 1356, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][57], number: 1357, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][58], number: 1358, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][59], number: 1359, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][60], number: 1360, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][61], number: 1361, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][62], number: 1362, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][63], number: 1363, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][64], number: 1364, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[2][65], number: 1365, fk_uniformType: this.ids.uniformTypeIds[2], fk_generation: null, fk_size: this.ids.sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][0], number: 1400, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][1], number: 1401, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][2], number: 1402, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][3], number: 1403, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][4], number: 1404, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][5], number: 1405, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][6], number: 1406, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][7], number: 1407, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][8], number: 1408, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][9], number: 1409, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][10], number: 1410, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][11], number: 1411, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
            { id: this.ids.uniformIds[3][12], number: 1412, fk_uniformType: this.ids.uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null, storageUnitId: null },
        ] satisfies Uniform[]
    }

    uniformIssued() {
        return [
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[3][4], dateIssued: new Date('2023-08-13T09:05:49.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[1][13], dateIssued: new Date('2023-08-13T09:15:41.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[2][56], dateIssued: new Date('2023-08-13T09:18:02.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[0][55], dateIssued: new Date('2023-08-13T09:10:55.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[0][56], dateIssued: new Date('2023-08-13T09:11:00.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[0][57], dateIssued: new Date('2023-08-13T09:11:05.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[3][10], dateIssued: new Date('2023-08-13T09:19:32.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[3][1], dateIssued: new Date('2023-08-13T09:05:19.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[1][15], dateIssued: new Date('2023-08-13T09:29:50.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[0][42], dateIssued: new Date('2023-08-13T09:09:19.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[0][43], dateIssued: new Date('2023-08-13T09:09:26.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[0][44], dateIssued: new Date('2023-08-13T09:09:32.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[0][45], dateIssued: new Date('2023-08-13T09:09:48.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[2][60], dateIssued: new Date('2023-08-13T09:18:50.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[2][50], dateIssued: new Date('2023-08-13T09:19:19.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[3][8], dateIssued: new Date('2023-08-13T09:07:08.000Z'), dateReturned: new Date('2023-08-16T09:43:58.000Z') },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[0][86], dateIssued: new Date('2023-08-16T09:43:05.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[0][85], dateIssued: new Date('2023-08-16T09:43:13.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[0][84], dateIssued: new Date('2023-08-16T09:43:18.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[1][9], dateIssued: new Date('2023-08-16T09:43:34.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[2][62], dateIssued: new Date('2023-08-16T09:43:47.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[3][3], dateIssued: new Date('2023-08-16T09:43:58.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[1][10], dateIssued: new Date('2023-08-13T09:01:20.000Z'), dateReturned: new Date('2023-08-16T09:43:34.000Z') },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[0][73], dateIssued: new Date('2023-08-13T09:01:43.000Z'), dateReturned: new Date('2023-08-16T09:43:13.000Z') },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[0][72], dateIssued: new Date('2023-08-13T09:03:58.000Z'), dateReturned: new Date('2023-08-16T09:43:05.000Z') },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[0][74], dateIssued: new Date('2023-08-13T09:04:03.000Z'), dateReturned: new Date('2023-08-16T09:43:18.000Z') },
            { fk_cadet: this.ids.cadetIds[1], fk_uniform: this.ids.uniformIds[2][52], dateIssued: new Date('2023-08-13T09:04:21.000Z'), dateReturned: new Date('2023-08-16T09:43:47.000Z') },
            { fk_cadet: this.ids.cadetIds[2], fk_uniform: this.ids.uniformIds[0][46], dateIssued: new Date('2023-08-13T09:10:06.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[2], fk_uniform: this.ids.uniformIds[0][48], dateIssued: new Date('2023-08-13T09:10:14.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[0][81], dateIssued: new Date('2023-08-13T09:12:22.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[0][82], dateIssued: new Date('2023-08-13T09:12:26.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[3][5], dateIssued: new Date('2023-08-13T09:05:59.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[1][12], dateIssued: new Date('2023-08-13T09:15:48.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[2][57], dateIssued: new Date('2023-08-13T09:18:09.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[0][80], dateIssued: new Date('2023-08-13T09:12:18.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[1][8], dateIssued: new Date('2023-08-13T09:30:08.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[2][0], dateIssued: new Date('2023-08-13T09:30:32.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[3][0], dateIssued: new Date('2023-08-13T09:31:17.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[0][21], dateIssued: new Date('2023-08-13T09:25:19.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[0][22], dateIssued: new Date('2023-08-13T09:25:27.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[0][23], dateIssued: new Date('2023-08-13T09:25:35.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[0][0], dateIssued: new Date('2023-08-13T09:19:56.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[0][1], dateIssued: new Date('2023-08-13T09:20:02.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[0][2], dateIssued: new Date('2023-08-13T09:20:07.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[1][0], dateIssued: new Date('2023-08-13T09:20:13.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[3][2], dateIssued: new Date('2023-08-13T09:31:02.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[2][53], dateIssued: new Date('2023-08-13T09:17:24.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[6], fk_uniform: this.ids.uniformIds[0][63], dateIssued: new Date('2023-08-13T09:13:08.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[6], fk_uniform: this.ids.uniformIds[0][64], dateIssued: new Date('2023-08-13T09:13:17.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[6], fk_uniform: this.ids.uniformIds[3][7], dateIssued: new Date('2023-08-13T09:06:13.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[6], fk_uniform: this.ids.uniformIds[0][65], dateIssued: new Date('2023-08-13T09:13:23.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[6], fk_uniform: this.ids.uniformIds[2][59], dateIssued: new Date('2023-08-13T09:18:25.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[0][75], dateIssued: new Date('2023-08-13T09:12:40.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[0][76], dateIssued: new Date('2023-08-13T09:12:45.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[0][77], dateIssued: new Date('2023-08-13T09:12:50.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[3][6], dateIssued: new Date('2023-08-13T09:06:06.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[1][11], dateIssued: new Date('2023-08-13T09:15:53.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[2][58], dateIssued: new Date('2023-08-13T09:18:19.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[9], fk_uniform: this.ids.uniformIds[0][68], dateIssued: new Date('2023-08-13T09:13:35.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[9], fk_uniform: this.ids.uniformIds[0][69], dateIssued: new Date('2023-08-13T09:13:41.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[9], fk_uniform: this.ids.uniformIds[0][70], dateIssued: new Date('2023-08-13T09:13:45.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[9], fk_uniform: this.ids.uniformIds[3][9], dateIssued: new Date('2023-08-13T09:06:44.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[9], fk_uniform: this.ids.uniformIds[2][61], dateIssued: new Date('2023-08-13T09:18:32.000Z'), dateReturned: null },
            { fk_cadet: this.ids.cadetIds[2], fk_uniform: this.ids.uniformIds[0][55], dateIssued: new Date('2023-08-20T09:00:00.000Z'), dateReturned: new Date('2023-08-25T09:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[0][55], dateIssued: new Date('2023-08-26T09:00:00.000Z'), dateReturned: new Date('2023-08-30T09:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[4], fk_uniform: this.ids.uniformIds[0][55], dateIssued: new Date('2023-09-01T09:00:00.000Z'), dateReturned: new Date('2023-09-05T09:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[0][56], dateIssued: new Date('2023-08-20T10:00:00.000Z'), dateReturned: new Date('2023-08-24T10:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[6], fk_uniform: this.ids.uniformIds[0][56], dateIssued: new Date('2023-08-25T10:00:00.000Z'), dateReturned: new Date('2023-08-29T10:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[7], fk_uniform: this.ids.uniformIds[0][56], dateIssued: new Date('2023-09-01T10:00:00.000Z'), dateReturned: new Date('2023-09-04T10:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[8], fk_uniform: this.ids.uniformIds[0][86], dateIssued: new Date('2023-08-01T09:00:00.000Z'), dateReturned: new Date('2023-08-05T09:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[9], fk_uniform: this.ids.uniformIds[0][86], dateIssued: new Date('2023-08-06T09:00:00.000Z'), dateReturned: new Date('2023-08-10T09:00:00.000Z') },
            { fk_cadet: this.ids.cadetIds[0], fk_uniform: this.ids.uniformIds[0][86], dateIssued: new Date('2023-08-11T09:00:00.000Z'), dateReturned: new Date('2023-08-15T09:00:00.000Z') },
        ];
    }

    materialGroup() {
        return [
            { id: this.ids.materialGroupIds[0], organisationId: this.ids.organisationId, description: 'Gruppe1', issuedDefault: null, sortOrder: 0, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
            { id: this.ids.materialGroupIds[1], organisationId: this.ids.organisationId, description: 'Gruppe2', issuedDefault: 4, sortOrder: 1, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
            { id: this.ids.materialGroupIds[2], organisationId: this.ids.organisationId, description: 'Gruppe3', issuedDefault: null, sortOrder: 2, recdelete: null, recdeleteUser: null, multitypeAllowed: true },
            { id: this.ids.materialGroupIds[3], organisationId: this.ids.organisationId, description: 'Gruppe4', issuedDefault: null, sortOrder: 1, recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', multitypeAllowed: true },
            { id: this.ids.materialGroupIds[4], organisationId: this.ids.organisationId, description: 'Gruppe5', issuedDefault: null, sortOrder: 3, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
        ]
    }

    material() {
        return [
            { id: this.ids.materialIds[0], typename: 'Typ1-1', fk_materialGroup: this.ids.materialGroupIds[0], actualQuantity: 200, targetQuantity: 150, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[1], typename: 'Typ1-2', fk_materialGroup: this.ids.materialGroupIds[0], actualQuantity: 300, targetQuantity: 0, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[2], typename: 'Typ1-3', fk_materialGroup: this.ids.materialGroupIds[0], actualQuantity: 100, targetQuantity: 200, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[3], typename: 'Typ1-4', fk_materialGroup: this.ids.materialGroupIds[0], actualQuantity: 1, targetQuantity: 20, sortOrder: 3, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[4], typename: 'Typ2-1', fk_materialGroup: this.ids.materialGroupIds[1], actualQuantity: 200, targetQuantity: 200, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[5], typename: 'Typ2-2', fk_materialGroup: this.ids.materialGroupIds[1], actualQuantity: 200, targetQuantity: 200, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[6], typename: 'Typ2-3', fk_materialGroup: this.ids.materialGroupIds[1], actualQuantity: 200, targetQuantity: 200, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[7], typename: 'Typ3-1', fk_materialGroup: this.ids.materialGroupIds[2], actualQuantity: 0, targetQuantity: 0, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[8], typename: 'Typ3-2', fk_materialGroup: this.ids.materialGroupIds[2], actualQuantity: 0, targetQuantity: 0, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[9], typename: 'Typ3-3', fk_materialGroup: this.ids.materialGroupIds[2], actualQuantity: 0, targetQuantity: 0, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: this.ids.materialIds[10], typename: 'Typ2-4', fk_materialGroup: this.ids.materialGroupIds[1], actualQuantity: 1, targetQuantity: 20, sortOrder: 2, recdelete: dayjs().subtract(20, "days").toDate(), recdeleteUser: "admin" },
            { id: this.ids.materialIds[11], typename: 'Type4-1', fk_materialGroup: this.ids.materialGroupIds[4], actualQuantity: 0, targetQuantity: 0, sortOrder: 0, recdelete: dayjs().subtract(20, "days").toDate(), recdeleteUser: "admin" }
        ]
    }

    materialIssued() {
        return [
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[8], quantity: 2, dateIssued: new Date('2023-08-13T09:44:43.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: this.ids.materialIds[4], fk_cadet: this.ids.cadetIds[8], quantity: 4, dateIssued: new Date('2023-08-13T09:44:52.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[8], quantity: 1, dateIssued: new Date('2023-08-13T09:44:57.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: this.ids.materialIds[8], fk_cadet: this.ids.cadetIds[8], quantity: 1, dateIssued: new Date('2023-08-13T09:45:03.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[0], quantity: 3, dateIssued: new Date('2023-08-13T09:55:50.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[3], fk_cadet: this.ids.cadetIds[0], quantity: 3, dateIssued: new Date('2023-08-13T09:55:54.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[6], fk_cadet: this.ids.cadetIds[0], quantity: 7, dateIssued: new Date('2023-08-13T09:56:03.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[7], fk_cadet: this.ids.cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:07.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[8], fk_cadet: this.ids.cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:13.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:16.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[5], fk_cadet: this.ids.cadetIds[0], quantity: 4, dateIssued: new Date('2023-08-13T09:56:37.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[4], fk_cadet: this.ids.cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:41.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[7], fk_cadet: this.ids.cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-13T09:55:19.000Z'), dateReturned: new Date('2023-08-16T10:06:43.000Z') },
            { fk_material: this.ids.materialIds[8], fk_cadet: this.ids.cadetIds[1], quantity: 3, dateIssued: new Date('2023-08-13T09:55:22.000Z'), dateReturned: new Date('2023-08-16T10:06:45.000Z') },
            { fk_material: this.ids.materialIds[2], fk_cadet: this.ids.cadetIds[1], quantity: 1, dateIssued: new Date('2023-08-16T10:06:37.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[7], fk_cadet: this.ids.cadetIds[1], quantity: 2, dateIssued: new Date('2023-08-16T10:06:43.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[8], fk_cadet: this.ids.cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-16T10:06:45.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[1], quantity: 2, dateIssued: new Date('2023-08-16T10:06:49.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[6], fk_cadet: this.ids.cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-16T10:06:59.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[1], quantity: 1, dateIssued: new Date('2023-08-13T09:55:05.000Z'), dateReturned: new Date('2023-08-16T10:06:37.000Z') },
            { fk_material: this.ids.materialIds[4], fk_cadet: this.ids.cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-13T09:55:15.000Z'), dateReturned: new Date('2023-08-16T10:06:55.000Z') },
            { fk_material: this.ids.materialIds[4], fk_cadet: this.ids.cadetIds[2], quantity: 2, dateIssued: new Date('2023-08-13T09:57:02.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[3], quantity: 3, dateIssued: new Date('2023-08-13T09:57:40.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[5], fk_cadet: this.ids.cadetIds[3], quantity: 4, dateIssued: new Date('2023-08-13T09:57:45.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[7], fk_cadet: this.ids.cadetIds[3], quantity: 2, dateIssued: new Date('2023-08-13T09:57:48.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[3], quantity: 2, dateIssued: new Date('2023-08-13T09:57:51.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[4], quantity: 1, dateIssued: new Date('2023-08-13T09:57:28.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[5], fk_cadet: this.ids.cadetIds[4], quantity: 4, dateIssued: new Date('2023-08-13T09:57:32.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[8], fk_cadet: this.ids.cadetIds[4], quantity: 3, dateIssued: new Date('2023-08-13T09:57:35.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[5], quantity: 2, dateIssued: new Date('2023-08-13T09:57:16.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[4], fk_cadet: this.ids.cadetIds[5], quantity: 4, dateIssued: new Date('2023-08-13T09:57:20.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[5], quantity: 3, dateIssued: new Date('2023-08-13T09:57:24.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[6], quantity: 2, dateIssued: new Date('2023-08-13T09:58:06.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[6], quantity: 1, dateIssued: new Date('2023-08-13T09:58:13.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[5], fk_cadet: this.ids.cadetIds[6], quantity: 4, dateIssued: new Date('2023-08-13T09:58:16.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[7], fk_cadet: this.ids.cadetIds[6], quantity: 2, dateIssued: new Date('2023-08-13T09:58:27.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[7], quantity: 1, dateIssued: new Date('2023-08-13T09:57:56.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[5], fk_cadet: this.ids.cadetIds[7], quantity: 4, dateIssued: new Date('2023-08-13T09:58:00.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[9], fk_cadet: this.ids.cadetIds[7], quantity: 2, dateIssued: new Date('2023-08-13T09:58:02.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[0], fk_cadet: this.ids.cadetIds[9], quantity: 1, dateIssued: new Date('2023-08-13T09:58:33.000Z'), dateReturned: null },
            { fk_material: this.ids.materialIds[5], fk_cadet: this.ids.cadetIds[9], quantity: 4, dateIssued: new Date('2023-08-13T09:58:48.000Z'), dateReturned: null },
        ]
    }

    deficiencyType(): Prisma.DeficiencyTypeCreateManyInput[] {
        return [
            { id: this.ids.deficiencyTypeIds[0], organisationId: this.ids.organisationId, name: 'Uniform', dependent: 'uniform', relation: null, disabledDate: null, disabledUser: null },
            { id: this.ids.deficiencyTypeIds[1], organisationId: this.ids.organisationId, name: 'Cadet', dependent: 'cadet', relation: null, disabledDate: null, disabledUser: null },
            { id: this.ids.deficiencyTypeIds[2], organisationId: this.ids.organisationId, name: 'CadetUniform', dependent: 'cadet', relation: 'uniform', disabledDate: null, disabledUser: null },
            { id: this.ids.deficiencyTypeIds[3], organisationId: this.ids.organisationId, name: 'CadetMaterial', dependent: 'cadet', relation: 'material', disabledDate: null, disabledUser: null },
            { id: this.ids.deficiencyTypeIds[4], organisationId: this.ids.organisationId, name: 'inactive', dependent: 'cadet', relation: null, disabledDate: new Date('2023-08-13T09:58:00.000Z'), disabledUser: 'test4' },
            { id: this.ids.deficiencyTypeIds[5], organisationId: this.ids.organisationId, name: 'XX unused type', dependent: 'cadet', relation: 'material', disabledDate: null, disabledUser: null },
            { id: this.ids.deficiencyTypeIds[6], organisationId: this.ids.organisationId, name: 'inactive seccond', dependent: 'cadet', relation: 'material', disabledDate: new Date('2023-08-01T09:58:00.000Z'), disabledUser: 'test4' },
            { id: this.ids.deficiencyTypeIds[7], organisationId: this.ids.organisationId, name: 'Uniform Broken', dependent: 'uniform', relation: null, disabledDate: null, disabledUser: null },
        ]
    }
    deficiency() {
        return [
            {
                id: this.ids.deficiencyIds[0], fk_deficiencyType: this.ids.deficiencyTypeIds[0], description: 'Typ1-1184', comment: 'Uniform Deficiency Sven Keller Resolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: this.ids.inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T00:00:00.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: this.ids.deficiencyIds[1], fk_deficiencyType: this.ids.deficiencyTypeIds[0], description: 'Typ1-1146', comment: 'Uniform Deficiency Sven Keller Unresolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-17T00:00:00.000Z'), dateUpdated: new Date('2023-06-17T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test2', userUpdated: 'test3', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[2], fk_deficiencyType: this.ids.deficiencyTypeIds[0], description: 'Typ1-1146', comment: 'Uniform Deficiency Sven Keller Resolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: this.ids.inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T00:00:00.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: this.ids.deficiencyIds[3], fk_deficiencyType: this.ids.deficiencyTypeIds[0], description: 'Typ1-1168', comment: 'Uniform Deficiency Faber Christina Unresolved',
                fk_inspection_created: this.ids.inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[4], fk_deficiencyType: this.ids.deficiencyTypeIds[1], description: 'Ungewaschen', comment: 'Cadet Deficiency Marie Becker Resolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: this.ids.inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T00:00:00.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: this.ids.deficiencyIds[5], fk_deficiencyType: this.ids.deficiencyTypeIds[1], description: 'Description1', comment: 'Cadet Deficiency Sven Keller Unresolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-08T00:00:00.000Z'), dateUpdated: new Date('2023-06-08T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[6], fk_deficiencyType: this.ids.deficiencyTypeIds[1], description: 'Resoved Test', comment: 'Cadet Deficiency Sven Keller Resolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: this.ids.inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T00:00:00.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: this.ids.deficiencyIds[7], fk_deficiencyType: this.ids.deficiencyTypeIds[2], description: 'Typ4-1405', comment: 'CadetUniform Deficiency Lucas Schwartz Unresolved',
                fk_inspection_created: this.ids.inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[8], fk_deficiencyType: this.ids.deficiencyTypeIds[2], description: 'Typ1-1101', comment: 'CadetUniform Deficiency Maik Finkel Unresolved',
                fk_inspection_created: this.ids.inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[9], fk_deficiencyType: this.ids.deficiencyTypeIds[3], description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deficiency Sven Keller Unresolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[10], fk_deficiencyType: this.ids.deficiencyTypeIds[3], description: 'Gruppe2-Typ2-3', comment: 'CadetMaterial Deficiency Sven Keller Unresolved',
                fk_inspection_created: this.ids.inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-10T00:00:00.000Z'), dateUpdated: new Date('2023-06-10T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[11], fk_deficiencyType: this.ids.deficiencyTypeIds[3], description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deeficiency Lucas Schwartz Unresolved',
                fk_inspection_created: this.ids.inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[12], fk_deficiencyType: this.ids.deficiencyTypeIds[3], description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deeficiency Maik Finkel Unresolved',
                fk_inspection_created: this.ids.inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[13], fk_deficiencyType: this.ids.deficiencyTypeIds[4], description: 'Bemerkung', comment: 'DeletedType Deficiency Sven Keller Unresolved',
                fk_inspection_created: this.ids.inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: this.ids.deficiencyIds[14], fk_deficiencyType: this.ids.deficiencyTypeIds[7], description: 'Typ1-1146', comment: 'Broken Uniform Deficiency Resolved',
                fk_inspection_created: null, fk_inspection_resolved: this.ids.inspectionIds[1],
                dateCreated: new Date('2023-07-01T00:00:00.000Z'), dateUpdated: new Date('2023-07-01T00:00:00.000Z'), dateResolved: new Date('2023-08-13T00:00:00.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: this.ids.deficiencyIds[15], fk_deficiencyType: this.ids.deficiencyTypeIds[7], description: 'Typ1-1146', comment: 'Broken Uniform Deficiency Unresolved',
                fk_inspection_created: null, fk_inspection_resolved: null,
                dateCreated: new Date('2023-07-15T00:00:00.000Z'), dateUpdated: new Date('2023-07-15T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
        ]
    }

    cadetDeficiency() {
        return [
            { deficiencyId: this.ids.deficiencyIds[4], fk_cadet: this.ids.cadetIds[1], fk_uniform: null, fk_material: null },
            { deficiencyId: this.ids.deficiencyIds[5], fk_cadet: this.ids.cadetIds[2], fk_uniform: null, fk_material: null },
            { deficiencyId: this.ids.deficiencyIds[6], fk_cadet: this.ids.cadetIds[2], fk_uniform: null, fk_material: null },
            { deficiencyId: this.ids.deficiencyIds[7], fk_cadet: this.ids.cadetIds[3], fk_uniform: this.ids.uniformIds[3][5], fk_material: null },
            { deficiencyId: this.ids.deficiencyIds[8], fk_cadet: this.ids.cadetIds[5], fk_uniform: this.ids.uniformIds[0][1], fk_material: null },
            { deficiencyId: this.ids.deficiencyIds[9], fk_cadet: this.ids.cadetIds[2], fk_uniform: null, fk_material: this.ids.materialIds[0] },
            { deficiencyId: this.ids.deficiencyIds[10], fk_cadet: this.ids.cadetIds[2], fk_uniform: null, fk_material: this.ids.materialIds[6] },
            { deficiencyId: this.ids.deficiencyIds[11], fk_cadet: this.ids.cadetIds[3], fk_uniform: null, fk_material: this.ids.materialIds[0] },
            { deficiencyId: this.ids.deficiencyIds[12], fk_cadet: this.ids.cadetIds[5], fk_uniform: null, fk_material: this.ids.materialIds[0] },
            { deficiencyId: this.ids.deficiencyIds[13], fk_cadet: this.ids.cadetIds[2], fk_uniform: null, fk_material: null },
        ];
    }
    uniformDeficiency() {
        return [
            { deficiencyId: this.ids.deficiencyIds[0], fk_uniform: this.ids.uniformIds[0][84] },
            { deficiencyId: this.ids.deficiencyIds[1], fk_uniform: this.ids.uniformIds[0][46] },
            { deficiencyId: this.ids.deficiencyIds[2], fk_uniform: this.ids.uniformIds[0][46] },
            { deficiencyId: this.ids.deficiencyIds[3], fk_uniform: this.ids.uniformIds[0][68] },
            { deficiencyId: this.ids.deficiencyIds[14], fk_uniform: this.ids.uniformIds[0][46] },
            { deficiencyId: this.ids.deficiencyIds[15], fk_uniform: this.ids.uniformIds[0][46] },
        ];
    }
    inspection() {
        return [
            { id: this.ids.inspectionIds[0], organisationId: this.ids.organisationId, name: "Quartal 1", date: '2023-06-18', timeStart: "07:58", timeEnd: "13:06" },
            { id: this.ids.inspectionIds[1], organisationId: this.ids.organisationId, name: "Quartal 2", date: '2023-08-13', timeStart: "07:58", timeEnd: "13:06" },
            { id: this.ids.inspectionIds[2], organisationId: this.ids.organisationId, name: "expired", date: '2023-08-17', timeStart: null, timeEnd: null },
            { id: this.ids.inspectionIds[3], organisationId: this.ids.organisationId, name: "planned", date: dayjs().add(10, "day").format("YYYY-MM-DD"), timeStart: null, timeEnd: null },
            { id: this.ids.inspectionIds[4], organisationId: this.ids.organisationId, name: "today", date: dayjs().format("YYYY-MM-DD"), timeStart: null, timeEnd: null },
        ] satisfies Inspection[];
    }
    cadetInspection() {
        return [
            { fk_inspection: this.ids.inspectionIds[0], fk_cadet: this.ids.cadetIds[1], uniformComplete: true, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[0], fk_cadet: this.ids.cadetIds[2], uniformComplete: false, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[0], fk_cadet: this.ids.cadetIds[3], uniformComplete: true, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[0], fk_cadet: this.ids.cadetIds[6], uniformComplete: false, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[0], fk_cadet: this.ids.cadetIds[9], uniformComplete: false, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[1], fk_cadet: this.ids.cadetIds[1], uniformComplete: true, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[1], fk_cadet: this.ids.cadetIds[3], uniformComplete: true, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[1], fk_cadet: this.ids.cadetIds[5], uniformComplete: true, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[1], fk_cadet: this.ids.cadetIds[7], uniformComplete: true, inspector: 'test2' },
            { fk_inspection: this.ids.inspectionIds[1], fk_cadet: this.ids.cadetIds[9], uniformComplete: false, inspector: 'test2' },
        ];
    }
    deregistrations() {
        return [
            { fk_cadet: this.ids.cadetIds[6], fk_inspection: this.ids.inspectionIds[4], date: dayjs().subtract(5, "day").toDate() },
            { fk_cadet: this.ids.cadetIds[7], fk_inspection: this.ids.inspectionIds[4], date: dayjs().subtract(5, "day").toDate() },
            { fk_cadet: this.ids.cadetIds[8], fk_inspection: this.ids.inspectionIds[4], date: dayjs().subtract(5, "day").toDate() },
            { fk_cadet: this.ids.cadetIds[9], fk_inspection: this.ids.inspectionIds[4], date: dayjs().subtract(5, "day").toDate() },
            { fk_cadet: this.ids.cadetIds[6], fk_inspection: this.ids.inspectionIds[2], date: dayjs().subtract(5, "day").toDate() },
            { fk_cadet: this.ids.cadetIds[7], fk_inspection: this.ids.inspectionIds[2], date: dayjs().subtract(5, "day").toDate() },
            { fk_cadet: this.ids.cadetIds[8], fk_inspection: this.ids.inspectionIds[2], date: dayjs().subtract(5, "day").toDate() },
        ] satisfies Deregistration[]
    }

    device() {
        const { userIds, deviceIds } = this.ids;
        const baseDate = dayjs();
        
        return [
            // Admin user (userIds[0]) devices
            {
                id: deviceIds[0],
                userId: userIds[0],
                name: 'Admin Desktop Chrome',
                description: 'Primary work desktop',
                createdAt: baseDate.subtract(30, 'days').toDate(),
                lastUsedAt: baseDate.subtract(1, 'hour').toDate(),
                lastLoginAt: baseDate.subtract(1, 'hour').toDate(),
                last2FAAt: baseDate.subtract(7, 'days').toDate(),
                lastIpAddress: '192.168.1.100',
                userAgent: JSON.stringify({
                    browser: { name: 'Chrome', version: '120.0.0.0' },
                    os: { name: 'Windows', version: '10' },
                    device: { type: 'desktop' },
                    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }),
                valid: true
            },
            {
                id: deviceIds[1],
                userId: userIds[0],
                name: 'Admin Mobile Safari',
                description: 'iPhone for mobile access',
                createdAt: baseDate.subtract(15, 'days').toDate(),
                lastUsedAt: baseDate.subtract(3, 'hours').toDate(),
                lastLoginAt: baseDate.subtract(3, 'hours').toDate(),
                last2FAAt: baseDate.subtract(3, 'days').toDate(),
                lastIpAddress: '192.168.1.150',
                userAgent: JSON.stringify({
                    browser: { name: 'Safari', version: '17.0' },
                    os: { name: 'iOS', version: '17.1' },
                    device: { type: 'mobile' },
                    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15'
                }),
                valid: true
            },
            // Manager user (userIds[1]) devices  
            {
                id: deviceIds[2],
                userId: userIds[1],
                name: 'Manager Laptop Firefox',
                description: 'Work laptop',
                createdAt: baseDate.subtract(25, 'days').toDate(),
                lastUsedAt: baseDate.subtract(30, 'minutes').toDate(),
                lastLoginAt: baseDate.subtract(30, 'minutes').toDate(),
                last2FAAt: baseDate.subtract(10, 'days').toDate(),
                lastIpAddress: '192.168.1.101',
                userAgent: JSON.stringify({
                    browser: { name: 'Firefox', version: '119.0' },
                    os: { name: 'Windows', version: '11' },
                    device: { type: 'desktop' },
                    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0'
                }),
                valid: true
            },
            {
                id: deviceIds[3],
                userId: userIds[1],
                name: 'Manager Tablet Chrome',
                description: 'iPad for meetings',
                createdAt: baseDate.subtract(20, 'days').toDate(),
                lastUsedAt: baseDate.subtract(2, 'hours').toDate(),
                lastLoginAt: baseDate.subtract(2, 'hours').toDate(),
                last2FAAt: baseDate.subtract(5, 'days').toDate(),
                lastIpAddress: '192.168.1.160',
                userAgent: JSON.stringify({
                    browser: { name: 'Chrome', version: '119.0.0.0' },
                    os: { name: 'iOS', version: '17.0' },
                    device: { type: 'tablet' },
                    ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
                }),
                valid: true
            },
            // Inspector user (userIds[2]) devices
            {
                id: deviceIds[4],
                userId: userIds[2],
                name: 'Inspector Desktop Edge',
                description: 'Office computer',
                createdAt: baseDate.subtract(40, 'days').toDate(),
                lastUsedAt: baseDate.subtract(5, 'hours').toDate(),
                lastLoginAt: baseDate.subtract(5, 'hours').toDate(),
                last2FAAt: baseDate.subtract(15, 'days').toDate(),
                lastIpAddress: '192.168.1.102',
                userAgent: JSON.stringify({
                    browser: { name: 'Edge', version: '119.0.0.0' },
                    os: { name: 'Windows', version: '10' },
                    device: { type: 'desktop' },
                    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
                }),
                valid: true
            },
            {
                id: deviceIds[5],
                userId: userIds[2],
                name: 'Inspector Phone Chrome',
                description: 'Android phone',
                createdAt: baseDate.subtract(35, 'days').toDate(),
                lastUsedAt: baseDate.subtract(1, 'day').toDate(),
                lastLoginAt: baseDate.subtract(1, 'day').toDate(),
                last2FAAt: baseDate.subtract(12, 'days').toDate(),
                lastIpAddress: '192.168.1.170',
                userAgent: JSON.stringify({
                    browser: { name: 'Chrome', version: '119.0.0.0' },
                    os: { name: 'Android', version: '13' },
                    device: { type: 'mobile' },
                    ua: 'Mozilla/5.0 (Linux; Android 13; SM-G973F) AppleWebKit/537.36'
                }),
                valid: true
            }
        ] satisfies Prisma.DeviceCreateManyInput[];
    }

    refreshToken() {
        const { userIds, deviceIds, refreshTokenIds } = this.ids;
        const baseDate = dayjs();
        
        return [
            // Active tokens - Admin desktop
            {
                token: refreshTokenIds[0].replace(/-/g, ''), // Remove hyphens to make it look more like a proper token
                userId: userIds[0],
                deviceId: deviceIds[0],
                endOfLife: baseDate.add(3, 'days').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.100',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Active tokens - Admin mobile
            {
                token: refreshTokenIds[1].replace(/-/g, ''),
                userId: userIds[0],
                deviceId: deviceIds[1],
                endOfLife: baseDate.add(2, 'days').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.150',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Used token - for testing token reuse scenarios
            {
                token: refreshTokenIds[2].replace(/-/g, ''),
                userId: userIds[0],
                deviceId: deviceIds[0],
                endOfLife: baseDate.add(1, 'day').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.100',
                usedAt: baseDate.subtract(5, 'minutes').toDate(), // Recently used
                usedIpAddress: '192.168.1.100',
                usedUserAgent: JSON.stringify({
                    browser: { name: 'Chrome', version: '120.0.0.0' },
                    os: { name: 'Windows', version: '10' },
                    device: { type: 'desktop' }
                }),
                numberOfUseAttempts: 1
            },
            // Active tokens - Manager laptop
            {
                token: refreshTokenIds[3].replace(/-/g, ''),
                userId: userIds[1],
                deviceId: deviceIds[2],
                endOfLife: baseDate.add(4, 'days').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.101',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Active tokens - Manager tablet
            {
                token: refreshTokenIds[4].replace(/-/g, ''),
                userId: userIds[1],
                deviceId: deviceIds[3],
                endOfLife: baseDate.add(1, 'day').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.160',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Revoked token - for testing
            {
                token: refreshTokenIds[5].replace(/-/g, ''),
                userId: userIds[1],
                deviceId: deviceIds[2],
                endOfLife: baseDate.add(2, 'days').toDate(),
                revoked: true, // Revoked
                issuerIpAddress: '192.168.1.101',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Expired token - for testing
            {
                token: refreshTokenIds[6].replace(/-/g, ''),
                userId: userIds[2],
                deviceId: deviceIds[4],
                endOfLife: baseDate.subtract(1, 'day').toDate(), // Expired
                revoked: false,
                issuerIpAddress: '192.168.1.102',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Active tokens - Inspector desktop
            {
                token: refreshTokenIds[7].replace(/-/g, ''),
                userId: userIds[2],
                deviceId: deviceIds[4],
                endOfLife: baseDate.add(3, 'days').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.102',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Active tokens - Inspector phone
            {
                token: refreshTokenIds[8].replace(/-/g, ''),
                userId: userIds[2],
                deviceId: deviceIds[5],
                endOfLife: baseDate.add(5, 'days').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.170',
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            // Old used token - for reuse detection edge cases
            {
                token: refreshTokenIds[9].replace(/-/g, ''),
                userId: userIds[0],
                deviceId: deviceIds[0],
                endOfLife: baseDate.add(2, 'days').toDate(),
                revoked: false,
                issuerIpAddress: '192.168.1.100',
                usedAt: baseDate.subtract(10, 'minutes').toDate(), // Used 10 minutes ago
                usedIpAddress: '192.168.1.100',
                usedUserAgent: JSON.stringify({
                    browser: { name: 'Chrome', version: '119.0.0.0' }, // Different version
                    os: { name: 'Windows', version: '10' },
                    device: { type: 'desktop' }
                }),
                numberOfUseAttempts: 1
            }
        ] satisfies Prisma.RefreshTokenCreateManyInput[];
    }

    redirects(index: number | string) {
        return [
            { id: this.ids.redirectIds[0], organisationId: this.ids.organisationId, code: 'homepage' + index, target: 'https://example.com/homepage', active: true },
            { id: this.ids.redirectIds[1], organisationId: this.ids.organisationId, code: 'ausbildung' + index, target: 'https://example.com/ausbildung', active: true },
            { id: this.ids.redirectIds[2], organisationId: this.ids.organisationId, code: 'kontakt' + index, target: 'https://example.com/kontakt', active: true },
            { id: this.ids.redirectIds[3], organisationId: this.ids.organisationId, code: 'impressum' + index, target: 'https://example.com/impressum', active: false },
        ] satisfies Redirect[];
    }
}