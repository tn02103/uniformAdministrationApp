-- CreateTable
CREATE TABLE authentication.password_reset_token (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" CHAR(64) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "organisation_id" CHAR(36) NOT NULL,
    "end_of_live" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45) NOT NULL,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_hash_key" ON authentication.password_reset_token("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_token_user_id_idx" ON authentication.password_reset_token("user_id");

-- AddForeignKey
ALTER TABLE authentication.password_reset_token ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES authentication."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE authentication.password_reset_token ADD CONSTRAINT "password_reset_token_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES authentication."organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
