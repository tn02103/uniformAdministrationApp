import { prisma } from "@/lib/db";
import { Assosiation, Cadet, Prisma, Uniform, UniformGeneration, UniformSize, UniformSizelist, UniformType } from "@prisma/client";
import bcrypt from 'bcrypt';
import { StaticDataIdType } from "../setup";
import StaticDataIds from "./staticDataIds.json";

export class StaticData {

    readonly index: number;
    readonly fk_assosiation: string;
    readonly ids: StaticDataIdType;
    readonly data: StaticDataGetter;
    readonly fill: StaticDataLoader;
    readonly cleanup: StaticDataCleanup;

    constructor(i: number) {
        if (i > StaticDataIds.length) throw Error("");

        this.index = i;
        this.fk_assosiation = StaticDataIds[i].fk_assosiation;
        this.ids = StaticDataIds[i];
        this.data = new StaticDataGetter(i);
        this.fill = new StaticDataLoader(this.data);
        this.cleanup = new StaticDataCleanup(this.data, this.fill)
    }

    async resetData() {
        try {
            const db = await prisma.assosiation.findUnique({
                where: { id: this.fk_assosiation }
            });
            if (db !== null) {
                await this.cleanup.removeAssosiation();
            }
        } catch (e) {
            console.error(e);
        }
        await this.fill.all();
    }
}

class StaticDataGetter {

    readonly index: number;
    readonly assosiation: Assosiation;
    readonly cadets: Cadet[];

    readonly uniformSizes: UniformSize[];
    readonly uniformSizelists: UniformSizelist[];
    readonly sizeConnections: { id: string }[][];
    readonly uniformTypes: UniformType[];
    readonly uniformGenerations: UniformGeneration[];

    readonly uniformList: Uniform[];
    readonly uniformIssedEntries: Prisma.UniformIssuedCreateManyInput[];

    readonly materialGroups: Prisma.MaterialGroupCreateManyInput[];
    readonly materialTypes: Prisma.MaterialCreateManyInput[];
    readonly materialIssuedEntries: Prisma.MaterialIssuedCreateManyInput[];

    readonly deficiencyTypes: Prisma.DeficiencyTypeCreateManyInput[];
    readonly deficiencies: Prisma.DeficiencyCreateManyInput[];
    readonly deficienciesCadet: Prisma.DeficiencyCadetCreateManyInput[];
    readonly deficienciesUniform: Prisma.DeficiencyUniformCreateManyInput[];

    readonly inspections: Prisma.InspectionCreateManyInput[];
    readonly cadetInspections: Prisma.CadetInspectionCreateManyInput[];

