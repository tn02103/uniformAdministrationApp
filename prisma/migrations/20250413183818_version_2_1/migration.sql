-- AlterTable
ALTER TABLE "base"."_uniformsizetouniformsizelist" ADD CONSTRAINT "_uniformsizetouniformsizelist_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "base"."_uniformsizetouniformsizelist_AB_unique";
