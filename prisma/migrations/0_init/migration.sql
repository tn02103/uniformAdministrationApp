-- CreateTable
CREATE TABLE public."Assosiation" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "acronym" VARCHAR(5) NOT NULL,
    "useBeta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Assosiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cadet" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "firstname" VARCHAR(30) NOT NULL,
    "lastname" VARCHAR(30) NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "comment" TEXT NOT NULL DEFAULT '',
    "recdelete" TIMESTAMP(6),
    "recdeleteUser" VARCHAR(10),

    CONSTRAINT "Cadet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadetDeficiency" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_deficiencyType" CHAR(36) NOT NULL,
    "description" VARCHAR(30) NOT NULL,
    "comment" TEXT,
    "fk_cadetInspection" CHAR(36),
    "fk_cadet" CHAR(36) NOT NULL,
    "dateCreated" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateResolved" DATE,

    CONSTRAINT "CadetDeficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadetDeficiencyType" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_assosiation" CHAR(36) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "dependsOnUniformitem" BOOLEAN NOT NULL,
    "addCommentToUniformitem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CadetDeficiencyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadetInspection" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_inspection" CHAR(36) NOT NULL,
    "fk_cadet" CHAR(36) NOT NULL,
    "uniformComplete" BOOLEAN NOT NULL,

    CONSTRAINT "CadetInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_assosiation" CHAR(36) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "typename" VARCHAR(20) NOT NULL,
    "fk_materialGroup" CHAR(36) NOT NULL,
    "actualQuantity" SMALLINT NOT NULL,
    "targetQuantity" SMALLINT NOT NULL,
    "sortOrder" SMALLINT NOT NULL,
    "recdelete" TIMESTAMP(6),
    "recdeleteUser" VARCHAR(10),

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialGroup" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "description" VARCHAR(20) NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "issuedDefault" SMALLINT,
    "sortOrder" SMALLINT NOT NULL,
    "recdelete" TIMESTAMP(6),
    "recdeleteUser" VARCHAR(10),
    "multitypeAllowed" BOOLEAN NOT NULL,

    CONSTRAINT "MaterialGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialIssued" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_material" CHAR(36) NOT NULL,
    "fk_cadet" CHAR(36) NOT NULL,
    "quantity" SMALLINT NOT NULL,
    "dateIssued" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReturned" TIMESTAMP(6),

    CONSTRAINT "MaterialIssued_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "fk_user" CHAR(36) NOT NULL,
    "token" CHAR(50) NOT NULL,
    "endOfLife" TIMESTAMP(6) NOT NULL,
    "deviceId" CHAR(36) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Uniform" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "number" INTEGER NOT NULL,
    "fk_uniformType" CHAR(36) NOT NULL,
    "fk_generation" CHAR(36),
    "fk_size" CHAR(36),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "comment" TEXT,
    "recdelete" TIMESTAMP(6),
    "recdeleteUser" VARCHAR(10),

    CONSTRAINT "Uniform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniformGeneration" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_uniformType" CHAR(36) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "fk_sizeList" CHAR(36),
    "sortOrder" SMALLINT NOT NULL,
    "outdated" BOOLEAN NOT NULL DEFAULT false,
    "recdelete" TIMESTAMP(6),
    "recdeleteUser" VARCHAR(10),

    CONSTRAINT "UniformGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniformIssued" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_cadet" CHAR(36) NOT NULL,
    "fk_uniform" CHAR(36) NOT NULL,
    "dateIssued" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReturned" DATE,

    CONSTRAINT "UniformIssued_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniformSize" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(10) NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "UniformSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniformSizelist" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(40) NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,

    CONSTRAINT "UniformSizelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniformType" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(10) NOT NULL,
    "acronym" VARCHAR(2) NOT NULL,
    "issuedDefault" INTEGER NOT NULL DEFAULT 1,
    "usingGenerations" BOOLEAN NOT NULL,
    "usingSizes" BOOLEAN NOT NULL,
    "fk_defaultSizeList" CHAR(36),
    "sortOrder" INTEGER NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "recdelete" TIMESTAMP(6),
    "recdeleteUser" VARCHAR(10),

    CONSTRAINT "UniformType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "fk_assosiation" CHAR(36) NOT NULL,
    "role" SMALLINT NOT NULL,
    "username" VARCHAR(10) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_uniformsizetouniformsizelist" (
    "A" CHAR(36) NOT NULL,
    "B" CHAR(36) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Assosiation_name_key" ON "Assosiation"("name");

