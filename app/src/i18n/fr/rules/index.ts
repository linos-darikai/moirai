// Français (BROUILLON) : page des règles. À faire relire par un locuteur natif.

import type { NamespaceRulesTranslation } from "../../i18n-types.js";

const fr_rules = {
  title: "Comment jouer",
  intro:
    "Moirai est une arène de bots. Vous ne déplacez pas de pièces : vous écrivez une stratégie, et le programme Solana la joue pour vous, à chaque tour, avec les mêmes règles pour tous. Les voici.",
  contents: "Sur cette page",
  goal: {
    title: "Le but",
    body: "De {min} à {max} civilisations partagent une carte de {size} × {size} pendant {turns} tours. Le salon choisit comment on gagne : le plus de territoire, le plus de richesse, la dernière civilisation debout ou un score mixte.",
  },
  map: {
    title: "La carte",
    mirrored:
      "La carte vient d'une graine aléatoire tirée une fois toutes les stratégies révélées. Un quart est généré puis reflété dans les trois autres : chaque civilisation démarre avec exactement les mêmes environs.",
    deposits: "Environ {percent} % des cases contiennent un gisement de Nourriture, de Minerai ou d'Or.",
    sites:
      "Les emplacements sont des cases où l'on peut bâtir une ville. Chaque quart en compte {count} en plus de celui de la capitale, espacés d'au moins {distance} cases. Chaque capitale démarre sur l'un d'eux.",
  },
  cities: {
    title: "Villes et frontières",
    capital: "Vous démarrez avec une ville, votre capitale, de taille 1. Vous pouvez posséder jusqu'à {max} villes.",
    start:
      "Chaque civilisation démarre avec la même réserve : {food} Nourriture, {ore} Minerai, {gold} Or, {coins} pièces et {workers} Ouvriers.",
    radius:
      "Une ville possède toutes les cases libres à sa portée : taille + 1 cases (en pas droits, sans diagonales). Grandir ne prend jamais une terre qui appartient déjà à une autre civilisation.",
    growth:
      "À chaque tour, une ville gagne des points de croissance : 1, plus 1 par gisement que vous possédez à sa portée. À 20 × taille² points, elle passe à la taille suivante (jusqu'à {max}) et prend l'anneau de terre suivant.",
    lock:
      "Quand une ville n'a plus de place pour grandir, parce que l'anneau suivant est entièrement pris, elle cesse de grandir pour de bon. Cette ligne est votre frontière. Ensuite, la terre ne change de mains que par la guerre, ou en achetant une case avec claim_tile.",
    settlers: "Les colons fondent des villes : found_city utilise un colon pour bâtir une ville de taille 1 sur un emplacement libre voisin de votre terre.",
    growthTable: "Croissance par taille",
    size: "Taille",
    reach: "Portée",
    pointsToGrow: "Points pour grandir",
    maxSize: "maximum",
  },
  economy: {
    title: "Économie",
    deposits:
      "Un gisement que vous possédez produit {amount} de sa ressource par tour, mais seulement tant qu'un Ouvrier l'exploite. Chaque Ouvrier exploite un gisement. Les Ouvriers vont d'abord vers la ressource choisie par assign_workers, puis se répartissent également.",
    coins:
      "Les pièces paient les unités et les achats au marché. Chaque ville rapporte {coins} pièce par taille à chaque tour, et vendre au marché en rapporte davantage.",
    cityIncome: "Chaque ville produit {food} Nourriture, {ore} Minerai et {gold} Or par taille et par tour.",
    upkeep:
      "Les unités mangent de la Nourriture à chaque tour. Si vous ne pouvez pas les nourrir, vos unités les plus chères sont dissoutes jusqu'à ce que votre Nourriture repasse au-dessus de zéro.",
    claim: "claim_tile achète une case libre voisine de votre terre pour {food} Nourriture et {gold} Or.",
    market:
      "Un seul marché est partagé par tous : on y vend des ressources contre des pièces et on les achète avec des pièces. Le prix d'une ressource monte quand elle se raréfie et baisse quand elle abonde, entre {min} % et {max} % de son prix de base. Un échange se paie au prix qu'il laisse derrière lui et perd {spread} % dans l'écart : acheter et revendre en boucle ne rapporte jamais.",
    basePrices: "Prix de base, en pièces : Nourriture {food}, Minerai {ore}, Or {gold}.",
  },
  units: {
    title: "Unités",
    intro:
      "Les unités sont comptées par civilisation (elles n'occupent pas de case dans cette version). Chacune est forte contre une autre, comme pierre-feuille-ciseaux : un duel favorable compte ×{bonus}.",
    settler: "Colon",
    worker: "Ouvrier",
    unit: "Unité",
    attack: "Attaque",
    defence: "Défense",
    cost: "Coût",
    coins: "Pièces",
    buildTurns: "Tours de construction",
    upkeep: "Nourriture par tour",
    strongAgainst: "Forte contre",
    speed: "Vitesse",
    speedValue: "{tiles} {{tiles:case|cases}} / tour",
    walls: "les remparts",
    all: "tout (×{bonus})",
    none: "—",
    eliteCap: "Vous pouvez aligner une Élite par taille de ville que vous possédez, en comptant celles en construction.",
    building:
      "Chaque ville construit une unité à la fois. Vous payez au lancement, et l'unité rejoint votre armée quand ses tours de construction sont écoulés. rush termine une construction tout de suite pour {multiplier} × ses pièces par tour restant : plus c'est rapide, plus c'est cher.",
  },
  warfare: {
    title: "La guerre",
    attack:
      "attack envoie toute votre armée (tout sauf les Colons et les Ouvriers) en expédition. Elle traverse n'importe quelle terre, même au cœur du territoire ennemi, jusqu'à une case, une ville ou la capitale ennemie, et combat à son arrivée. Les survivants rentrent.",
    march:
      "Une armée avance à la vitesse de son unité la plus lente : emmener du Siège la ralentit. Une seule expédition à la fois ; pendant son absence votre armée à la maison est plus petite, et elle mange toujours.",
    defenders: "L'armée du défenseur est répartie également entre ses villes et ses frontières : chaque cible est tenue par sa part de chaque type d'unité.",
    strength:
      "L'attaque est l'attaque de vos unités, bonus de duel compris. La défense est celle des défenseurs plus les remparts : {walls} par taille de ville, +{capital} % pour une capitale. Le siège compte ×{siege} contre les remparts. Chaque camp tire jusqu'à ±{roll} %.",
    win: "Si l'attaque dépasse la défense, tous les défenseurs sur place sont détruits et la cible tombe. Une case change de propriétaire. Une ville est capturée (elle perd une taille), ou rasée si vous avez choisi attack(target, raze) : elle est détruite et sa terre redevient libre.",
    plunder: "Prendre ou raser une ville emporte aussi une part des réserves du perdant : ses réserves divisées par son nombre de villes.",
    lose: "Si l'attaque ne dépasse pas la défense, les deux camps perdent des unités en proportion de la force adverse.",
    capital: "Si une capitale tombe, la plus grande ville restante de cette civilisation devient sa nouvelle capitale.",
    elimination: "Une civilisation sans ville est éliminée.",
  },
  turn: {
    title: "Un tour, étape par étape",
    steps: {
      count: "On compte ce que chacun possède.",
      produce: "Les gisements exploités et les villes produisent des ressources et des pièces.",
      grow: "Les villes grandissent, leurs frontières avancent et les unités terminées rejoignent les armées.",
      decide: "Chaque stratégie décide à partir du même instantané du monde. Seules les {count} premières règles vraies agissent.",
      resolve: "Toutes les actions ont lieu ensemble : construire et accélérer, fonder des villes, acheter des cases, affecter les ouvriers, échanger, puis attaquer. L'ordre de passage tourne à chaque tour.",
      upkeep: "Les unités mangent. Celles qui ne sont pas nourries sont dissoutes.",
      eliminate: "Les civilisations sans ville sont retirées.",
    },
  },
  winning: {
    title: "Gagner",
    metric: "Condition de victoire",
    winner: "Gagnant",
    territory: "Le plus de cases après le dernier tour.",
    wealth: "Le plus de pièces plus la valeur de toutes les ressources aux prix finaux du marché.",
    conquest: "La dernière civilisation debout ; s'il en reste plusieurs, celle qui a le plus de cases.",
    score: "Cases × {tiles} + richesse ÷ {wealth} + force de l'armée.",
  },
  policy: {
    title: "Votre stratégie",
    body: "Une stratégie est une liste ordonnée de {max} règles si/alors au plus. À chaque tour, les {active} premières règles dont la condition est vraie agissent. Testez-la gratuitement dans le simulateur avant de miser quoi que ce soit.",
    targets:
      "attack choisit sa cible avec weakest_neighbor, strongest_neighbor, nearest_enemy, richest_enemy, largest_enemy ou leader, et son objectif avec border, city ou capital : attack(richest_enemy, capital).",
    edit: "Ouvrir l'éditeur de stratégies",
  },
} satisfies NamespaceRulesTranslation;

export default fr_rules;
