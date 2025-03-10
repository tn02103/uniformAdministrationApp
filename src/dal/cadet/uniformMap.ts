"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { uniformArgs } from "@/types/globalUniformTypes";
import { Prisma } from "@prisma/client";
import { z } from "zod";


export const getCadetUniformMap = async (props: string): Promise<CadetUniformMap> => genericSAValidator(
    AuthRole.user,
    props,
    z.string().uuid(),
    { cadetId: props }
).then(([, id]) => __unsecuredGetCadetUniformMap(id));

export const __unsecuredGetCadetUniformMap = async (cadetId: string, client?: Prisma.TransactionClient) =>
    (client ?? prisma).uniform.findMany({
        ...uniformArgs,
        where: {
            issuedEntries: {
                some: {
                    fk_cadet: cadetId,
                    dateReturned: null
                }
            },
            recdelete: null,
        },
        orderBy: {
            number: "asc",
        }
    }).then(list => list.reduce(
        (map: CadetUniformMap, item) => {
            if (!map[item.type.id]) {
                map[item.type.id] = [];
            }

            map[item.type.id].push(item);
            return map;
        }, {}
    ));