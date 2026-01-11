-- CreateEnum
CREATE TYPE "voting_round_status" AS ENUM ('SUGGESTING', 'VOTING', 'REVEALED', 'TIE_BREAKING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "selected_movie_status" AS ENUM ('UPCOMING', 'WATCHED');

-- CreateTable
CREATE TABLE "club_settings" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "movieSuggestionsCount" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_rotation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_rotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_voting_rounds" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "suggestedByUserId" TEXT NOT NULL,
    "status" "voting_round_status" NOT NULL DEFAULT 'SUGGESTING',
    "revealedAt" TIMESTAMP(3),
    "selectedMovieId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_voting_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_suggestions" (
    "id" TEXT NOT NULL,
    "votingRoundId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "releaseYear" INTEGER,
    "overview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_votes" (
    "id" TEXT NOT NULL,
    "votingRoundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rankings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selected_movies" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "votingRoundId" TEXT NOT NULL,
    "movieSuggestionId" TEXT NOT NULL,
    "watchByDate" TIMESTAMP(3) NOT NULL,
    "watchedAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "selected_movie_status" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "selected_movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_ratings" (
    "id" TEXT NOT NULL,
    "selectedMovieId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_settings_clubId_key" ON "club_settings"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "club_rotation_clubId_order_key" ON "club_rotation"("clubId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "club_rotation_clubId_userId_key" ON "club_rotation"("clubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_votes_votingRoundId_userId_key" ON "movie_votes"("votingRoundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "selected_movies_votingRoundId_key" ON "selected_movies"("votingRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_ratings_selectedMovieId_userId_key" ON "movie_ratings"("selectedMovieId", "userId");

-- AddForeignKey
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_rotation" ADD CONSTRAINT "club_rotation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_rotation" ADD CONSTRAINT "club_rotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_voting_rounds" ADD CONSTRAINT "movie_voting_rounds_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_voting_rounds" ADD CONSTRAINT "movie_voting_rounds_suggestedByUserId_fkey" FOREIGN KEY ("suggestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_suggestions" ADD CONSTRAINT "movie_suggestions_votingRoundId_fkey" FOREIGN KEY ("votingRoundId") REFERENCES "movie_voting_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_votes" ADD CONSTRAINT "movie_votes_votingRoundId_fkey" FOREIGN KEY ("votingRoundId") REFERENCES "movie_voting_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_votes" ADD CONSTRAINT "movie_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_movies" ADD CONSTRAINT "selected_movies_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_movies" ADD CONSTRAINT "selected_movies_votingRoundId_fkey" FOREIGN KEY ("votingRoundId") REFERENCES "movie_voting_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_movies" ADD CONSTRAINT "selected_movies_movieSuggestionId_fkey" FOREIGN KEY ("movieSuggestionId") REFERENCES "movie_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_ratings" ADD CONSTRAINT "movie_ratings_selectedMovieId_fkey" FOREIGN KEY ("selectedMovieId") REFERENCES "selected_movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_ratings" ADD CONSTRAINT "movie_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

