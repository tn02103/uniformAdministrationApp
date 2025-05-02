-- CreateTable
CREATE TABLE "public"."redirect" (
    "id" CHAR(36) NOT NULL DEFAULT gen_random_uuid(),
    "assosiationId" CHAR(36) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "target" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "redirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "redirect_code_key" ON "public"."redirect"("code");

-- AddForeignKey
ALTER TABLE "public"."redirect" ADD CONSTRAINT "redirect_assosiationId_fkey" FOREIGN KEY ("assosiationId") REFERENCES "authentication"."assosiation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
