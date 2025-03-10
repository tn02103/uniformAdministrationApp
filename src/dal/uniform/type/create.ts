import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";

export const create = () =>
    genericSANoDataValidator(AuthRole.materialManager).then(
        async ([{ assosiation }]) => prisma.$transaction(async (client) => {
            const typeList = await client.uniformType.findMany({
                where: { 
                    fk_assosiation: assosiation,
                    recdelete: null,
                 }
            });

            function getAcronym(): string {
                let acronym: string;
                for (let i = 0; i < 26; i++) {
                    for (let j = 0; j < 26; j++) {
                        acronym = String.fromCharCode(i + 65) + String.fromCharCode(j + 65)
                        if (!typeList.find(t => t.acronym === acronym)) {
                            return acronym;
                        }
                    }
                }
                throw Error("Could not find free Acronym");
            }
            function getName() {
                let i = 1;
                let name: string;
                do {
                    name = `Typ${i}`;
                    i++;
                } while (typeList.find(t => t.name == name));
                return name;
            }

            return await client.uniformType.create({
                ...uniformTypeArgs,
                data: {
                    name: getName(),
                    acronym: getAcronym(),
                    sortOrder: typeList.length,
                    fk_assosiation: assosiation,
                    usingGenerations: true,
                    usingSizes: false,
                }
            })
        })
    );