-- CreateIndex
CREATE INDEX "Cadet_fk_assosiation_idx" ON "Cadet"("fk_assosiation");

-- CreateIndex
CREATE INDEX "CadetDeficiency_fk_cadetInspection_idx" ON "CadetDeficiency"("fk_cadetInspection");

-- CreateIndex
CREATE INDEX "CadetDeficiency_fk_cadet_idx" ON "CadetDeficiency"("fk_cadet");

-- CreateIndex
CREATE INDEX "CadetDeficiency_fk_deficiencyType_idx" ON "CadetDeficiency"("fk_deficiencyType");

-- CreateIndex
CREATE INDEX "CadetDeficiencyType_fk_assosiation_idx" ON "CadetDeficiencyType"("fk_assosiation");

-- CreateIndex
CREATE UNIQUE INDEX "CadetDeficiencyType_name_fk_assosiation_key" ON "CadetDeficiencyType"("name", "fk_assosiation");

-- CreateIndex
CREATE INDEX "CadetInspection_fk_cadet_idx" ON "CadetInspection"("fk_cadet");

-- CreateIndex
CREATE UNIQUE INDEX "CadetInspection_fk_inspection_fk_cadet_key" ON "CadetInspection"("fk_inspection", "fk_cadet");

-- CreateIndex
CREATE INDEX "Inspection_fk_assosiation_idx" ON "Inspection"("fk_assosiation");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_date_fk_assosiation_key" ON "Inspection"("date", "fk_assosiation");

-- CreateIndex
CREATE INDEX "Material_fk_materialGroup_idx" ON "Material"("fk_materialGroup");

-- CreateIndex
CREATE INDEX "MaterialGroup_fk_assosiation_idx" ON "MaterialGroup"("fk_assosiation");

-- CreateIndex
CREATE INDEX "MaterialIssued_fk_cadet_idx" ON "MaterialIssued"("fk_cadet");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialIssued_fk_material_fk_cadet_dateIssued_key" ON "MaterialIssued"("fk_material", "fk_cadet", "dateIssued");

-- CreateIndex
CREATE INDEX "RefreshToken_fk_user_idx" ON "RefreshToken"("fk_user");

-- CreateIndex
CREATE INDEX "Uniform_fk_generation_idx" ON "Uniform"("fk_generation");

-- CreateIndex
CREATE INDEX "Uniform_fk_size_idx" ON "Uniform"("fk_size");

-- CreateIndex
CREATE INDEX "Uniform_fk_uniformType_idx" ON "Uniform"("fk_uniformType");

-- CreateIndex
CREATE INDEX "UniformGeneration_fk_sizeList_idx" ON "UniformGeneration"("fk_sizeList");

-- CreateIndex
CREATE INDEX "UniformGeneration_fk_uniformType_idx" ON "UniformGeneration"("fk_uniformType");

-- CreateIndex
CREATE INDEX "UniformIssued_fk_cadet_idx" ON "UniformIssued"("fk_cadet");

-- CreateIndex
CREATE INDEX "UniformIssued_fk_uniform_idx" ON "UniformIssued"("fk_uniform");

-- CreateIndex
CREATE UNIQUE INDEX "UniformIssued_fk_cadet_fk_uniform_dateIssued_key" ON "UniformIssued"("fk_cadet", "fk_uniform", "dateIssued");

-- CreateIndex
CREATE INDEX "UniformSize_fk_assosiation_idx" ON "UniformSize"("fk_assosiation");

-- CreateIndex
CREATE UNIQUE INDEX "UniformSize_name_fk_assosiation_key" ON "UniformSize"("name", "fk_assosiation");

-- CreateIndex
CREATE INDEX "UniformSizelist_fk_assosiation_idx" ON "UniformSizelist"("fk_assosiation");

