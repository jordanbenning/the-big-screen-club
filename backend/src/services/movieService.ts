import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RotationMember {
  id: string
  userId: string
  username: string
  order: number
}

interface MovieSuggestionInput {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseYear: number | null
  overview: string | null
}

interface VoteRankings {
  [movieSuggestionId: string]: number
}

interface VotingRoundWithDetails {
  id: string
  clubId: string
  suggestedByUserId: string
  suggestedByUsername: string
  status: string
  revealedAt: Date | null
  createdAt: Date
  suggestions: Array<{
    id: string
    tmdbId: number
    title: string
    posterPath: string | null
    releaseYear: number | null
    overview: string | null
  }>
  votes: Array<{
    id: string
    userId: string
    username: string
    rankings: VoteRankings
  }>
  winnerMovieId?: string
  tiedMovies?: string[]
}

interface CalculateWinnerResult {
  status: 'winner' | 'tie'
  winnerId?: string
  tiedMovieIds?: string[]
  scores: Record<string, number>
}

export const movieService = {
  /**
   * Get the current rotation order for a club
   */
  async getRotation(clubId: string): Promise<RotationMember[]> {
    const rotation = await prisma.clubRotation.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return rotation.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.user.username,
      order: r.order,
    }))
  },

  /**
   * Update the rotation order (admin only)
   */
  async updateRotation(
    clubId: string,
    adminUserId: string,
    userIds: string[]
  ): Promise<void> {
    // Check if the requester is an admin
    const adminMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: adminUserId,
        },
      },
    })

    if (adminMembership === null || adminMembership.role !== 'ADMIN') {
      throw new Error('Only admins can update rotation')
    }

    // Verify all users are club members
    const members = await prisma.clubMember.findMany({
      where: {
        clubId,
        userId: { in: userIds },
      },
    })

    if (members.length !== userIds.length) {
      throw new Error('All users must be club members')
    }

    // Delete existing rotation and create new one
    await prisma.$transaction([
      prisma.clubRotation.deleteMany({
        where: { clubId },
      }),
      ...userIds.map((userId, index) =>
        prisma.clubRotation.create({
          data: {
            clubId,
            userId,
            order: index,
          },
        })
      ),
    ])
  },

  /**
   * Randomize the rotation order (admin only)
   */
  async randomizeRotation(clubId: string, adminUserId: string): Promise<void> {
    // Check if the requester is an admin
    const adminMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: adminUserId,
        },
      },
    })

    if (adminMembership === null || adminMembership.role !== 'ADMIN') {
      throw new Error('Only admins can randomize rotation')
    }

    // Get all current rotation members
    const rotation = await this.getRotation(clubId)
    const userIds = rotation.map((r) => r.userId)

    // Shuffle the array
    for (let i = userIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[userIds[i], userIds[j]] = [userIds[j], userIds[i]]
    }

    // Update rotation with shuffled order
    await this.updateRotation(clubId, adminUserId, userIds)
  },

  /**
   * Get whose turn it is to suggest movies (auto-skip removed members)
   */
  async getCurrentTurn(clubId: string): Promise<{
    userId: string
    username: string
    order: number
  } | null> {
    // Get all club members
    const members = await prisma.clubMember.findMany({
      where: { clubId },
      select: { userId: true },
    })

    const memberUserIds = new Set(members.map((m) => m.userId))

    // Get rotation, filtering out non-members
    const rotation = await prisma.clubRotation.findMany({
      where: {
        clubId,
        userId: { in: Array.from(memberUserIds) },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    if (rotation.length === 0) {
      return null
    }

    // Find the last completed voting round
    const lastCompletedRound = await prisma.movieVotingRound.findFirst({
      where: {
        clubId,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        suggestedByUserId: true,
      },
    })

    if (lastCompletedRound === null) {
      // No completed rounds yet, return first person in rotation
      return {
        userId: rotation[0].userId,
        username: rotation[0].user.username,
        order: rotation[0].order,
      }
    }

    // Find the index of the last suggester
    const lastSuggesterIndex = rotation.findIndex(
      (r) => r.userId === lastCompletedRound.suggestedByUserId
    )

    // If last suggester is not in rotation, start from beginning
    if (lastSuggesterIndex === -1) {
      return {
        userId: rotation[0].userId,
        username: rotation[0].user.username,
        order: rotation[0].order,
      }
    }

    // Return next person in rotation (wrap around if needed)
    const nextIndex = (lastSuggesterIndex + 1) % rotation.length
    return {
      userId: rotation[nextIndex].userId,
      username: rotation[nextIndex].user.username,
      order: rotation[nextIndex].order,
    }
  },

  /**
   * Start a new voting round
   */
  async startVotingRound(
    clubId: string,
    suggestedByUserId: string
  ): Promise<string> {
    // Check if user is a club member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: suggestedByUserId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    // Check if there's already an active voting round
    const activeRound = await prisma.movieVotingRound.findFirst({
      where: {
        clubId,
        status: { in: ['SUGGESTING', 'VOTING', 'REVEALED', 'TIE_BREAKING'] },
      },
    })

    if (activeRound !== null) {
      throw new Error('There is already an active voting round')
    }

    // Check if it's this user's turn (unless they're an admin)
    const currentTurn = await this.getCurrentTurn(clubId)
    if (
      membership.role !== 'ADMIN' &&
      currentTurn !== null &&
      currentTurn.userId !== suggestedByUserId
    ) {
      throw new Error('It is not your turn to suggest movies')
    }

    // Create the voting round
    const round = await prisma.movieVotingRound.create({
      data: {
        clubId,
        suggestedByUserId,
        status: 'SUGGESTING',
      },
    })

    return round.id
  },

  /**
   * Add movie suggestions to a voting round
   */
  async addMovieSuggestions(
    roundId: string,
    userId: string,
    movies: MovieSuggestionInput[]
  ): Promise<void> {
    const round = await prisma.movieVotingRound.findUnique({
      where: { id: roundId },
      include: {
        club: {
          include: {
            settings: true,
          },
        },
        suggestions: true,
      },
    })

    if (round === null) {
      throw new Error('Voting round not found')
    }

    // Check if user is the suggester
    if (round.suggestedByUserId !== userId) {
      throw new Error('Only the suggester can add movie suggestions')
    }

    // Check if round is in SUGGESTING status
    if (round.status !== 'SUGGESTING') {
      throw new Error('Cannot add suggestions to this round')
    }

    // Check if correct number of movies
    const requiredCount = round.club.settings?.movieSuggestionsCount ?? 4
    if (movies.length !== requiredCount) {
      throw new Error(`Must suggest exactly ${requiredCount} movies`)
    }

    // Check if suggestions already exist
    if (round.suggestions.length > 0) {
      throw new Error('Movies have already been suggested for this round')
    }

    // Add suggestions and update status to VOTING
    await prisma.$transaction([
      ...movies.map((movie) =>
        prisma.movieSuggestion.create({
          data: {
            votingRoundId: roundId,
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            overview: movie.overview,
          },
        })
      ),
      prisma.movieVotingRound.update({
        where: { id: roundId },
        data: { status: 'VOTING' },
      }),
    ])
  },

  /**
   * Submit a ranked vote for a voting round
   */
  async submitVote(
    roundId: string,
    userId: string,
    rankings: VoteRankings
  ): Promise<void> {
    const round = await prisma.movieVotingRound.findUnique({
      where: { id: roundId },
      include: {
        suggestions: true,
      },
    })

    if (round === null) {
      throw new Error('Voting round not found')
    }

    // Check if round is in VOTING status
    if (round.status !== 'VOTING') {
      throw new Error('Voting is not active for this round')
    }

    // Check if user is the suggester (they cannot vote)
    if (round.suggestedByUserId === userId) {
      throw new Error('The suggester cannot vote on their own suggestions')
    }

    // Check if user is a club member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: round.clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    // Validate rankings
    const suggestionIds = round.suggestions.map((s) => s.id)
    const rankedIds = Object.keys(rankings)
    const rankValues = Object.values(rankings)

    if (rankedIds.length !== suggestionIds.length) {
      throw new Error('Must rank all movies')
    }

    for (const id of rankedIds) {
      if (!suggestionIds.includes(id)) {
        throw new Error('Invalid movie suggestion ID')
      }
    }

    // Check that ranks are 1 through N without duplicates
    const sortedRanks = [...rankValues].sort((a, b) => a - b)
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        throw new Error('Rankings must be consecutive starting from 1')
      }
    }

    // Create or update vote
    await prisma.movieVote.upsert({
      where: {
        votingRoundId_userId: {
          votingRoundId: roundId,
          userId,
        },
      },
      create: {
        votingRoundId: roundId,
        userId,
        rankings,
      },
      update: {
        rankings,
      },
    })
  },

  /**
   * Calculate the winner using ranked-choice voting
   */
  calculateWinner(
    suggestions: Array<{ id: string }>,
    votes: Array<{ rankings: VoteRankings }>
  ): CalculateWinnerResult {
    // Calculate total points for each movie (lower is better)
    const scores: Record<string, number> = {}

    for (const suggestion of suggestions) {
      scores[suggestion.id] = 0
    }

    for (const vote of votes) {
      for (const [movieId, rank] of Object.entries(vote.rankings)) {
        scores[movieId] = (scores[movieId] ?? 0) + rank
      }
    }

    // Find the minimum score
    const minScore = Math.min(...Object.values(scores))
    const winners = Object.keys(scores).filter((id) => scores[id] === minScore)

    if (winners.length === 1) {
      return {
        status: 'winner',
        winnerId: winners[0],
        scores,
      }
    }

    // Tie-breaking: exclude movies that are someone's last pick
    const lastPlaceRank = suggestions.length
    const moviesNotLastPick = winners.filter((movieId) => {
      return !votes.some((vote) => vote.rankings[movieId] === lastPlaceRank)
    })

    if (moviesNotLastPick.length === 1) {
      return {
        status: 'winner',
        winnerId: moviesNotLastPick[0],
        scores,
      }
    }

    // If multiple movies aren't anyone's last pick, use those
    const tiedMovies =
      moviesNotLastPick.length > 0 ? moviesNotLastPick : winners

    // Count last-place votes for each tied movie
    const lastPlaceCount: Record<string, number> = {}
    for (const movieId of tiedMovies) {
      lastPlaceCount[movieId] = votes.filter(
        (vote) => vote.rankings[movieId] === lastPlaceRank
      ).length
    }

    const minLastPlace = Math.min(...Object.values(lastPlaceCount))
    const fewestLastPlace = tiedMovies.filter(
      (id) => lastPlaceCount[id] === minLastPlace
    )

    if (fewestLastPlace.length === 1) {
      return {
        status: 'winner',
        winnerId: fewestLastPlace[0],
        scores,
      }
    }

    // Still tied - need manual tie-breaking
    return {
      status: 'tie',
      tiedMovieIds: fewestLastPlace,
      scores,
    }
  },

  /**
   * Trigger the reveal of voting results
   */
  async triggerReveal(
    roundId: string,
    userId: string
  ): Promise<{
    status: 'winner' | 'tie'
    winnerId?: string
    tiedMovieIds?: string[]
  }> {
    const round = await prisma.movieVotingRound.findUnique({
      where: { id: roundId },
      include: {
        club: {
          include: {
            members: true,
          },
        },
        suggestions: true,
        votes: true,
      },
    })

    if (round === null) {
      throw new Error('Voting round not found')
    }

    // Check if user is the suggester or an admin
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: round.clubId,
          userId,
        },
      },
    })

    if (
      membership === null ||
      (round.suggestedByUserId !== userId && membership.role !== 'ADMIN')
    ) {
      throw new Error('Only the suggester or an admin can trigger the reveal')
    }

    // Check if round is in VOTING status
    if (round.status !== 'VOTING') {
      throw new Error('Round is not in voting status')
    }

    // Check if all non-suggester members have voted
    const nonSuggesterMembers = round.club.members.filter(
      (m) => m.userId !== round.suggestedByUserId
    )
    const voterIds = new Set(round.votes.map((v) => v.userId))

    for (const member of nonSuggesterMembers) {
      if (!voterIds.has(member.userId)) {
        throw new Error('Not all members have voted yet')
      }
    }

    // Calculate winner
    const result = this.calculateWinner(
      round.suggestions,
      round.votes.map((v) => ({
        rankings: v.rankings as VoteRankings,
      }))
    )

    if (result.status === 'winner') {
      // Update round to REVEALED
      await prisma.movieVotingRound.update({
        where: { id: roundId },
        data: {
          status: 'REVEALED',
          revealedAt: new Date(),
          selectedMovieId: result.winnerId,
        },
      })

      return {
        status: 'winner',
        winnerId: result.winnerId,
      }
    } else {
      // Update round to TIE_BREAKING
      await prisma.movieVotingRound.update({
        where: { id: roundId },
        data: {
          status: 'TIE_BREAKING',
          revealedAt: new Date(),
        },
      })

      return {
        status: 'tie',
        tiedMovieIds: result.tiedMovieIds,
      }
    }
  },

  /**
   * Break a tie by manually selecting a winner (suggester only)
   */
  async breakTie(
    roundId: string,
    userId: string,
    movieSuggestionId: string
  ): Promise<void> {
    const round = await prisma.movieVotingRound.findUnique({
      where: { id: roundId },
      include: {
        suggestions: true,
      },
    })

    if (round === null) {
      throw new Error('Voting round not found')
    }

    // Check if user is the suggester
    if (round.suggestedByUserId !== userId) {
      throw new Error('Only the suggester can break the tie')
    }

    // Check if round is in TIE_BREAKING status
    if (round.status !== 'TIE_BREAKING') {
      throw new Error('Round is not in tie-breaking status')
    }

    // Verify the movie exists in suggestions
    const validMovie = round.suggestions.some((s) => s.id === movieSuggestionId)
    if (!validMovie) {
      throw new Error('Invalid movie suggestion')
    }

    // Update round to REVEALED with selected movie
    await prisma.movieVotingRound.update({
      where: { id: roundId },
      data: {
        status: 'REVEALED',
        selectedMovieId: movieSuggestionId,
      },
    })
  },

  /**
   * Select a movie as the winner and set watch-by date
   */
  async selectMovie(
    roundId: string,
    userId: string,
    watchByDate: Date
  ): Promise<void> {
    const round = await prisma.movieVotingRound.findUnique({
      where: { id: roundId },
    })

    if (round === null) {
      throw new Error('Voting round not found')
    }

    // Check if user is an admin
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: round.clubId,
          userId,
        },
      },
    })

    if (membership === null || membership.role !== 'ADMIN') {
      throw new Error('Only admins can select the movie')
    }

    // Check if round is REVEALED
    if (round.status !== 'REVEALED') {
      throw new Error('Round must be revealed before selecting movie')
    }

    // Check if movie has been selected
    if (round.selectedMovieId === null) {
      throw new Error('No movie has been selected as winner')
    }

    // Check if watch-by date is in the future
    if (watchByDate <= new Date()) {
      throw new Error('Watch-by date must be in the future')
    }

    // Create selected movie and update round to COMPLETED
    await prisma.$transaction([
      prisma.selectedMovie.create({
        data: {
          clubId: round.clubId,
          votingRoundId: roundId,
          movieSuggestionId: round.selectedMovieId,
          watchByDate,
          status: 'UPCOMING',
        },
      }),
      prisma.movieVotingRound.update({
        where: { id: roundId },
        data: {
          status: 'COMPLETED',
        },
      }),
    ])
  },

  /**
   * Mark a movie as watched (admin only)
   */
  async markAsWatched(
    selectedMovieId: string,
    adminUserId: string
  ): Promise<void> {
    const selectedMovie = await prisma.selectedMovie.findUnique({
      where: { id: selectedMovieId },
    })

    if (selectedMovie === null) {
      throw new Error('Selected movie not found')
    }

    // Check if user is an admin
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: selectedMovie.clubId,
          userId: adminUserId,
        },
      },
    })

    if (membership === null || membership.role !== 'ADMIN') {
      throw new Error('Only admins can mark movies as watched')
    }

    // Update selected movie
    await prisma.selectedMovie.update({
      where: { id: selectedMovieId },
      data: {
        status: 'WATCHED',
        watchedAt: new Date(),
      },
    })
  },

  /**
   * Submit a rating for a watched movie
   */
  async submitRating(
    selectedMovieId: string,
    userId: string,
    rating: number
  ): Promise<void> {
    // Validate rating (0.5 to 5.0 in 0.5 increments)
    if (rating < 0.5 || rating > 5.0 || rating % 0.5 !== 0) {
      throw new Error('Rating must be between 0.5 and 5.0 in 0.5 increments')
    }

    const selectedMovie = await prisma.selectedMovie.findUnique({
      where: { id: selectedMovieId },
    })

    if (selectedMovie === null) {
      throw new Error('Selected movie not found')
    }

    // Check if user is a club member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: selectedMovie.clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    // Create or update rating
    await prisma.movieRating.upsert({
      where: {
        selectedMovieId_userId: {
          selectedMovieId,
          userId,
        },
      },
      create: {
        selectedMovieId,
        userId,
        rating,
      },
      update: {
        rating,
      },
    })
  },

  /**
   * Get movie history for a club
   */
  async getMovieHistory(
    clubId: string,
    userId: string
  ): Promise<
    Array<{
      id: string
      movie: {
        tmdbId: number
        title: string
        posterPath: string | null
        releaseYear: number | null
      }
      suggestedBy: string
      watchByDate: Date
      watchedAt: Date | null
      selectedAt: Date
      votes: Array<{
        username: string
        rankings: Record<string, number>
      }>
      ratings: Array<{
        username: string
        rating: number
      }>
      averageRating: number | null
    }>
  > {
    // Check if user is a club member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    const selectedMovies = await prisma.selectedMovie.findMany({
      where: { clubId },
      include: {
        movieSuggestion: true,
        votingRound: {
          include: {
            suggestedBy: {
              select: {
                username: true,
              },
            },
            votes: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            suggestions: true,
          },
        },
        ratings: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        selectedAt: 'desc',
      },
    })

    return selectedMovies.map((sm) => {
      const averageRating =
        sm.ratings.length > 0
          ? sm.ratings.reduce((sum, r) => sum + r.rating, 0) / sm.ratings.length
          : null

      return {
        id: sm.id,
        movie: {
          tmdbId: sm.movieSuggestion.tmdbId,
          title: sm.movieSuggestion.title,
          posterPath: sm.movieSuggestion.posterPath,
          releaseYear: sm.movieSuggestion.releaseYear,
        },
        suggestedBy: sm.votingRound.suggestedBy.username,
        watchByDate: sm.watchByDate,
        watchedAt: sm.watchedAt,
        selectedAt: sm.selectedAt,
        votes: sm.votingRound.votes.map((v) => ({
          username: v.user.username,
          rankings: v.rankings as Record<string, number>,
        })),
        ratings: sm.ratings.map((r) => ({
          username: r.user.username,
          rating: r.rating,
        })),
        averageRating,
      }
    })
  },

  /**
   * Get detailed info about a specific voting round
   */
  async getVotingRoundDetails(
    roundId: string,
    userId: string
  ): Promise<VotingRoundWithDetails> {
    const round = await prisma.movieVotingRound.findUnique({
      where: { id: roundId },
      include: {
        suggestedBy: {
          select: {
            username: true,
          },
        },
        suggestions: true,
        votes: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })

    if (round === null) {
      throw new Error('Voting round not found')
    }

    // Check if user is a club member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: round.clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    return {
      id: round.id,
      clubId: round.clubId,
      suggestedByUserId: round.suggestedByUserId,
      suggestedByUsername: round.suggestedBy.username,
      status: round.status,
      revealedAt: round.revealedAt,
      createdAt: round.createdAt,
      suggestions: round.suggestions.map((s) => ({
        id: s.id,
        tmdbId: s.tmdbId,
        title: s.title,
        posterPath: s.posterPath,
        releaseYear: s.releaseYear,
        overview: s.overview,
      })),
      votes: round.votes.map((v) => ({
        id: v.id,
        userId: v.userId,
        username: v.user.username,
        rankings: v.rankings as VoteRankings,
      })),
      winnerMovieId: round.selectedMovieId ?? undefined,
    }
  },

  /**
   * Get current movie state for a club
   */
  async getCurrentMovieState(
    clubId: string,
    userId: string
  ): Promise<{
    currentMovie?: {
      id: string
      tmdbId: number
      title: string
      posterPath: string | null
      releaseYear: number | null
      watchByDate: Date
      status: string
    }
    activeVotingRound?: VotingRoundWithDetails
    currentTurn?: {
      userId: string
      username: string
      isCurrentUser: boolean
    }
    userHasVoted?: boolean
  }> {
    // Check if user is a club member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    // Check for upcoming movie
    const upcomingMovie = await prisma.selectedMovie.findFirst({
      where: {
        clubId,
        status: 'UPCOMING',
      },
      include: {
        movieSuggestion: true,
      },
      orderBy: {
        watchByDate: 'asc',
      },
    })

    // Check for active voting round
    const activeRound = await prisma.movieVotingRound.findFirst({
      where: {
        clubId,
        status: { in: ['SUGGESTING', 'VOTING', 'REVEALED', 'TIE_BREAKING'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let activeVotingRound
    let userHasVoted
    if (activeRound !== null) {
      activeVotingRound = await this.getVotingRoundDetails(
        activeRound.id,
        userId
      )
      userHasVoted = activeVotingRound.votes.some((v) => v.userId === userId)
    }

    // Get current turn
    // If there's an active voting round, currentTurn represents the suggester of that round
    // Otherwise, it represents whose turn it is next
    let currentTurn
    if (activeVotingRound !== undefined) {
      currentTurn = {
        userId: activeVotingRound.suggestedByUserId,
        username: activeVotingRound.suggestedByUsername,
        order: 0, // Not relevant for active rounds
      }
    } else {
      currentTurn = await this.getCurrentTurn(clubId)
    }

    return {
      currentMovie:
        upcomingMovie !== null
          ? {
              id: upcomingMovie.id,
              tmdbId: upcomingMovie.movieSuggestion.tmdbId,
              title: upcomingMovie.movieSuggestion.title,
              posterPath: upcomingMovie.movieSuggestion.posterPath,
              releaseYear: upcomingMovie.movieSuggestion.releaseYear,
              watchByDate: upcomingMovie.watchByDate,
              status: upcomingMovie.status,
            }
          : undefined,
      activeVotingRound,
      currentTurn:
        currentTurn !== null
          ? {
              userId: currentTurn.userId,
              username: currentTurn.username,
              isCurrentUser: currentTurn.userId === userId,
            }
          : undefined,
      userHasVoted,
    }
  },
}
