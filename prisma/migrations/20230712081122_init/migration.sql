-- CreateTable
CREATE TABLE "inscriptions" (
    "id" SERIAL NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "isSold" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_inscriptionId_key" ON "inscriptions"("inscriptionId");
