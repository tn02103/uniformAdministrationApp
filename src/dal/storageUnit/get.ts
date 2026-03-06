import { genericSANoDataValidator } from '@/actions/validations';
import { AuthRole } from '@/lib/AuthRoles';
import { prisma } from '@/lib/db';
import { uniformArgs } from '@/types/globalUniformTypes';
import { Prisma } from '@/prisma/client';

const StorageUnitWithUniformItemsArgs = {
    include: {
        uniformList: {
            ...uniformArgs,
            orderBy: {
                number: 'asc',
            },
            where: {
                recdelete: null
            }
        },
    },
} satisfies Prisma.StorageUnitFindManyArgs;

export type StorageUnitWithUniformItems = Prisma.StorageUnitGetPayload<typeof StorageUnitWithUniformItemsArgs>;

export const getUnitsWithUniformItems = (): Promise<StorageUnitWithUniformItems[]> => genericSANoDataValidator(AuthRole.user).then(
    ([{ assosiation }]) => __unsecuredGetUnitsWithUniformItems(assosiation),
);

export const __unsecuredGetUnitsWithUniformItems = (assosiation: string, client?: Prisma.TransactionClient): Promise<StorageUnitWithUniformItems[]> =>
    (client ?? prisma).storageUnit.findMany({
        where: { assosiationId: assosiation },
        ...StorageUnitWithUniformItemsArgs,
        orderBy: { name: 'asc' },
    });
