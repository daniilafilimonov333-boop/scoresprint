import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import './App.css'

const REFRESH_INTERVAL_MS = 30000
const FAVORITES_STORAGE_KEY = 'wcscores-favorites'
const PREMIUM_STORAGE_KEY = 'wcscores-premium-enabled'
const DISPLAY_TIME_ZONE = 'America/Detroit'
const DISPLAY_TIME_ZONE_LABEL = 'Eastern Daylight Time (Detroit, MI GMT-4)'
const VIEW_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'scheduled', label: 'Upcoming' },
  { id: 'final', label: 'Finals' },
]
const SORT_OPTIONS = [
  { id: 'priority', label: 'Smart order' },
  { id: 'confidence', label: 'Top confidence' },
  { id: 'soonest', label: 'Kickoff time' },
]
const PREMIUM_FEATURES = [
  'Player score visibility (/10) for every lineup',
  'Top players scoreboard for each match',
  'Live team lineup score based on player form',
]

const SPORT_TABS = [
  {
    id: 'fifa-world-cup',
    label: 'FIFA World Cup',
    provider: 'fifa',
  },
  {
    id: 'basketball',
    label: 'Basketball',
    provider: 'espn',
    feeds: [
      { sport: 'basketball', league: 'nba', name: 'NBA' },
      { sport: 'basketball', league: 'wnba', name: 'WNBA' },
      {
        sport: 'basketball',
        league: 'mens-college-basketball',
        name: 'NCAA Men',
      },
    ],
  },
  {
    id: 'baseball',
    label: 'Baseball',
    provider: 'espn',
    feeds: [{ sport: 'baseball', league: 'mlb', name: 'MLB' }],
  },
  {
    id: 'football',
    label: 'Football',
    provider: 'espn',
    feeds: [
      { sport: 'football', league: 'nfl', name: 'NFL' },
      { sport: 'football', league: 'college-football', name: 'NCAA Football' },
    ],
  },
  {
    id: 'hockey',
    label: 'Hockey',
    provider: 'espn',
    feeds: [{ sport: 'hockey', league: 'nhl', name: 'NHL' }],
  },
  {
    id: 'tennis',
    label: 'Tennis',
    provider: 'espn',
    feeds: [
      { sport: 'tennis', league: 'atp', name: 'ATP' },
      { sport: 'tennis', league: 'wta', name: 'WTA' },
    ],
  },
  {
    id: 'mma',
    label: 'MMA',
    provider: 'espn',
    feeds: [{ sport: 'mma', league: 'ufc', name: 'UFC' }],
  },
]

const FIFA_MATCH_CENTER_URL =
  'https://api.fifa.com/api/v3/calendar/matches?from=2026-06-11T00%3A00%3A00Z&to=2026-07-19T23%3A59%3A59Z&language=en&count=500&idCompetition=17'

function getPlayerName(player) {
  return getFifaText(player?.PlayerName) || getFifaText(player?.ShortName) || 'Unknown player'
}

