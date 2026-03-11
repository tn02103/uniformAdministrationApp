
-- DropForeignKey
ALTER TABLE "authentication"."refresh_token" RENAME CONSTRAINT "refresh_token_fk_user_fkey" TO "refresh_token_user_id_fkey";

-- DropForeignKey
ALTER TABLE "authentication"."user" RENAME CONSTRAINT "user_fk_assosiation_fkey" TO "user_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."assosiation_configuration" RENAME CONSTRAINT "assosiation_configuration_assosiationId_fkey" TO "organisation_configuration_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."cadet" RENAME CONSTRAINT "cadet_fk_assosiation_fkey" TO "cadet_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."material_group" RENAME CONSTRAINT "material_group_fk_assosiation_fkey" TO "material_group_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."storage_unit" RENAME CONSTRAINT "storage_unit_assosiationId_fkey" TO "storage_unit_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."uniform_size" RENAME CONSTRAINT "uniform_size_fk_assosiation_fkey" TO "uniform_size_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."uniform_sizelist" RENAME CONSTRAINT "uniform_sizelist_fk_assosiation_fkey" TO "uniform_sizelist_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "base"."uniform_type" RENAME CONSTRAINT "uniform_type_fk_assosiation_fkey" TO "uniform_type_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."deficiency_type" RENAME CONSTRAINT "deficiency_type_fk_assosiation_fkey" TO "deficiency_type_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."inspection" RENAME CONSTRAINT "inspection_fk_assosiation_fkey" TO "inspection_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."redirect" RENAME CONSTRAINT "redirect_assosiationId_fkey" TO "redirect_organisation_id_fkey";

-- AlterTable
ALTER TABLE "base"."cadet" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "base"."material_group" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "base"."storage_unit" RENAME COLUMN "assosiationId" TO "organisation_id";

-- AlterTable
ALTER TABLE "base"."uniform_size" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "base"."uniform_sizelist" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "base"."uniform_type" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "inspection"."deficiency_type" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "inspection"."inspection" RENAME COLUMN "fk_assosiation" TO "organisation_id";

-- AlterTable
ALTER TABLE "public"."redirect" RENAME COLUMN "assosiationId" TO "organisation_id";

-- AlterTable
ALTER TABLE "authentication"."assosiation" RENAME TO "organisation";

-- RenameIndex
ALTER INDEX "authentication"."assosiation_name_key" RENAME TO "organisation_name_key";

-- RenameIndex
ALTER INDEX "authentication"."refresh_token_fk_user_idx" RENAME TO "refresh_token_user_id_idx";

-- RenameIndex
ALTER INDEX "authentication"."user_fk_assosiation_idx" RENAME TO "user_organisation_id_idx";

-- RenameIndex
ALTER INDEX "authentication"."user_username_fk_assosiation_key" RENAME TO "user_username_organisation_id_key";

-- RenameIndex
ALTER INDEX "base"."cadet_fk_assosiation_idx" RENAME TO "cadet_organisation_id_idx";

-- RenameIndex
ALTER INDEX "base"."material_group_fk_assosiation_idx" RENAME TO "material_group_organisation_id_idx";

-- RenameIndex
ALTER INDEX "base"."storage_unit_name_assosiationId_key" RENAME TO "storage_unit_name_organisation_id_key";

-- RenameIndex
ALTER INDEX "base"."uniform_size_fk_assosiation_idx" RENAME TO "uniform_size_organisation_id_idx";

-- RenameIndex
ALTER INDEX "base"."uniform_size_name_fk_assosiation_key" RENAME TO "uniform_size_name_organisation_id_key";

-- RenameIndex
ALTER INDEX "base"."uniform_sizelist_fk_assosiation_idx" RENAME TO "uniform_sizelist_organisation_id_idx";

-- RenameIndex
ALTER INDEX "base"."uniform_sizelist_name_fk_assosiation_key" RENAME TO "uniform_sizelist_name_organisation_id_key";

-- RenameIndex
ALTER INDEX "base"."uniform_type_fk_assosiation_idx" RENAME TO "uniform_type_organisation_id_idx";

-- RenameIndex
ALTER INDEX "inspection"."deficiency_type_name_fk_assosiation_key" RENAME TO "deficiency_type_name_organisation_id_key";

-- RenameIndex
ALTER INDEX "inspection"."inspection_date_fk_assosiation_key" RENAME TO "inspection_date_organisation_id_key";

-- RenameIndex
ALTER INDEX "inspection"."inspection_fk_assosiation_idx" RENAME TO "inspection_organisation_id_idx";

-- AlterTable
ALTER TABLE "authentication"."organisation" RENAME CONSTRAINT "assosiation_pkey" TO "organisation_pkey";

-- AlterTable
ALTER TABLE "base"."assosiation_configuration" RENAME CONSTRAINT "assosiation_configuration_pkey" TO "organisation_configuration_pkey";

-- CreateEnum
CREATE TYPE "authentication"."RefreshTokenStatus" AS ENUM ('active', 'rotated', 'revoked');

-- CreateEnum
CREATE TYPE "authentication"."MFAType" AS ENUM ('totp', 'email');

-- CreateEnum
CREATE TYPE "authentication"."OrganisationConfiguration_2FARule" AS ENUM ('optional', 'administrators', 'required');

-- AlterTable
ALTER TABLE "authentication"."organisation" 
ALTER COLUMN "acronym" SET DATA TYPE VARCHAR(6);

-- AlterTable
ALTER TABLE "base"."assosiation_configuration" RENAME TO "organisation_configuration";
ALTER TABLE "base"."organisation_configuration" RENAME COLUMN "assosiationId" TO "organisation_id";
ALTER TABLE "base"."organisation_configuration" 
ADD COLUMN     "two_factor_auth_rule" "authentication"."OrganisationConfiguration_2FARule" NOT NULL DEFAULT 'optional';
ALTER TABLE "base"."organisation_configuration" SET SCHEMA "authentication";

