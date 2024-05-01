import { prisma } from "@/lib/db";
import { testAssosiationList } from "./newStaticData";
import { StaticDataIdType, StaticDataIds } from "./staticDataIds";

export class StaticDataLoader {

    readonly index: number;
    readonly fk_assosiation: string;
    readonly ids: StaticDataIdType;

    getUsers = () => prisma.user.findMany({
        where: { fk_assosiation: this.fk_assosiation }
    });

    getCadetList = () => prisma.cadet.findMany({
        where: { fk_assosiation: this.fk_assosiation }
    });

    getUniformSizelists = () => prisma.uniformSizelist.findMany({
        where: { fk_assosiation: this.fk_assosiation },
        include: { uniformSizes: true }
    });

    getUniformSizelist = (name: string) => this.getUniformSizelists().then(d => d.find(sl => sl.name === name))

    getUniformSizes = () => prisma.uniformSize.findMany({
        where: { fk_assosiation: this.fk_assosiation }
    });


    getUniformTypeList = () => prisma.uniformType.findMany({
        where: { fk_assosiation: this.fk_assosiation }
    });
    getUniformType = (acronym: string) => this.getUniformTypeList().then(d => d.find(t => t.acronym === acronym));

    getUniformGenerationList = () => prisma.uniformGeneration.findMany({
        where: {
            uniformType: {
                fk_assosiation: this.fk_assosiation
            }
        }
    });

    getDeficiencyList = () => prisma.deficiency.findMany({
        where: {
            DeficiencyType: {
                fk_assosiation: this.fk_assosiation
            }
        }
    });

    constructor(i: number) {
        if (i > testAssosiationList.length) throw Error("");

        this.index = i;
        this.fk_assosiation = testAssosiationList[i].id;
        this.ids = StaticDataIds[i];
    }
}