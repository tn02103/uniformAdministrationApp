import { genericSANoDataValidator } from '@/actions/validations';
import { AuthRole } from '@/lib/AuthRoles';
import { prisma } from '@/lib/db';
import { uniformArgs } from '@/types/globalUniformTypes';
import { Prisma } from '@prisma/client';

const StorageUnitWithUniformItemsArgs = Prisma.validator<Prisma.StorageUnitFindManyArgs>()({
    include: {
        uniformList: {
            ...uniformArgs,
            orderBy: {
                number: 'asc',
            },
        },
    },
});

export type StorageUnitWithUniformItems = Prisma.StorageUnitGetPayload<typeof StorageUnitWithUniformItemsArgs>;

export const getUnitsWithUniformItems = (): Promise<StorageUnitWithUniformItems[]> => genericSANoDataValidator(AuthRole.inspector).then(
    ([{ assosiation }]) => prisma.storageUnit.findMany({
        where: { assosiationId: assosiation },
        ...StorageUnitWithUniformItemsArgs,
        orderBy: {name: 'asc'},
    })
);
