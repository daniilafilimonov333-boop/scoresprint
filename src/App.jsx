import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import './App.css'

const REFRESH_INTERVAL_MS = 30000
const FAVORITES_STORAGE_KEY = 'wcscores-favorites'
const LANGUAGE_STORAGE_KEY = 'wcscores-language'
const DISPLAY_TIME_ZONE = 'America/Detroit'
const DISPLAY_TIME_ZONE_LABEL = 'Eastern Daylight Time (Detroit, MI GMT-4)'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
]

const TRANSLATIONS = {
  en: {
    all: 'All',
    live: 'Live',
    upcoming: 'Upcoming',
    finals: 'Finals',
    smartOrder: 'Smart order',
    topConfidence: 'Top confidence',
    kickoffTime: 'Kickoff time',
    playerScores: 'Player score visibility (/10) for every lineup',
    topPlayers: 'Top players scoreboard for each match',
    lineupScore: 'Live team lineup score based on player form',
    premiumPrice: 'Premium $4.99/month',
    unlockPremium: 'Unlock Premium for $4.99',
    premiumActive: 'Premium Active',
    allSports: 'FIFA World Cup',
    liveSingular: 'Live scoreboard',
    subtitle: 'Live FIFA World Cup 2026 scores with official match data, player ratings, and lineup analytics.',
    lastUpdated: 'Last updated',
    searchPlaceholder: 'Mexico, Ecuador, Toronto...',
    searchLabel: 'Search team or venue',
    liveNow: 'Live now',
    upcoming: 'Upcoming',
    finished: 'Finished',
    onScreen: 'On screen',
    watchlist: 'Watchlist',
    premiumPlan: 'Premium Plan - $4.99/month',
    upgradePremium: 'Upgrade to Premium $4.99',
    premiumEnabled: 'Premium Enabled',
    premiumCopy: 'Unlock player scores, lineup strength, and top player rankings.',
    featuredMatch: 'Featured Match',
    watchlistMatches: 'Watchlist',
    savedMatches: 'saved matches',
    starMatches: 'Star matches to keep them pinned here.',
    liveScores: 'Live Scores',
    liveCount: 'live',
    matches: 'matches',
    games: 'games',
    loadingScores: 'Loading live scores...',
    noGames: 'No games found in this feed right now.',
    worldCup: 'FIFA World Cup 2026',
    played: 'played',
    worldCupNote: 'Showing first 16 matches. Full data is available in world_cup_2026_scores.json.',
    close: 'Close',
    loading: 'Loading player stats...',
    coach: 'Coach',
    goalMoments: 'Goal moments',
    teamLineupScore: 'Team lineup score',
    lineupDetails: 'lineup details',
    starredMatch: 'Starred match',
    starMatch: 'Star match',
    prediction: 'Prediction',
    confidence: 'confidence',
    viewPlayerStats: 'View player stats and rating /10',
    removeWatchlist: 'Remove from watchlist',
    addWatchlist: 'Add to watchlist',
    premiumUnlocks: 'Premium unlocks advanced match insights.',
    lineupCard: 'Lineup',
    noGoalsYet: 'No goals yet',
    premiumOnly: 'Premium only',
    language: 'Language',
  },
  es: {
    all: 'Todos',
    live: 'En directo',
    upcoming: 'Próximos',
    finals: 'Finales',
    smartOrder: 'Orden inteligente',
    topConfidence: 'Máxima confianza',
    kickoffTime: 'Hora de inicio',
    playerScores: 'Visibilidad de puntuación de jugadores (/10) para cada alineación',
    topPlayers: 'Marcador de mejores jugadores para cada partido',
    lineupScore: 'Puntuación de alineación de equipo en vivo basada en forma del jugador',
    premiumPrice: 'Premium $4.99/mes',
    unlockPremium: 'Desbloquear Premium por $4.99',
    premiumActive: 'Premium Activo',
    allSports: 'Copa Mundial FIFA',
    liveSingular: 'Marcador en directo',
    subtitle: 'Puntuaciones en vivo de la Copa Mundial FIFA 2026 con datos de partidos oficiales, calificaciones de jugadores y análisis de alineaciones.',
    lastUpdated: 'Última actualización',
    searchPlaceholder: 'México, Ecuador, Toronto...',
    searchLabel: 'Buscar equipo o estadio',
    liveNow: 'En directo',
    upcoming: 'Próximos',
    finished: 'Finalizados',
    onScreen: 'En pantalla',
    watchlist: 'Lista de vigilancia',
    premiumPlan: 'Plan Premium - $4.99/mes',
    upgradePremium: 'Mejorar a Premium $4.99',
    premiumEnabled: 'Premium Habilitado',
    premiumCopy: 'Desbloquea puntuaciones de jugadores, fortaleza de alineación y clasificaciones de mejores jugadores.',
    featuredMatch: 'Partido Destacado',
    watchlistMatches: 'Lista de vigilancia',
    savedMatches: 'partidos guardados',
    starMatches: 'Marca partidos para mantenerlos fijados aquí.',
    liveScores: 'Puntuaciones en Directo',
    liveCount: 'en directo',
    matches: 'partidos',
    games: 'juegos',
    loadingScores: 'Cargando puntuaciones en vivo...',
    noGames: 'No hay juegos en este feed en este momento.',
    worldCup: 'Copa Mundial FIFA 2026',
    played: 'jugados',
    worldCupNote: 'Mostrando primeros 16 partidos. Los datos completos están disponibles en world_cup_2026_scores.json.',
    close: 'Cerrar',
    loading: 'Cargando estadísticas de jugadores...',
    coach: 'Entrenador',
    goalMoments: 'Momentos de gol',
    teamLineupScore: 'Puntuación de alineación del equipo',
    lineupDetails: 'detalles de alineación',
    starredMatch: 'Partido marcado',
    starMatch: 'Marcar partido',
    prediction: 'Predicción',
    confidence: 'confianza',
    viewPlayerStats: 'Ver estadísticas de jugadores y calificación /10',
    removeWatchlist: 'Eliminar de la lista de vigilancia',
    addWatchlist: 'Agregar a la lista de vigilancia',
    premiumUnlocks: 'Premium desbloquea información avanzada del partido.',
    lineupCard: 'Alineación',
    noGoalsYet: 'Sin goles aún',
    premiumOnly: 'Solo Premium',
    language: 'Idioma',
  },
  fr: {
    all: 'Tous',
    live: 'En direct',
    upcoming: 'À venir',
    finals: 'Finales',
    smartOrder: 'Ordre intelligent',
    topConfidence: 'Confiance maximale',
    kickoffTime: 'Heure du coup d\'envoi',
    playerScores: 'Visibilité du score des joueurs (/10) pour chaque composition',
    topPlayers: 'Tableau de bord des meilleurs joueurs pour chaque match',
    lineupScore: 'Score d\'équipe en direct basé sur la forme des joueurs',
    premiumPrice: 'Premium 4,99 $/mois',
    unlockPremium: 'Déverrouiller Premium pour 4,99 $',
    premiumActive: 'Premium Actif',
    allSports: 'Coupe du Monde FIFA',
    liveSingular: 'Tableau de bord en direct',
    subtitle: 'Scores en direct de la Coupe du Monde FIFA 2026 avec données officielles, cotes de joueurs et analyse des compositions.',
    lastUpdated: 'Dernière mise à jour',
    searchPlaceholder: 'Mexique, Équateur, Toronto...',
    searchLabel: 'Rechercher une équipe ou un stade',
    liveNow: 'En direct',
    upcoming: 'À venir',
    finished: 'Terminé',
    onScreen: 'À l\'écran',
    watchlist: 'Liste de suivi',
    premiumPlan: 'Plan Premium - 4,99 $/mois',
    upgradePremium: 'Passer à Premium 4,99 $',
    premiumEnabled: 'Premium Activé',
    premiumCopy: 'Déverrouiller les scores des joueurs, la force de composition et les classements des meilleurs joueurs.',
    featuredMatch: 'Match en vedette',
    watchlistMatches: 'Liste de suivi',
    savedMatches: 'matchs enregistrés',
    starMatches: 'Marquer les matchs pour les garder épinglés ici.',
    liveScores: 'Scores en Direct',
    liveCount: 'en direct',
    matches: 'matchs',
    games: 'jeux',
    loadingScores: 'Chargement des scores en direct...',
    noGames: 'Aucun jeu disponible dans ce flux pour l\'instant.',
    worldCup: 'Coupe du Monde FIFA 2026',
    played: 'joués',
    worldCupNote: 'Affichage des 16 premiers matchs. L\'ensemble des données est disponible dans world_cup_2026_scores.json.',
    close: 'Fermer',
    loading: 'Chargement des statistiques des joueurs...',
    coach: 'Entraîneur',
    goalMoments: 'Moments de but',
    teamLineupScore: 'Score d\'équipe',
    lineupDetails: 'détails de composition',
    starredMatch: 'Match marqué',
    starMatch: 'Marquer un match',
    prediction: 'Prédiction',
    confidence: 'confiance',
    viewPlayerStats: 'Voir les statistiques des joueurs et la cote /10',
    removeWatchlist: 'Supprimer de la liste de suivi',
    addWatchlist: 'Ajouter à la liste de suivi',
    premiumUnlocks: 'Premium déverrouille des informations avancées sur les matchs.',
    lineupCard: 'Composition',
    noGoalsYet: 'Aucun but pour l\'instant',
    premiumOnly: 'Premium uniquement',
    language: 'Langue',
  },
  de: {
    all: 'Alle',
    live: 'Live',
    upcoming: 'Bevorstehend',
    finals: 'Finale',
    smartOrder: 'Intelligente Sortierung',
    topConfidence: 'Höchste Zuverlässigkeit',
    kickoffTime: 'Spielbeginn',
    playerScores: 'Spielerbewertung (/10) für jede Aufstellung',
    topPlayers: 'Top-Spieler-Anzeigetafel für jedes Spiel',
    lineupScore: 'Live-Teamaufstellung basierend auf Spielerform',
    premiumPrice: 'Premium 4,99 $/Monat',
    unlockPremium: 'Premium für 4,99 $ freischalten',
    premiumActive: 'Premium Aktiv',
    allSports: 'FIFA-Weltmeisterschaft',
    liveSingular: 'Live-Scoreboard',
    subtitle: 'Live-Ergebnisse der FIFA-Weltmeisterschaft 2026 mit offiziellen Spieldaten, Spielerbewertungen und Aufstellungsanalysen.',
    lastUpdated: 'Zuletzt aktualisiert',
    searchPlaceholder: 'Mexiko, Ecuador, Toronto...',
    searchLabel: 'Team oder Stadion suchen',
    liveNow: 'Live',
    upcoming: 'Bevorstehend',
    finished: 'Beendet',
    onScreen: 'Auf dem Bildschirm',
    watchlist: 'Beobachtungsliste',
    premiumPlan: 'Premium-Plan - 4,99 $/Monat',
    upgradePremium: 'Upgrade auf Premium 4,99 $',
    premiumEnabled: 'Premium Aktiviert',
    premiumCopy: 'Entsperren Sie Spielerbewertungen, Aufstellungsstärke und Top-Spieler-Rankings.',
    featuredMatch: 'Ausgewähltes Spiel',
    watchlistMatches: 'Beobachtungsliste',
    savedMatches: 'gespeicherte Spiele',
    starMatches: 'Markieren Sie Spiele, um sie hier oben zu halten.',
    liveScores: 'Live-Ergebnisse',
    liveCount: 'live',
    matches: 'Spiele',
    games: 'Spiele',
    loadingScores: 'Live-Ergebnisse werden geladen...',
    noGames: 'Derzeit keine Spiele in diesem Feed.',
    worldCup: 'FIFA-Weltmeisterschaft 2026',
    played: 'gespielt',
    worldCupNote: 'Zeigt die ersten 16 Spiele. Vollständige Daten finden Sie in world_cup_2026_scores.json.',
    close: 'Schließen',
    loading: 'Spielerstatistiken werden geladen...',
    coach: 'Trainer',
    goalMoments: 'Tormomente',
    teamLineupScore: 'Team-Aufstellung',
    lineupDetails: 'Aufstellungsdetails',
    starredMatch: 'Markiertes Spiel',
    starMatch: 'Spiel markieren',
    prediction: 'Vorhersage',
    confidence: 'Zuverlässigkeit',
    viewPlayerStats: 'Spielerstatistiken und Bewertung /10 anzeigen',
    removeWatchlist: 'Aus Beobachtungsliste entfernen',
    addWatchlist: 'Zur Beobachtungsliste hinzufügen',
    premiumUnlocks: 'Premium entsperrt erweiterte Spielinformationen.',
    lineupCard: 'Aufstellung',
    noGoalsYet: 'Noch keine Tore',
    premiumOnly: 'Nur Premium',
    language: 'Sprache',
  },
  pt: {
    all: 'Todos',
    live: 'Ao vivo',
    upcoming: 'Próximos',
    finals: 'Finais',
    smartOrder: 'Ordem inteligente',
    topConfidence: 'Confiança máxima',
    kickoffTime: 'Hora do pontapé',
    playerScores: 'Visibilidade de pontuação do jogador (/10) para cada escalação',
    topPlayers: 'Placar dos melhores jogadores para cada partida',
    lineupScore: 'Pontuação da escalação do time ao vivo com base na forma do jogador',
    premiumPrice: 'Premium $4,99/mês',
    unlockPremium: 'Desbloquear Premium por $4,99',
    premiumActive: 'Premium Ativo',
    allSports: 'Copa do Mundo FIFA',
    liveSingular: 'Placar ao vivo',
    subtitle: 'Pontuações ao vivo da Copa do Mundo FIFA 2026 com dados oficiais de partidas, classificações de jogadores e análise de escalações.',
    lastUpdated: 'Última atualização',
    searchPlaceholder: 'México, Equador, Toronto...',
    searchLabel: 'Pesquisar time ou estádio',
    liveNow: 'Ao vivo',
    upcoming: 'Próximos',
    finished: 'Terminados',
    onScreen: 'Na tela',
    watchlist: 'Lista de Favoritos',
    premiumPlan: 'Plano Premium - $4,99/mês',
    upgradePremium: 'Atualizar para Premium $4,99',
    premiumEnabled: 'Premium Ativado',
    premiumCopy: 'Desbloqueie pontuações de jogadores, força de escalação e rankings dos melhores jogadores.',
    featuredMatch: 'Partida em Destaque',
    watchlistMatches: 'Lista de Favoritos',
    savedMatches: 'partidas salvas',
    starMatches: 'Marque as partidas para mantê-las fixadas aqui.',
    liveScores: 'Pontuações ao Vivo',
    liveCount: 'ao vivo',
    matches: 'partidas',
    games: 'jogos',
    loadingScores: 'Carregando pontuações ao vivo...',
    noGames: 'Nenhum jogo encontrado neste feed no momento.',
    worldCup: 'Copa do Mundo FIFA 2026',
    played: 'jogadas',
    worldCupNote: 'Mostrando os primeiros 16 jogos. Os dados completos estão disponíveis em world_cup_2026_scores.json.',
    close: 'Fechar',
    loading: 'Carregando estatísticas do jogador...',
    coach: 'Técnico',
    goalMoments: 'Momentos de gol',
    teamLineupScore: 'Pontuação da escalação do time',
    lineupDetails: 'detalhes da escalação',
    starredMatch: 'Partida marcada',
    starMatch: 'Marcar partida',
    prediction: 'Previsão',
    confidence: 'confiança',
    viewPlayerStats: 'Ver estatísticas do jogador e classificação /10',
    removeWatchlist: 'Remover da lista de favoritos',
    addWatchlist: 'Adicionar à lista de favoritos',
    premiumUnlocks: 'Premium desbloqueia insights avançados da partida.',
    lineupCard: 'Escalação',
    noGoalsYet: 'Sem gols ainda',
    premiumOnly: 'Apenas Premium',
    language: 'Idioma',
  },
  it: {
    all: 'Tutti',
    live: 'In diretta',
    upcoming: 'Prossimi',
    finals: 'Finali',
    smartOrder: 'Ordine intelligente',
    topConfidence: 'Massima fiducia',
    kickoffTime: 'Ora di inizio',
    playerScores: 'Visibilità del punteggio dei giocatori (/10) per ogni formazione',
    topPlayers: 'Classifica dei migliori giocatori per ogni partita',
    lineupScore: 'Punteggio della formazione della squadra in diretta basato sulla forma dei giocatori',
    premiumPrice: 'Premium $4,99/mese',
    unlockPremium: 'Sblocca Premium per $4,99',
    premiumActive: 'Premium Attivo',
    allSports: 'Coppa del Mondo FIFA',
    liveSingular: 'Tabellone in diretta',
    subtitle: 'Punteggi in diretta della Coppa del Mondo FIFA 2026 con dati ufficiali delle partite, valutazioni dei giocatori e analisi delle formazioni.',
    lastUpdated: 'Ultimo aggiornamento',
    searchPlaceholder: 'Messico, Ecuador, Toronto...',
    searchLabel: 'Cerca squadra o stadio',
    liveNow: 'In diretta',
    upcoming: 'Prossimi',
    finished: 'Terminato',
    onScreen: 'Sullo schermo',
    watchlist: 'Elenco preferiti',
    premiumPlan: 'Piano Premium - $4,99/mese',
    upgradePremium: 'Aggiorna a Premium $4,99',
    premiumEnabled: 'Premium Attivato',
    premiumCopy: 'Sblocca punteggi dei giocatori, forza della formazione e classifiche dei migliori giocatori.',
    featuredMatch: 'Partita in Primo Piano',
    watchlistMatches: 'Elenco preferiti',
    savedMatches: 'partite salvate',
    starMatches: 'Contrassegna le partite per tenerle fissate qui.',
    liveScores: 'Punteggi in Diretta',
    liveCount: 'in diretta',
    matches: 'partite',
    games: 'giochi',
    loadingScores: 'Caricamento punteggi in diretta...',
    noGames: 'Nessuna partita disponibile in questo feed al momento.',
    worldCup: 'Coppa del Mondo FIFA 2026',
    played: 'giocate',
    worldCupNote: 'Visualizzazione delle prime 16 partite. I dati completi sono disponibili in world_cup_2026_scores.json.',
    close: 'Chiudi',
    loading: 'Caricamento statistiche del giocatore...',
    coach: 'Allenatore',
    goalMoments: 'Momenti di gol',
    teamLineupScore: 'Punteggio della formazione',
    lineupDetails: 'dettagli della formazione',
    starredMatch: 'Partita contrassegnata',
    starMatch: 'Contrassegna partita',
    prediction: 'Previsione',
    confidence: 'fiducia',
    viewPlayerStats: 'Visualizza statistiche del giocatore e valutazione /10',
    removeWatchlist: 'Rimuovi da elenco preferiti',
    addWatchlist: 'Aggiungi a elenco preferiti',
    premiumUnlocks: 'Premium sblocca approfondimenti avanzati sulla partita.',
    lineupCard: 'Formazione',
    noGoalsYet: 'Ancora nessun gol',
    premiumOnly: 'Solo Premium',
    language: 'Lingua',
  },
  ru: {
    all: 'Все',
    live: 'В эфире',
    upcoming: 'Скоро',
    finals: 'Финалы',
    smartOrder: 'Умный порядок',
    topConfidence: 'Наивысшая уверенность',
    kickoffTime: 'Время начала',
    playerScores: 'Оценки игроков (/10) для каждого состава',
    topPlayers: 'Таблица лучших игроков для каждого матча',
    lineupScore: 'Рейтинг состава команды в реальном времени по форме игроков',
    premiumPrice: 'Премиум $4.99/месяц',
    unlockPremium: 'Открыть Премиум за $4.99',
    premiumActive: 'Премиум активен',
    allSports: 'Чемпионат мира FIFA',
    liveSingular: 'Табло в реальном времени',
    subtitle: 'Онлайн-счета Чемпионата мира FIFA 2026 с официальными данными матчей, рейтингами игроков и аналитикой составов.',
    lastUpdated: 'Обновлено',
    searchPlaceholder: 'Мексика, Эквадор, Торонто...',
    searchLabel: 'Поиск команды или стадиона',
    liveNow: 'Сейчас в эфире',
    finished: 'Завершено',
    onScreen: 'На экране',
    watchlist: 'Список наблюдения',
    premiumPlan: 'Премиум план - $4.99/месяц',
    upgradePremium: 'Перейти на Премиум $4.99',
    premiumEnabled: 'Премиум включен',
    premiumCopy: 'Откройте оценки игроков, силу состава и рейтинг лучших игроков.',
    featuredMatch: 'Матч дня',
    watchlistMatches: 'Список наблюдения',
    savedMatches: 'сохраненных матчей',
    starMatches: 'Добавляйте матчи в избранное, чтобы закрепить их здесь.',
    liveScores: 'Счета в реальном времени',
    liveCount: 'в эфире',
    matches: 'матчей',
    games: 'игр',
    loadingScores: 'Загрузка счетов в реальном времени...',
    noGames: 'Сейчас в этом источнике нет матчей.',
    worldCup: 'Чемпионат мира FIFA 2026',
    played: 'сыграно',
    worldCupNote: 'Показаны первые 16 матчей. Полные данные доступны в world_cup_2026_scores.json.',
    close: 'Закрыть',
    loading: 'Загрузка статистики игроков...',
    coach: 'Тренер',
    goalMoments: 'Голевые моменты',
    teamLineupScore: 'Рейтинг состава команды',
    lineupDetails: 'детали состава',
    starredMatch: 'Матч в избранном',
    starMatch: 'Добавить в избранное',
    prediction: 'Прогноз',
    confidence: 'уверенность',
    viewPlayerStats: 'Показать статистику игроков и рейтинг /10',
    removeWatchlist: 'Удалить из списка наблюдения',
    addWatchlist: 'Добавить в список наблюдения',
    premiumUnlocks: 'Премиум открывает расширенную аналитику матча.',
    lineupCard: 'Состав',
    noGoalsYet: 'Пока без голов',
    premiumOnly: 'Только Премиум',
    language: 'Язык',
  },
  zh: {
    all: '全部',
    live: '直播',
    upcoming: '即将进行',
    finals: '决赛',
    smartOrder: '智能排序',
    topConfidence: '最高信心',
    kickoffTime: '开球时间',
    playerScores: '每个阵容的球员得分可见性 (/10)',
    topPlayers: '每场比赛的顶级球员记分板',
    lineupScore: '基于球员表现的实时球队阵容得分',
    premiumPrice: '高级版 $4.99/月',
    unlockPremium: '解锁高级版本 $4.99',
    premiumActive: '高级版已激活',
    allSports: 'FIFA 世界杯',
    liveSingular: '实时记分牌',
    subtitle: 'FIFA 2026 世界杯实时比分，包括官方比赛数据、球员评分和阵容分析。',
    lastUpdated: '最后更新',
    searchPlaceholder: '墨西哥、厄瓜多尔、多伦多...',
    searchLabel: '搜索球队或球场',
    liveNow: '直播',
    upcoming: '即将进行',
    finished: '已结束',
    onScreen: '屏幕上',
    watchlist: '观察清单',
    premiumPlan: '高级计划 - $4.99/月',
    upgradePremium: '升级到高级版 $4.99',
    premiumEnabled: '高级版已启用',
    premiumCopy: '解锁球员得分、阵容强度和顶级球员排名。',
    featuredMatch: '精选比赛',
    watchlistMatches: '观察清单',
    savedMatches: '已保存的比赛',
    starMatches: '标星比赛以将其固定在此处。',
    liveScores: '实时比分',
    liveCount: '直播',
    matches: '比赛',
    games: '游戏',
    loadingScores: '加载实时比分...',
    noGames: '此源中暂无游戏。',
    worldCup: 'FIFA 2026 世界杯',
    played: '已进行',
    worldCupNote: '显示前 16 场比赛。完整数据可在 world_cup_2026_scores.json 中获得。',
    close: '关闭',
    loading: '正在加载球员统计数据...',
    coach: '教练',
    goalMoments: '进球时刻',
    teamLineupScore: '球队阵容得分',
    lineupDetails: '阵容详情',
    starredMatch: '已标星比赛',
    starMatch: '标星比赛',
    prediction: '预测',
    confidence: '置信度',
    viewPlayerStats: '查看球员统计和 /10 评分',
    removeWatchlist: '从观察清单中移除',
    addWatchlist: '添加到观察清单',
    premiumUnlocks: '高级版解锁高级比赛见解。',
    lineupCard: '阵容',
    noGoalsYet: '暂未进球',
    premiumOnly: '仅限高级版',
    language: '语言',
  },
  ja: {
    all: 'すべて',
    live: 'ライブ',
    upcoming: '近日公開',
    finals: 'ファイナル',
    smartOrder: 'スマートオーダー',
    topConfidence: 'トップ確度',
    kickoffTime: 'キックオフ時刻',
    playerScores: 'すべてのラインアップのプレイヤースコア表示 (/10)',
    topPlayers: '各試合のトッププレイヤースコアボード',
    lineupScore: 'プレイヤーフォームに基づくライブチームラインアップスコア',
    premiumPrice: 'プレミアム $4.99/月',
    unlockPremium: 'プレミアムのロックを解除 $4.99',
    premiumActive: 'プレミアムアクティブ',
    allSports: 'FIFAワールドカップ',
    liveSingular: 'ライブスコアボード',
    subtitle: 'FIFA 2026ワールドカップのライブスコア、公式試合データ、プレイヤー評価、ラインアップ分析。',
    lastUpdated: '最終更新',
    searchPlaceholder: 'メキシコ、エクアドル、トロント...',
    searchLabel: 'チームまたはスタジアムを検索',
    liveNow: 'ライブ',
    upcoming: '近日公開',
    finished: '終了',
    onScreen: '画面上',
    watchlist: 'ウォッチリスト',
    premiumPlan: 'プレミアムプラン - $4.99/月',
    upgradePremium: 'プレミアムにアップグレード $4.99',
    premiumEnabled: 'プレミアムが有効',
    premiumCopy: 'プレイヤースコア、ラインアップの強さ、トッププレイヤーランキングをロック解除します。',
    featuredMatch: 'フィーチャーマッチ',
    watchlistMatches: 'ウォッチリスト',
    savedMatches: '保存された試合',
    starMatches: '試合に星を付けてここに固定してください。',
    liveScores: 'ライブスコア',
    liveCount: 'ライブ',
    matches: '試合',
    games: 'ゲーム',
    loadingScores: 'ライブスコアを読み込み中...',
    noGames: 'このフィードには現在ゲームがありません。',
    worldCup: 'FIFAワールドカップ 2026',
    played: '実施済み',
    worldCupNote: '最初の16試合を表示しています。完全なデータは world_cup_2026_scores.json で利用可能です。',
    close: '閉じる',
    loading: 'プレイヤー統計を読み込み中...',
    coach: 'コーチ',
    goalMoments: 'ゴールの瞬間',
    teamLineupScore: 'チームラインアップスコア',
    lineupDetails: 'ラインアップの詳細',
    starredMatch: 'スター付き試合',
    starMatch: '試合に星を付ける',
    prediction: '予測',
    confidence: '確度',
    viewPlayerStats: 'プレイヤー統計と /10 評価を表示',
    removeWatchlist: 'ウォッチリストから削除',
    addWatchlist: 'ウォッチリストに追加',
    premiumUnlocks: 'プレミアムは高度な試合インサイトをロック解除します。',
    lineupCard: 'ラインアップ',
    noGoalsYet: 'ゴールなし',
    premiumOnly: 'プレミアムのみ',
    language: '言語',
  },
}