-- AlterTable
DELETE FROM "authentication"."refresh_token";
ALTER TABLE "authentication"."refresh_token"
RENAME COLUMN "fk_user" TO "user_id";
ALTER TABLE "authentication"."refresh_token" DROP CONSTRAINT "refresh_token_pkey",
ADD COLUMN     "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "issuer_ip_address" VARCHAR(45) NOT NULL,
ADD COLUMN     "used_at" TIMESTAMP(3),
ADD COLUMN     "number_of_uses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "used_ip_address" VARCHAR(45),
ADD COLUMN     "used_user_agent" TEXT,
ADD COLUMN     "session_id" CHAR(36) NOT NULL,
ADD COLUMN     "status" "authentication"."RefreshTokenStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "tokenFamilyId" CHAR(36) NOT NULL,
ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rotatedFromTokenId" CHAR(36),
ALTER COLUMN "end_of_live" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "token" SET DATA TYPE CHAR(64),
ADD CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "authentication"."user"
RENAME COLUMN "fk_assosiation" TO "organisation_id";

ALTER TABLE "authentication"."user" 
ADD COLUMN     "change_password_on_login" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "rec_delete" TIMESTAMP(3),
ADD COLUMN     "rec_delete_user" VARCHAR(36),
ADD COLUMN     "default_2fa_method" VARCHAR(36),
ADD COLUMN     "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "authentication"."user" SET "email" = "username";

ALTER TABLE "authentication"."user" ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "authentication"."device" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(100),
    "user_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL,
    "last_ip_address" VARCHAR(45) NOT NULL,
    "last_mfa_login_at" TIMESTAMP(3),
    "last_used_mfa_type" "authentication"."MFAType",
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "user_agent" TEXT NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication"."audit_log" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" CHAR(36),
    "user_id" CHAR(36),
    "device_id" CHAR(36),
    "action" VARCHAR(50) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "security_level" SMALLINT NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);



-- CreateTable
CREATE TABLE "authentication"."EmailToken" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "token" CHAR(6) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "end_of_live" TIMESTAMP(3) NOT NULL,
    "device_id" CHAR(36) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "used_ip_address" VARCHAR(45),
    "used_user_agent" TEXT,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication"."Session" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "device_id" CHAR(36) NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "session_lifetime" TIMESTAMP(3),
    "session_rl" CHAR(10) NOT NULL,
    "last_login_at" TIMESTAMP(3) NOT NULL,
    "last_ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "elevated_session_till" TIMESTAMP(0),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication"."TwoFactorApp" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "secret" TEXT NOT NULL,
    "app_name" VARCHAR(20) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "TwoFactorApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_organisation_id_idx" ON "authentication"."audit_log"("organisation_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "authentication"."audit_log"("user_id");

-- CreateIndex
CREATE INDEX "device_user_id_idx" ON "authentication"."device"("user_id");

-- AddForeignKey
ALTER TABLE "authentication"."device" ADD CONSTRAINT "device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authentication"."user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "authentication"."audit_log" ADD CONSTRAINT "audit_log_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "authentication"."organisation"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "authentication"."audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authentication"."user"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "authentication"."audit_log" ADD CONSTRAINT "audit_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "authentication"."device"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AlterView
ALTER VIEW base.v_cadet_generaloverview RENAME COLUMN "fk_assosiation" TO "organisation_id";

/*
-- AlterTable
ALTER TABLE "base"."cadet" ALTER COLUMN "recdelete" SET DATA TYPE TIMESTAMP(0);

-- AlterTable
ALTER TABLE "base"."material" ALTER COLUMN "recdelete" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "base"."material_group" ALTER COLUMN "recdelete" SET DATA TYPE TIMESTAMP(0);

-- AlterTable
ALTER TABLE "base"."material_issued" ALTER COLUMN "date_issued" SET DATA TYPE TIMESTAMP(0),
ALTER COLUMN "date_returned" SET DATA TYPE TIMESTAMP(0);

-- AlterTable
ALTER TABLE "base"."uniform" ALTER COLUMN "recdelete" SET DATA TYPE TIMESTAMP(0);

-- AlterTable
ALTER TABLE "base"."uniform_generation" ALTER COLUMN "recdelete" SET DATA TYPE TIMESTAMP(0);

-- AlterTable
ALTER TABLE "base"."uniform_type" ALTER COLUMN "recdelete" SET DATA TYPE TIMESTAMP(0);
*/
-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "authentication"."refresh_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_rotatedFromTokenId_key" ON "authentication"."refresh_token"("rotatedFromTokenId");

-- AddForeignKey
ALTER TABLE "authentication"."refresh_token" ADD CONSTRAINT "refresh_token_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "authentication"."device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication"."refresh_token" ADD CONSTRAINT "refresh_token_rotatedFromTokenId_fkey" FOREIGN KEY ("rotatedFromTokenId") REFERENCES "authentication"."refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication"."refresh_token" ADD CONSTRAINT "refresh_token_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "authentication"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication"."Session" ADD CONSTRAINT "Session_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "authentication"."device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_token_user_id_key" ON "authentication"."EmailToken"("token", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorApp_app_name_user_id_key" ON "authentication"."TwoFactorApp"("app_name", "user_id");

-- AddForeignKey
ALTER TABLE "authentication"."EmailToken" ADD CONSTRAINT "EmailToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authentication"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication"."EmailToken" ADD CONSTRAINT "EmailToken_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "authentication"."device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication"."TwoFactorApp" ADD CONSTRAINT "TwoFactorApp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "authentication"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