function normalizePlayerRatings(teamData) {
  const players = teamData?.Players || []
  const goals = teamData?.Goals || []
  const bookings = teamData?.Bookings || []
  const substitutions = teamData?.Substitutions || []

  const goalsByPlayer = goals.reduce((acc, item) => {
    const id = String(item.IdPlayer)
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  const cardsByPlayer = bookings.reduce((acc, item) => {
    const id = String(item.IdPlayer)
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  const subOnIds = new Set(substitutions.map((item) => String(item.IdPlayerOn)))
  const subOffIds = new Set(substitutions.map((item) => String(item.IdPlayerOff)))

  return players
    .map((player) => {
      const playerId = String(player.IdPlayer)
      const goalsCount = goalsByPlayer[playerId] || 0
      const cardsCount = cardsByPlayer[playerId] || 0
      const subOn = subOnIds.has(playerId)
      const subOff = subOffIds.has(playerId)
      const statusValue = Number(player.Status)
      const started = statusValue === 1 || statusValue === 2

      let rating = 6.2
      rating += goalsCount * 1.35
      rating -= cardsCount * 0.45

      if (started) {
        rating += 0.35
      }

      if (subOn) {
        rating += 0.2
      }

      if (subOff) {
        rating -= 0.1
      }

      rating = clamp(Math.round(rating * 10) / 10, 4.5, 10)

      return {
        id: playerId,
        name: getPlayerName(player),
        number: player.ShirtNumber || '-',
        position: Number.isFinite(player.Position) ? player.Position : null,
        goals: goalsCount,
        cards: cardsCount,
        started,
        subOn,
        subOff,
        rating,
      }
    })
    .sort((a, b) => b.rating - a.rating)
}

function normalizeGoalMoments(teamData) {
  const players = teamData?.Players || []
  const goals = teamData?.Goals || []
  const playersById = players.reduce((acc, player) => {
    acc[String(player.IdPlayer)] = getPlayerName(player)
    return acc
  }, {})

  return goals.map((goal, index) => {
    const playerId = String(goal.IdPlayer)
    const minute = goal.Minute || 'N/A'
    const scorer = playersById[playerId] || 'Unknown player'

    return {
      id: `${playerId}-${minute}-${index}`,
      scorer,
      minute,
    }
  })
}

async function fetchFifaMatchDetails(matchId) {
  const response = await fetch(
    `https://api.fifa.com/api/v3/live/football/17/285023/289273/${matchId}?language=en`
  )

  if (!response.ok) {
    throw new Error('Unable to load player stats from FIFA right now.')
  }

  const payload = await response.json()
  const homeTeamData = payload.HomeTeam || {}
  const awayTeamData = payload.AwayTeam || {}

  return {
    homePlayers: normalizePlayerRatings(homeTeamData),
    awayPlayers: normalizePlayerRatings(awayTeamData),
    homeGoals: normalizeGoalMoments(homeTeamData),
    awayGoals: normalizeGoalMoments(awayTeamData),
    homeCoach: getFifaText(homeTeamData?.Coaches?.[0]?.Name) || 'Coach unavailable',
    awayCoach: getFifaText(awayTeamData?.Coaches?.[0]?.Name) || 'Coach unavailable',
    matchCentreUrl: `https://www.fifa.com/en/match-centre/match/17/285023/289273/${matchId}`,
    momentsLinks: buildFifaMomentsLinks(matchId),
    watchLinks: [
      {
        label: 'FIFA Match Centre',
        url: `https://www.fifa.com/en/match-centre/match/17/285023/289273/${matchId}`,
      },
      {
        label: 'FIFA Tournament Hub',
        url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
      },
    ],
  }
}

function getStatusLabel(event) {
  const statusType = event.status?.type

  if (statusType?.state === 'in') {
    return `LIVE ${statusType.shortDetail ?? ''}`.trim()
  }

  if (statusType?.completed) {
    return 'Final'
  }

  return statusType?.shortDetail || statusType?.description || 'Scheduled'
}

function getMatchPriority(match) {
  if (match.status.startsWith('LIVE')) {
    return 0
  }

  if (match.status === 'Scheduled') {
    return 1
  }

  return 2
}

function getMatchState(status) {
  if (status.startsWith('LIVE')) {
    return 'live'
  }

  if (status === 'Scheduled') {
    return 'scheduled'
  }

  return 'final'
}

function sortMatches(matches) {
  return [...matches].sort((left, right) => {
    const priorityDifference = getMatchPriority(left) - getMatchPriority(right)

    if (priorityDifference !== 0) {
      return priorityDifference
    }

    return new Date(left.date) - new Date(right.date)
  })
}

function sortVisibleMatches(matches, sortMode, favoriteIds) {
  return [...matches].sort((left, right) => {
    const leftFavoriteBoost = favoriteIds.includes(left.id) ? 0 : 1
    const rightFavoriteBoost = favoriteIds.includes(right.id) ? 0 : 1

    if (leftFavoriteBoost !== rightFavoriteBoost) {
      return leftFavoriteBoost - rightFavoriteBoost
    }

    if (sortMode === 'confidence') {
      const leftConfidence = left.prediction.confidence ?? -1
      const rightConfidence = right.prediction.confidence ?? -1

      if (leftConfidence !== rightConfidence) {
        return rightConfidence - leftConfidence
      }
    }

    if (sortMode === 'soonest') {
      return new Date(left.date) - new Date(right.date)
    }

    return sortMatches([left, right])[0].id === left.id ? -1 : 1
  })
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildWorldCupRatings(matches) {
  const playedMatches = matches
    .filter((match) => match.played === 'yes')
    .map((match) => ({ ...match, playedOrder: new Date(match.date).getTime() }))
    .sort((left, right) => left.playedOrder - right.playedOrder)

  const ratings = {}

  function ensureTeam(teamName) {
    ratings[teamName] ||= {
      games: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      form: [],
      elo: 1500,
      weightedPoints: 0,
      weightedGoalsFor: 0,
      weightedGoalsAgainst: 0,
    }

    return ratings[teamName]
  }

  playedMatches.forEach((match, index) => {
    const homeGoals = Number(match.home_score)
    const awayGoals = Number(match.away_score)

    if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) {
      return
    }

    const homeTeam = match.home_team
    const awayTeam = match.away_team
    const homeStats = ensureTeam(homeTeam)
    const awayStats = ensureTeam(awayTeam)
    const goalDifference = homeGoals - awayGoals
    const marginMultiplier = goalDifference === 0 ? 1 : clamp(1 + Math.log(Math.abs(goalDifference) + 1) * 0.9, 1, 2.8)
    const homeExpected = 1 / (1 + 10 ** (((awayStats.elo || 1500) - (homeStats.elo || 1500) + 60) / 400))
    const awayExpected = 1 - homeExpected
    const outcome = homeGoals > awayGoals ? { home: 3, away: 0 } : awayGoals > homeGoals ? { home: 0, away: 3 } : { home: 1, away: 1 }
    const recencyWeight = 0.85 + ((index + 1) / playedMatches.length) * 0.55
    const kFactor = index < 10 ? 26 : 22

    homeStats.games += 1
    awayStats.games += 1
    homeStats.points += outcome.home
    awayStats.points += outcome.away
    homeStats.goalsFor += homeGoals
    homeStats.goalsAgainst += awayGoals
    awayStats.goalsFor += awayGoals
    awayStats.goalsAgainst += homeGoals
    homeStats.form.push(outcome.home)
    awayStats.form.push(outcome.away)
    homeStats.form = homeStats.form.slice(-5)
    awayStats.form = awayStats.form.slice(-5)
    homeStats.weightedPoints += outcome.home * recencyWeight
    awayStats.weightedPoints += outcome.away * recencyWeight
    homeStats.weightedGoalsFor += homeGoals * recencyWeight
    homeStats.weightedGoalsAgainst += awayGoals * recencyWeight
    awayStats.weightedGoalsFor += awayGoals * recencyWeight
    awayStats.weightedGoalsAgainst += homeGoals * recencyWeight

    const homeEloDelta = Math.round(kFactor * marginMultiplier * ((outcome.home / 3) - homeExpected))
    const awayEloDelta = Math.round(kFactor * marginMultiplier * ((outcome.away / 3) - awayExpected))
    homeStats.elo += homeEloDelta
    awayStats.elo += awayEloDelta
  })

  return ratings
}

function getRecentFormScore(stats) {
  if (!stats?.form?.length) {
    return 0
  }

  const weights = [1, 0.92, 0.84, 0.76, 0.68]
  const recentForm = stats.form.slice(-5).reduce((sum, result, index) => sum + result * weights[index], 0)
  return recentForm / 9
}

function getWorldCupStrength(teamName, ratings) {
  const stats = ratings[teamName]

  if (!stats || stats.games === 0) {
    return 1
  }

  const pointsPerGame = stats.points / stats.games
  const goalDifferencePerGame = (stats.goalsFor - stats.goalsAgainst) / stats.games
  const goalsForPerGame = stats.goalsFor / stats.games
  const goalsAgainstPerGame = stats.goalsAgainst / stats.games
  const eloEdge = (stats.elo - 1500) / 220
  const recentForm = getRecentFormScore(stats)
  const weightedMomentum = (stats.weightedPoints / stats.games) * 0.24

  return clamp(
    1 + pointsPerGame * 0.33 + goalDifferencePerGame * 0.2 + goalsForPerGame * 0.12 - goalsAgainstPerGame * 0.08 + eloEdge * 0.34 + recentForm * 0.2 + weightedMomentum,
    0.75,
    3.8
  )
}

function getProjectedScore(homeTeam, awayTeam, ratings) {
  const homeStrength = getWorldCupStrength(homeTeam, ratings)
  const awayStrength = getWorldCupStrength(awayTeam, ratings)
  const strengthGap = homeStrength - awayStrength
  const projectedHomeGoals = clamp(Math.round(1.2 + strengthGap * 0.95 + homeStrength * 0.12), 0, 5)
  const projectedAwayGoals = clamp(Math.round(1 + (awayStrength - homeStrength) * 0.72 + awayStrength * 0.1), 0, 5)

  return {
    homeStrength,
    awayStrength,
    projectedHomeGoals,
    projectedAwayGoals,
  }
}

function getPredictionConfidence(homeStrength, awayStrength, scoreMargin = 0) {
  const strengthGap = Math.abs(homeStrength - awayStrength)
  return clamp(Math.round(50 + strengthGap * 14 + Math.abs(scoreMargin) * 9), 52, 94)
}

function getPremiumInsights(match) {
  const confidence = match.prediction?.confidence
  const state = getMatchState(match.status)
  const insights = []

  if (state === 'live') {
    insights.push('Momentum tracker active')
  }

  if (confidence !== null && confidence !== undefined) {
    if (confidence >= 78) {
      insights.push('Strong favorite pattern')
    } else if (confidence <= 58) {
      insights.push('Upset alert signal')
    } else {
      insights.push('Balanced matchup trend')
    }
  }

  if (state === 'scheduled') {
    insights.push('Pre-kickoff tactical preview')
  }

  if (state === 'final') {
    insights.push('Post-match performance digest')
  }

  return insights.slice(0, 3)
}

function getTeamLineupScore(players) {
  if (!players || players.length === 0) {
    return null
  }

  const total = players.reduce((sum, player) => sum + Number(player.rating || 0), 0)
  return Math.round((total / players.length) * 10) / 10
}

function getFifaPrediction(match, ratings) {
  const { homeTeam, awayTeam, status } = match
  const { homeStrength, awayStrength, projectedHomeGoals, projectedAwayGoals } = getProjectedScore(
    homeTeam,
    awayTeam,
    ratings
  )
  const baseConfidence = getPredictionConfidence(homeStrength, awayStrength)

  if (status.startsWith('LIVE')) {
    const homeScore = Number(match.homeScore)
    const awayScore = Number(match.awayScore)

    if (!Number.isNaN(homeScore) && !Number.isNaN(awayScore)) {
      const liveConfidence = getPredictionConfidence(
        homeStrength,
        awayStrength,
        homeScore - awayScore
      )

      if (homeScore > awayScore) {
        return {
          text: `${homeTeam} likely to hold on`,
          confidence: liveConfidence,
        }
      }

      if (awayScore > homeScore) {
        return {
          text: `${awayTeam} likely to hold on`,
          confidence: liveConfidence,
        }
      }
    }

    return {
      text: homeStrength >= awayStrength ? `${homeTeam} slight edge live` : `${awayTeam} slight edge live`,
      confidence: baseConfidence,
    }
  }

  if (status === 'Final') {
    return {
      text: 'Prediction closed',
      confidence: null,
    }
  }

  if (projectedHomeGoals === projectedAwayGoals) {
    return {
      text: `Projected draw ${projectedHomeGoals}-${projectedAwayGoals}`,
      confidence: clamp(baseConfidence - 6, 50, 74),
    }
  }

  const projectedWinner = projectedHomeGoals > projectedAwayGoals ? homeTeam : awayTeam
  return {
    text: `${projectedWinner} edge, projected ${projectedHomeGoals}-${projectedAwayGoals}`,
    confidence: baseConfidence,
  }
}

function getWorldCupCardPrediction(match, ratings) {
  const liveLikeMatch = {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeScore: match.home_score,
    awayScore: match.away_score,
    status: match.played === 'yes' ? 'Final' : 'Scheduled',
  }

  return getFifaPrediction(liveLikeMatch, ratings)
}

function getFifaText(value) {
  if (Array.isArray(value)) {
    return value[0]?.Description || value[0]?.Value || ''
  }

  return typeof value === 'string' ? value : ''
}

function getFifaTeamName(team) {
  return getFifaText(team?.TeamName) || team?.ShortClubName || team?.Abbreviation || 'Unknown'
}

function getFifaScore(team) {
  return typeof team?.Score === 'number' ? String(team.Score) : '-'
}

function getFifaStatus(match) {
  if (match.MatchStatus === 3) {
    return `LIVE ${match.MatchTime || ''}`.trim()
  }

  if (match.MatchStatus === 0) {
    return 'Final'
  }

  if (match.MatchStatus === 1) {
    return 'Scheduled'
  }

  return match.MatchTime || 'Scheduled'
}

function buildFifaMomentsLinks(matchId) {
  return [
    {
      label: 'Match moments',
      url: `https://www.fifa.com/en/match-centre/match/17/285023/289273/${matchId}`,
    },
  ]
}

function buildEspnMomentsLinks(event) {
  return (event.links || []).slice(0, 2).map((link) => ({
    label:
      link.text && link.text.toLowerCase().includes('gamecast') ? 'Game moments' : link.text || 'Game link',
    url: link.href,
  }))
}

function normalizeFifaMatch(match) {
  const homeTeam = match.Home
  const awayTeam = match.Away

  if (!homeTeam || !awayTeam) {
    return null
  }

  return {
    id: `fifa-${match.IdMatch}`,
    sourceMatchId: String(match.IdMatch),
    league: 'FIFA World Cup',
    homeTeam: getFifaTeamName(homeTeam),
    awayTeam: getFifaTeamName(awayTeam),
    homeScore: getFifaScore(homeTeam),
    awayScore: getFifaScore(awayTeam),
    status: getFifaStatus(match),
    venue: getFifaText(match.Stadium?.Name) || match.Stadium?.CityName?.[0]?.Description || 'Venue TBD',
    date: match.LocalDate || match.Date,
    matchCentreUrl: `https://www.fifa.com/en/match-centre/match/17/285023/289273/${match.IdMatch}`,
    momentsLinks: buildFifaMomentsLinks(match.IdMatch),
    watchLinks: [
      {
        label: 'FIFA Match Centre',
        url: `https://www.fifa.com/en/match-centre/match/17/285023/289273/${match.IdMatch}`,
      },
      {
        label: 'FIFA Tournament Hub',
        url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
      },
    ],
  }
}

function normalizeEvent(event, leagueName) {
  const competition = event.competitions?.[0]
  const competitors = competition?.competitors || []
  const home = competitors.find((team) => team.homeAway === 'home')
  const away = competitors.find((team) => team.homeAway === 'away')

  if (!home || !away) {
    return null
  }

  return {
    id: event.id,
    league: leagueName,
    homeTeam: home.team?.displayName || 'Home',
    awayTeam: away.team?.displayName || 'Away',
    homeScore: home.score || '-',
    awayScore: away.score || '-',
    status: getStatusLabel(event),
    venue: competition?.venue?.fullName || 'Venue TBD',
    date: event.date,
    momentsLinks: buildEspnMomentsLinks(event),
    prediction: {
      text: 'Prediction pending',
      confidence: null,
    },
  }
}

async function fetchFeed(feed) {
  if (feed.provider === 'fifa') {
    const response = await fetch(FIFA_MATCH_CENTER_URL)

    if (!response.ok) {
      throw new Error('FIFA World Cup unavailable')
    }

    const payload = await response.json()
    const matches = payload.Results || []

    return matches
      .map((match) => normalizeFifaMatch(match))
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/${feed.sport}/${feed.league}/scoreboard`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`${feed.name} unavailable`)
  }

  const payload = await response.json()
  const events = payload.events || []
  return events.map((event) => normalizeEvent(event, feed.name)).filter(Boolean)
}

function formatDateTime(isoDate) {
  const date = new Date(isoDate)
  const today = new Date()

  const dateParts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: DISPLAY_TIME_ZONE,
  }).formatToParts(date)

  const todayParts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: DISPLAY_TIME_ZONE,
  }).formatToParts(today)

  const getPart = (parts, type) => parts.find((part) => part.type === type)?.value || ''
  const dateKey = `${getPart(dateParts, 'year')}-${getPart(dateParts, 'month')}-${getPart(dateParts, 'day')}`
  const todayKey = `${getPart(todayParts, 'year')}-${getPart(todayParts, 'month')}-${getPart(todayParts, 'day')}`

  const dayDifference = Math.round((Date.UTC(+getPart(dateParts, 'year'), +getPart(dateParts, 'month') - 1, +getPart(dateParts, 'day')) - Date.UTC(+getPart(todayParts, 'year'), +getPart(todayParts, 'month') - 1, +getPart(todayParts, 'day'))) / 86400000)
  const dayLabel =
    dateKey === todayKey ? 'Today' : dayDifference === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: DISPLAY_TIME_ZONE,
    }).format(date)

  const kickoff = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)

  return `${dayLabel} ${kickoff}`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildLineupRows(players, isPremium) {
  if (!players || players.length === 0) {
    return '<p class="empty">Lineups are not available yet for this match.</p>'
  }

  if (!isPremium) {
    return `<ul>${players
      .map(
        (player) =>
          `<li><strong>#${escapeHtml(player.number)} ${escapeHtml(
            player.name
          )}</strong><small>Upgrade to Premium to see player score and full stats.</small></li>`
      )
      .join('')}</ul>`
  }

  return `<ul>${players
    .map(
      (player) =>
        `<li><strong>#${escapeHtml(player.number)} ${escapeHtml(player.name)}</strong><span>${escapeHtml(
          player.rating
        )}/10</span><small>G:${escapeHtml(player.goals)} C:${escapeHtml(player.cards)}</small></li>`
    )
    .join('')}</ul>`
}

function buildLineupWindowHtml(match, details, errorMessage, isPremium) {
  const homeRows = details ? buildLineupRows(details.homePlayers, isPremium) : ''
  const awayRows = details ? buildLineupRows(details.awayPlayers, isPremium) : ''
  const homeLineupScore = details ? getTeamLineupScore(details.homePlayers) : null
  const awayLineupScore = details ? getTeamLineupScore(details.awayPlayers) : null
  const momentsMarkup = (details?.momentsLinks || match.momentsLinks || [])
    .map(
      (link) =>
        `<a class="moment-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(
          link.label
        )}</a>`
    )
    .join('')
  const errorMarkup = errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ''
  const premiumTag = isPremium
    ? '<span class="premium">Premium analytics enabled</span>'
    : '<span class="premium">Free plan - limited lineup stats</span>'
  const loadedMarkup = details
    ? `<div class="grid"><section><h2>${escapeHtml(match.homeTeam)}</h2><p class="coach">Coach: ${escapeHtml(
        details.homeCoach
      )}</p><p class="coach">Goal moments: ${escapeHtml(
        (details.homeGoals || []).map((goal) => `${goal.scorer} ${goal.minute}`).join(', ') || 'No goals yet'
      )}</p><p class="coach">Team lineup score: ${
        isPremium ? (homeLineupScore ?? 'N/A') : 'Premium only'
      }</p>${homeRows}</section><section><h2>${escapeHtml(match.awayTeam)}</h2><p class="coach">Coach: ${escapeHtml(
        details.awayCoach
      )}</p><p class="coach">Goal moments: ${escapeHtml(
        (details.awayGoals || []).map((goal) => `${goal.scorer} ${goal.minute}`).join(', ') || 'No goals yet'
      )}</p><p class="coach">Team lineup score: ${
        isPremium ? (awayLineupScore ?? 'N/A') : 'Premium only'
      }</p>${awayRows}</section></div>`
    : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(match.homeTeam)} vs ${escapeHtml(match.awayTeam)} Lineups</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; margin: 0; background: linear-gradient(145deg, #fff4c7, #d6f6ff); color: #1e1733; }
      main { max-width: 980px; margin: 24px auto; padding: 0 16px 24px; }
      h1 { margin: 0 0 8px; }
      .meta { color: #5a5775; margin: 0 0 18px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
      section { background: linear-gradient(180deg, #ffffff, #fff0c8); border: 2px solid #231d3d; border-radius: 12px; padding: 12px; box-shadow: 0 4px 0 rgba(35, 29, 61, 0.12); }
      h2 { margin: 0; font-size: 1.1rem; }
      .coach { color: #5a5775; margin: 8px 0 10px; font-size: 0.92rem; }
      ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
      li { border: 2px solid #231d3d; border-radius: 10px; padding: 8px; display: grid; gap: 4px; background: linear-gradient(90deg, rgba(255, 93, 143, 0.14), rgba(88, 185, 255, 0.14)); }
      span { justify-self: end; font-weight: 600; }
      small { color: #5a5775; }
      .empty { color: #5a5775; }
      .error { color: #d63d57; font-weight: 600; }
      .premium { display: inline-block; border: 2px solid #231d3d; border-radius: 999px; padding: 4px 10px; background: linear-gradient(90deg, #ffd84e, #ff5d8f); color: #231d3d; font-weight: 700; margin-bottom: 10px; }
      .moments { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
      .moment-link { display: inline-block; text-decoration: none; color: #1e1733; border: 2px solid #231d3d; border-radius: 999px; padding: 6px 10px; background: linear-gradient(90deg, #58b9ff, #63d39b); }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(match.homeTeam)} vs ${escapeHtml(match.awayTeam)}</h1>
      <p class="meta">${escapeHtml(match.status)} | ${escapeHtml(formatDateTime(match.date))} | ${escapeHtml(
        match.venue
      )}</p>
      ${premiumTag}
      <div class="moments">${momentsMarkup}</div>
      ${errorMarkup}
      ${loadedMarkup}
    </main>
  </body>
</html>`
}

function App() {
  const [selectedTab, setSelectedTab] = useState(SPORT_TABS[0].id)
  const [viewFilter, setViewFilter] = useState('all')
  const [sortMode, setSortMode] = useState('priority')
  const [searchTerm, setSearchTerm] = useState('')
  const [favoriteMatchIds, setFavoriteMatchIds] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [worldCupMatches, setWorldCupMatches] = useState([])
  const [isLoadingLive, setIsLoadingLive] = useState(true)
  const [liveError, setLiveError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null)
  const [isLoadingMatchDetails, setIsLoadingMatchDetails] = useState(false)
  const [matchDetailError, setMatchDetailError] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const activeTab = useMemo(
    () => SPORT_TABS.find((tab) => tab.id === selectedTab) || SPORT_TABS[0],
    [selectedTab]
  )

  useEffect(() => {
    try {
      const storedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY)

      if (storedFavorites) {
        setFavoriteMatchIds(JSON.parse(storedFavorites))
      }
    } catch {
      setFavoriteMatchIds([])
    }

    try {
      const storedPremium = window.localStorage.getItem(PREMIUM_STORAGE_KEY)

      if (storedPremium) {
        setIsPremium(JSON.parse(storedPremium))
      }
    } catch {
      setIsPremium(false)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteMatchIds))
  }, [favoriteMatchIds])

  useEffect(() => {
    window.localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(isPremium))
  }, [isPremium])
  const worldCupRatings = useMemo(() => buildWorldCupRatings(worldCupMatches), [worldCupMatches])
  const predictedLiveMatches = useMemo(
    () =>
      liveMatches.map((match) => ({
        ...match,
        prediction:
          match.league === 'FIFA World Cup'
            ? getFifaPrediction(match, worldCupRatings)
            : match.prediction || { text: 'Prediction pending', confidence: null },
      })),
    [liveMatches, worldCupRatings]
  )
  const predictedWorldCupMatches = useMemo(
    () =>
      worldCupMatches.slice(0, 16).map((match) => ({
        ...match,
        prediction: getWorldCupCardPrediction(match, worldCupRatings),
      })),
    [worldCupMatches, worldCupRatings]
  )

  useEffect(() => {
    let isMounted = true

    async function loadLiveScores() {
      setIsLoadingLive(true)
      setLiveError('')

      const requests =
        activeTab.provider === 'fifa' ? [fetchFeed(activeTab)] : activeTab.feeds.map(fetchFeed)
      const results = await Promise.allSettled(requests)

      if (!isMounted) {
        return
      }

      const fulfilledEvents = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)

      const sortedEvents = sortMatches(fulfilledEvents)

      if (sortedEvents.length === 0) {
        setLiveError('No live feed available right now for this sport.')
      }

      setLiveMatches(sortedEvents)
      setLastUpdated(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZone: DISPLAY_TIME_ZONE,
        }).format(new Date())
      )
      setIsLoadingLive(false)
    }

    loadLiveScores()
    const interval = setInterval(loadLiveScores, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [activeTab])

  useEffect(() => {
    let isMounted = true

    async function loadWorldCupScores() {
      try {
        const response = await fetch('/world_cup_2026_scores.json')
        if (!response.ok) {
          throw new Error('Cannot load World Cup data')
        }
        const data = await response.json()
        if (isMounted) {
          setWorldCupMatches(data)
        }
      } catch {
        if (isMounted) {
          setWorldCupMatches([])
        }
      }
    }

    loadWorldCupScores()

    return () => {
      isMounted = false
    }
  }, [])

  const playedCount = worldCupMatches.filter((match) => match.played === 'yes').length
  const liveNowCount = predictedLiveMatches.filter((match) => match.status.startsWith('LIVE')).length
  const scheduledCount = predictedLiveMatches.filter((match) => match.status === 'Scheduled').length
  const finalCount = predictedLiveMatches.filter((match) => match.status === 'Final').length
  const filteredMatches = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    return predictedLiveMatches.filter((match) => {
      const stateMatches = viewFilter === 'all' || getMatchState(match.status) === viewFilter
      const searchMatches =
        normalizedSearch.length === 0 ||
        match.homeTeam.toLowerCase().includes(normalizedSearch) ||
        match.awayTeam.toLowerCase().includes(normalizedSearch) ||
        match.venue.toLowerCase().includes(normalizedSearch)

      return stateMatches && searchMatches
    })
  }, [deferredSearchTerm, predictedLiveMatches, viewFilter])
  const visibleMatches = useMemo(
    () => sortVisibleMatches(filteredMatches, sortMode, favoriteMatchIds),
    [favoriteMatchIds, filteredMatches, sortMode]
  )
  const featuredMatch = visibleMatches[0] || predictedLiveMatches[0] || null
  const watchlistMatches = useMemo(
    () => predictedLiveMatches.filter((match) => favoriteMatchIds.includes(match.id)).slice(0, 6),
    [favoriteMatchIds, predictedLiveMatches]
  )

  function toggleFavorite(matchId) {
    setFavoriteMatchIds((currentIds) =>
      currentIds.includes(matchId)
        ? currentIds.filter((id) => id !== matchId)
        : [...currentIds, matchId]
    )
  }

  async function openMatchDetails(match) {
    setSelectedMatch(match)
    setSelectedMatchDetails(null)
    setMatchDetailError('')

    if (!match.sourceMatchId) {
      setMatchDetailError('Detailed player stats are currently available for FIFA World Cup matches only.')
      return
    }

    setIsLoadingMatchDetails(true)

    try {
      const details = await fetchFifaMatchDetails(match.sourceMatchId)
      setSelectedMatchDetails(details)
    } catch (error) {
      setMatchDetailError(error instanceof Error ? error.message : 'Unable to load match details.')
    } finally {
      setIsLoadingMatchDetails(false)
    }
  }

  async function openLineupsInNewWindow(match) {
    const popup = window.open('', '_blank', 'width=980,height=820')

    if (!popup) {
      return
    }

    popup.document.open()
    popup.document.write(buildLineupWindowHtml(match, null, 'Loading lineups...', isPremium))
    popup.document.close()

    if (!match.sourceMatchId) {
      popup.document.open()
      popup.document.write(
        buildLineupWindowHtml(
          match,
          null,
          'Detailed lineups are currently available for FIFA World Cup matches only.',
          isPremium
        )
      )
      popup.document.close()
      return
    }

    try {
      const details = await fetchFifaMatchDetails(match.sourceMatchId)
      popup.document.open()
      popup.document.write(buildLineupWindowHtml(match, details, '', isPremium))
      popup.document.close()
    } catch (error) {
      popup.document.open()
      popup.document.write(
        buildLineupWindowHtml(
          match,
          null,
          error instanceof Error ? error.message : 'Unable to load lineups right now.',
          isPremium
        )
      )
      popup.document.close()
    }
  }

  function closeMatchDetails() {
    setSelectedMatch(null)
    setSelectedMatchDetails(null)
    setMatchDetailError('')
    setIsLoadingMatchDetails(false)
  }

  function handlePremiumUpgrade() {
    setIsPremium(true)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-top-actions">
          <span className="premium-price-tag">Premium $4.99/month</span>
          <button type="button" className="premium-top-button" onClick={handlePremiumUpgrade}>
            {isPremium ? 'Premium Active' : 'Unlock Premium for $4.99'}
          </button>
        </div>
        <p className="kicker">ScoreSprint</p>
        <h1>All Sports, One Live Scoreboard</h1>
        <p className="subtitle">
          Multi-sport live scores with tab selection, auto-refresh every 30 seconds,
          and an official FIFA World Cup live feed.
        </p>
        <p className="refresh">
          Last updated: {lastUpdated || 'Loading...'} · {DISPLAY_TIME_ZONE_LABEL}
        </p>
      </header>

      <section className="tabs" aria-label="Sport tabs">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedTab(tab.id)}
            className={tab.id === activeTab.id ? 'tab active' : 'tab'}
          >
            {tab.label}
          </button>
        ))}
      </section>

      <section className="toolbar" aria-label="Scoreboard controls">
        <div className="filter-row">
          {VIEW_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setViewFilter(filter.id)}
              className={viewFilter === filter.id ? 'filter-pill active' : 'filter-pill'}
            >
              {filter.label}
            </button>
          ))}

          <div className="sort-group" role="group" aria-label="Sort matches">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSortMode(option.id)}
                className={sortMode === option.id ? 'filter-pill active' : 'filter-pill'}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="search-box">
          <span>Search team or venue</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Mexico, Ecuador, Toronto..."
          />
        </label>
      </section>

      <section className="summary-strip" aria-label="Scoreboard summary">
        <article className="summary-card">
          <strong>{liveNowCount}</strong>
          <span>Live now</span>
        </article>
        <article className="summary-card">
          <strong>{scheduledCount}</strong>
          <span>Upcoming</span>
        </article>
        <article className="summary-card">
          <strong>{finalCount}</strong>
          <span>Finished</span>
        </article>
        <article className="summary-card">
          <strong>{filteredMatches.length}</strong>
          <span>On screen</span>
        </article>
        <article className="summary-card">
          <strong>{watchlistMatches.length}</strong>
          <span>Watchlist</span>
        </article>
      </section>

      <section className="premium-panel" aria-label="Premium plan">
        <div className="premium-head">
          <h2>Premium Plan - $4.99/month</h2>
          <button
            type="button"
            className={isPremium ? 'premium-toggle active' : 'premium-toggle'}
            onClick={() => setIsPremium((current) => !current)}
          >
            {isPremium ? 'Premium Enabled' : 'Upgrade to Premium $4.99'}
          </button>
        </div>
        <p className="premium-copy">
          Unlock player scores, lineup strength, and top player rankings.
        </p>
        <div className="premium-grid">
          {PREMIUM_FEATURES.map((feature) => (
            <article key={feature} className="premium-item">
              {feature}
            </article>
          ))}
        </div>
      </section>

      {featuredMatch ? (
        <section className="spotlight" aria-label="Featured match">
          <div className="spotlight-copy">
            <p className="spotlight-kicker">Featured Match</p>
            <h2>
              {featuredMatch.homeTeam} vs {featuredMatch.awayTeam}
            </h2>
            <p className="spotlight-meta">
              {featuredMatch.status} • {formatDateTime(featuredMatch.date)} • {featuredMatch.venue}
            </p>
          </div>

          <div className="spotlight-score">
            <div>
              <span>{featuredMatch.homeTeam}</span>
              <strong>{featuredMatch.homeScore}</strong>
            </div>
            <div>
              <span>{featuredMatch.awayTeam}</span>
              <strong>{featuredMatch.awayScore}</strong>
            </div>
          </div>

          <div className="spotlight-prediction">
            <button
              type="button"
              className="prediction prediction-button"
              onClick={() => openLineupsInNewWindow(featuredMatch)}
            >
              Prediction: {featuredMatch.prediction.text}
            </button>
            {featuredMatch.prediction.confidence ? (
              <span>{featuredMatch.prediction.confidence}% confidence</span>
            ) : (
              <span>Prediction locked</span>
            )}
            <button
              type="button"
              className="watch-button"
              onClick={() => toggleFavorite(featuredMatch.id)}
            >
              {favoriteMatchIds.includes(featuredMatch.id) ? 'Remove from watchlist' : 'Add to watchlist'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="watchlist-panel" aria-label="Watchlist matches">
        <div className="section-head">
          <h2>Watchlist</h2>
          <span>{watchlistMatches.length} saved matches</span>
        </div>

        {watchlistMatches.length === 0 ? (
          <p className="state-message">Star matches to keep them pinned here.</p>
        ) : (
          <div className="watchlist-grid">
            {watchlistMatches.map((match) => (
              <article key={match.id} className="watchlist-card">
                <div className="meta">
                  <span className="league">{match.league}</span>
                  <span className="status">{match.status}</span>
                </div>
                <p className="watchlist-title">
                  {match.homeTeam} vs {match.awayTeam}
                </p>
                <p className="confidence">
                  {match.prediction.confidence
                    ? `${match.prediction.confidence}% confidence`
                    : 'Prediction locked'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="live-panel">
        <div className="section-head">
          <h2>{activeTab.label} Live Scores</h2>
          <span>
            {activeTab.provider === 'fifa'
              ? `${liveNowCount} live • ${predictedLiveMatches.length} matches`
              : `${predictedLiveMatches.length} games`}
          </span>
        </div>

        {isLoadingLive ? <p className="state-message">Loading live scores...</p> : null}
        {liveError ? <p className="state-message error">{liveError}</p> : null}

        <div className="score-grid">
          {visibleMatches.map((match) => (
            <article
              key={match.id}
              className="match-card"
              role="button"
              tabIndex={0}
              aria-label={`${match.homeTeam} vs ${match.awayTeam} lineup details`}
              onClick={() => openMatchDetails(match)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openMatchDetails(match)
                }
              }}
            >
              <div className="meta">
                <span className="league">{match.league}</span>
                <span className="status">{match.status}</span>
              </div>
              <div className="teams">
                <p>
                  <strong>{match.homeTeam}</strong>
                  <span>{match.homeScore}</span>
                </p>
                <p>
                  <strong>{match.awayTeam}</strong>
                  <span>{match.awayScore}</span>
                </p>
              </div>
              <div className="details">
                <span>{formatDateTime(match.date)}</span>
                <span>{match.venue}</span>
              </div>
              <button
                type="button"
                className={favoriteMatchIds.includes(match.id) ? 'star-button active' : 'star-button'}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleFavorite(match.id)
                }}
              >
                {favoriteMatchIds.includes(match.id) ? 'Starred match' : 'Star match'}
              </button>
              <button
                type="button"
                className="prediction prediction-button"
                onClick={(event) => {
                  event.stopPropagation()
                  openLineupsInNewWindow(match)
                }}
              >
                Prediction: {match.prediction.text}
              </button>
              {isPremium ? (
                <div className="insight-chips" onClick={(event) => event.stopPropagation()}>
                  {getPremiumInsights(match).map((insight) => (
                    <span key={`${match.id}-${insight}`} className="insight-chip">
                      {insight}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="premium-lock">Premium unlocks advanced match insights.</p>
              )}
              {match.prediction.confidence ? (
                <p className="confidence">Confidence: {match.prediction.confidence}%</p>
              ) : null}
              <button
                type="button"
                className="details-button"
                onClick={(event) => {
                  event.stopPropagation()
                  openMatchDetails(match)
                }}
              >
                View player stats and rating /10
              </button>
              <div className="watch-links">
                {(match.momentsLinks || []).map((link) => (
                  <a
                    key={`${match.id}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {link.label}
                  </a>
                ))}
                {(match.watchLinks || []).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          ))}

          {!isLoadingLive && visibleMatches.length === 0 ? (
            <p className="state-message">No games found in this feed right now.</p>
          ) : null}
        </div>
      </section>

      <section className="world-cup-panel">
        <div className="section-head">
          <h2>FIFA World Cup 2026</h2>
          <span>
            {playedCount}/{worldCupMatches.length} played
          </span>
        </div>

        <div className="wc-list">
          {predictedWorldCupMatches.map((match) => (
            <article key={match.match_number} className="wc-item">
              <p className="wc-stage">{match.stage}</p>
              <p className="wc-line">
                <span>{match.home_team}</span>
                <strong>{match.played === 'yes' ? match.score : 'vs'}</strong>
                <span>{match.away_team}</span>
              </p>
              <p className="wc-date">{match.date}</p>
              <p className="prediction">Prediction: {match.prediction.text}</p>
              {match.prediction.confidence ? (
                <p className="confidence">Confidence: {match.prediction.confidence}%</p>
              ) : null}
            </article>
          ))}
        </div>

        <p className="wc-note">
          Showing first 16 matches. Full data is available in
          {' '}
          <code>world_cup_2026_scores.json</code>.
        </p>
      </section>

      {selectedMatch ? (
        <section className="details-modal" aria-label="Match details">
          <div className="details-panel">
            <div className="details-head">
              <h2>
                {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
              </h2>
              <button type="button" className="close-button" onClick={closeMatchDetails}>
                Close
              </button>
            </div>

            <p className="spotlight-meta">
              {selectedMatch.status} • {formatDateTime(selectedMatch.date)} • {selectedMatch.venue}
            </p>

            <div className="watch-links modal-watch-links">
              {(selectedMatchDetails?.momentsLinks || selectedMatch.momentsLinks || []).map((link) => (
                <a key={`modal-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
              {(selectedMatchDetails?.watchLinks || selectedMatch.watchLinks || []).map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>

            {isLoadingMatchDetails ? <p className="state-message">Loading player stats...</p> : null}
            {matchDetailError ? <p className="state-message error">{matchDetailError}</p> : null}

            {selectedMatchDetails ? (
              <>
                <div className="lineups-grid">
                <article className="lineup-card">
                  <h3>{selectedMatch.homeTeam}</h3>
                  <p className="confidence">Coach: {selectedMatchDetails.homeCoach}</p>
                  <p className="confidence">
                    Goal moments:{' '}
                    {(selectedMatchDetails.homeGoals || []).length > 0
                      ? selectedMatchDetails.homeGoals.map((goal) => `${goal.scorer} ${goal.minute}`).join(', ')
                      : 'No goals yet'}
                  </p>
                  <p className="confidence">
                    Team lineup score:{' '}
                    {isPremium
                      ? getTeamLineupScore(selectedMatchDetails.homePlayers) ?? 'N/A'
                      : 'Premium only'}
                  </p>
                  <ul>
                    {selectedMatchDetails.homePlayers.map((player) => (
                      <li key={`home-${player.id}`}>
                        <span>
                          #{player.number} {player.name}
                        </span>
                        <span>{isPremium ? `${player.rating}/10` : 'Premium only'}</span>
                        <small>
                          {isPremium ? `G:${player.goals} C:${player.cards}` : 'Upgrade to see player stats'}
                        </small>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="lineup-card">
                  <h3>{selectedMatch.awayTeam}</h3>
                  <p className="confidence">Coach: {selectedMatchDetails.awayCoach}</p>
                  <p className="confidence">
                    Goal moments:{' '}
                    {(selectedMatchDetails.awayGoals || []).length > 0
                      ? selectedMatchDetails.awayGoals.map((goal) => `${goal.scorer} ${goal.minute}`).join(', ')
                      : 'No goals yet'}
                  </p>
                  <p className="confidence">
                    Team lineup score:{' '}
                    {isPremium
                      ? getTeamLineupScore(selectedMatchDetails.awayPlayers) ?? 'N/A'
                      : 'Premium only'}
                  </p>
                  <ul>
                    {selectedMatchDetails.awayPlayers.map((player) => (
                      <li key={`away-${player.id}`}>
                        <span>
                          #{player.number} {player.name}
                        </span>
                        <span>{isPremium ? `${player.rating}/10` : 'Premium only'}</span>
                        <small>
                          {isPremium ? `G:${player.goals} C:${player.cards}` : 'Upgrade to see player stats'}
                        </small>
                      </li>
                    ))}
                  </ul>
                </article>
                </div>

                <section className="premium-scoreboard">
                  <h3>Top Players Scoreboard</h3>
                  {isPremium ? (
                    <div className="premium-score-list">
                      {[...selectedMatchDetails.homePlayers, ...selectedMatchDetails.awayPlayers]
                        .sort((left, right) => right.rating - left.rating)
                        .slice(0, 6)
                        .map((player) => (
                          <p key={`top-${player.id}-${player.number}`}>
                            #{player.number} {player.name} - {player.rating}/10
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="premium-lock">Upgrade to Premium to view top player scores.</p>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
