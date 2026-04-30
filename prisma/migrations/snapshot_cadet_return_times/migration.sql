-- snapshot_cadet_return_times: add return_started_at and return_ended_at to base.cadet
BEGIN;

ALTER TABLE base.cadet
    ADD COLUMN IF NOT EXISTS return_started_at timestamp(6);

ALTER TABLE base.cadet
    ADD COLUMN IF NOT EXISTS return_ended_at timestamp(6);

COMMIT;
