export interface MovieSearchResult {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseYear: number | null
  overview: string
}

export interface MovieSuggestion {
  id: string
  tmdbId: number
  title: string
  posterPath: string | null
  releaseYear: number | null
  overview: string | null
}

export interface VoteRankings {
  [movieSuggestionId: string]: number
}

export interface MovieVote {
  id: string
  userId: string
  username: string
  rankings: VoteRankings
}

export type VotingRoundStatus =
  | 'SUGGESTING'
  | 'VOTING'
  | 'REVEALED'
  | 'TIE_BREAKING'
  | 'COMPLETED'

export interface VotingRound {
  id: string
  clubId: string
  suggestedByUserId: string
  suggestedByUsername: string
  status: VotingRoundStatus
  revealedAt: string | null
  createdAt: string
  suggestions: MovieSuggestion[]
  votes: MovieVote[]
  winnerMovieId?: string
  tiedMovies?: string[]
}

export type SelectedMovieStatus = 'UPCOMING' | 'WATCHED'

export interface SelectedMovie {
  id: string
  tmdbId: number
  title: string
  posterPath: string | null
  releaseYear: number | null
  watchByDate: string
  status: SelectedMovieStatus
}

export interface MovieRating {
  username: string
  rating: number
}

export interface MovieHistory {
  id: string
  movie: {
    tmdbId: number
    title: string
    posterPath: string | null
    releaseYear: number | null
  }
  suggestedBy: string
  watchByDate: string
  watchedAt: string | null
  selectedAt: string
  votes: Array<{
    username: string
    rankings: VoteRankings
  }>
  ratings: MovieRating[]
  averageRating: number | null
}

export interface ClubRotationMember {
  id: string
  userId: string
  username: string
  order: number
}

export interface CurrentMovieState {
  currentMovie?: SelectedMovie
  activeVotingRound?: VotingRound
  currentTurn?: {
    userId: string
    username: string
    isCurrentUser: boolean
  }
  userHasVoted?: boolean
}

export interface ClubSettings {
  movieSuggestionsCount: number
}
