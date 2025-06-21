
-- AlterTable
ALTER TABLE "base"."uniform"
    ADD COLUMN "storageUnitId" CHAR(36);
    
-- AlterTable
ALTER TABLE "inspection"."inspection" ALTER COLUMN "date" DROP DEFAULT;

-- CreateTable
CREATE TABLE "base"."storage_unit" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(100),
    "is_reserve" BOOLEAN NOT NULL DEFAULT false,
    "assosiationId" CHAR(36) NOT NULL,
    "capacity" SMALLINT,

    CONSTRAINT "storage_unit_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "storage_unit_name_assosiationId_key" ON "base"."storage_unit"("name", "assosiationId");
-- AddForeignKey
ALTER TABLE "base"."uniform"
ADD CONSTRAINT "uniform_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "base"."storage_unit"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "base"."storage_unit"
ADD CONSTRAINT "storage_unit_assosiationId_fkey" FOREIGN KEY ("assosiationId") REFERENCES "authentication"."assosiation"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