-- CreateIndex
CREATE UNIQUE INDEX "UniformSizelist_name_fk_assosiation_key" ON "UniformSizelist"("name", "fk_assosiation");

-- CreateIndex
CREATE INDEX "UniformType_fk_assosiation_idx" ON "UniformType"("fk_assosiation");

-- CreateIndex
CREATE INDEX "UniformType_fk_defaultSizeList_idx" ON "UniformType"("fk_defaultSizeList");

-- CreateIndex
CREATE INDEX "User_fk_assosiation_idx" ON "User"("fk_assosiation");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_fk_assosiation_key" ON "User"("username", "fk_assosiation");

-- CreateIndex
CREATE UNIQUE INDEX "_uniformsizetouniformsizelist_AB_unique" ON "_uniformsizetouniformsizelist"("A", "B");

-- CreateIndex
CREATE INDEX "_uniformsizetouniformsizelist_B_index" ON "_uniformsizetouniformsizelist"("B");

-- AddForeignKey
ALTER TABLE "Cadet" ADD CONSTRAINT "Cadet_fk_assosiation_fkey" FOREIGN KEY ("fk_assosiation") REFERENCES "Assosiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadetDeficiency" ADD CONSTRAINT "CadetDeficiency_fk_cadetInspection_fkey" FOREIGN KEY ("fk_cadetInspection") REFERENCES "CadetInspection"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CadetDeficiency" ADD CONSTRAINT "CadetDeficiency_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CadetDeficiency" ADD CONSTRAINT "CadetDeficiency_fk_deficiencyType_fkey" FOREIGN KEY ("fk_deficiencyType") REFERENCES "CadetDeficiencyType"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CadetInspection" ADD CONSTRAINT "CadetInspection_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CadetInspection" ADD CONSTRAINT "CadetInspection_fk_inspection_fkey" FOREIGN KEY ("fk_inspection") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_fk_materialGroup_fkey" FOREIGN KEY ("fk_materialGroup") REFERENCES "MaterialGroup"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MaterialIssued" ADD CONSTRAINT "MaterialIssued_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MaterialIssued" ADD CONSTRAINT "MaterialIssued_fk_material_fkey" FOREIGN KEY ("fk_material") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_fk_user_fkey" FOREIGN KEY ("fk_user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Uniform" ADD CONSTRAINT "Uniform_fk_generation_fkey" FOREIGN KEY ("fk_generation") REFERENCES "UniformGeneration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Uniform" ADD CONSTRAINT "Uniform_fk_size_fkey" FOREIGN KEY ("fk_size") REFERENCES "UniformSize"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Uniform" ADD CONSTRAINT "Uniform_fk_uniformType_fkey" FOREIGN KEY ("fk_uniformType") REFERENCES "UniformType"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UniformGeneration" ADD CONSTRAINT "UniformGeneration_fk_sizeList_fkey" FOREIGN KEY ("fk_sizeList") REFERENCES "UniformSizelist"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UniformGeneration" ADD CONSTRAINT "UniformGeneration_fk_uniformType_fkey" FOREIGN KEY ("fk_uniformType") REFERENCES "UniformType"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UniformIssued" ADD CONSTRAINT "UniformIssued_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UniformIssued" ADD CONSTRAINT "UniformIssued_fk_uniform_fkey" FOREIGN KEY ("fk_uniform") REFERENCES "Uniform"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UniformType" ADD CONSTRAINT "UniformType_fk_defaultSizeList_fkey" FOREIGN KEY ("fk_defaultSizeList") REFERENCES "UniformSizelist"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_fk_assosiation_fkey" FOREIGN KEY ("fk_assosiation") REFERENCES "Assosiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_uniformsizetouniformsizelist" ADD CONSTRAINT "_uniformsizetouniformsizelist_A_fkey" FOREIGN KEY ("A") REFERENCES "UniformSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_uniformsizetouniformsizelist" ADD CONSTRAINT "_uniformsizetouniformsizelist_B_fkey" FOREIGN KEY ("B") REFERENCES "UniformSizelist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

