/*
 Warnings:
 
 - You are about to drop the column `active` on the `uniform` table. All the data in the column will be lost.
 
 */
-- AlterTable
ALTER TABLE "base"."uniform"
ADD COLUMN "is_reserve" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "storageUnitId" CHAR(36);
-- MoveData
UPDATE "base"."uniform"
SET "is_reserve" = NOT "active";
-- DropColumn
ALTER TABLE "base"."uniform" DROP COLUMN "active";
-- CreateTable
CREATE TABLE "base"."storage_unit" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(50),
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