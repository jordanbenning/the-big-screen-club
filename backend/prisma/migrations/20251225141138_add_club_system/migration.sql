-- CreateEnum
CREATE TYPE "club_role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "profilePictureUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_members" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "club_role" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_invitations" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "status" "invitation_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "club_members_clubId_userId_key" ON "club_members"("clubId", "userId");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitations" ADD CONSTRAINT "club_invitations_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitations" ADD CONSTRAINT "club_invitations_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitations" ADD CONSTRAINT "club_invitations_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

