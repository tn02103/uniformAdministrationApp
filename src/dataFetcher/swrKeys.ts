
export const swrKeys = {
    materialConfig: "materialConfig",
    cadetUniformMap: (cadetId: string) => `cadet/uniform/${cadetId}/map`,
    cadetMaterialMap: (cadetId: string) => `cadet/material/${cadetId}/map`,
    useCadetMaterialDescriptionList: (cadetId: string) => `cadet/${cadetId}/list`,
    // Deficiency keys
    deficiencyTypeList: 'deficiency.type.list',
    deficiencyAdminTypeList: 'deficiency.type.adminList',
    uniformDeficiencies: (uniformId: string, includeResolved: boolean) => `uniform.${uniformId}.deficiencies.${JSON.stringify(includeResolved)}`,
    uniformDefieicncyMutateMatcher: (uniformId: string) => (key: string | object) => (typeof key === "string") && key.startsWith(`uniform.${uniformId}.deficiencies`),

    // Storage
    storageUnitUniformItems: 'storageUnit/uniformItems',

    // Uniform admin / sizes
    uniformTypeList: 'uniform.type.list',
    uniformSizelistList: 'uniform.sizelist.list',
    uniformSizeAll: 'uniform.size.all',

    // Uniform items
    uniformItemLabels: 'uniformItemLabels',
    uniformHistory: (uniformId: string) => `uniform.${uniformId}.history`,

    // Inspection
    inspectionStatus: 'inspection.status',
    inspectionPlannedList: 'inspection.planned.list',
    inspectionInspectedIdList: 'inspection/status/idList',
    unresolvedDeficienciesByCadet: (cadetId: string) => `cadet.${cadetId}.deficiencies.unresolved`,
    // Cadet specific
    cadetLastInspection: 'cadet/inspection/lastInspection',
}