import { prisma } from "@/lib/db";
import { Assosiation, AssosiationConfiguration, Cadet, DeficiencyType, Inspection, Material, MaterialGroup, Prisma, Uniform, UniformGeneration, UniformSize, UniformSizelist, UniformType } from "@prisma/client";
import bcrypt from 'bcrypt';
import StaticDataGenerator, { StaticDataIdType } from "./staticDataGenerator";
import { getStaticDataIds } from "./staticDataIds";
const fs = require('fs');

export class StaticData {

    readonly index: number;
    readonly fk_assosiation: string;
    readonly ids: StaticDataIdType;
    readonly data: StaticDataGetter;
    readonly fill: StaticDataLoader;
    readonly cleanup: StaticDataCleanup;

    constructor(i: number) {
        if (i < 0 || i > 99) {
            throw new Error("Index must be between 0 and 99");
        }

        this.index = i;
        this.ids = getStaticDataIds(i);
        this.fk_assosiation = this.ids.fk_assosiation;
        this.data = new StaticDataGetter(i, this.ids);
        this.fill = new StaticDataLoader(this.data);
        this.cleanup = new StaticDataCleanup(this.data, this.fill);
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
    readonly assosiationConfiguration: AssosiationConfiguration;
    readonly cadets: Cadet[];
    readonly userIds: string[];

    readonly uniformSizes: UniformSize[];
    readonly uniformSizelists: UniformSizelist[];
    readonly sizeConnections: { id: string }[][];
    readonly uniformTypes: UniformType[];
    readonly uniformGenerations: UniformGeneration[];

    readonly uniformList: Uniform[];
    readonly uniformIssedEntries: Prisma.UniformIssuedCreateManyInput[];

    readonly materialGroups: MaterialGroup[];
    readonly materialTypes: Material[];
    readonly materialIssuedEntries: Prisma.MaterialIssuedCreateManyInput[];

    readonly deficiencyTypes: DeficiencyType[];
    readonly deficiencies: Prisma.DeficiencyCreateManyInput[];
    readonly cadetDeficiencies: Prisma.CadetDeficiencyCreateManyInput[];
    readonly uniformDeficiencies: Prisma.UniformDeficiencyCreateManyInput[];

    readonly inspections: Inspection[];
    readonly cadetInspections: Prisma.CadetInspectionCreateManyInput[];
    readonly deregistrations: Prisma.DeregistrationCreateManyInput[];
    readonly redirects: Prisma.RedirectCreateManyInput[];

    constructor(i: number, ids: StaticDataIdType) {
        this.index = i;
        const generator = new StaticDataGenerator(ids);
        const { fk_assosiation, userIds, sizeIds, sizelistIds } = ids;
        this.userIds = userIds;

        this.assosiation = {
            id: fk_assosiation,
            name: `Testautomatisation-${i}`,
            acronym: `test${i}`,
            useBeta: false,
        };


        this.assosiationConfiguration = generator.assosiationConfiguration();
        this.cadets = generator.cadet();
        this.uniformSizes = generator.uniformSize();

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
        this.uniformTypes = generator.uniformType();
        this.uniformGenerations = generator.uniformGeneration();
        this.uniformList = generator.uniform();
        this.uniformIssedEntries = generator.uniformIssued();
        this.materialGroups = generator.materialGroup();
        this.materialTypes = generator.material();
        this.materialIssuedEntries = generator.materialIssued();

        this.deficiencyTypes = generator.deficiencyType() as DeficiencyType[];
        this.deficiencies = generator.deficiency();
        this.cadetDeficiencies = generator.cadetDeficiency();
        this.uniformDeficiencies = generator.uniformDeficiency();

        this.inspections = generator.inspection();
        this.cadetInspections = generator.cadetInspection();
        this.deregistrations = generator.deregistrations();
        this.redirects = generator.redirects(i);
    }

    async users() {
        const fk_assosiation = this.assosiation.id;
        const password = await bcrypt.hash(process.env.TEST_USER_PASSWORD??"Test!234" as string, 12);
        return [
            { id: this.userIds[0], fk_assosiation, role: 4, username: 'test4', name: `Test ${this.index} Admin`, password, active: true },
            { id: this.userIds[1], fk_assosiation, role: 3, username: 'test3', name: `Test ${this.index} Verwaltung`, password, active: true },
            { id: this.userIds[2], fk_assosiation, role: 2, username: 'test2', name: `Test ${this.index} Kontrolleur`, password, active: true },
            { id: this.userIds[3], fk_assosiation, role: 1, username: 'test1', name: `Test ${this.index} Nutzer`, password, active: true },
            { id: this.userIds[4], fk_assosiation, role: 1, username: 'test5', name: `Test ${this.index} Gesperrt`, password, active: false },
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
        await this.loader.deregistration();
        await this.loader.deficiencyTypes();
        await this.loader.deficiencies();
        await this.loader.deficienciesCadet();
        await this.loader.deficienciesUniform();
    }
    async user() {
        await this.deleteUsers();
        await this.loader.users();
    }
    async cadet() {
        await prisma.$transaction([
            this.deleteUniformIssued(),
            this.deleteMaterialIssued(),
            prisma.cadetDeficiency.deleteMany({
                where: { cadet: { fk_assosiation: this.data.assosiation.id } }
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

    async uniform(cleanup?: () => Promise<void>) {
        await prisma.$transaction([
            this.deleteUniformIssued(),
            this.deleteDeficiency(),
        ]);
        await this.deleteUniform();

        if (cleanup) {
            await cleanup();
        }

        await this.loader.uniform();
        await this.loader.deficiencies();
        await Promise.all([
            this.loader.uniformIssued(),
            this.loader.deficienciesCadet(),
            this.loader.deficienciesUniform(),
        ]);
    }

    async uniformTypeConfiguration(cleanup?: () => Promise<void>) {
        await this.uniform(async () => {
            await this.deleteUniformGeneration();
            await this.deleteUniformType();

            if (cleanup) {
                await cleanup();
            }

            await this.loader.uniformTypes();
            await this.loader.uniformGenerations();
        });
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

    async materialConfig() {
        await this.deleteMaterialIssued();
        await this.deleteDeficiency();
        await this.deleteMaterial();
        await this.deleteMaterialGroup();

        await this.loader.materialGroups();
        await this.loader.material();
        await this.loader.materialIssued();
        await this.loader.deficiencies();
        await this.loader.deficienciesCadet();
        await this.loader.deficienciesUniform();
    }

    async materialIssued() {
        await this.deleteMaterialIssued();
        await this.loader.materialIssued();
    }

    async removeAssosiation() {
        await this.deleteRedirects();
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
        where: { type: { fk_assosiation: this.fk_assosiation } }
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
        where: { type: { fk_assosiation: this.fk_assosiation } }
    });
    private deleteUniformType = () => prisma.uniformType.deleteMany({
        where: { fk_assosiation: this.fk_assosiation } }
    );
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
        where: { fk_assosiation: this.fk_assosiation }
    });
    private deleteAssosiationConfiguration = () => prisma.assosiationConfiguration.delete({
        where: { assosiationId: this.fk_assosiation }
    });
    private deleteAssosiation = () => prisma.assosiation.delete({
        where: { id: this.fk_assosiation }
    });
    private deleteRedirects = () => prisma.redirect.deleteMany({
        where: { assosiationId: this.fk_assosiation }
    });
}
class StaticDataLoader {
    readonly data: StaticDataGetter;

    constructor(getter: StaticDataGetter) {
        this.data = getter;
    }

    async all() {
        await this.assosiation();
        await this.assosiationConfiguration();
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
        await this.deregistration();
        await this.deficiencyTypes();
        await this.deficiencies();
        await this.deficienciesUniform();
        await this.deficienciesCadet();
        await this.cadetInspections();
        await this.redirects();
    }
    async assosiation() {
        await prisma.assosiation.create({
            data: this.data.assosiation,
        });
    }
    async assosiationConfiguration() {
        await prisma.assosiationConfiguration.create({
            data: this.data.assosiationConfiguration,
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
        await prisma.cadetDeficiency.createMany({
            data: this.data.cadetDeficiencies,
        });
    }
    async deficienciesUniform() {
        await prisma.uniformDeficiency.createMany({
            data: this.data.uniformDeficiencies,
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
    async deregistration() {
        await prisma.deregistration.createMany({
            data: this.data.deregistrations,
        });
    }
    async redirects() {
        await prisma.redirect.createMany({
            data: this.data.redirects,
        });
    }
}
