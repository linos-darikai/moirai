// Español (BORRADOR): página de reglas. Pendiente de revisión por un hablante nativo.

import type { NamespaceRulesTranslation } from "../../i18n-types.js";

const es_rules = {
  title: "Cómo se juega",
  intro:
    "Moirai es una arena de bots. No mueves piezas: escribes una política y el programa de Solana la juega por ti, en cada turno, con las mismas reglas para todos. Estas son esas reglas.",
  contents: "En esta página",
  goal: {
    title: "El objetivo",
    body: "De {min} a {max} civilizaciones comparten un mapa de {size} × {size} durante {turns} turnos. La sala decide cómo se gana: más territorio, más riqueza, última civilización en pie o una puntuación mixta.",
  },
  map: {
    title: "El mapa",
    mirrored:
      "El mapa sale de una semilla aleatoria que se sortea cuando todas las políticas están reveladas. Se genera un cuarto y se refleja en los otros tres, así que todas las civilizaciones empiezan con el mismo entorno.",
    deposits: "Alrededor del {percent}% de las casillas tienen un depósito de Comida, Mineral u Oro.",
    sites:
      "Los emplazamientos son casillas donde se puede construir una ciudad. Cada cuarto tiene {count} además del de la capital, separados al menos {distance} casillas. Todas las capitales empiezan en uno.",
  },
  cities: {
    title: "Ciudades y fronteras",
    capital: "Empiezas con una ciudad, tu capital, de tamaño 1. Puedes tener hasta {max} ciudades.",
    start:
      "Todas las civilizaciones empiezan con lo mismo: {food} de Comida, {ore} de Mineral, {gold} de Oro, {coins} monedas y {workers} Trabajadores.",
    radius:
      "Una ciudad posee todas las casillas libres a su alcance: tamaño + 1 casillas (en pasos rectos, sin diagonales). Crecer nunca quita tierra que ya es de otra civilización.",
    growth:
      "Cada turno una ciudad gana puntos de crecimiento: 1, más 1 por cada depósito tuyo a su alcance. Al llegar a 20 × tamaño² puntos crece al siguiente tamaño (hasta {max}) y reclama el siguiente anillo de tierra.",
    lock:
      "Cuando una ciudad ya no tiene adónde crecer porque el siguiente anillo está ocupado, deja de crecer para siempre. Esa línea es tu frontera. A partir de ahí la tierra solo cambia de manos con la guerra o comprando una casilla con claim_tile.",
    settlers: "Los colonos fundan ciudades: found_city usa un colono para construir una ciudad de tamaño 1 en un emplazamiento libre junto a tu tierra.",
    growthTable: "Crecimiento por tamaño",
    size: "Tamaño",
    reach: "Alcance",
    pointsToGrow: "Puntos para crecer",
    maxSize: "máximo",
  },
  economy: {
    title: "Economía",
    deposits:
      "Un depósito tuyo produce {amount} de su recurso por turno, pero solo mientras un Trabajador lo trabaja. Cada Trabajador trabaja un depósito. Los Trabajadores van primero al recurso de assign_workers y luego se reparten por igual.",
    coins:
      "Las monedas pagan unidades y compras en el mercado. Cada ciudad paga {coins} moneda por tamaño cada turno, y vender en el mercado da más.",
    cityIncome: "Cada ciudad produce {food} de Comida, {ore} de Mineral y {gold} de Oro por tamaño y por turno.",
    upkeep:
      "Las unidades comen Comida cada turno. Si no puedes alimentarlas, se disuelven tus unidades más caras hasta que tu Comida vuelva a estar por encima de cero.",
    claim: "claim_tile compra una casilla libre junto a tu tierra por {food} de Comida y {gold} de Oro.",
    market:
      "Hay un único mercado para todos: vendes recursos por monedas y los compras con monedas. El precio de un recurso sube cuando escasea y baja cuando abunda, entre el {min}% y el {max}% de su precio base. Cada operación se paga al precio que deja tras ella y pierde un {spread}% en el diferencial, así que comprar y vender una y otra vez nunca da beneficio.",
    basePrices: "Precios base, en monedas: Comida {food}, Mineral {ore}, Oro {gold}.",
  },
  units: {
    title: "Unidades",
    intro:
      "Las unidades se cuentan por civilización (en esta versión no ocupan casillas). Cada una es fuerte contra otra, como piedra, papel o tijera: un enfrentamiento favorable cuenta ×{bonus}.",
    settler: "Colono",
    worker: "Trabajador",
    unit: "Unidad",
    attack: "Ataque",
    defence: "Defensa",
    cost: "Coste",
    coins: "Monedas",
    buildTurns: "Turnos de construcción",
    upkeep: "Comida por turno",
    strongAgainst: "Fuerte contra",
    speed: "Velocidad",
    speedValue: "{tiles} {{tiles:casilla|casillas}} / turno",
    walls: "murallas",
    all: "todo (×{bonus})",
    none: "—",
    eliteCap: "Puedes tener una Élite por cada tamaño de ciudad que poseas, contando las que se están construyendo.",
    building:
      "Cada ciudad construye una unidad a la vez. Pagas al empezar y la unidad se une a tu ejército cuando terminan sus turnos de construcción. rush termina una construcción al instante por {multiplier} × sus monedas por cada turno que falte: cuanto más rápido, más caro.",
  },
  warfare: {
    title: "Guerra",
    attack:
      "attack envía todo tu ejército (todo salvo Colonos y Trabajadores) en una expedición. Marcha por cualquier tierra, incluso dentro del territorio enemigo, hasta una casilla, una ciudad o la capital enemiga, y lucha al llegar. Los supervivientes vuelven a casa.",
    march:
      "Los ejércitos marchan a la velocidad de su unidad más lenta, así que llevar Asedio los frena. Tienes una expedición a la vez; mientras está fuera tu ejército en casa es menor y sigue comiendo.",
    defenders: "El ejército defensor se reparte por igual entre sus ciudades y fronteras, así que cada objetivo lo defiende su parte de cada tipo de unidad.",
    strength:
      "El ataque es el ataque de tus unidades con sus bonificaciones. La defensa es la defensa de los defensores más las murallas: {walls} por tamaño de ciudad, +{capital}% en una capital. El asedio cuenta ×{siege} contra murallas. Cada bando tira hasta ±{roll}%.",
    win: "Si el ataque supera a la defensa, todos los defensores allí mueren y el objetivo cae. Una casilla cambia de dueño. Una ciudad se captura (baja un tamaño) o se arrasa si elegiste attack(target, raze): se destruye y su tierra queda libre.",
    plunder: "Tomar o arrasar una ciudad también se lleva una parte de las reservas del perdedor: sus reservas divididas entre su número de ciudades.",
    lose: "Si el ataque no supera a la defensa, ambos bandos pierden unidades en proporción a la fuerza del otro.",
    capital: "Si cae una capital, la ciudad más grande que le quede a esa civilización pasa a ser su nueva capital.",
    elimination: "Una civilización sin ciudades queda fuera de la partida.",
  },
  turn: {
    title: "Un turno, paso a paso",
    steps: {
      count: "Se cuenta lo que tiene cada uno.",
      produce: "Los depósitos trabajados y las ciudades producen recursos y monedas.",
      grow: "Las ciudades crecen, sus fronteras se mueven y las unidades terminadas se unen a los ejércitos.",
      decide: "Cada política decide a partir de la misma foto del mundo. Solo actúan las {count} primeras reglas que se cumplen.",
      resolve: "Todas las acciones ocurren a la vez: construir y acelerar, fundar ciudades, reclamar casillas, asignar trabajadores, comerciar y después atacar. Quién va primero rota cada turno.",
      upkeep: "Las unidades comen. Las que no comen se disuelven.",
      eliminate: "Se eliminan las civilizaciones sin ciudades.",
    },
  },
  winning: {
    title: "Ganar",
    metric: "Condición de victoria",
    winner: "Gana",
    territory: "Quien tenga más casillas tras el último turno.",
    wealth: "Más monedas más el valor de todos los recursos a los precios finales del mercado.",
    conquest: "La última civilización en pie; si quedan varias, la que tenga más casillas.",
    score: "Casillas × {tiles} + riqueza ÷ {wealth} + fuerza del ejército.",
  },
  policy: {
    title: "Tu política",
    body: "Una política es una lista ordenada de hasta {max} reglas si/entonces. Cada turno actúan las {active} primeras reglas cuya condición se cumple. Puedes probarla gratis en el simulador antes de apostar nada.",
    targets:
      "attack elige su víctima con weakest_neighbor, strongest_neighbor, nearest_enemy, richest_enemy, largest_enemy o leader, y su objetivo con border, city o capital: attack(richest_enemy, capital).",
    edit: "Abrir el editor de políticas",
  },
} satisfies NamespaceRulesTranslation;

export default es_rules;