    constructor(i: number) {
        this.index = i;
        const { fk_assosiation, cadetIds, sizeIds, sizelistIds, uniformTypeIds, uniformGenerationIds, uniformIds, materialGroupIds, materialIds, deficiencyIds, deficiencyTypeIds, inspectionIds } = StaticDataIds[i];

        this.assosiation = {
            id: StaticDataIds[i].fk_assosiation,
            name: `Testautomatisation-${i}`,
            acronym: `test${i}`,
            useBeta: false,
        };

        this.cadets = [
            { id: cadetIds[0], fk_assosiation, firstname: 'Antje', lastname: 'Fried', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[1], fk_assosiation, firstname: 'Marie', lastname: 'Becker', active: true, comment: 'Bemerkung Test', recdelete: null, recdeleteUser: null },
            { id: cadetIds[2], fk_assosiation, firstname: 'Sven', lastname: 'Keller', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[3], fk_assosiation, firstname: 'Lucas', lastname: 'Schwartz', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[4], fk_assosiation, firstname: 'Uwe', lastname: 'Luft', active: true, comment: 'initial-comment', recdelete: null, recdeleteUser: null },
            { id: cadetIds[5], fk_assosiation, firstname: 'Maik', lastname: 'Finkel', active: true, comment: 'initial-comment', recdelete: null, recdeleteUser: null },
            { id: cadetIds[6], fk_assosiation, firstname: 'Tim', lastname: 'Weissmuller', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[7], fk_assosiation, firstname: 'Juliane', lastname: 'Unger', active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: cadetIds[8], fk_assosiation, firstname: 'Simone', lastname: 'Osterhagen', active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: cadetIds[9], fk_assosiation, firstname: 'Christina', lastname: 'Faber', active: true, comment: '', recdelete: null, recdeleteUser: null },
        ];
        this.uniformSizes = [
            { id: sizeIds[0], name: '0', sortOrder: 1, fk_assosiation },
            { id: sizeIds[1], name: '1', sortOrder: 2, fk_assosiation },
            { id: sizeIds[2], name: '2', sortOrder: 3, fk_assosiation },
            { id: sizeIds[3], name: '3', sortOrder: 4, fk_assosiation },
            { id: sizeIds[4], name: '4', sortOrder: 5, fk_assosiation },
            { id: sizeIds[5], name: '5', sortOrder: 6, fk_assosiation },
            { id: sizeIds[6], name: '6', sortOrder: 7, fk_assosiation },
            { id: sizeIds[7], name: '7', sortOrder: 8, fk_assosiation },
            { id: sizeIds[8], name: '8', sortOrder: 9, fk_assosiation },
            { id: sizeIds[9], name: '9', sortOrder: 10, fk_assosiation },
            { id: sizeIds[10], name: '10', sortOrder: 11, fk_assosiation },
            { id: sizeIds[11], name: '11', sortOrder: 12, fk_assosiation },
            { id: sizeIds[12], name: '12', sortOrder: 13, fk_assosiation },
            { id: sizeIds[13], name: '13', sortOrder: 14, fk_assosiation },
            { id: sizeIds[14], name: '14', sortOrder: 15, fk_assosiation },
            { id: sizeIds[15], name: '15', sortOrder: 16, fk_assosiation },
            { id: sizeIds[16], name: 'Größe16', sortOrder: 17, fk_assosiation },
            { id: sizeIds[17], name: 'Größe17', sortOrder: 18, fk_assosiation },
            { id: sizeIds[18], name: 'Größe18', sortOrder: 19, fk_assosiation },
            { id: sizeIds[19], name: 'Größe19', sortOrder: 20, fk_assosiation },
            { id: sizeIds[20], name: 'Größe20', sortOrder: 21, fk_assosiation },
        ];
        this.uniformSizelists = [
            { id: sizelistIds[0], name: 'Liste1', fk_assosiation },
            { id: sizelistIds[1], name: 'Liste2', fk_assosiation },
            { id: sizelistIds[2], name: 'Liste3', fk_assosiation },
            { id: sizelistIds[3], name: 'Liste4', fk_assosiation },
        ];
        this.sizeConnections = [
            [
                { id: sizeIds[0] },
                { id: sizeIds[1] },
                { id: sizeIds[2] },
                { id: sizeIds[3] },
                { id: sizeIds[4] },
                { id: sizeIds[5] }
            ],
            [
                { id: sizeIds[0] },
                { id: sizeIds[1] },
                { id: sizeIds[2] },
                { id: sizeIds[3] },
                { id: sizeIds[4] },
                { id: sizeIds[5] },
                { id: sizeIds[6] },
                { id: sizeIds[7] },
                { id: sizeIds[8] },
                { id: sizeIds[9] },
                { id: sizeIds[10] },
            ],
            [
                { id: sizeIds[16] },
                { id: sizeIds[17] },
                { id: sizeIds[18] },
                { id: sizeIds[19] },
                { id: sizeIds[20] },
            ],
            [
                { id: sizeIds[0] },
                { id: sizeIds[1] },
                { id: sizeIds[2] },
                { id: sizeIds[3] },
                { id: sizeIds[4] },
                { id: sizeIds[5] }
            ]
        ]
        this.uniformTypes = [
            { id: uniformTypeIds[0], fk_assosiation, name: 'Typ1', acronym: 'AA', issuedDefault: 3, usingGenerations: true, usingSizes: true, fk_defaultSizeList: sizelistIds[0], sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: uniformTypeIds[1], fk_assosiation, name: 'Typ2', acronym: 'AB', issuedDefault: 1, usingGenerations: true, usingSizes: false, fk_defaultSizeList: null, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: uniformTypeIds[2], fk_assosiation, name: 'Typ3', acronym: 'AC', issuedDefault: 1, usingGenerations: false, usingSizes: true, fk_defaultSizeList: sizelistIds[1], sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: uniformTypeIds[3], fk_assosiation, name: 'Typ4', acronym: 'AD', issuedDefault: 1, usingGenerations: false, usingSizes: false, fk_defaultSizeList: null, sortOrder: 3, recdelete: null, recdeleteUser: null },
            { id: uniformTypeIds[4], fk_assosiation, name: 'Typ5', acronym: 'AE', issuedDefault: 1, usingGenerations: false, usingSizes: false, fk_defaultSizeList: null, sortOrder: 2, recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
        ];
        this.uniformGenerations = [
            { id: uniformGenerationIds[0], fk_uniformType: uniformTypeIds[0], name: 'Generation1-1', fk_sizeList: sizelistIds[0], outdated: true, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: uniformGenerationIds[1], fk_uniformType: uniformTypeIds[0], name: 'Generation1-2', fk_sizeList: sizelistIds[0], outdated: false, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: uniformGenerationIds[2], fk_uniformType: uniformTypeIds[0], name: 'Generation1-3', fk_sizeList: sizelistIds[1], outdated: false, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: uniformGenerationIds[3], fk_uniformType: uniformTypeIds[0], name: 'Generation1-4', fk_sizeList: sizelistIds[2], outdated: false, sortOrder: 3, recdelete: null, recdeleteUser: null },
            { id: uniformGenerationIds[4], fk_uniformType: uniformTypeIds[1], name: 'Generation2-1', fk_sizeList: null, outdated: true, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: uniformGenerationIds[5], fk_uniformType: uniformTypeIds[1], name: 'Generation2-2', fk_sizeList: null, outdated: false, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: uniformGenerationIds[6], fk_uniformType: uniformTypeIds[1], name: 'Generation2-3', fk_sizeList: null, outdated: true, sortOrder: 2, recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
        ];
        this.uniformList = [
            { id: uniformIds[0][0], number: 1100, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][1], number: 1101, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[1], active: true, comment: 'AABBCC', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][2], number: 1102, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][3], number: 1103, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][4], number: 1104, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][5], number: 1105, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[2], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][6], number: 1106, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[2], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][7], number: 1107, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[2], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][8], number: 1108, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[3], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][9], number: 1109, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[3], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][10], number: 1110, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][11], number: 1111, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][12], number: 1112, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][13], number: 1113, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][14], number: 1114, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][15], number: 1115, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][16], number: 1116, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][17], number: 1117, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][18], number: 1118, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][19], number: 1119, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][20], number: 1120, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[0], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][21], number: 1121, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[1], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][22], number: 1122, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[1], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][23], number: 1123, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[1], active: false, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][24], number: 1124, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][25], number: 1125, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][26], number: 1126, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][27], number: 1127, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[3], active: true, comment: 'Comment 2', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][28], number: 1128, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][29], number: 1129, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][30], number: 1130, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[3], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: uniformIds[0][31], number: 1131, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[4], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: uniformIds[0][32], number: 1132, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[4], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: uniformIds[0][33], number: 1133, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[5], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: uniformIds[0][34], number: 1134, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[5], active: true, comment: '', recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4' },
            { id: uniformIds[0][35], number: 1135, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][36], number: 1136, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][37], number: 1137, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][38], number: 1138, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[1], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][39], number: 1139, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][40], number: 1140, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][41], number: 1141, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][42], number: 1142, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][43], number: 1143, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][44], number: 1144, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][45], number: 1145, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][46], number: 1146, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][47], number: 1147, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][48], number: 1148, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][49], number: 1149, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][50], number: 1150, fk_uniformType: uniformTypeIds[0], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][51], number: 1151, fk_uniformType: uniformTypeIds[0], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][52], number: 1152, fk_uniformType: uniformTypeIds[0], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][53], number: 1153, fk_uniformType: uniformTypeIds[0], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][54], number: 1154, fk_uniformType: uniformTypeIds[0], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][55], number: 1155, fk_uniformType: uniformTypeIds[0], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][56], number: 1156, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][57], number: 1157, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][58], number: 1158, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][59], number: 1159, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][60], number: 1160, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][61], number: 1161, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][62], number: 1162, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][63], number: 1163, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][64], number: 1164, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][65], number: 1165, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][66], number: 1166, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][67], number: 1167, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][68], number: 1168, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][69], number: 1169, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][70], number: 1170, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][71], number: 1171, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][72], number: 1172, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[2], fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][73], number: 1173, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[16], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][74], number: 1174, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[16], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][75], number: 1175, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[16], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][76], number: 1176, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[17], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][77], number: 1177, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[17], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][78], number: 1178, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[17], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][79], number: 1179, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[18], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][80], number: 1180, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[18], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][81], number: 1181, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[18], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][82], number: 1182, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[19], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][83], number: 1183, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[19], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][84], number: 1184, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[20], active: true, comment: 'Bemerkung 1', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][85], number: 1185, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[20], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[0][86], number: 1186, fk_uniformType: uniformTypeIds[0], fk_generation: uniformGenerationIds[3], fk_size: sizeIds[20], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][0], number: 1200, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][1], number: 1201, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][2], number: 1202, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][3], number: 1203, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][4], number: 1204, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][5], number: 1205, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][6], number: 1206, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][7], number: 1207, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[4], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][8], number: 1208, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][9], number: 1209, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][10], number: 1210, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][11], number: 1211, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][12], number: 1212, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][13], number: 1213, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][14], number: 1214, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[1][15], number: 1215, fk_uniformType: uniformTypeIds[1], fk_generation: uniformGenerationIds[5], fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][0], number: 1300, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][1], number: 1301, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][2], number: 1302, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][3], number: 1303, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][4], number: 1304, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][5], number: 1305, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[1], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][6], number: 1306, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][7], number: 1307, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][8], number: 1308, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][9], number: 1309, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][10], number: 1310, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][11], number: 1311, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][12], number: 1312, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[2], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][13], number: 1313, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][14], number: 1314, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][15], number: 1315, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][16], number: 1316, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][17], number: 1317, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][18], number: 1318, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][19], number: 1319, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[3], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][20], number: 1320, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][21], number: 1321, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][22], number: 1322, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][23], number: 1323, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][24], number: 1324, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[4], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][25], number: 1325, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][26], number: 1326, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][27], number: 1327, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][28], number: 1328, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][29], number: 1329, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][30], number: 1330, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[5], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][31], number: 1331, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][32], number: 1332, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][33], number: 1333, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][34], number: 1334, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][35], number: 1335, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[6], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][36], number: 1336, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][37], number: 1337, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][38], number: 1338, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][39], number: 1339, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][40], number: 1340, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[7], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][41], number: 1341, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][42], number: 1342, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][43], number: 1343, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][44], number: 1344, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][45], number: 1345, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][46], number: 1346, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][47], number: 1347, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[8], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][48], number: 1348, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][49], number: 1349, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][50], number: 1350, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][51], number: 1351, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][52], number: 1352, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[9], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][53], number: 1353, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][54], number: 1354, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][55], number: 1355, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][56], number: 1356, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][57], number: 1357, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][58], number: 1358, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[10], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][59], number: 1359, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][60], number: 1360, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][61], number: 1361, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][62], number: 1362, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][63], number: 1363, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][64], number: 1364, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[2][65], number: 1365, fk_uniformType: uniformTypeIds[2], fk_generation: null, fk_size: sizeIds[0], active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][0], number: 1400, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][1], number: 1401, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][2], number: 1402, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][3], number: 1403, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][4], number: 1404, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][5], number: 1405, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][6], number: 1406, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][7], number: 1407, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][8], number: 1408, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][9], number: 1409, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][10], number: 1410, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][11], number: 1411, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
            { id: uniformIds[3][12], number: 1412, fk_uniformType: uniformTypeIds[3], fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
        ];
        this.uniformIssedEntries = [
            { fk_cadet: cadetIds[8], fk_uniform: uniformIds[3][4], dateIssued: new Date('2023-08-13T09:05:49.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: cadetIds[8], fk_uniform: uniformIds[1][13], dateIssued: new Date('2023-08-13T09:15:41.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: cadetIds[8], fk_uniform: uniformIds[2][56], dateIssued: new Date('2023-08-13T09:18:02.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: cadetIds[8], fk_uniform: uniformIds[0][55], dateIssued: new Date('2023-08-13T09:10:55.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: cadetIds[8], fk_uniform: uniformIds[0][56], dateIssued: new Date('2023-08-13T09:11:00.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: cadetIds[8], fk_uniform: uniformIds[0][57], dateIssued: new Date('2023-08-13T09:11:05.000Z'), dateReturned: new Date('2023-08-16T09:45:25.000Z') },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[3][10], dateIssued: new Date('2023-08-13T09:19:32.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[3][1], dateIssued: new Date('2023-08-13T09:05:19.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[1][15], dateIssued: new Date('2023-08-13T09:29:50.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[0][42], dateIssued: new Date('2023-08-13T09:09:19.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[0][43], dateIssued: new Date('2023-08-13T09:09:26.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[0][44], dateIssued: new Date('2023-08-13T09:09:32.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[0][45], dateIssued: new Date('2023-08-13T09:09:48.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[2][60], dateIssued: new Date('2023-08-13T09:18:50.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[0], fk_uniform: uniformIds[2][50], dateIssued: new Date('2023-08-13T09:19:19.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[3][8], dateIssued: new Date('2023-08-13T09:07:08.000Z'), dateReturned: new Date('2023-08-16T09:43:58.000Z') },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[0][86], dateIssued: new Date('2023-08-16T09:43:05.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[0][85], dateIssued: new Date('2023-08-16T09:43:13.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[0][84], dateIssued: new Date('2023-08-16T09:43:18.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[1][9], dateIssued: new Date('2023-08-16T09:43:34.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[2][62], dateIssued: new Date('2023-08-16T09:43:47.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[3][3], dateIssued: new Date('2023-08-16T09:43:58.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[1][10], dateIssued: new Date('2023-08-13T09:01:20.000Z'), dateReturned: new Date('2023-08-16T09:43:34.000Z') },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[0][73], dateIssued: new Date('2023-08-13T09:01:43.000Z'), dateReturned: new Date('2023-08-16T09:43:13.000Z') },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[0][72], dateIssued: new Date('2023-08-13T09:03:58.000Z'), dateReturned: new Date('2023-08-16T09:43:05.000Z') },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[0][74], dateIssued: new Date('2023-08-13T09:04:03.000Z'), dateReturned: new Date('2023-08-16T09:43:18.000Z') },
            { fk_cadet: cadetIds[1], fk_uniform: uniformIds[2][52], dateIssued: new Date('2023-08-13T09:04:21.000Z'), dateReturned: new Date('2023-08-16T09:43:47.000Z') },
            { fk_cadet: cadetIds[2], fk_uniform: uniformIds[0][46], dateIssued: new Date('2023-08-13T09:10:06.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[2], fk_uniform: uniformIds[0][48], dateIssued: new Date('2023-08-13T09:10:14.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[3], fk_uniform: uniformIds[0][81], dateIssued: new Date('2023-08-13T09:12:22.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[3], fk_uniform: uniformIds[0][82], dateIssued: new Date('2023-08-13T09:12:26.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[3], fk_uniform: uniformIds[3][5], dateIssued: new Date('2023-08-13T09:05:59.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[3], fk_uniform: uniformIds[1][12], dateIssued: new Date('2023-08-13T09:15:48.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[3], fk_uniform: uniformIds[2][57], dateIssued: new Date('2023-08-13T09:18:09.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[3], fk_uniform: uniformIds[0][80], dateIssued: new Date('2023-08-13T09:12:18.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[4], fk_uniform: uniformIds[1][8], dateIssued: new Date('2023-08-13T09:30:08.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[4], fk_uniform: uniformIds[2][0], dateIssued: new Date('2023-08-13T09:30:32.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[4], fk_uniform: uniformIds[3][0], dateIssued: new Date('2023-08-13T09:31:17.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[4], fk_uniform: uniformIds[0][21], dateIssued: new Date('2023-08-13T09:25:19.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[4], fk_uniform: uniformIds[0][22], dateIssued: new Date('2023-08-13T09:25:27.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[4], fk_uniform: uniformIds[0][23], dateIssued: new Date('2023-08-13T09:25:35.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[5], fk_uniform: uniformIds[0][0], dateIssued: new Date('2023-08-13T09:19:56.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[5], fk_uniform: uniformIds[0][1], dateIssued: new Date('2023-08-13T09:20:02.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[5], fk_uniform: uniformIds[0][2], dateIssued: new Date('2023-08-13T09:20:07.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[5], fk_uniform: uniformIds[1][0], dateIssued: new Date('2023-08-13T09:20:13.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[5], fk_uniform: uniformIds[3][2], dateIssued: new Date('2023-08-13T09:31:02.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[5], fk_uniform: uniformIds[2][53], dateIssued: new Date('2023-08-13T09:17:24.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[6], fk_uniform: uniformIds[0][63], dateIssued: new Date('2023-08-13T09:13:08.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[6], fk_uniform: uniformIds[0][64], dateIssued: new Date('2023-08-13T09:13:17.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[6], fk_uniform: uniformIds[3][7], dateIssued: new Date('2023-08-13T09:06:13.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[6], fk_uniform: uniformIds[0][65], dateIssued: new Date('2023-08-13T09:13:23.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[6], fk_uniform: uniformIds[2][59], dateIssued: new Date('2023-08-13T09:18:25.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[7], fk_uniform: uniformIds[0][75], dateIssued: new Date('2023-08-13T09:12:40.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[7], fk_uniform: uniformIds[0][76], dateIssued: new Date('2023-08-13T09:12:45.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[7], fk_uniform: uniformIds[0][77], dateIssued: new Date('2023-08-13T09:12:50.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[7], fk_uniform: uniformIds[3][6], dateIssued: new Date('2023-08-13T09:06:06.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[7], fk_uniform: uniformIds[1][11], dateIssued: new Date('2023-08-13T09:15:53.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[7], fk_uniform: uniformIds[2][58], dateIssued: new Date('2023-08-13T09:18:19.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[9], fk_uniform: uniformIds[0][68], dateIssued: new Date('2023-08-13T09:13:35.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[9], fk_uniform: uniformIds[0][69], dateIssued: new Date('2023-08-13T09:13:41.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[9], fk_uniform: uniformIds[0][70], dateIssued: new Date('2023-08-13T09:13:45.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[9], fk_uniform: uniformIds[3][9], dateIssued: new Date('2023-08-13T09:06:44.000Z'), dateReturned: null },
            { fk_cadet: cadetIds[9], fk_uniform: uniformIds[2][61], dateIssued: new Date('2023-08-13T09:18:32.000Z'), dateReturned: null },
        ];

        this.materialGroups = [
            { id: materialGroupIds[0], fk_assosiation, description: 'Gruppe1', issuedDefault: null, sortOrder: 0, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
            { id: materialGroupIds[1], fk_assosiation, description: 'Gruppe2', issuedDefault: 4, sortOrder: 1, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
            { id: materialGroupIds[2], fk_assosiation, description: 'Gruppe3', issuedDefault: null, sortOrder: 2, recdelete: null, recdeleteUser: null, multitypeAllowed: true },
            { id: materialGroupIds[3], fk_assosiation, description: 'Gruppe4', issuedDefault: null, sortOrder: 1, recdelete: new Date('2023-08-16 09:45:25'), recdeleteUser: 'test4', multitypeAllowed: true },
        ];

        this.materialTypes = [
            { id: materialIds[0], typename: 'Typ1-1', fk_materialGroup: materialGroupIds[0], actualQuantity: 200, targetQuantity: 150, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: materialIds[1], typename: 'Typ1-2', fk_materialGroup: materialGroupIds[0], actualQuantity: 300, targetQuantity: 0, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: materialIds[2], typename: 'Typ1-3', fk_materialGroup: materialGroupIds[0], actualQuantity: 100, targetQuantity: 200, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: materialIds[3], typename: 'Typ1-4', fk_materialGroup: materialGroupIds[0], actualQuantity: 1, targetQuantity: 20, sortOrder: 3, recdelete: null, recdeleteUser: null },
            { id: materialIds[4], typename: 'Typ2-1', fk_materialGroup: materialGroupIds[1], actualQuantity: 200, targetQuantity: 200, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: materialIds[5], typename: 'Typ2-2', fk_materialGroup: materialGroupIds[1], actualQuantity: 200, targetQuantity: 200, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: materialIds[6], typename: 'Typ2-3', fk_materialGroup: materialGroupIds[1], actualQuantity: 200, targetQuantity: 200, sortOrder: 2, recdelete: null, recdeleteUser: null },
            { id: materialIds[7], typename: 'Typ3-1', fk_materialGroup: materialGroupIds[2], actualQuantity: 0, targetQuantity: 0, sortOrder: 0, recdelete: null, recdeleteUser: null },
            { id: materialIds[8], typename: 'Typ3-2', fk_materialGroup: materialGroupIds[2], actualQuantity: 0, targetQuantity: 0, sortOrder: 1, recdelete: null, recdeleteUser: null },
            { id: materialIds[9], typename: 'Typ3-3', fk_materialGroup: materialGroupIds[2], actualQuantity: 0, targetQuantity: 0, sortOrder: 2, recdelete: null, recdeleteUser: null },
        ];

        this.materialIssuedEntries = [
            { fk_material: materialIds[0], fk_cadet: cadetIds[8], quantity: 2, dateIssued: new Date('2023-08-13T09:44:43.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: materialIds[4], fk_cadet: cadetIds[8], quantity: 4, dateIssued: new Date('2023-08-13T09:44:52.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: materialIds[9], fk_cadet: cadetIds[8], quantity: 1, dateIssued: new Date('2023-08-13T09:44:57.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: materialIds[8], fk_cadet: cadetIds[8], quantity: 1, dateIssued: new Date('2023-08-13T09:45:03.000Z'), dateReturned: new Date('2023-08-13T09:45:25.000Z') },
            { fk_material: materialIds[0], fk_cadet: cadetIds[0], quantity: 3, dateIssued: new Date('2023-08-13T09:55:50.000Z'), dateReturned: null },
            { fk_material: materialIds[3], fk_cadet: cadetIds[0], quantity: 3, dateIssued: new Date('2023-08-13T09:55:54.000Z'), dateReturned: null },
            { fk_material: materialIds[6], fk_cadet: cadetIds[0], quantity: 7, dateIssued: new Date('2023-08-13T09:56:03.000Z'), dateReturned: null },
            { fk_material: materialIds[7], fk_cadet: cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:07.000Z'), dateReturned: null },
            { fk_material: materialIds[8], fk_cadet: cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:13.000Z'), dateReturned: null },
            { fk_material: materialIds[9], fk_cadet: cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:16.000Z'), dateReturned: null },
            { fk_material: materialIds[5], fk_cadet: cadetIds[0], quantity: 4, dateIssued: new Date('2023-08-13T09:56:37.000Z'), dateReturned: null },
            { fk_material: materialIds[4], fk_cadet: cadetIds[0], quantity: 2, dateIssued: new Date('2023-08-13T09:56:41.000Z'), dateReturned: null },
            { fk_material: materialIds[7], fk_cadet: cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-13T09:55:19.000Z'), dateReturned: new Date('2023-08-16T10:06:43.000Z') },
            { fk_material: materialIds[8], fk_cadet: cadetIds[1], quantity: 3, dateIssued: new Date('2023-08-13T09:55:22.000Z'), dateReturned: new Date('2023-08-16T10:06:45.000Z') },
            { fk_material: materialIds[2], fk_cadet: cadetIds[1], quantity: 1, dateIssued: new Date('2023-08-16T10:06:37.000Z'), dateReturned: null },
            { fk_material: materialIds[7], fk_cadet: cadetIds[1], quantity: 2, dateIssued: new Date('2023-08-16T10:06:43.000Z'), dateReturned: null },
            { fk_material: materialIds[8], fk_cadet: cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-16T10:06:45.000Z'), dateReturned: null },
            { fk_material: materialIds[9], fk_cadet: cadetIds[1], quantity: 2, dateIssued: new Date('2023-08-16T10:06:49.000Z'), dateReturned: null },
            { fk_material: materialIds[6], fk_cadet: cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-16T10:06:59.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[1], quantity: 1, dateIssued: new Date('2023-08-13T09:55:05.000Z'), dateReturned: new Date('2023-08-16T10:06:37.000Z') },
            { fk_material: materialIds[4], fk_cadet: cadetIds[1], quantity: 4, dateIssued: new Date('2023-08-13T09:55:15.000Z'), dateReturned: new Date('2023-08-16T10:06:55.000Z') },
            { fk_material: materialIds[4], fk_cadet: cadetIds[2], quantity: 2, dateIssued: new Date('2023-08-13T09:57:02.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[3], quantity: 3, dateIssued: new Date('2023-08-13T09:57:40.000Z'), dateReturned: null },
            { fk_material: materialIds[5], fk_cadet: cadetIds[3], quantity: 4, dateIssued: new Date('2023-08-13T09:57:45.000Z'), dateReturned: null },
            { fk_material: materialIds[7], fk_cadet: cadetIds[3], quantity: 2, dateIssued: new Date('2023-08-13T09:57:48.000Z'), dateReturned: null },
            { fk_material: materialIds[9], fk_cadet: cadetIds[3], quantity: 2, dateIssued: new Date('2023-08-13T09:57:51.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[4], quantity: 1, dateIssued: new Date('2023-08-13T09:57:28.000Z'), dateReturned: null },
            { fk_material: materialIds[5], fk_cadet: cadetIds[4], quantity: 4, dateIssued: new Date('2023-08-13T09:57:32.000Z'), dateReturned: null },
            { fk_material: materialIds[8], fk_cadet: cadetIds[4], quantity: 3, dateIssued: new Date('2023-08-13T09:57:35.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[5], quantity: 2, dateIssued: new Date('2023-08-13T09:57:16.000Z'), dateReturned: null },
            { fk_material: materialIds[4], fk_cadet: cadetIds[5], quantity: 4, dateIssued: new Date('2023-08-13T09:57:20.000Z'), dateReturned: null },
            { fk_material: materialIds[9], fk_cadet: cadetIds[5], quantity: 3, dateIssued: new Date('2023-08-13T09:57:24.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[6], quantity: 2, dateIssued: new Date('2023-08-13T09:58:06.000Z'), dateReturned: null },
            { fk_material: materialIds[9], fk_cadet: cadetIds[6], quantity: 1, dateIssued: new Date('2023-08-13T09:58:13.000Z'), dateReturned: null },
            { fk_material: materialIds[5], fk_cadet: cadetIds[6], quantity: 4, dateIssued: new Date('2023-08-13T09:58:16.000Z'), dateReturned: null },
            { fk_material: materialIds[7], fk_cadet: cadetIds[6], quantity: 2, dateIssued: new Date('2023-08-13T09:58:27.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[7], quantity: 1, dateIssued: new Date('2023-08-13T09:57:56.000Z'), dateReturned: null },
            { fk_material: materialIds[5], fk_cadet: cadetIds[7], quantity: 4, dateIssued: new Date('2023-08-13T09:58:00.000Z'), dateReturned: null },
            { fk_material: materialIds[9], fk_cadet: cadetIds[7], quantity: 2, dateIssued: new Date('2023-08-13T09:58:02.000Z'), dateReturned: null },
            { fk_material: materialIds[0], fk_cadet: cadetIds[9], quantity: 1, dateIssued: new Date('2023-08-13T09:58:33.000Z'), dateReturned: null },
            { fk_material: materialIds[5], fk_cadet: cadetIds[9], quantity: 4, dateIssued: new Date('2023-08-13T09:58:48.000Z'), dateReturned: null },
        ];

        this.deficiencyTypes = [
            { id: deficiencyTypeIds[0], fk_assosiation, name: 'Uniform', dependend: 'uniform', relation: null, recdelete: null, recdeleteUser: null },
            { id: deficiencyTypeIds[1], fk_assosiation, name: 'Cadet', dependend: 'cadet', relation: null, recdelete: null, recdeleteUser: null },
            { id: deficiencyTypeIds[2], fk_assosiation, name: 'CadetUniform', dependend: 'cadet', relation: 'uniform', recdelete: null, recdeleteUser: null },
            { id: deficiencyTypeIds[3], fk_assosiation, name: 'CadetMaterial', dependend: 'cadet', relation: 'material', recdelete: null, recdeleteUser: null },
            { id: deficiencyTypeIds[4], fk_assosiation, name: 'deleted', dependend: 'cadet', relation: null, recdelete: new Date('2023-08-13T09:58:00.000Z'), recdeleteUser: 'test4' },
        ];
        this.deficiencies = [
            {
                id: deficiencyIds[0], fk_deficiencyType: deficiencyTypeIds[0], description: 'Typ1-1184', comment: 'Uniform Deficiency Sven Keller Resolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T14:14:28.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: deficiencyIds[1], fk_deficiencyType: deficiencyTypeIds[0], description: 'Typ1-1146', comment: 'Uniform Deficiency Sven Keller Unresolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-17T00:00:00.000Z'), dateUpdated: new Date('2023-06-17T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[2], fk_deficiencyType: deficiencyTypeIds[0], description: 'Typ1-1146', comment: 'Uniform Deficiency Sven Keller Resolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T14:14:28.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: deficiencyIds[3], fk_deficiencyType: deficiencyTypeIds[0], description: 'Typ1-1168', comment: 'Uniform Deficiency Faber Christina Unresolved',
                fk_inspection_created: inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[4], fk_deficiencyType: deficiencyTypeIds[1], description: 'Ungewaschen', comment: 'Cadet Deficiency Marie Becker Resolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T14:14:28.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: deficiencyIds[5], fk_deficiencyType: deficiencyTypeIds[1], description: 'Description1', comment: 'Cadet Deficiency Sven Keller Unresolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-08T00:00:00.000Z'), dateUpdated: new Date('2023-06-08T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[6], fk_deficiencyType: deficiencyTypeIds[1], description: 'Resoved Test', comment: 'Cadet Deficiency Sven Keller Resolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: inspectionIds[1],
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: new Date('2023-08-13T14:14:28.000Z'),
                userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
            },
            {
                id: deficiencyIds[7], fk_deficiencyType: deficiencyTypeIds[2], description: 'Typ4-1405', comment: 'CadetUniform Deficiency Lucas Schwartz Unresolved',
                fk_inspection_created: inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[8], fk_deficiencyType: deficiencyTypeIds[2], description: 'Typ1-1101', comment: 'CadetUniform Deficiency Maik Finkel Unresolved',
                fk_inspection_created: inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[9], fk_deficiencyType: deficiencyTypeIds[3], description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deficiency Sven Keller Unresolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-18T00:00:00.000Z'), dateUpdated: new Date('2023-06-18T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[10], fk_deficiencyType: deficiencyTypeIds[3], description: 'Gruppe2-Typ2-3', comment: 'CadetMaterial Deficiency Sven Keller Unresolved',
                fk_inspection_created: inspectionIds[0], fk_inspection_resolved: null,
                dateCreated: new Date('2023-06-10T00:00:00.000Z'), dateUpdated: new Date('2023-06-10T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[11], fk_deficiencyType: deficiencyTypeIds[3], description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deeficiency Lucas Schwartz Unresolved',
                fk_inspection_created: inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[12], fk_deficiencyType: deficiencyTypeIds[3], description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deeficiency Maik Finkel Unresolved',
                fk_inspection_created: inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
            {
                id: deficiencyIds[13], fk_deficiencyType: deficiencyTypeIds[4], description: 'Bemerkung', comment: 'DeletedType Deficiency Sven Keller Unresolved',
                fk_inspection_created: inspectionIds[1], fk_inspection_resolved: null,
                dateCreated: new Date('2023-08-13T00:00:00.000Z'), dateUpdated: new Date('2023-08-13T00:00:00.000Z'), dateResolved: null,
                userCreated: 'test4', userUpdated: 'test4', userResolved: null
            },
        ];
        this.deficienciesCadet = [
            { deficiencyId: deficiencyIds[4], fk_cadet: cadetIds[1], fk_uniform: null, fk_material: null },
            { deficiencyId: deficiencyIds[5], fk_cadet: cadetIds[2], fk_uniform: null, fk_material: null },
            { deficiencyId: deficiencyIds[6], fk_cadet: cadetIds[2], fk_uniform: null, fk_material: null },
            { deficiencyId: deficiencyIds[7], fk_cadet: cadetIds[3], fk_uniform: uniformIds[3][5], fk_material: null },
            { deficiencyId: deficiencyIds[8], fk_cadet: cadetIds[5], fk_uniform: uniformIds[0][1], fk_material: null },
            { deficiencyId: deficiencyIds[9], fk_cadet: cadetIds[2], fk_uniform: null, fk_material: materialIds[0] },
            { deficiencyId: deficiencyIds[10], fk_cadet: cadetIds[2], fk_uniform: null, fk_material: materialIds[6] },
            { deficiencyId: deficiencyIds[11], fk_cadet: cadetIds[3], fk_uniform: null, fk_material: materialIds[0] },
            { deficiencyId: deficiencyIds[12], fk_cadet: cadetIds[5], fk_uniform: null, fk_material: materialIds[0] },
            { deficiencyId: deficiencyIds[13], fk_cadet: cadetIds[2], fk_uniform: null, fk_material: null },
        ];
        this.deficienciesUniform = [
            { deficiencyId: deficiencyIds[0], fk_uniform: uniformIds[0][84] },
            { deficiencyId: deficiencyIds[1], fk_uniform: uniformIds[0][46] },
            { deficiencyId: deficiencyIds[2], fk_uniform: uniformIds[0][46] },
            { deficiencyId: deficiencyIds[3], fk_uniform: uniformIds[0][68] }
        ];

        this.inspections = [
            { id: inspectionIds[0], fk_assosiation, date: new Date('2023-06-18T00:00:00.000Z'), active: false },
            { id: inspectionIds[1], fk_assosiation, date: new Date('2023-08-13T00:00:00.000Z'), active: false },
        ];
        this.cadetInspections = [
            { fk_inspection: inspectionIds[0], fk_cadet: cadetIds[1], uniformComplete: true },
            { fk_inspection: inspectionIds[0], fk_cadet: cadetIds[2], uniformComplete: false },
            { fk_inspection: inspectionIds[0], fk_cadet: cadetIds[3], uniformComplete: true },
            { fk_inspection: inspectionIds[0], fk_cadet: cadetIds[6], uniformComplete: false },
            { fk_inspection: inspectionIds[0], fk_cadet: cadetIds[9], uniformComplete: false },
            { fk_inspection: inspectionIds[1], fk_cadet: cadetIds[1], uniformComplete: true },
            { fk_inspection: inspectionIds[1], fk_cadet: cadetIds[3], uniformComplete: true },
            { fk_inspection: inspectionIds[1], fk_cadet: cadetIds[5], uniformComplete: true },
            { fk_inspection: inspectionIds[1], fk_cadet: cadetIds[7], uniformComplete: true },
            { fk_inspection: inspectionIds[1], fk_cadet: cadetIds[9], uniformComplete: false },
        ];
    }

    async users() {
        const fk_assosiation = this.assosiation.id;
        const password = await bcrypt.hash(process.env.TEST_USER_PASSWORD as string, 12);
        return [
            { fk_assosiation, role: 4, username: 'test4', name: `Test ${this.index} Admin`, password, active: true },
            { fk_assosiation, role: 3, username: 'test3', name: `Test ${this.index} Verwaltung`, password, active: true },
            { fk_assosiation, role: 2, username: 'test2', name: `Test ${this.index} Kontrolleur`, password, active: true },
            { fk_assosiation, role: 1, username: 'test1', name: `Test ${this.index} Nutzer`, password, active: true },
            { fk_assosiation, role: 1, username: 'test5', name: `Test ${this.index} Gesperrt`, password, active: false },
        ]
    }



}
class StaticDataCleanup {
    readonly data: StaticDataGetter;
    readonly loader: StaticDataLoader;
    readonly fk_assosiation: string;
    constructor(getter: StaticDataGetter, filler: StaticDataLoader) {
        this.data = getter;
        this.loader = filler;
        this.fk_assosiation = getter.assosiation.id;
    }

    async inspection() {
        await this.deleteDeficiency();
        await this.deleteDeficiencyType();
        await this.deleteCadetInspection();
        await this.deleteInspection();

        await this.loader.inspection();
        await this.loader.cadetInspections();
        await this.loader.deficiencyTypes();
        await this.loader.deficiencies();
        await this.loader.deficienciesCadet();
        await this.loader.deficienciesUniform();
    }
    async cadet() {
        await prisma.$transaction([
            this.deleteUniformIssued(),
            this.deleteMaterialIssued(),
            prisma.deficiencyCadet.deleteMany({
                where: { Cadet: { fk_assosiation: this.data.assosiation.id } }
            }),
            this.deleteCadetInspection(),
        ]);
        await this.deleteCadet();

        await this.loader.cadets();
        await this.loader.uniformIssued();
        await this.loader.materialIssued();
        await this.loader.deficienciesCadet();
        await this.loader.cadetInspections();
    }
    async uniformIssued() {
        await this.deleteUniformIssued();
        await this.loader.uniformIssued();
    }

    async uniformTypeConfiguration(cleanup?: () => Promise<void>) {
        await prisma.$transaction([
            this.deleteUniformIssued(),
            this.deleteDeficiency(),
        ]);
        await this.deleteUniform();
        await this.deleteUniformGeneration();
        await this.deleteUniformType();

        if (cleanup) {
            await cleanup();
        }


        await this.loader.uniformTypes();
        await this.loader.uniformGenerations();
        await this.loader.uniform();
        await this.loader.deficiencies();
        await Promise.all([
            this.loader.uniformIssued(),
            this.loader.deficienciesCadet(),
            this.loader.deficienciesUniform(),
        ]);
    }

    async uniformSizeConfiguration() {
        await this.uniformTypeConfiguration(async () => {
            await this.deleteUniformSize();
            await this.deleteUniformSizelist();

            await this.loader.uniformSize();
            await this.loader.uniformSizelists();
            await this.loader.connectSizes();
        });
    }

    async removeAssosiation() {
        await this.deleteDeficiency();
        await this.deleteDeficiencyType();

        await this.deleteCadetInspection();
        await this.deleteInspection();

        await this.deleteMaterial();
        await this.deleteMaterialGroup();

        await this.deleteUniform();
        await this.deleteUniformGeneration();
        await this.deleteUniformType();
        await this.deleteUniformSize();
        await this.deleteUniformSizelist();

        await this.deleteCadet();
        await this.deleteUsers();
        await this.deleteAssosiation();
    }
    private deleteDeficiency = () => prisma.deficiency.deleteMany({
        where: { DeficiencyType: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteDeficiencyType = () => prisma.deficiencyType.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });
    private deleteCadetInspection = () => prisma.cadetInspection.deleteMany({
        where: { inspection: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteInspection = () => prisma.inspection.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });

    private deleteUniformIssued = () => prisma.uniformIssued.deleteMany({
        where: { cadet: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteMaterialIssued = () => prisma.materialIssued.deleteMany({
        where: { cadet: { fk_assosiation: this.fk_assosiation } }
    });

    private deleteMaterial = () => prisma.material.deleteMany({
        where: { materialGroup: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteMaterialGroup = () => prisma.materialGroup.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });

    private deleteUniform = () => prisma.uniform.deleteMany({
        where: { type: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteUniformGeneration = () => prisma.uniformGeneration.deleteMany({
        where: { uniformType: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteUniformType = () => prisma.uniformType.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });
    private deleteUniformSize = () => prisma.uniformSize.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });
    private deleteUniformSizelist = () => prisma.uniformSizelist.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });
    private deleteCadet = () => prisma.cadet.deleteMany({
        where: { fk_assosiation: this.fk_assosiation }
    });
    private deleteUsers = () => prisma.user.deleteMany({
        where: {fk_assosiation: this.fk_assosiation}
    });
    private deleteAssosiation = () => prisma.assosiation.delete({
        where: { id: this.fk_assosiation }
    });
}
class StaticDataLoader {
    readonly data: StaticDataGetter;

    constructor(getter: StaticDataGetter) {
        this.data = getter;
    }

    async all() {
        await this.assosiation();
        await this.users();

        await this.cadets();
        await this.uniformSize();
        await this.uniformSizelists();
        await this.connectSizes();
        await this.uniformTypes();
        await this.uniformGenerations();
        await this.uniform();
        await this.uniformIssued();
        await this.materialGroups();
        await this.material();
        await this.materialIssued();

        await this.inspection();
        await this.deficiencyTypes();
        await this.deficiencies();
        await this.deficienciesUniform();
        await this.deficienciesCadet();
        await this.cadetInspections();
    }
    async assosiation() {
        await prisma.assosiation.create({
            data: this.data.assosiation,
        });
    }
    async users() {
        await prisma.user.createMany({
            data: await this.data.users(),
        });
    }
    async cadets() {
        await prisma.cadet.createMany({
            data: this.data.cadets,
        });
    }
    async uniformSize() {
        await prisma.uniformSize.createMany({
            data: this.data.uniformSizes
        });
    }
    async uniformSizelists() {
        await prisma.uniformSizelist.createMany({
            data: this.data.uniformSizelists,
        });
    }
    async connectSizes() {
        for (let i = 0; i < this.data.uniformSizelists.length; i++) {
            await prisma.uniformSizelist.update({
                where: { id: this.data.uniformSizelists[i].id },
                data: {
                    uniformSizes: {
                        connect: this.data.sizeConnections[i],
                    },
                },
            });
        }
    }

    async uniformTypes() {
        await prisma.uniformType.createMany({
            data: this.data.uniformTypes,
        });
    }
    async uniformGenerations() {
        await prisma.uniformGeneration.createMany({
            data: this.data.uniformGenerations,
        });
    }
    async uniform() {
        await prisma.uniform.createMany({
            data: this.data.uniformList,
        });
    }
    async uniformIssued() {
        await prisma.uniformIssued.createMany({
            data: this.data.uniformIssedEntries,
        });
    }

    async materialGroups() {
        await prisma.materialGroup.createMany({
            data: this.data.materialGroups,
        });
    }
    async material() {
        await prisma.material.createMany({
            data: this.data.materialTypes,
        });
    }
    async materialIssued() {
        await prisma.materialIssued.createMany({
            data: this.data.materialIssuedEntries,
        });
    }

    async deficiencyTypes() {
        await prisma.deficiencyType.createMany({
            data: this.data.deficiencyTypes,
        });
    }
    async deficiencies() {
        await prisma.deficiency.createMany({
            data: this.data.deficiencies,
        });
    }
    async deficienciesCadet() {
        await prisma.deficiencyCadet.createMany({
            data: this.data.deficienciesCadet,
        });
    }
    async deficienciesUniform() {
        await prisma.deficiencyUniform.createMany({
            data: this.data.deficienciesUniform,
        });
    }
    async inspection() {
        await prisma.inspection.createMany({
            data: this.data.inspections,
        });
    }
    async cadetInspections() {
        await prisma.cadetInspection.createMany({
            data: this.data.cadetInspections,
        });
    }
}
