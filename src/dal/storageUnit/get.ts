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
            where: {
                recdelete: null
            }
        },
    },
});

export type StorageUnitWithUniformItems = Prisma.StorageUnitGetPayload<typeof StorageUnitWithUniformItemsArgs>;

export const getUnitsWithUniformItems = (): Promise<StorageUnitWithUniformItems[]> => genericSANoDataValidator(AuthRole.user).then(
    ([{ organisationId }]) => __unsecuredGetUnitsWithUniformItems(organisationId),
);

export const __unsecuredGetUnitsWithUniformItems = (organisationId: string, client?: Prisma.TransactionClient): Promise<StorageUnitWithUniformItems[]> =>
    (client ?? prisma).storageUnit.findMany({
        where: { organisationId },
        ...StorageUnitWithUniformItemsArgs,
        orderBy: { name: 'asc' },
    });
