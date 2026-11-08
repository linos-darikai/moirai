// Español (BORRADOR): traducción automática, pendiente de revisión por un hablante nativo.
// Spanish (DRAFT): machine-quality translation; have a native speaker review it before launch.

import type { Translation } from "../i18n-types.js";

const es = {
  appName: "Moirai",
  nav: {
    main: "Principal",
    homeLink: "Moirai, volver a las salas",
    lobbies: "Salas",
    policies: "Políticas",
    simulator: "Simulador",
    matches: "Partidas",
    leaderboard: "Clasificación",
    rules: "Reglas",
    ranks: "Ranking",
    back: "Atrás",
  },
  network: {
    devnet: "Devnet",
  },
  wallet: {
    connect: "Conectar billetera",
    connected: "Tu perfil, billetera {address}, {balance}",
    balanceLoading: "…",
  },
  language: {
    label: "Idioma",
    draft: "traducción en borrador",
  },
  preview: {
    banner:
      "Vista previa: las salas, partidas y jugadores son datos de ejemplo hasta que se publique el programa de partidas. El mapa, el motor del juego y la billetera funcionan de verdad.",
  },
  footer: {
    devnetOnly: "Solo devnet. Las cuotas y premios usan SOL de prueba y no tienen valor real.",
    program: "Programa",
  },
  states: {
    loading: "Cargando…",
    error: "Algo salió mal: {message}",
  },
  routeError: {
    title: "No se pudo cargar esta página",
    body: "Puede que el enlace sea incorrecto o que algo haya fallado por nuestra parte.",
    home: "Volver a las salas",
  },
  breadcrumb: "Ruta de navegación",
  sol: "{amount|sol}",
  tiles: "{count|integer} {{count:casilla|casillas}}",
  turnOf: "Turno {turn} de {total}",
  you: "{name} (tú)",
  metric: {
    territory: "Territorio",
    wealth: "Riqueza",
    conquest: "Conquista",
    score: "Puntuación",
  },
  metricDescription: {
    territory: "Más casillas en el último turno.",
    wealth: "Mayor valor de recursos a los precios finales del mercado.",
    conquest: "Última civilización en pie; después, más territorio.",
    score: "Una mezcla fija de territorio, riqueza y ejército.",
  },
  resource: {
    food: "Comida",
    ore: "Mineral",
    gold: "Oro",
  },
  resourceAmount: {
    food: "{count|integer} de comida",
    ore: "{count|integer} de mineral",
    gold: "{count|integer} de oro",
  },
  unit: {
    infantry: "Infantería",
    guard: "Guardia",
    siege: "Asedio",
    elite: "Élite",
  },
  status: {
    revealed: "Revelada",
    committed: "Comprometida",
    notCommitted: "Sin comprometer",
    hidden: "Oculta",
    forfeited: "Perdida",
    joined: "Unido",
    empty: "Vacío",
    public: "Pública",
    draft: "Borrador",
  },
  payout: {
    winnerTakesAll: "El ganador se lo lleva todo",
    topThree: "Top 3 · 60/30/10",
    practice: "Práctica",
  },
  map: {
    label: "Mapa en el turno {turn}: {summary}. Los bordes dorados marcan casillas en disputa.",
    civTiles: "{name} {count} casillas",
    legend: "Leyenda del mapa",
    legendFood: "Depósito de comida",
    legendOre: "Depósito de mineral",
    legendGold: "Depósito de oro",
    legendCity: "Ciudad",
    legendContested: "Casilla en disputa",
    previewNote:
      "Los depósitos y ciudades vienen de civ-core. El crecimiento del territorio es una vista previa hasta que llegue el motor de turnos.",
  },
  army: "ejército {count|integer}",
  copyAddress: "Copiar dirección de la billetera",
  copied: "Copiado",
} satisfies Translation;

export default es;
