import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { IronSessionUser } from "@/lib/ironSession";
import { createDeficiencySchema, CreateDeficiencyInput } from "@/zod/deficiency";
import { __usecuredGetDeficiencyTypeList } from "./type/get";

const getSchema = async ({ assosiation }: IronSessionUser) => {
    const deficiencyTypeList = await __usecuredGetDeficiencyTypeList(assosiation);
    return createDeficiencySchema(deficiencyTypeList);
}

export const createDeficiency = async (props: CreateDeficiencyInput) => genericSAValidator(
    AuthRole.inspector,
    props,
    getSchema,
    {
        deficiencytypeId: props.typeId,
        ...(props.uniformId ? { uniformId: props.uniformId } : {}),
        ...(props.cadetId ? { cadetId: props.cadetId } : {}),
        ...(props.materialId ? { materialId: props.materialId } : {}),
    }
).then(async ([{ username, assosiation }, { typeId, comment, description, uniformId, cadetId, materialId }]) => {
    const type = await prisma.deficiencyType.findFirst({
        where: { id: typeId, fk_assosiation: assosiation },
    });
    if (!type) {
        throw new Error("Deficiency type not found");
    }

    let resolvedDescription = description ?? '';
    if (type.dependent === 'uniform') {
        if (!uniformId) {
            throw new Error("uniformId is required for uniform-dependent deficiency type");
        }
        const uniform = await prisma.uniform.findUnique({
            where: { id: uniformId, recdelete: null },
            include: { type: true },
        });
        if (!uniform) {
            throw new Error('Uniform not found');
        }
        resolvedDescription = `${uniform.type.name}-${uniform.number}`;
    } else if (type.dependent === 'cadet') {
        if (!cadetId) {
            throw new Error("cadetId is required for cadet-dependent deficiency type");
        }
        if (type.relation === 'uniform') {
            if (!uniformId) {
                throw new Error("uniformId is required for cadet deficiency type with uniform relation");
            }
            const issuance = await prisma.uniformIssued.findFirst({
                where: {
                    fk_cadet: cadetId,
                    fk_uniform: uniformId,
                    dateReturned: null,
                },
                include: {
                    uniform: { include: { type: true } },
                },
            });
            if (!issuance) {
                throw new Error("Uniform is not issued to cadet");
            }
            resolvedDescription = `${issuance.uniform.type.name}-${issuance.uniform.number}`;
        } else if (type.relation === 'material') {
            if (!materialId) {
                throw new Error("materialId is required for cadet deficiency type with material relation");
            }
            const material = await prisma.material.findUnique({
                where: { id: materialId, recdelete: null },
            });
            if (!material) {
                throw new Error("Material not found");
            }
            resolvedDescription = material.typename;
        }
    }

    await prisma.deficiency.create({
        data: {
            fk_deficiencyType: typeId,
            comment,
            description: resolvedDescription,
            userCreated: username,
            dateCreated: new Date(),
            userUpdated: username,
            dateUpdated: new Date(),
            fk_inspection_created: null,
            fk_uniform: uniformId ?? undefined,
            fk_cadet: cadetId ?? undefined,
            fk_material: materialId ?? undefined,
        },
    });
});
