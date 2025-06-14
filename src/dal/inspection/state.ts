"use server";
import { genericSAValidatorV2 } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { InspectionStatus } from "@/types/deficiencyTypes";
import dayjs from "@/lib/dayjs";
import { unstable_cache } from "next/cache";

export const getInspectionState = async (): Promise<InspectionStatus | null> => genericSAValidatorV2(
    AuthRole.user, true, {}
).then(async ({ assosiation, role }) => unstable_cache(async (): Promise<InspectionStatus | null> => {
    if (role === AuthRole.user) return null;
    const today = dayjs().format("YYYY-MM-DD");

    const [inspection, unfinished] = await prisma.$transaction([
        prisma.inspection.findFirst({
            where: {
                fk_assosiation: assosiation,
                date: today,
            }
        }),
        prisma.inspection.findFirst({
            where: {
                timeStart: { not: null },
                timeEnd: null,
                date: { lt: today },
            },
        }),
    ]);
    if (unfinished) {
        return {
            active: false,
            state: 'unfinished',
            id: unfinished.id
        }
    }
    if (!inspection) {
        return {
            active: false,
            state: 'none',
        };
    }
    else if (!inspection.timeStart) {
        return {
            active: false,
            state: 'planned',
        };
    } else if (inspection.timeEnd) {
        return {
            active: false,
            state: 'finished',
        };
    }

    const [inspectedCadets, activeCadets, deregistrations] = await prisma.$transaction([
        prisma.cadetInspection.aggregate({
            _count: true,
            where: {
                fk_inspection: inspection.id
            }
        }),
        prisma.cadet.aggregate({
            _count: true,
            where: {
                fk_assosiation: assosiation,
                active: true,
                recdelete: null,
            },
        }),
        prisma.deregistration.aggregate({
            _count: true,
            where: {
                fk_inspection: inspection.id,
                cadet: {
                    active: true,
                    recdelete: null,
                }
            }
        }),
    ]);

    return {
        ...inspection,
        active: true,
        state: 'active',
        inspectedCadets: inspectedCadets._count,
        activeCadets: activeCadets._count,
        deregistrations: deregistrations._count,
    }
}, [`serverA.inspectionState.${assosiation}`], {
    revalidate: process.env.STAGE === "DEV" ? 0.0000001 : 30,
    tags: [`serverA.inspectionState.${assosiation}`]
})());
