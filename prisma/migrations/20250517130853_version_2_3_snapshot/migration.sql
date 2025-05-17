 -- BackupOldColumns
ALTER TABLE "inspection"."inspection"
    RENAME COLUMN "time_start" TO "time_start_old";
ALTER TABLE "inspection"."inspection"
    RENAME COLUMN "time_end" TO "time_end_old";

-- AddNewColumns
ALTER TABLE "inspection"."inspection"
ADD COLUMN "time_start" TEXT,
    ADD COLUMN "time_end" TEXT;

-- CopyData
UPDATE "inspection"."inspection" 
   SET "time_start" = TO_CHAR(
        "time_start_old",
        'HH24:MI'
    )
WHERE "time_start_old" IS NOT NULL;

UPDATE "inspection"."inspection"
   SET "time_end" = TO_CHAR(
        "time_end_old",
        'HH24:MI'
    )
WHERE "time_end_old" IS NOT NULL;

-- DropOldColumns
ALTER TABLE "inspection"."inspection" DROP COLUMN "time_start_old",
    DROP COLUMN "time_end_old";
