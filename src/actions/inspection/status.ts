"use server"

import { AuthRole } from "@/lib/AuthRoles";
import { genericSAValidatior, genericSAValidatiorV2 } from "../validations";
import { prisma } from "@/lib/db";
import { InspectionStatus } from "@/types/deficiencyTypes";

export const getInspectionState = (): Promise<InspectionStatus> => genericSAValidatior(
    AuthRole.user,
    true, []
).then(async ({ assosiation }) => {
    const inspection = await prisma.inspection.findFirst({
        where: {
            fk_assosiation: assosiation,
            active: true,
        }
    });
    if (!inspection) {
        return { active: false };
    }

    const [inspectedCadets, activeCadets] = await prisma.$transaction([
        prisma.cadetInspection.aggregate({
            _count: { id: true },
            where: {
                fk_inspection: inspection.id
            }
        }),
        prisma.cadet.aggregate({
            _count: { id: true },
            where: {
                fk_assosiation: assosiation,
                active: true,
                recdelete: null,
            }
        }),
    ]);

    return {
        ...inspection,
        inspectedCadets: inspectedCadets['_count'].id,
        activeCadets: activeCadets['_count'].id
    }
});

export const getInspectedCadetIdList = () => genericSAValidatior(AuthRole.inspector, true, [])
    .then(async ({ assosiation }) =>
        prisma.cadetInspection.findMany({
            select: {
                fk_cadet: true
            },
            where: {
                inspection: {
                    active: true,
                    fk_assosiation: assosiation,
                }
            }
        }).then((data) => data.map(c => c.fk_cadet))
    );

export const startInspection = () => genericSAValidatiorV2(AuthRole.materialManager, true, {})
    .then(async ({ assosiation }) => {
        const i = await prisma.inspection.findFirst({
            where: {
                fk_assosiation: assosiation,
                date: new Date(),
            }
        });

        if (i) {
            if (i.active) return;
            await prisma.inspection.update({
                where: { id: i.id },
                data: { active: true }
            });
        } else {
            await prisma.inspection.create({
                data: {
                    fk_assosiation: assosiation
                }
            });
        }
    })