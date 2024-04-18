import { Assosiation, Deficiency, DeficiencyCadet, DeficiencyType, DeficiencyUniform } from "@prisma/client";
import { Cadet, Material, MaterialGroup, MaterialIssued, Uniform, UniformGeneration, UniformIssued, UniformSize, UniformType } from "@prisma/client";
import { prisma } from "../../src/lib/db";

export const testAssosiation: Assosiation = {
    id: "85181337-3aa3-11ee-ab4b-0068eb8ba754",
    name: "Testautomatisation",
    acronym: "test",
    useBeta: false,
}
export const testWrongAssosiation: Assosiation = {
    id: "25209715-3aa3-11ee-ab4b-0068eb8ba754",
    name: "TestautoSecconds",
    acronym: "test2",
    useBeta: false,
}
export const testUsers = [
    { id: '0490e8ab-3aa4-11ee-ab4b-0068eb8ba754', fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", role: 4, username: "test4", name: "Test Admin", password: "$2b$12$hrTWOZnQq.M3br.0zp78hOMK7p/0B/Iq4UjQTgv.IBgzmMX7sKHAq", active: true },
    { id: '42c89ed3-3aa4-11ee-ab4b-0068eb8ba754', fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", role: 3, username: "test3", name: "Test Verwaltung", password: "$2b$12$hrTWOZnQq.M3br.0zp78hOMK7p/0B/Iq4UjQTgv.IBgzmMX7sKHAq", active: true },
    { id: '4b0d08f8-3aa4-11ee-ab4b-0068eb8ba754', fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", role: 2, username: "test2", name: "Test Kontrolleur", password: "$2b$12$hrTWOZnQq.M3br.0zp78hOMK7p/0B/Iq4UjQTgv.IBgzmMX7sKHAq", active: true },
    { id: '53153667-3aa4-11ee-ab4b-0068eb8ba754', fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", role: 1, username: "test1", name: "Test Nutzer", password: "$2b$12$hrTWOZnQq.M3br.0zp78hOMK7p/0B/Iq4UjQTgv.IBgzmMX7sKHAq", active: true },
    { id: '23598720-3aa4-11ee-ab4b-0068eb8ba754', fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", role: 1, username: "test5", name: "Test Gesperrt", password: "$2b$12$hrTWOZnQq.M3br.0zp78hOMK7p/0B/Iq4UjQTgv.IBgzmMX7sKHAq", active: false },
    { id: '09872358-3aa4-11ee-ab4b-0068eb8ba754', fk_assosiation: "25209715-3aa3-11ee-ab4b-0068eb8ba754", role: 4, username: "test", name: "Test Nutzer", password: "$2b$12$hrTWOZnQq.M3br.0zp78hOMK7p/0B/Iq4UjQTgv.IBgzmMX7sKHAq", active: true },
]

export const testUniformTypes: UniformType[] = [
    { id: "036ff236-3b83-11ee-ab4b-0068eb8ba754", name: "Typ1", acronym: "AA", issuedDefault: 3, usingGenerations: true, usingSizes: true, fk_defaultSizeList: "23a700ff-3b83-11ee-ab4b-0068eb8ba754", sortOrder: 0, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", recdelete: null, recdeleteUser: null },
    { id: "0b95e809-3b83-11ee-ab4b-0068eb8ba754", name: "Typ2", acronym: "AB", issuedDefault: 1, usingGenerations: true, usingSizes: false, fk_defaultSizeList: null, sortOrder: 1, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", recdelete: null, recdeleteUser: null },
    { id: "0c35d0c1-3b83-11ee-ab4b-0068eb8ba754", name: "Typ3", acronym: "AC", issuedDefault: 1, usingGenerations: false, usingSizes: true, fk_defaultSizeList: "277a262c-3b83-11ee-ab4b-0068eb8ba754", sortOrder: 2, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", recdelete: null, recdeleteUser: null },
    { id: "0cb53b49-3b83-11ee-ab4b-0068eb8ba754", name: "Typ4", acronym: "AD", issuedDefault: 1, usingGenerations: false, usingSizes: false, fk_defaultSizeList: null, sortOrder: 3, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", recdelete: null, recdeleteUser: null },
    { id: "b774faa9-3b85-11ee-ab4b-0068eb8ba754", name: "Typ5", acronym: "AE", issuedDefault: 1, usingGenerations: false, usingSizes: false, fk_defaultSizeList: null, sortOrder: 2, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
    { id: 'a2482328-5719-11ee-afcf-0068eb8ba754', name: 'Typ1', acronym: 'AA', issuedDefault: 1, usingGenerations: true, usingSizes: true, fk_defaultSizeList: 'aa0814fd-5719-11ee-afcf-0068eb8ba754', sortOrder: 0, fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', recdelete: null, recdeleteUser: null },
]
export const testGenerations: UniformGeneration[] = [
    { id: "acc01de5-3b83-11ee-ab4b-0068eb8ba754", fk_uniformType: "036ff236-3b83-11ee-ab4b-0068eb8ba754", name: "Generation1-1", fk_sizeList: "23a700ff-3b83-11ee-ab4b-0068eb8ba754", outdated: true, sortOrder: 0, recdelete: null, recdeleteUser: null },
    { id: "b1f5af66-3b83-11ee-ab4b-0068eb8ba754", fk_uniformType: "036ff236-3b83-11ee-ab4b-0068eb8ba754", name: "Generation1-2", fk_sizeList: "23a700ff-3b83-11ee-ab4b-0068eb8ba754", outdated: false, sortOrder: 1, recdelete: null, recdeleteUser: null },
    { id: "b839a899-3b83-11ee-ab4b-0068eb8ba754", fk_uniformType: "036ff236-3b83-11ee-ab4b-0068eb8ba754", name: "Generation1-3", fk_sizeList: "277a262c-3b83-11ee-ab4b-0068eb8ba754", outdated: false, sortOrder: 2, recdelete: null, recdeleteUser: null },
    { id: "de658fa7-3b83-11ee-ab4b-0068eb8ba754", fk_uniformType: "036ff236-3b83-11ee-ab4b-0068eb8ba754", name: "Generation1-4", fk_sizeList: "2a49e13a-3b83-11ee-ab4b-0068eb8ba754", outdated: false, sortOrder: 3, recdelete: null, recdeleteUser: null },
    { id: "d22540b5-3b83-11ee-ab4b-0068eb8ba754", fk_uniformType: "0b95e809-3b83-11ee-ab4b-0068eb8ba754", name: "Generation2-1", fk_sizeList: null, outdated: true, sortOrder: 0, recdelete: null, recdeleteUser: null },
    { id: "d5b76199-3b83-11ee-ab4b-0068eb8ba754", fk_uniformType: "0b95e809-3b83-11ee-ab4b-0068eb8ba754", name: "Generation2-2", fk_sizeList: null, outdated: false, sortOrder: 1, recdelete: null, recdeleteUser: null },
    { id: "44bfb2cd-3b87-11ee-ab4b-0068eb8ba754", fk_uniformType: "0b95e809-3b83-11ee-ab4b-0068eb8ba754", name: "Generation2-3", fk_sizeList: null, outdated: true, sortOrder: 2, recdelete: new Date('2023-08-15 16:07:58'), recdeleteUser: 'test4' },
    { id: 'ccdef55e-5719-11ee-afcf-0068eb8ba754', fk_uniformType: 'a2482328-5719-11ee-afcf-0068eb8ba754', name: 'Generation1', fk_sizeList: 'aa0814fd-5719-11ee-afcf-0068eb8ba754', sortOrder: 0, outdated: false, recdelete: null, recdeleteUser: null },
]

export const testSizes: UniformSize[] = [
    { id: "585509de-3b83-11ee-ab4b-0068eb8ba754", name: "0", sortOrder: 1, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "3656714b-3b83-11ee-ab4b-0068eb8ba754", name: "1", sortOrder: 2, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "37665288-3b83-11ee-ab4b-0068eb8ba754", name: "2", sortOrder: 3, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "38823b5b-3b83-11ee-ab4b-0068eb8ba754", name: "3", sortOrder: 4, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "39939996-3b83-11ee-ab4b-0068eb8ba754", name: "4", sortOrder: 5, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "3b93f87a-3b83-11ee-ab4b-0068eb8ba754", name: "5", sortOrder: 6, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "402937e7-3b83-11ee-ab4b-0068eb8ba754", name: "6", sortOrder: 7, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "4153c111-3b83-11ee-ab4b-0068eb8ba754", name: "7", sortOrder: 8, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "44a8e9e3-3b83-11ee-ab4b-0068eb8ba754", name: "8", sortOrder: 9, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "45fb2357-3b83-11ee-ab4b-0068eb8ba754", name: "9", sortOrder: 10, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "47c68566-3b83-11ee-ab4b-0068eb8ba754", name: "10", sortOrder: 11, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "491a236d-3b83-11ee-ab4b-0068eb8ba754", name: "11", sortOrder: 12, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "4b6ecca3-3b83-11ee-ab4b-0068eb8ba754", name: "12", sortOrder: 13, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "4caa9a18-3b83-11ee-ab4b-0068eb8ba754", name: "13", sortOrder: 14, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "4f3667fa-3b83-11ee-ab4b-0068eb8ba754", name: "14", sortOrder: 15, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "511e4f71-3b83-11ee-ab4b-0068eb8ba754", name: "15", sortOrder: 16, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "65942979-3b83-11ee-ab4b-0068eb8ba754", name: "Größe16", sortOrder: 17, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "68db2832-3b83-11ee-ab4b-0068eb8ba754", name: "Größe17", sortOrder: 18, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "6c8c017f-3b83-11ee-ab4b-0068eb8ba754", name: "Größe18", sortOrder: 19, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "7189d109-3b83-11ee-ab4b-0068eb8ba754", name: "Größe19", sortOrder: 20, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "74c1b7da-3b83-11ee-ab4b-0068eb8ba754", name: "Größe20", sortOrder: 21, fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: 'b2334000-5719-11ee-afcf-0068eb8ba754', name: 'Größe1', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', sortOrder: 1 },
    { id: 'b586c6e0-5719-11ee-afcf-0068eb8ba754', name: 'Größe2', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', sortOrder: 2 },
]
export const testSizelists = [
    { id: "23a700ff-3b83-11ee-ab4b-0068eb8ba754", name: "Liste1", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "277a262c-3b83-11ee-ab4b-0068eb8ba754", name: "Liste2", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "2a49e13a-3b83-11ee-ab4b-0068eb8ba754", name: "Liste3", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: "34097829-3b83-11ee-ab4b-0068eb8ba754", name: "Liste4", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754" },
    { id: 'aa0814fd-5719-11ee-afcf-0068eb8ba754', name: 'Liste1', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754' },
]
export async function connectionSizesToSizeLists() {
    await prisma.uniformSizelist.update({
        where: { id: "23a700ff-3b83-11ee-ab4b-0068eb8ba754" },
        data: {
            uniformSizes: {
                connect: [
                    { id: "585509de-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "3656714b-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "37665288-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "38823b5b-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "39939996-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "3b93f87a-3b83-11ee-ab4b-0068eb8ba754" }
                ]
            }
        }
    });
    await prisma.uniformSizelist.update({
        where: { id: "277a262c-3b83-11ee-ab4b-0068eb8ba754" },
        data: {
            uniformSizes: {
                connect: [
                    { id: "585509de-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "3656714b-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "37665288-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "38823b5b-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "39939996-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "3b93f87a-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "402937e7-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "4153c111-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "44a8e9e3-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "45fb2357-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "47c68566-3b83-11ee-ab4b-0068eb8ba754" },
                ]
            }
        }
    });
    await prisma.uniformSizelist.update({
        where: { id: "2a49e13a-3b83-11ee-ab4b-0068eb8ba754" },
        data: {
            uniformSizes: {
                connect: [
                    { id: "65942979-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "68db2832-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "6c8c017f-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "7189d109-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "74c1b7da-3b83-11ee-ab4b-0068eb8ba754" },
                ]
            }
        }
    });
    await prisma.uniformSizelist.update({
        where: { id: "34097829-3b83-11ee-ab4b-0068eb8ba754" },
        data: {
            uniformSizes: {
                connect: [
                    { id: "585509de-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "3656714b-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "37665288-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "38823b5b-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "39939996-3b83-11ee-ab4b-0068eb8ba754" },
                    { id: "3b93f87a-3b83-11ee-ab4b-0068eb8ba754" }
                ]
            }
        }
    });
    await prisma.uniformSizelist.update({
        where: { id: "aa0814fd-5719-11ee-afcf-0068eb8ba754" },
        data: {
            uniformSizes: {
                connect: [
                    { id: "b2334000-5719-11ee-afcf-0068eb8ba754" },
                    { id: "b586c6e0-5719-11ee-afcf-0068eb8ba754" }
                ]
            }
        }
    });
}

export const testMaterialGroups: MaterialGroup[] = [
    { id: "4b8b8b36-3c03-11ee-8084-0068eb8ba754", description: "Gruppe1", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", issuedDefault: null, sortOrder: 0, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
    { id: "b9a6c18d-3c03-11ee-8084-0068eb8ba754", description: "Gruppe2", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", issuedDefault: 4, sortOrder: 1, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
    { id: "d87d81f3-3c03-11ee-8084-0068eb8ba754", description: "Gruppe3", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", issuedDefault: null, sortOrder: 2, recdelete: null, recdeleteUser: null, multitypeAllowed: true },
    { id: "d8343452-3c03-11ee-8084-0068eb8ba754", description: "Gruppe4", fk_assosiation: "85181337-3aa3-11ee-ab4b-0068eb8ba754", issuedDefault: null, sortOrder: 1, recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: 'test4', multitypeAllowed: true },
    { id: 'e1f20872-571a-11ee-afcf-0068eb8ba754', description: 'Gruppe1', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', issuedDefault: null, sortOrder: 0, recdelete: null, recdeleteUser: null, multitypeAllowed: false },
]
export const testMaterials: Material[] = [
    { id: "9d09592c-3c03-11ee-8084-0068eb8ba754", typename: "Typ1-1", fk_materialGroup: "4b8b8b36-3c03-11ee-8084-0068eb8ba754", actualQuantity: 200, targetQuantity: 150, sortOrder: 0, recdelete: null, recdeleteUser: null },
    { id: "a5630e5c-3c03-11ee-8084-0068eb8ba754", typename: "Typ1-2", fk_materialGroup: "4b8b8b36-3c03-11ee-8084-0068eb8ba754", actualQuantity: 300, targetQuantity: 0, sortOrder: 1, recdelete: null, recdeleteUser: null },
    { id: "acda1cc8-3c03-11ee-8084-0068eb8ba754", typename: "Typ1-3", fk_materialGroup: "4b8b8b36-3c03-11ee-8084-0068eb8ba754", actualQuantity: 100, targetQuantity: 200, sortOrder: 2, recdelete: null, recdeleteUser: null },
    { id: "b8025f55-3c03-11ee-8084-0068eb8ba754", typename: "Typ1-4", fk_materialGroup: "4b8b8b36-3c03-11ee-8084-0068eb8ba754", actualQuantity: 1, targetQuantity: 20, sortOrder: 3, recdelete: null, recdeleteUser: null },
    { id: "cadbd92f-3c03-11ee-8084-0068eb8ba754", typename: "Typ2-1", fk_materialGroup: "b9a6c18d-3c03-11ee-8084-0068eb8ba754", actualQuantity: 200, targetQuantity: 200, sortOrder: 0, recdelete: null, recdeleteUser: null },
    { id: "d08d5c61-3c03-11ee-8084-0068eb8ba754", typename: "Typ2-2", fk_materialGroup: "b9a6c18d-3c03-11ee-8084-0068eb8ba754", actualQuantity: 200, targetQuantity: 200, sortOrder: 1, recdelete: null, recdeleteUser: null },
    { id: "d652732e-3c03-11ee-8084-0068eb8ba754", typename: "Typ2-3", fk_materialGroup: "b9a6c18d-3c03-11ee-8084-0068eb8ba754", actualQuantity: 200, targetQuantity: 200, sortOrder: 2, recdelete: null, recdeleteUser: null },
    { id: "e56ce632-3c03-11ee-8084-0068eb8ba754", typename: "Typ3-1", fk_materialGroup: "d87d81f3-3c03-11ee-8084-0068eb8ba754", actualQuantity: 0, targetQuantity: 0, sortOrder: 0, recdelete: null, recdeleteUser: null },
    { id: "f123c42d-3c03-11ee-8084-0068eb8ba754", typename: "Typ3-2", fk_materialGroup: "d87d81f3-3c03-11ee-8084-0068eb8ba754", actualQuantity: 0, targetQuantity: 0, sortOrder: 1, recdelete: null, recdeleteUser: null },
    { id: "e9c31e15-3c03-11ee-8084-0068eb8ba754", typename: "Typ3-3", fk_materialGroup: "d87d81f3-3c03-11ee-8084-0068eb8ba754", actualQuantity: 0, targetQuantity: 0, sortOrder: 2, recdelete: null, recdeleteUser: null },
    { id: 'f0459426-571a-11ee-afcf-0068eb8ba754', typename: 'Typ1', fk_materialGroup: 'e1f20872-571a-11ee-afcf-0068eb8ba754', actualQuantity: 0, targetQuantity: 0, sortOrder: 0, recdelete: null, recdeleteUser: null },
]

export const testUniformItems: Uniform[] = [
    { id: '45f31bf3-3c0d-11ee-8084-0068eb8ba754', number: 1119, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31da9-3c0d-11ee-8084-0068eb8ba754', number: 1120, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f2fdcc-3c0d-11ee-8084-0068eb8ba754', number: 1100, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3053a-3c0d-11ee-8084-0068eb8ba754', number: 1101, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: 'AABBCC', recdelete: null, recdeleteUser: null },
    { id: '45f30918-3c0d-11ee-8084-0068eb8ba754', number: 1102, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f309c6-3c0d-11ee-8084-0068eb8ba754', number: 1103, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f30a5e-3c0d-11ee-8084-0068eb8ba754', number: 1104, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f30af6-3c0d-11ee-8084-0068eb8ba754', number: 1105, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f30d6a-3c0d-11ee-8084-0068eb8ba754', number: 1106, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f30dfb-3c0d-11ee-8084-0068eb8ba754', number: 1107, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f30eb7-3c0d-11ee-8084-0068eb8ba754', number: 1108, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f30f3a-3c0d-11ee-8084-0068eb8ba754', number: 1109, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3167a-3c0d-11ee-8084-0068eb8ba754', number: 1110, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31751-3c0d-11ee-8084-0068eb8ba754', number: 1111, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31821-3c0d-11ee-8084-0068eb8ba754', number: 1112, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f318ab-3c0d-11ee-8084-0068eb8ba754', number: 1113, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31930-3c0d-11ee-8084-0068eb8ba754', number: 1114, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f319fa-3c0d-11ee-8084-0068eb8ba754', number: 1115, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31a7a-3c0d-11ee-8084-0068eb8ba754', number: 1116, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31af8-3c0d-11ee-8084-0068eb8ba754', number: 1117, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31b76-3c0d-11ee-8084-0068eb8ba754', number: 1118, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'acc01de5-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32cc2-3c0d-11ee-8084-0068eb8ba754', number: 1136, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32d46-3c0d-11ee-8084-0068eb8ba754', number: 1137, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32dc5-3c0d-11ee-8084-0068eb8ba754', number: 1138, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f31e47-3c0d-11ee-8084-0068eb8ba754', number: 1121, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f322f6-3c0d-11ee-8084-0068eb8ba754', number: 1122, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f323b0-3c0d-11ee-8084-0068eb8ba754', number: 1123, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: false, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3243b-3c0d-11ee-8084-0068eb8ba754', number: 1124, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f324d4-3c0d-11ee-8084-0068eb8ba754', number: 1125, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3255b-3c0d-11ee-8084-0068eb8ba754', number: 1126, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f325df-3c0d-11ee-8084-0068eb8ba754', number: 1127, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: 'Comment 2', recdelete: null, recdeleteUser: null },
    { id: '45f32661-3c0d-11ee-8084-0068eb8ba754', number: 1128, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f326e9-3c0d-11ee-8084-0068eb8ba754', number: 1129, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3297d-3c0d-11ee-8084-0068eb8ba754', number: 1130, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: "test4" },
    { id: '45f32a21-3c0d-11ee-8084-0068eb8ba754', number: 1131, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: "test4" },
    { id: '45f32aa7-3c0d-11ee-8084-0068eb8ba754', number: 1132, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: "test4" },
    { id: '45f32b2c-3c0d-11ee-8084-0068eb8ba754', number: 1133, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: "test4" },
    { id: '45f32bb1-3c0d-11ee-8084-0068eb8ba754', number: 1134, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: "test4" },
    { id: '45f32c35-3c0d-11ee-8084-0068eb8ba754', number: 1135, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b1f5af66-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f34a86-3c0d-11ee-8084-0068eb8ba754', number: 1170, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f34b2a-3c0d-11ee-8084-0068eb8ba754', number: 1171, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f351ad-3c0d-11ee-8084-0068eb8ba754', number: 1172, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32e4c-3c0d-11ee-8084-0068eb8ba754', number: 1139, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32ed3-3c0d-11ee-8084-0068eb8ba754', number: 1140, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32f5d-3c0d-11ee-8084-0068eb8ba754', number: 1141, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f32ff0-3c0d-11ee-8084-0068eb8ba754', number: 1142, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33074-3c0d-11ee-8084-0068eb8ba754', number: 1143, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f330fe-3c0d-11ee-8084-0068eb8ba754', number: 1144, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3317e-3c0d-11ee-8084-0068eb8ba754', number: 1145, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33205-3c0d-11ee-8084-0068eb8ba754', number: 1146, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f332d7-3c0d-11ee-8084-0068eb8ba754', number: 1147, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3337e-3c0d-11ee-8084-0068eb8ba754', number: 1148, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33405-3c0d-11ee-8084-0068eb8ba754', number: 1149, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33489-3c0d-11ee-8084-0068eb8ba754', number: 1150, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33511-3c0d-11ee-8084-0068eb8ba754', number: 1151, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33595-3c0d-11ee-8084-0068eb8ba754', number: 1152, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3362f-3c0d-11ee-8084-0068eb8ba754', number: 1153, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f336b1-3c0d-11ee-8084-0068eb8ba754', number: 1154, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33738-3c0d-11ee-8084-0068eb8ba754', number: 1155, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33978-3c0d-11ee-8084-0068eb8ba754', number: 1156, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33a0a-3c0d-11ee-8084-0068eb8ba754', number: 1157, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33a8f-3c0d-11ee-8084-0068eb8ba754', number: 1158, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33b14-3c0d-11ee-8084-0068eb8ba754', number: 1159, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '4153c111-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33b92-3c0d-11ee-8084-0068eb8ba754', number: 1160, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33c16-3c0d-11ee-8084-0068eb8ba754', number: 1161, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33c93-3c0d-11ee-8084-0068eb8ba754', number: 1162, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33d2a-3c0d-11ee-8084-0068eb8ba754', number: 1163, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33da5-3c0d-11ee-8084-0068eb8ba754', number: 1164, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33e2a-3c0d-11ee-8084-0068eb8ba754', number: 1165, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33ea5-3c0d-11ee-8084-0068eb8ba754', number: 1166, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33f26-3c0d-11ee-8084-0068eb8ba754', number: 1167, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f33fa9-3c0d-11ee-8084-0068eb8ba754', number: 1168, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f349ba-3c0d-11ee-8084-0068eb8ba754', number: 1169, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'b839a899-3b83-11ee-ab4b-0068eb8ba754', fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35279-3c0d-11ee-8084-0068eb8ba754', number: 1173, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '65942979-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35302-3c0d-11ee-8084-0068eb8ba754', number: 1174, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '65942979-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3538b-3c0d-11ee-8084-0068eb8ba754', number: 1175, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '65942979-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35420-3c0d-11ee-8084-0068eb8ba754', number: 1176, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '68db2832-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f354a1-3c0d-11ee-8084-0068eb8ba754', number: 1177, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '68db2832-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35520-3c0d-11ee-8084-0068eb8ba754', number: 1178, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '68db2832-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3559f-3c0d-11ee-8084-0068eb8ba754', number: 1179, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '6c8c017f-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3561d-3c0d-11ee-8084-0068eb8ba754', number: 1180, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '6c8c017f-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35698-3c0d-11ee-8084-0068eb8ba754', number: 1181, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '6c8c017f-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35715-3c0d-11ee-8084-0068eb8ba754', number: 1182, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '7189d109-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35795-3c0d-11ee-8084-0068eb8ba754', number: 1183, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '7189d109-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35815-3c0d-11ee-8084-0068eb8ba754', number: 1184, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '74c1b7da-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: 'Bemerkung 1', recdelete: null, recdeleteUser: null },
    { id: '45f35893-3c0d-11ee-8084-0068eb8ba754', number: 1185, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '74c1b7da-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35923-3c0d-11ee-8084-0068eb8ba754', number: 1186, fk_uniformType: '036ff236-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'de658fa7-3b83-11ee-ab4b-0068eb8ba754', fk_size: '74c1b7da-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35a06-3c0d-11ee-8084-0068eb8ba754', number: 1200, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35acf-3c0d-11ee-8084-0068eb8ba754', number: 1201, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35b54-3c0d-11ee-8084-0068eb8ba754', number: 1202, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35bd1-3c0d-11ee-8084-0068eb8ba754', number: 1203, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35c49-3c0d-11ee-8084-0068eb8ba754', number: 1204, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35cc7-3c0d-11ee-8084-0068eb8ba754', number: 1205, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35d36-3c0d-11ee-8084-0068eb8ba754', number: 1206, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35da7-3c0d-11ee-8084-0068eb8ba754', number: 1207, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd22540b5-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35e15-3c0d-11ee-8084-0068eb8ba754', number: 1208, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35e89-3c0d-11ee-8084-0068eb8ba754', number: 1209, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35ef6-3c0d-11ee-8084-0068eb8ba754', number: 1210, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35f75-3c0d-11ee-8084-0068eb8ba754', number: 1211, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f35fe2-3c0d-11ee-8084-0068eb8ba754', number: 1212, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36054-3c0d-11ee-8084-0068eb8ba754', number: 1213, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f360c3-3c0d-11ee-8084-0068eb8ba754', number: 1214, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36130-3c0d-11ee-8084-0068eb8ba754', number: 1215, fk_uniformType: '0b95e809-3b83-11ee-ab4b-0068eb8ba754', fk_generation: 'd5b76199-3b83-11ee-ab4b-0068eb8ba754', fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38947-3c0d-11ee-8084-0068eb8ba754', number: 1359, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f389c8-3c0d-11ee-8084-0068eb8ba754', number: 1360, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38a8b-3c0d-11ee-8084-0068eb8ba754', number: 1361, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38b60-3c0d-11ee-8084-0068eb8ba754', number: 1362, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38c30-3c0d-11ee-8084-0068eb8ba754', number: 1363, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38cb9-3c0d-11ee-8084-0068eb8ba754', number: 1364, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38d3c-3c0d-11ee-8084-0068eb8ba754', number: 1365, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '585509de-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3619f-3c0d-11ee-8084-0068eb8ba754', number: 1300, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36261-3c0d-11ee-8084-0068eb8ba754', number: 1301, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f362e4-3c0d-11ee-8084-0068eb8ba754', number: 1302, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36362-3c0d-11ee-8084-0068eb8ba754', number: 1303, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f363e2-3c0d-11ee-8084-0068eb8ba754', number: 1304, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3645c-3c0d-11ee-8084-0068eb8ba754', number: 1305, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3656714b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f364cd-3c0d-11ee-8084-0068eb8ba754', number: 1306, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36556-3c0d-11ee-8084-0068eb8ba754', number: 1307, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f365d4-3c0d-11ee-8084-0068eb8ba754', number: 1308, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36649-3c0d-11ee-8084-0068eb8ba754', number: 1309, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f366bd-3c0d-11ee-8084-0068eb8ba754', number: 1310, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36734-3c0d-11ee-8084-0068eb8ba754', number: 1311, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f367ad-3c0d-11ee-8084-0068eb8ba754', number: 1312, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '37665288-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36837-3c0d-11ee-8084-0068eb8ba754', number: 1313, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f368b0-3c0d-11ee-8084-0068eb8ba754', number: 1314, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3692a-3c0d-11ee-8084-0068eb8ba754', number: 1315, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f369a3-3c0d-11ee-8084-0068eb8ba754', number: 1316, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36a18-3c0d-11ee-8084-0068eb8ba754', number: 1317, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36a8f-3c0d-11ee-8084-0068eb8ba754', number: 1318, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36b03-3c0d-11ee-8084-0068eb8ba754', number: 1319, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '38823b5b-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36b8c-3c0d-11ee-8084-0068eb8ba754', number: 1320, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36c0c-3c0d-11ee-8084-0068eb8ba754', number: 1321, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36c90-3c0d-11ee-8084-0068eb8ba754', number: 1322, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36d0b-3c0d-11ee-8084-0068eb8ba754', number: 1323, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36d8d-3c0d-11ee-8084-0068eb8ba754', number: 1324, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '39939996-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36e08-3c0d-11ee-8084-0068eb8ba754', number: 1325, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36e84-3c0d-11ee-8084-0068eb8ba754', number: 1326, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36efc-3c0d-11ee-8084-0068eb8ba754', number: 1327, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36f7a-3c0d-11ee-8084-0068eb8ba754', number: 1328, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f36ffa-3c0d-11ee-8084-0068eb8ba754', number: 1329, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37077-3c0d-11ee-8084-0068eb8ba754', number: 1330, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '3b93f87a-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f370e9-3c0d-11ee-8084-0068eb8ba754', number: 1331, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '402937e7-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37174-3c0d-11ee-8084-0068eb8ba754', number: 1332, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '402937e7-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f371eb-3c0d-11ee-8084-0068eb8ba754', number: 1333, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '402937e7-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37261-3c0d-11ee-8084-0068eb8ba754', number: 1334, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '402937e7-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f372da-3c0d-11ee-8084-0068eb8ba754', number: 1335, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '402937e7-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f373b8-3c0d-11ee-8084-0068eb8ba754', number: 1336, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '4153c111-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37441-3c0d-11ee-8084-0068eb8ba754', number: 1337, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '4153c111-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f374bd-3c0d-11ee-8084-0068eb8ba754', number: 1338, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '4153c111-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3753f-3c0d-11ee-8084-0068eb8ba754', number: 1339, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '4153c111-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f375c2-3c0d-11ee-8084-0068eb8ba754', number: 1340, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '4153c111-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3763c-3c0d-11ee-8084-0068eb8ba754', number: 1341, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f376c0-3c0d-11ee-8084-0068eb8ba754', number: 1342, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37739-3c0d-11ee-8084-0068eb8ba754', number: 1343, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f377ee-3c0d-11ee-8084-0068eb8ba754', number: 1344, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f378b0-3c0d-11ee-8084-0068eb8ba754', number: 1345, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37b38-3c0d-11ee-8084-0068eb8ba754', number: 1346, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37bbf-3c0d-11ee-8084-0068eb8ba754', number: 1347, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '44a8e9e3-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37c6d-3c0d-11ee-8084-0068eb8ba754', number: 1348, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37d3c-3c0d-11ee-8084-0068eb8ba754', number: 1349, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37dcf-3c0d-11ee-8084-0068eb8ba754', number: 1350, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37e4f-3c0d-11ee-8084-0068eb8ba754', number: 1351, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37ec9-3c0d-11ee-8084-0068eb8ba754', number: 1352, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '45fb2357-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37f47-3c0d-11ee-8084-0068eb8ba754', number: 1353, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f37fc4-3c0d-11ee-8084-0068eb8ba754', number: 1354, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38044-3c0d-11ee-8084-0068eb8ba754', number: 1355, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38127-3c0d-11ee-8084-0068eb8ba754', number: 1356, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f38836-3c0d-11ee-8084-0068eb8ba754', number: 1357, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f388cb-3c0d-11ee-8084-0068eb8ba754', number: 1358, fk_uniformType: '0c35d0c1-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: '47c68566-3b83-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3954b-3c0d-11ee-8084-0068eb8ba754', number: 1400, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f395f1-3c0d-11ee-8084-0068eb8ba754', number: 1401, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f39662-3c0d-11ee-8084-0068eb8ba754', number: 1402, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f396ce-3c0d-11ee-8084-0068eb8ba754', number: 1403, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f39735-3c0d-11ee-8084-0068eb8ba754', number: 1404, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f397b0-3c0d-11ee-8084-0068eb8ba754', number: 1405, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3981b-3c0d-11ee-8084-0068eb8ba754', number: 1406, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f3987c-3c0d-11ee-8084-0068eb8ba754', number: 1407, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f398dd-3c0d-11ee-8084-0068eb8ba754', number: 1408, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f39947-3c0d-11ee-8084-0068eb8ba754', number: 1409, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f399a9-3c0d-11ee-8084-0068eb8ba754', number: 1410, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f39aa7-3c0d-11ee-8084-0068eb8ba754', number: 1411, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45f39b42-3c0d-11ee-8084-0068eb8ba754', number: 1412, fk_uniformType: '0cb53b49-3b83-11ee-ab4b-0068eb8ba754', fk_generation: null, fk_size: null, active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '00e8c632-571b-11ee-afcf-0068eb8ba754', number: 2300, fk_uniformType: 'a2482328-5719-11ee-afcf-0068eb8ba754', fk_generation: 'ccdef55e-5719-11ee-afcf-0068eb8ba754', fk_size: 'b2334000-5719-11ee-afcf-0068eb8ba754', active: true, comment: 'wrong assosiation', recdelete: null, recdeleteUser: null },
]


export const testCadets: Cadet[] = [
    { id: '0692ae33-3c12-11ee-8084-0068eb8ba754', firstname: 'Antje', lastname: 'Fried', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '0d06427b-3c12-11ee-8084-0068eb8ba754', firstname: 'Marie', lastname: 'Ackerman', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: 'Bemerkung Test', recdelete: null, recdeleteUser: null },
    { id: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', firstname: 'Sven', lastname: 'Keller', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: 'cbb69711-3c11-11ee-8084-0068eb8ba754', firstname: 'Lucas', lastname: 'Schwartz', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', firstname: 'Uwe', lastname: 'Luft', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: 'db998c2f-3c11-11ee-8084-0068eb8ba754', firstname: 'Maik', lastname: 'Finkel', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: 'e2061e21-3c11-11ee-8084-0068eb8ba754', firstname: 'Tim', lastname: 'Weissmuller', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: 'ee601c39-3c11-11ee-8084-0068eb8ba754', firstname: 'Juliane', lastname: 'Unger', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '004220f5-3c12-11ee-8084-0068eb8ba754', firstname: 'Simone', lastname: 'Osterhagen', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: new Date("2023-08-16 09:45:25"), recdeleteUser: "test4" },
    { id: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', firstname: 'Christina', lastname: 'Faber', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: '', recdelete: null, recdeleteUser: null },
    { id: '45dc48d7-5719-11ee-afcf-0068eb8ba754', firstname: 'Bob', lastname: 'Beispiel', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', active: true, comment: 'wrong assosiation', recdelete: null, recdeleteUser: null },
];

// UNIFORM ISSUED
// Marie Ackerman (0d06427b-3c12-11ee-8084-0068eb8ba754) everything correct with returned
// Antje Fried (0692ae33-3c12-11ee-8084-0068eb8ba754) to many items
// Sven Keller (c4d33a71-3c11-11ee-8084-0068eb8ba754) to little items
// Maik Finkel (db998c2f-3c11-11ee-8084-0068eb8ba754) generations to old
// Uwe Luft (d468ac3c-3c11-11ee-8084-0068eb8ba754) uniformItems deprecated
// Simone Osterhagen (004220f5-3c12-11ee-8084-0068eb8ba754) deleted
export const testUniformIssued: UniformIssued[] = [
    { id: '177fb581-3c14-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f39735-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:05:49.000Z"), dateReturned: new Date("2023-08-16T09:45:25.000Z") },
    { id: '781cc1a3-3c15-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f36054-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:15:41.000Z"), dateReturned: new Date("2023-08-16T09:45:25.000Z") },
    { id: 'cc49ee18-3c15-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f38127-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:18:02.000Z"), dateReturned: new Date("2023-08-16T09:45:25.000Z") },
    { id: 'cdf001bf-3c14-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f33738-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:10:55.000Z"), dateReturned: new Date("2023-08-16T09:45:25.000Z") },
    { id: 'd10093e0-3c14-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f33978-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:11:00.000Z"), dateReturned: new Date("2023-08-16T09:45:25.000Z") },
    { id: 'd3ac8a81-3c14-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f33a0a-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:11:05.000Z"), dateReturned: new Date("2023-08-16T09:45:25.000Z") },
    { id: '01db46f5-3c16-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f399a9-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:19:32.000Z"), dateReturned: null },
    { id: '05a9b9a6-3c14-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f395f1-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:05:19.000Z"), dateReturned: null },
    { id: '72276af1-3c17-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f36130-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:29:50.000Z"), dateReturned: null },
    { id: '94a3f10e-3c14-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f32ff0-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:09:19.000Z"), dateReturned: null },
    { id: '9884050d-3c14-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f33074-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:09:26.000Z"), dateReturned: null },
    { id: '9c3b4a39-3c14-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f330fe-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:09:32.000Z"), dateReturned: null },
    { id: 'a6053fd5-3c14-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f3317e-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:09:48.000Z"), dateReturned: null },
    { id: 'e8a595fb-3c15-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f389c8-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:18:50.000Z"), dateReturned: null },
    { id: 'fa330109-3c15-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f37dcf-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:19:19.000Z"), dateReturned: null },
    { id: '465b43bb-3c14-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f398dd-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:07:08.000Z"), dateReturned: new Date("2023-08-16T09:43:58.000Z") },
    { id: '4c5d58c6-3c19-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35923-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-16T09:43:05.000Z"), dateReturned: null },
    { id: '50e972f5-3c19-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35893-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-16T09:43:13.000Z"), dateReturned: null },
    { id: '53e99700-3c19-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35815-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-16T09:43:18.000Z"), dateReturned: null },
    { id: '5daab41e-3c19-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35e89-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-16T09:43:34.000Z"), dateReturned: null },
    { id: '652d1a6d-3c19-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f38b60-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-16T09:43:47.000Z"), dateReturned: null },
    { id: '6bbf5c72-3c19-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f396ce-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-16T09:43:58.000Z"), dateReturned: null },
    { id: '7749b27b-3c13-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35ef6-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:01:20.000Z"), dateReturned: new Date("2023-08-16T09:43:34.000Z") },
    { id: '84bd175d-3c13-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35279-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:01:43.000Z"), dateReturned: new Date("2023-08-16T09:43:13.000Z") },
    { id: 'd52b6ff9-3c13-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f351ad-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:03:58.000Z"), dateReturned: new Date("2023-08-16T09:43:05.000Z") },
    { id: 'd816d35b-3c13-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f35302-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:04:03.000Z"), dateReturned: new Date("2023-08-16T09:43:18.000Z") },
    { id: 'e32174a7-3c13-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: '45f37ec9-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:04:21.000Z"), dateReturned: new Date("2023-08-16T09:43:47.000Z") },
    { id: 'b0b4a12e-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f33205-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:10:06.000Z"), dateReturned: null },
    { id: 'b55adb65-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3337e-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:10:14.000Z"), dateReturned: null },
    { id: '018a3896-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35698-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:12:22.000Z"), dateReturned: null },
    { id: '03d8e81c-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35715-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:12:26.000Z"), dateReturned: null },
    { id: '1d5bade6-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f397b0-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:05:59.000Z"), dateReturned: null },
    { id: '7c56a412-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35fe2-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:15:48.000Z"), dateReturned: null },
    { id: 'd0336a25-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f38836-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:18:09.000Z"), dateReturned: null },
    { id: 'ff50f7ef-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3561d-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:12:18.000Z"), dateReturned: null },
    { id: '7cfa865b-3c17-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35e15-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:30:08.000Z"), dateReturned: null },
    { id: '8b1e270c-3c17-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3619f-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:30:32.000Z"), dateReturned: null },
    { id: 'a5f4c8e3-3c17-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3954b-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:31:17.000Z"), dateReturned: null },
    { id: 'd0f4710c-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f31e47-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:25:19.000Z"), dateReturned: null },
    { id: 'd56fa011-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f322f6-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:25:27.000Z"), dateReturned: null },
    { id: 'da553fc1-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f323b0-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:25:35.000Z"), dateReturned: null },
    { id: '10725ad5-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f2fdcc-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:19:56.000Z"), dateReturned: null },
    { id: '13e1043d-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3053a-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:20:02.000Z"), dateReturned: null },
    { id: '16b6dbb2-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f30918-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:20:07.000Z"), dateReturned: null },
    { id: '1a646ddf-3c16-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35a06-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:20:13.000Z"), dateReturned: null },
    { id: '9d42e0ab-3c17-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f39662-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:31:02.000Z"), dateReturned: null },
    { id: 'b57071b1-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f37f47-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:17:24.000Z"), dateReturned: null },
    { id: '1d4302f5-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f33d2a-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:13:08.000Z"), dateReturned: null },
    { id: '22404c6d-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f33da5-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:13:17.000Z"), dateReturned: null },
    { id: '25b8306c-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3987c-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:06:13.000Z"), dateReturned: null },
    { id: '25f251d0-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f33e2a-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:13:23.000Z"), dateReturned: null },
    { id: 'da07daff-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f38947-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:18:25.000Z"), dateReturned: null },
    { id: '0c348263-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3538b-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:12:40.000Z"), dateReturned: null },
    { id: '0f449776-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35420-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:12:45.000Z"), dateReturned: null },
    { id: '126f14e8-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f354a1-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:12:50.000Z"), dateReturned: null },
    { id: '21a2a3a1-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3981b-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:06:06.000Z"), dateReturned: null },
    { id: '7fb0122f-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f35f75-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:15:53.000Z"), dateReturned: null },
    { id: 'd63b7e15-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f388cb-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:18:19.000Z"), dateReturned: null },
    { id: '2d1b5de4-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f33fa9-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:13:35.000Z"), dateReturned: null },
    { id: '30923893-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f349ba-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:13:41.000Z"), dateReturned: null },
    { id: '3367f1a9-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f34a86-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:13:45.000Z"), dateReturned: null },
    { id: '38350140-3c14-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f39947-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:06:44.000Z"), dateReturned: null },
    { id: 'de5eacfd-3c15-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f38a8b-3c0d-11ee-8084-0068eb8ba754', dateIssued: new Date("2023-08-13T09:18:32.000Z"), dateReturned: null },
    { id: '81096375-571b-11ee-afcf-0068eb8ba754', fk_cadet: '45dc48d7-5719-11ee-afcf-0068eb8ba754', fk_uniform: '00e8c632-571b-11ee-afcf-0068eb8ba754', dateIssued: new Date('2023-09-19T00:00:00.000Z'), dateReturned: null }
]

// MATERIAL ISSUED
// Marie Ackerman (0d06427b-3c12-11ee-8084-0068eb8ba754) everything correct with returned
// Antje Fried (0692ae33-3c12-11ee-8084-0068eb8ba754) to many issued types and to many or to little items
// Sven Keller (c4d33a71-3c11-11ee-8084-0068eb8ba754) to little items
export const testMaterialIssued: MaterialIssued[] = [
    { id: '869eb7d7-3c19-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:44:43.000Z"), dateReturned: new Date("2023-08-13T09:45:25.000Z") },
    { id: '8c0a4d68-3c19-11ee-8084-0068eb8ba754', fk_material: 'cadbd92f-3c03-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:44:52.000Z"), dateReturned: new Date("2023-08-13T09:45:25.000Z") },
    { id: '8eb91d7d-3c19-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:44:57.000Z"), dateReturned: new Date("2023-08-13T09:45:25.000Z") },
    { id: '92c6f3a2-3c19-11ee-8084-0068eb8ba754', fk_material: 'f123c42d-3c03-11ee-8084-0068eb8ba754', fk_cadet: '004220f5-3c12-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:45:03.000Z"), dateReturned: new Date("2023-08-13T09:45:25.000Z") },
    { id: '13f6a32c-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 3, dateIssued: new Date("2023-08-13T09:55:50.000Z"), dateReturned: null },
    { id: '1671fcc4-3c1b-11ee-8084-0068eb8ba754', fk_material: 'b8025f55-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 3, dateIssued: new Date("2023-08-13T09:55:54.000Z"), dateReturned: null },
    { id: '1be9f99c-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd652732e-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 7, dateIssued: new Date("2023-08-13T09:56:03.000Z"), dateReturned: null },
    { id: '1e4ed402-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e56ce632-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:56:07.000Z"), dateReturned: null },
    { id: '21e79bc2-3c1b-11ee-8084-0068eb8ba754', fk_material: 'f123c42d-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:56:13.000Z"), dateReturned: null },
    { id: '23e6adea-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:56:16.000Z"), dateReturned: null },
    { id: '30270a33-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd08d5c61-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:56:37.000Z"), dateReturned: null },
    { id: '32583763-3c1b-11ee-8084-0068eb8ba754', fk_material: 'cadbd92f-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0692ae33-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:56:41.000Z"), dateReturned: null },
    { id: '019b743d-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e56ce632-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:55:19.000Z"), dateReturned: new Date("2023-08-16T10:06:43.000Z") },
    { id: '0390bd7e-3c1b-11ee-8084-0068eb8ba754', fk_material: 'f123c42d-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 3, dateIssued: new Date("2023-08-13T09:55:22.000Z"), dateReturned: new Date("2023-08-16T10:06:45.000Z") },
    { id: '95fffc72-3c1c-11ee-8084-0068eb8ba754', fk_material: 'acda1cc8-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-16T10:06:37.000Z"), dateReturned: null },
    { id: '990f85ac-3c1c-11ee-8084-0068eb8ba754', fk_material: 'e56ce632-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-16T10:06:43.000Z"), dateReturned: null },
    { id: '9a6804fd-3c1c-11ee-8084-0068eb8ba754', fk_material: 'f123c42d-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-16T10:06:45.000Z"), dateReturned: null },
    { id: '9cfba9bf-3c1c-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-16T10:06:49.000Z"), dateReturned: null },
    { id: 'a2e94f54-3c1c-11ee-8084-0068eb8ba754', fk_material: 'd652732e-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-16T10:06:59.000Z"), dateReturned: null },
    { id: 'f935ad0c-3c1a-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:55:05.000Z"), dateReturned: new Date("2023-08-16T10:06:37.000Z") },
    { id: 'ff5ddcd9-3c1a-11ee-8084-0068eb8ba754', fk_material: 'cadbd92f-3c03-11ee-8084-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:55:15.000Z"), dateReturned: new Date("2023-08-16T10:06:55.000Z") },
    { id: '3ed7f061-3c1b-11ee-8084-0068eb8ba754', fk_material: 'cadbd92f-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:57:02.000Z"), dateReturned: null },
    { id: '55a8f0eb-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', quantity: 3, dateIssued: new Date("2023-08-13T09:57:40.000Z"), dateReturned: null },
    { id: '58a0538c-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd08d5c61-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:57:45.000Z"), dateReturned: null },
    { id: '5a67c5bf-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e56ce632-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:57:48.000Z"), dateReturned: null },
    { id: '5c50f89e-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:57:51.000Z"), dateReturned: null },
    { id: '4ec2431c-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:57:28.000Z"), dateReturned: null },
    { id: '50d5f7c3-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd08d5c61-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:57:32.000Z"), dateReturned: null },
    { id: '52716cfa-3c1b-11ee-8084-0068eb8ba754', fk_material: 'f123c42d-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'd468ac3c-3c11-11ee-8084-0068eb8ba754', quantity: 3, dateIssued: new Date("2023-08-13T09:57:35.000Z"), dateReturned: null },
    { id: '4769473e-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:57:16.000Z"), dateReturned: null },
    { id: '49935236-3c1b-11ee-8084-0068eb8ba754', fk_material: 'cadbd92f-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:57:20.000Z"), dateReturned: null },
    { id: '4bfecd63-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', quantity: 3, dateIssued: new Date("2023-08-13T09:57:24.000Z"), dateReturned: null },
    { id: '6570453c-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:58:06.000Z"), dateReturned: null },
    { id: '691333ed-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:58:13.000Z"), dateReturned: null },
    { id: '6b6db329-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd08d5c61-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:58:16.000Z"), dateReturned: null },
    { id: '71d05f0e-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e56ce632-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:58:27.000Z"), dateReturned: null },
    { id: '5f4011e4-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:57:56.000Z"), dateReturned: null },
    { id: '614ffc52-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd08d5c61-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:58:00.000Z"), dateReturned: null },
    { id: '62d7d07a-3c1b-11ee-8084-0068eb8ba754', fk_material: 'e9c31e15-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', quantity: 2, dateIssued: new Date("2023-08-13T09:58:02.000Z"), dateReturned: null },
    { id: '7571708a-3c1b-11ee-8084-0068eb8ba754', fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', quantity: 1, dateIssued: new Date("2023-08-13T09:58:33.000Z"), dateReturned: null },
    { id: '7e226e96-3c1b-11ee-8084-0068eb8ba754', fk_material: 'd08d5c61-3c03-11ee-8084-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', quantity: 4, dateIssued: new Date("2023-08-13T09:58:48.000Z"), dateReturned: null },
    { id: '84c16be8-571b-11ee-afcf-0068eb8ba754', fk_material: 'f0459426-571a-11ee-afcf-0068eb8ba754', fk_cadet: '45dc48d7-5719-11ee-afcf-0068eb8ba754', quantity: 4, dateIssued: new Date('2023-09-19T18:37:00.000Z'), dateReturned: null },
]

// INSPECTION
// Marie Ackerman hatte mal Mängel jetzt ohne, beide kontrollen
// Sven Keller, hat Mängel vorletze Kontrolle 
// Antje Fried, keine Mängel, nie kontrolliert
// Maik Finkel, nur letzte Kontrolle, mit Mängel
export const testDeficiencyTypes: DeficiencyType[] = [
    { id: '4ae2c25c-3dcf-11ee-ac41-0068eb8ba754', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', name: 'Uniform', dependend: 'uniform', relation: null, recdelete: null, recdeleteUser: null },
    { id: '4ae2c8d9-3dcf-11ee-ac41-0068eb8ba754', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', name: 'Cadet', dependend: 'cadet', relation: null, recdelete: null, recdeleteUser: null },
    { id: '4ae2c800-3dcf-11ee-ac41-0068eb8ba754', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', name: 'CadetUniform', dependend: 'cadet', relation: 'uniform', recdelete: null, recdeleteUser: null },
    { id: '4ae2c897-3dcf-11ee-ac41-0068eb8ba754', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', name: 'CadetMaterial', dependend: 'cadet', relation: 'material', recdelete: null, recdeleteUser: null },
    { id: '4ae2c8d9-3dcf-11ee-ac41-314560987454', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', name: 'deleted', dependend: 'cadet', relation: null, recdelete: new Date("2023-08-13T09:58:00.000Z"), recdeleteUser: 'test4' },
    { id: '23422349-3dcf-11ee-ac41-0068eb8ba754', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', name: 'DefciciencyTyp1', dependend: 'cadet', relation: 'uniform', recdelete: null, recdeleteUser: null },
];
export const testDeficiencies: Deficiency[] = [
    {
        id: '8b6468ab-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c25c-3dcf-11ee-ac41-0068eb8ba754', description: 'Typ1-1184', comment: 'Uniform Deficiency Sven Keller Resolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754',
        dateCreated: new Date("2023-06-18T00:00:00.000Z"), dateUpdated: new Date("2023-06-18T00:00:00.000Z"), dateResolved: new Date("2023-08-13T14:14:28.000Z"),
        userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
    },
    {
        id: 'ccffb98b-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c25c-3dcf-11ee-ac41-0068eb8ba754', description: 'Typ1-1146', comment: 'Uniform Deficiency Sven Keller Unresolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-06-17T00:00:00.000Z"), dateUpdated: new Date("2023-06-17T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: '36843453-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c25c-3dcf-11ee-ac41-0068eb8ba754', description: 'Typ1-1146', comment: 'Uniform Deficiency Sven Keller Resolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754',
        dateCreated: new Date("2023-06-18T00:00:00.000Z"), dateUpdated: new Date("2023-06-18T00:00:00.000Z"), dateResolved: new Date("2023-08-13T14:14:28.000Z"),
        userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
    },
    {
        id: 'be9cf3cd-3dd1-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c25c-3dcf-11ee-ac41-0068eb8ba754', description: 'Typ1-1168', comment: 'Uniform Deficiency Faber Christina Unresolved',
        fk_inspection_created: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-08-13T00:00:00.000Z"), dateUpdated: new Date("2023-08-13T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: '95f44abb-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c8d9-3dcf-11ee-ac41-0068eb8ba754', description: 'Ungewaschen', comment: 'Cadet Deficiency Marie Ackermann Resolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754',
        dateCreated: new Date("2023-06-18T00:00:00.000Z"), dateUpdated: new Date("2023-06-18T00:00:00.000Z"), dateResolved: new Date("2023-08-13T14:14:28.000Z"),
        userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
    },
    {
        id: '09868976-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c8d9-3dcf-11ee-ac41-0068eb8ba754', description: 'Description1', comment: 'Cadet Deficiency Sven Keller Unresolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-06-08T00:00:00.000Z"), dateUpdated: new Date("2023-06-08T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: 'a351df15-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c8d9-3dcf-11ee-ac41-0068eb8ba754', description: 'Resoved Test', comment: 'Cadet Deficiency Sven Keller Resolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754',
        dateCreated: new Date("2023-06-18T00:00:00.000Z"), dateUpdated: new Date("2023-06-18T00:00:00.000Z"), dateResolved: new Date("2023-08-13T14:14:28.000Z"),
        userCreated: 'test4', userUpdated: 'test4', userResolved: 'test4'
    },
    {
        id: 'ddfe80c4-3dd1-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c800-3dcf-11ee-ac41-0068eb8ba754', description: 'Typ4-1405', comment: 'CadetUniform Deficiency Lucas Schwartz Unresolved',
        fk_inspection_created: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-08-13T00:00:00.000Z"), dateUpdated: new Date("2023-08-13T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: 'a9e73275-3dd1-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c800-3dcf-11ee-ac41-0068eb8ba754', description: 'Typ1-1101', comment: 'CadetUniform Deficiency Maik Finkel Unresolved',
        fk_inspection_created: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-08-13T00:00:00.000Z"), dateUpdated: new Date("2023-08-13T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: 'ccff6a65-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c897-3dcf-11ee-ac41-0068eb8ba754', description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deficiency Sven Keller Unresolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-06-18T00:00:00.000Z"), dateUpdated: new Date("2023-06-18T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: '345309ab-3dcf-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c897-3dcf-11ee-ac41-0068eb8ba754', description: 'Gruppe2-Typ2-3', comment: 'CadetMaterial Deficiency Sven Keller Unresolved',
        fk_inspection_created: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-06-10T00:00:00.000Z"), dateUpdated: new Date("2023-06-10T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: 'ddfe58dc-3dd1-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c897-3dcf-11ee-ac41-0068eb8ba754', description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deeficiency Lucas Schwartz Unresolved',
        fk_inspection_created: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-08-13T00:00:00.000Z"), dateUpdated: new Date("2023-08-13T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: 'a9e7287a-3dd1-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c897-3dcf-11ee-ac41-0068eb8ba754', description: 'Gruppe1-Typ1-1', comment: 'CadetMaterial Deeficiency Maik Finkel Unresolved',
        fk_inspection_created: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-08-13T00:00:00.000Z"), dateUpdated: new Date("2023-08-13T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: '987a6c24-3dd1-11ee-ac41-0068eb8ba754', fk_deficiencyType: '4ae2c8d9-3dcf-11ee-ac41-314560987454', description: 'Bemerkung', comment: 'DeletedType Deficiency Sven Keller Unresolved',
        fk_inspection_created: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-08-13T00:00:00.000Z"), dateUpdated: new Date("2023-08-13T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test4', userUpdated: 'test4', userResolved: null
    },
    {
        id: '63cd8117-571c-11ee-afcf-0068eb8ba754', fk_deficiencyType: '23422349-3dcf-11ee-ac41-0068eb8ba754', description: 'Beschreibung', comment: 'DeficiencyComment wrong assosiation Unresolved',
        fk_inspection_created: '572782d5-571c-11ee-afcf-0068eb8ba754', fk_inspection_resolved: null,
        dateCreated: new Date("2023-09-19T00:00:00.000Z"), dateUpdated: new Date("2023-09-19T00:00:00.000Z"), dateResolved: null,
        userCreated: 'test', userUpdated: 'test', userResolved: null
    },
]

export const testDeficiencyUniforms: DeficiencyUniform[] = [
    { deficiencyId: '8b6468ab-3dcf-11ee-ac41-0068eb8ba754', fk_uniform: '45f35815-3c0d-11ee-8084-0068eb8ba754' },
    { deficiencyId: 'ccffb98b-3dcf-11ee-ac41-0068eb8ba754', fk_uniform: '45f33205-3c0d-11ee-8084-0068eb8ba754' },
    { deficiencyId: '36843453-3dcf-11ee-ac41-0068eb8ba754', fk_uniform: '45f33205-3c0d-11ee-8084-0068eb8ba754' },
    { deficiencyId: 'be9cf3cd-3dd1-11ee-ac41-0068eb8ba754', fk_uniform: '45f33fa9-3c0d-11ee-8084-0068eb8ba754' }
];

export const testDeficiencyCadets: DeficiencyCadet[] = [
    { deficiencyId: '95f44abb-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: null },
    { deficiencyId: '09868976-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: null },
    { deficiencyId: 'a351df15-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: null },
    { deficiencyId: 'ddfe80c4-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f397b0-3c0d-11ee-8084-0068eb8ba754', fk_material: null },
    { deficiencyId: 'a9e73275-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: '45f3053a-3c0d-11ee-8084-0068eb8ba754', fk_material: null },
    { deficiencyId: 'ccff6a65-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754' },
    { deficiencyId: '345309ab-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: 'd652732e-3c03-11ee-8084-0068eb8ba754' },
    { deficiencyId: 'ddfe58dc-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754' },
    { deficiencyId: 'a9e7287a-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: '9d09592c-3c03-11ee-8084-0068eb8ba754' },
    { deficiencyId: '987a6c24-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', fk_uniform: null, fk_material: null },
    { deficiencyId: '63cd8117-571c-11ee-afcf-0068eb8ba754', fk_cadet: '45dc48d7-5719-11ee-afcf-0068eb8ba754', fk_uniform: '00e8c632-571b-11ee-afcf-0068eb8ba754', fk_material: null },

]

export const testInspections = [
    { id: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', date: new Date("2023-06-18T00:00:00.000Z"), active: false },
    { id: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_assosiation: '85181337-3aa3-11ee-ab4b-0068eb8ba754', date: new Date("2023-08-13T00:00:00.000Z"), active: false },
    { id: '572782d5-571c-11ee-afcf-0068eb8ba754', fk_assosiation: '25209715-3aa3-11ee-ab4b-0068eb8ba754', date: new Date("2023-09-19T00:00:00.000Z"), active: false },
]
export const testCadetInspcetions = [
    { id: '8b621608-3dcf-11ee-ac41-0068eb8ba754', fk_inspection: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', uniformComplete: true },
    { id: 'ccfc756b-3dcf-11ee-ac41-0068eb8ba754', fk_inspection: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754', uniformComplete: false },
    { id: 'e81e0c5a-3dcf-11ee-ac41-0068eb8ba754', fk_inspection: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', uniformComplete: true },
    { id: 'f1c97f9d-3dcf-11ee-ac41-0068eb8ba754', fk_inspection: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'e2061e21-3c11-11ee-8084-0068eb8ba754', uniformComplete: false },
    { id: 'e39eafab-3dcf-11ee-ac41-0068eb8ba754', fk_inspection: '5153c4fb-3dcf-11ee-ac41-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', uniformComplete: false },
    { id: '8a7987e0-3dd1-11ee-ac41-0068eb8ba754', fk_inspection: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: '0d06427b-3c12-11ee-8084-0068eb8ba754', uniformComplete: true },
    { id: 'ddef6108-3dd1-11ee-ac41-0068eb8ba754', fk_inspection: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'cbb69711-3c11-11ee-8084-0068eb8ba754', uniformComplete: true },
    { id: 'a9e4076c-3dd1-11ee-ac41-0068eb8ba754', fk_inspection: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'db998c2f-3c11-11ee-8084-0068eb8ba754', uniformComplete: true },
    { id: 'e3f10ce2-3dd1-11ee-ac41-0068eb8ba754', fk_inspection: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'ee601c39-3c11-11ee-8084-0068eb8ba754', uniformComplete: true },
    { id: 'be99f337-3dd1-11ee-ac41-0068eb8ba754', fk_inspection: '8326e5ab-3dd1-11ee-ac41-0068eb8ba754', fk_cadet: 'f8e28d70-3c11-11ee-8084-0068eb8ba754', uniformComplete: false },
    { id: '63cb50ea-571c-11ee-afcf-0068eb8ba754', fk_inspection: '572782d5-571c-11ee-afcf-0068eb8ba754', fk_cadet: '45dc48d7-5719-11ee-afcf-0068eb8ba754', uniformComplete: true },
]

export async function fillAllTables() {
    // AUTHENTICATION
    await fillAssosiation();
    await fillUser();

    // UNIFORM-SIZE
    await prisma.uniformSize.createMany({
        data: testSizes,
    });
    await prisma.uniformSizelist.createMany({
        data: testSizelists,
    });
    await connectionSizesToSizeLists();

    // UNIFORM
    await prisma.uniformType.createMany({
        data: testUniformTypes,
    });
    await prisma.uniformGeneration.createMany({
        data: testGenerations,
    });
    await prisma.uniform.createMany({
        data: testUniformItems,
    });

    // MATERIAL
    await prisma.materialGroup.createMany({
        data: testMaterialGroups,
    });
    await prisma.material.createMany({
        data: testMaterials,
    });

    // CADET
    await prisma.cadet.createMany({
        data: testCadets,
    });
    await prisma.uniformIssued.createMany({
        data: testUniformIssued,
    });
    await prisma.materialIssued.createMany({
        data: testMaterialIssued,
    });

    // DEFICIENCY
    await prisma.inspection.createMany({
        data: testInspections,
    });
    await prisma.cadetInspection.createMany({
        data: testCadetInspcetions,
    });
    await prisma.deficiencyType.createMany({
        data: testDeficiencyTypes
    });
    await prisma.deficiency.createMany({
        data: testDeficiencies
    });
    await prisma.deficiencyCadet.createMany({
        data: testDeficiencyCadets
    });
    await prisma.deficiencyUniform.createMany({
        data: testDeficiencyUniforms
    });
}

export async function fillAssosiation() {
    await prisma.assosiation.create({
        data: testAssosiation,
    });
    await prisma.assosiation.create({
        data: testWrongAssosiation,
    });
}

export async function fillUser() {
    return prisma.user.createMany({
        data: testUsers,
    });
}
