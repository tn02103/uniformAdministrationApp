import { genericSAValidatior } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { cadetArgs } from "@/types/globalCadetTypes";
import { cache } from "react";

export class Cadet {

    readonly cadetId: string;


    constructor(cadetId: string) {
        this.cadetId = cadetId;
    }

    data() {
        "use server"
        return cache(() => genericSAValidatior(
            AuthRole.user,
            uuidValidationPattern.test(this.cadetId),
            [{ type: "cadet", value: this.cadetId }]
        ).then(() => prisma.cadet.findUnique({
            where: { id: this.cadetId },
            ...cadetArgs
        })));
    }
    lastInspected() {
        "use server"
        return genericSAValidatior(
            AuthRole.inspector,
            uuidValidationPattern.test(this.cadetId),
            [{ value: this.cadetId, type: "cadet" }]
        ).then(() => {
            return prisma.inspection.aggregate({
                _max: { date: true },
                where: {
                    cadetInspection: {
                        some: {
                            fk_cadet: this.cadetId,
                        }
                    }
                }
            }).then((data) => data._max.date);
        });
    }
    create(data: {}) {

    }
}


export class Cadets {

    readonly assosiationId: string;

    constructor(assosiationId: string) {
        this.assosiationId = assosiationId;
    }


}