function getTranslation(language, key) {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key
}

const SPORT_TABS = [
  {
    id: 'fifa-world-cup',
    label: 'FIFA World Cup',
    provider: 'fifa',
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
  const premiumTag = '<span class="premium">Full lineup analytics enabled</span>'
  const loadedMarkup = details
    ? `<div class="grid"><section><h2>${escapeHtml(match.homeTeam)}</h2><p class="coach">Coach: ${escapeHtml(
        details.homeCoach
      )}</p><p class="coach">Goal moments: ${escapeHtml(
        (details.homeGoals || []).map((goal) => `${goal.scorer} ${goal.minute}`).join(', ') || 'No goals yet'
      )}</p><p class="coach">Team lineup score: ${homeLineupScore ?? 'N/A'}</p>${homeRows}</section><section><h2>${escapeHtml(
        match.awayTeam
      )}</h2><p class="coach">Coach: ${escapeHtml(
        details.awayCoach
      )}</p><p class="coach">Goal moments: ${escapeHtml(
        (details.awayGoals || []).map((goal) => `${goal.scorer} ${goal.minute}`).join(', ') || 'No goals yet'
      )}</p><p class="coach">Team lineup score: ${awayLineupScore ?? 'N/A'}</p>${awayRows}</section></div>`
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
  const isPremium = true
  const [language, setLanguage] = useState('en')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({ worldCup: true, playerStats: false })
  const [viewTab, setViewTab] = useState('live')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const VIEW_FILTERS = [
    { id: 'all', label: getTranslation(language, 'all') },
    { id: 'live', label: getTranslation(language, 'live') },
    { id: 'scheduled', label: getTranslation(language, 'upcoming') },
    { id: 'final', label: getTranslation(language, 'finals') },
  ]
  const SORT_OPTIONS = [
    { id: 'priority', label: getTranslation(language, 'smartOrder') },
    { id: 'confidence', label: getTranslation(language, 'topConfidence') },
    { id: 'soonest', label: getTranslation(language, 'kickoffTime') },
  ]
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
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)

      if (storedLanguage) {
        setLanguage(storedLanguage)
      }
    } catch {
      setLanguage('en')
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteMatchIds))
  }, [favoriteMatchIds])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])
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

  function toggleSection(sectionName) {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }))
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

  return (
    <main className="app-shell-organized">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="navbar-container">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="navbar-brand">
            <p className="navbar-kicker">ScoreSprint</p>
            <h1 className="navbar-title">FIFA World Cup 2026</h1>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-selector"
            aria-label={getTranslation(language, 'language')}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>

          <section className="sidebar-section">
            <h3>Quick Filters</h3>
            <div className="filter-chips">
              {VIEW_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setViewFilter(filter.id)
                    setIsSidebarOpen(false)
                  }}
                  className={viewFilter === filter.id ? 'chip active' : 'chip'}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-section">
            <h3>Sort By</h3>
            <div className="filter-chips">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSortMode(option.id)
                    setIsSidebarOpen(false)
                  }}
                  className={sortMode === option.id ? 'chip active' : 'chip'}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-section">
            <h3>Stats</h3>
            <div className="sidebar-stats">
              <article className="stat-item">
                <strong>{liveNowCount}</strong>
                <span>Live</span>
              </article>
              <article className="stat-item">
                <strong>{scheduledCount}</strong>
                <span>Upcoming</span>
              </article>
              <article className="stat-item">
                <strong>{finalCount}</strong>
                <span>Finished</span>
              </article>
              <article className="stat-item">
                <strong>{watchlistMatches.length}</strong>
                <span>Saved</span>
              </article>
            </div>
          </section>
        </div>
      </aside>

      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Update Banner */}
        <p className="update-banner">
          NEW UPDATE THURSDAY JUNE 25: Premium and more sports are coming, including Basketball and Hockey.
        </p>

        {/* Search Box */}
        <section className="search-section">
          <label className="search-box">
            <span>{getTranslation(language, 'searchLabel')}</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={getTranslation(language, 'searchPlaceholder')}
            />
          </label>
        </section>

        {/* View Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${viewTab === 'live' ? 'active' : ''}`}
            onClick={() => setViewTab('live')}
          >
            Live Now
          </button>
          <button
            className={`view-tab ${viewTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewTab('calendar')}
          >
            Calendar
          </button>
          <button
            className={`view-tab ${viewTab === 'stats' ? 'active' : ''}`}
            onClick={() => setViewTab('stats')}
          >
            Statistics
          </button>
        </div>

        {/* Live Tab */}
        {viewTab === 'live' && (
          <section className="tab-content">
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

            <section className="live-panel">
              <div className="section-head">
                <h2>Live Scores</h2>
                <span>
                  {liveNowCount} live • {predictedLiveMatches.length} matches
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
                    <div className="insight-chips" onClick={(event) => event.stopPropagation()}>
                      {getPremiumInsights(match).map((insight) => (
                        <span key={`${match.id}-${insight}`} className="insight-chip">
                          {insight}
                        </span>
                      ))}
                    </div>
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
          </section>
        )}

        {/* Calendar Tab */}
        {viewTab === 'calendar' && (
          <section className="tab-content">
            <section className="world-cup-panel">
              <button
                type="button"
                className="collapsible-header"
                onClick={() => toggleSection('worldCup')}
              >
                <span className="collapsible-title">FIFA World Cup 2026 Schedule</span>
                <span className="collapsible-icon">{expandedSections.worldCup ? '▼' : '▶'}</span>
              </button>

              {expandedSections.worldCup && (
                <div className="collapsible-content">
                  <div className="section-head">
                    <h2>Matches</h2>
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
                    Showing first 16 matches. Full data available in
                    {' '}
                    <code>world_cup_2026_scores.json</code>.
                  </p>
                </div>
              )}
            </section>
          </section>
        )}

        {/* Stats Tab */}
        {viewTab === 'stats' && (
          <section className="tab-content">
            <section className="stats-panel">
              <button
                type="button"
                className="collapsible-header"
                onClick={() => toggleSection('playerStats')}
              >
                <span className="collapsible-title">Player Statistics & Team Insights</span>
                <span className="collapsible-icon">{expandedSections.playerStats ? '▼' : '▶'}</span>
              </button>

              {expandedSections.playerStats && (
                <div className="collapsible-content">
                  <div className="stats-grid">
                    <article className="stat-card">
                      <h3>Live Matches</h3>
                      <p className="stat-number">{liveNowCount}</p>
                      <p className="stat-label">Currently playing</p>
                    </article>
                    <article className="stat-card">
                      <h3>Upcoming</h3>
                      <p className="stat-number">{scheduledCount}</p>
                      <p className="stat-label">Matches scheduled</p>
                    </article>
                    <article className="stat-card">
                      <h3>Completed</h3>
                      <p className="stat-number">{finalCount}</p>
                      <p className="stat-label">Matches finished</p>
                    </article>
                    <article className="stat-card">
                      <h3>Your Watchlist</h3>
                      <p className="stat-number">{watchlistMatches.length}</p>
                      <p className="stat-label">Saved matches</p>
                    </article>
                  </div>
                </div>
              )}
            </section>

            <section className="watchlist-panel">
              <div className="section-head">
                <h2>Your Watchlist</h2>
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
          </section>
        )}
      </div>

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
                      Team lineup score: {getTeamLineupScore(selectedMatchDetails.homePlayers) ?? 'N/A'}
                    </p>
                    <ul>
                      {selectedMatchDetails.homePlayers.map((player) => (
                        <li key={`home-${player.id}`}>
                          <span>
                            #{player.number} {player.name}
                          </span>
                          <span>{`${player.rating}/10`}</span>
                          <small>{`G:${player.goals} C:${player.cards}`}</small>
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
                      Team lineup score: {getTeamLineupScore(selectedMatchDetails.awayPlayers) ?? 'N/A'}
                    </p>
                    <ul>
                      {selectedMatchDetails.awayPlayers.map((player) => (
                        <li key={`away-${player.id}`}>
                          <span>
                            #{player.number} {player.name}
                          </span>
                          <span>{`${player.rating}/10`}</span>
                          <small>{`G:${player.goals} C:${player.cards}`}</small>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>

                <section className="premium-scoreboard">
                  <h3>Top Players Scoreboard</h3>
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
