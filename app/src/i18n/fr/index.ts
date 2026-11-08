// Français (BROUILLON) : traduction automatique, à faire relire par un locuteur natif.
// French (DRAFT): machine-quality translation; have a native speaker review it before launch.

import type { Translation } from "../i18n-types.js";

const fr = {
  appName: "Moirai",
  nav: {
    main: "Principal",
    homeLink: "Moirai, retour aux salons",
    lobbies: "Salons",
    policies: "Stratégies",
    simulator: "Simulateur",
    matches: "Parties",
    leaderboard: "Classement",
    rules: "Règles",
    ranks: "Rangs",
    back: "Retour",
  },
  network: {
    devnet: "Devnet",
  },
  wallet: {
    connect: "Connecter le portefeuille",
    connected: "Votre profil, portefeuille {address}, {balance}",
    balanceLoading: "…",
  },
  language: {
    label: "Langue",
    draft: "traduction provisoire",
  },
  preview: {
    banner:
      "Aperçu : les salons, parties et joueurs sont des données d'exemple jusqu'à la sortie du programme de partie. La carte, le moteur de jeu et le portefeuille sont réels.",
  },
  footer: {
    devnetOnly: "Devnet uniquement. Les frais et les prix utilisent des SOL de test sans valeur réelle.",
    program: "Programme",
  },
  states: {
    loading: "Chargement…",
    error: "Une erreur est survenue : {message}",
  },
  routeError: {
    title: "Cette page n'a pas pu se charger",
    body: "Le lien est peut-être erroné, ou quelque chose a échoué de notre côté.",
    home: "Retour aux salons",
  },
  breadcrumb: "Fil d'Ariane",
  sol: "{amount|sol}",
  tiles: "{count|integer} {{count:case|cases}}",
  turnOf: "Tour {turn} sur {total}",
  you: "{name} (vous)",
  metric: {
    territory: "Territoire",
    wealth: "Richesse",
    conquest: "Conquête",
    score: "Score",
  },
  metricDescription: {
    territory: "Le plus de cases au dernier tour.",
    wealth: "La plus grande valeur de ressources aux prix finaux du marché.",
    conquest: "Dernière civilisation debout, puis le plus de territoire.",
    score: "Un mélange fixe de territoire, de richesse et d'armée.",
  },
  resource: {
    food: "Nourriture",
    ore: "Minerai",
    gold: "Or",
  },
  resourceAmount: {
    food: "{count|integer} nourriture",
    ore: "{count|integer} minerai",
    gold: "{count|integer} or",
  },
  unit: {
    infantry: "Infanterie",
    guard: "Garde",
    siege: "Siège",
    elite: "Élite",
  },
  status: {
    revealed: "Révélée",
    committed: "Engagée",
    notCommitted: "Non engagée",
    hidden: "Cachée",
    forfeited: "Perdue",
    joined: "Inscrit",
    empty: "Libre",
    public: "Publique",
    draft: "Brouillon",
  },
  payout: {
    winnerTakesAll: "Le gagnant remporte tout",
    topThree: "Top 3 · 60/30/10",
    practice: "Entraînement",
  },
  map: {
    label: "Carte au tour {turn} : {summary}. Les contours dorés marquent les cases disputées.",
    civTiles: "{name} {count} cases",
    legend: "Légende de la carte",
    legendFood: "Gisement de nourriture",
    legendOre: "Gisement de minerai",
    legendGold: "Gisement d'or",
    legendCity: "Ville",
    legendContested: "Case disputée",
    previewNote:
      "Les gisements et les villes viennent de civ-core. L'expansion du territoire est un aperçu en attendant le moteur de tours.",
  },
  army: "armée {count|integer}",
  copyAddress: "Copier l'adresse du portefeuille",
  copied: "Copié",
} satisfies Translation;

export default fr;
