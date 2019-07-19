


function addDie(prototype, target) {
	let die = document.createElement("die");

	die.style.backgroundColor = prototype.color;
	die.setAttribute("data-name", prototype.name);
	die.setAttribute("data-text", prototype.text);

	if (die.type != "empty")
		die.style.backgroundPosition = Math.floor(Math.random() * 6) * -90 + "px " + Math.floor(Math.random() * 4) * -99 + "px";

	target.appendChild(die);

	return die;
}





let dice = {
	atk: { },
	mul: { },
	empty: {
		type: "empty",
		name: "empty",
		text: "empty slot"
	}
}, diceOrder = [];
function addDieType(name, type, min, max, mul, color, text) {
	let die = {
		name: type + name,
		type: type,
		min: min,
		max: max,
		mul: mul,
		color: color,
		text: text,
		risky: type == "atk" && min == 1,
		doubleMultiplier: mul == 1 ? 2 : 3,
		tripleMultiplier: mul == 1 ? 5 : 11 + 2/3,
	};
	dice[type][name] = die;
	diceOrder.push(die);
}

addDieType("single"	, "atk", 1, 6, 1, "#ffffff", "single");

addDieType("x2"		, "atk", 1, 6, 2, "#781713", "double");
addDieType("x3"		, "atk", 1, 6, 3, "#921514", "triple");
addDieType("x4"		, "atk", 1, 6, 4, "#A91514", "quadruple");
addDieType("x5"		, "atk", 1, 6, 5, "#C01710", "quintuple");
addDieType("x6"		, "atk", 1, 6, 6, "#E01710", "sextuple");

addDieType("p1"		, "atk", 2, 6, 1, "#773712", "> 1");
// addDieType("p2"		, "atk", 3, 6, 1, "#0F0", "> 2");
addDieType("p3"		, "atk", 4, 6, 1, "#DB630E", "> 3");

addDieType("x2"		, "mul", 1, 2, 1, "#484201", "mult 1-2");
addDieType("x3"		, "mul", 1, 3, 1, "#544C0A", "mult 1-3");
addDieType("x4"		, "mul", 1, 4, 1, "#5F5912", "mult 1-4");
addDieType("x5"		, "mul", 1, 5, 1, "#6B631C", "mult 1-5");
addDieType("x6"		, "mul", 1, 6, 1, "#776F24", "mult 1-6");
addDieType("p1"		, "mul", 2, 6, 1, "#906E25", "mult > 1");
addDieType("p2"		, "mul", 3, 6, 1, "#A88621", "mult > 2");
addDieType("p3"		, "mul", 4, 6, 1, "#C09A27", "mult > 3");


let selectorExists = undefined;
function createSelector(slot) {
	if (selectorExists)
		return;
	let selector = document.createElement("die-selector");
	const target = slot.el;
	selectorExists = selector;
	for (let j = 0; j < diceOrder.length; j += 4) {
		let column = document.createElement("die-selector-column");
		for (let i = j; i < j + 4; ++i) {
			const dieButton = diceOrder[i] == slot.die ? dice.empty : diceOrder[i];
			const dieButtonEl = addDie(dieButton, column);
			dieButtonEl.onclick = function(ev) {
				let originalDieEl = slot.dieEl;
				let originalDie = slot.die;
				slot.el.removeChild(originalDieEl);
				slot.die = dieButton;
				slot.dieEl = dieButtonEl;
				slot.el.appendChild(slot.dieEl);
				dieButtonEl.onclick = undefined;
				destructSelector(ev);
				go(ex => {
					console.error(ex);
					alert(ex);
					slot.el.removeChild(slot.dieEl);
					slot.die = originalDie;
					slot.dieEl = originalDieEl;
					slot.el.appendChild(slot.dieEl);
				});
			};
			slot.dieEl.onclick = function(ev) {
				destructSelector(ev);
			}
			
			// if (dieButton == dice.empty)
			// 	dieButton.setAttribute("data-text", "clear die");

		}

		selector.appendChild(column);
	}

	let bgOverlay = document.createElement("die-selector-overlay");
	target.parentNode.appendChild(bgOverlay);
	const oldZIndex = target.style.zIndex;
	target.style.zIndex = 101;
	bgOverlay.onclick = destructSelector;
	target.insertBefore(selector, target.firstChild);

	return selector;


	function destructSelector(ev) {
		slot.dieEl.onclick = undefined;
		target.removeChild(selector);
		target.parentNode.removeChild(bgOverlay);
		target.style.zIndex = oldZIndex;
		selectorExists = undefined;
		ev.stopPropagation();
	}
}


window.onload = function() {

	let bar = {
		el: document.getElementById("dice-bar"),
		dice: [],
	}
	for (let i = 0; i < bar.el.children.length; i++) {
		const slot = {
			die: i ? dice.empty : dice.atk.single,
			el: bar.el.children[i],
		};

		slot.dieEl = addDie(slot.die, slot.el);

		slot.el.onclick = function() {
			createSelector(slot);
		};

		bar.dice.push(slot);
	}

	window.bar = bar;

	go();
};







function go(cb_invalid) {


	let bar = window.bar;

	let allDice = bar.dice.map(d => d.die);
	let safeDice = allDice.filter(d => d.type != "empty" && !d.risky).sort((a, b) => (a.type == "mul") - (b.type == "mul") || a.min - b.min || a.max - b.max)
	let riskyDice = allDice.filter(d => d.type != "empty" && d.risky).sort((a, b) => a.mul - b.mul);

	// validate inputs
	try {

		if (riskyDice.length < 1)
			throw new Error("There needs to be at least 1 risky dice to calculate anything meaningful.");

		for (let die of allDice)
			if (die.type == "atk" && allDice.filter(d => d.name == die.name).length > 3)
				throw new Error("Cannot calculate for 4 of the same die type as the multiplier for rolling the same number on 4 identical dice is unknown.");

	} catch (ex) {
		return cb_invalid(ex);
	}
	

	let newDiceOrder = [...riskyDice, ...safeDice];

	// reorder
	// let oldDieEls = bar.dice.map(slot => ({ name: slot.die.name, el: slot.dieEl }) );
	// for (let i = bar.dice.length - 1; i >= 0; i--) {
	// 	const newDice = i < newDiceOrder.length ? newDiceOrder[i] : dice.empty;
	// 	if (newDice.name != allDice[i].name) {
	// 		const slot = bar.dice[i];
			
	// 		slot.die = newDice;
	// 		slot.dieEl = oldDieEls.splice(oldDieEls.findIndex(d => d.name == newDice.name), 1)[0].el;
	// 		slot.el.appendChild(slot.dieEl);
	// 	}
	// }
	


	

	const avMul = safeDice.filter(d => d.type == "mul").map(d => (d.min + d.max) / 2).reduce((p, q) => p * q, 1);
	
	let multiplierConfigurations = { 1: { multiplier: 1, breakEvenPoint: 0, done: false } };
	for (let dieIndex = 0; dieIndex < safeDice.length; dieIndex++) {
		const die = safeDice[dieIndex];
		if (die.type != "mul")
			continue;
		const newMultipliers = { };
		for (let prev of Object.values(multiplierConfigurations))
				for (let nowMultiplier = die.min; nowMultiplier <= die.max; nowMultiplier++)
					newMultipliers[nowMultiplier * prev.multiplier] = { multiplier: nowMultiplier * prev.multiplier, breakEvenPoint: 0, done: false };

		multiplierConfigurations = newMultipliers;
	}

	let previousThrows = [];
	// TODO: these are only the calculations if you should throw the first die and say nothing about subsequent dice.

	let isCurrentThrow = true;
	let currentThrowCount = 0, currentDiceIndex = riskyDice.length;
	let successChance = 1;
	let avCurrentGain = 0, avNextGain = 0;	// average gains before multiplied my multiplier dice in current throw (with predetermined multiplier) and in subsequent throws
	let thrownRiskyDice = [];

	let anyIncreased;
	do {
		anyIncreased = false;

		for (let _ of riskyDice) {

			let currentDie = riskyDice[--currentDiceIndex];
			let diff = currentDie.max - currentDie.min;
			let av = (currentDie.max + currentDie.min + 1) / 2 * currentDie.mul;

			let doubleAv = 0;
			let identicalDiceCount = 1;
			let previousIdenticalDiceThrowValues = [];
			for (let dieThrow of previousThrows)
				if (dieThrow.die.name == currentDie.name) {
					// TODO: stuff?
					identicalDiceCount++;
					previousIdenticalDiceThrowValues.push(dieThrow.result);
				}

			for (let die of thrownRiskyDice)
				if (die.name == currentDie.name)
					identicalDiceCount++;
			
			if (identicalDiceCount == 2) {
				if (previousIdenticalDiceThrowValues.length == 1) {
					// 1 known, 1 unknown
					// double with 1 known
					doubleAv += 2 * (currentDie.doubleMultiplier - 1) * previousIdenticalDiceThrowValues[0] / diff;

				} else if (previousIdenticalDiceThrowValues.length == 0)
					// 2 unknown
					// double with 2 unknowns
					doubleAv += 2 * (currentDie.doubleMultiplier - 1) * av / diff;

			} else if (identicalDiceCount == 3) {
				if (previousIdenticalDiceThrowValues.length == 2) {
					if (previousIdenticalDiceThrowValues[1] == previousIdenticalDiceThrowValues[0])
						// 2 same known, 1 unknown
						// for triple if double already happened with 1 unkwown
						doubleAv += 3 * (currentDie.tripleMultiplier - currentDie.doubleMultiplier) * av / diff;

					else
						// 2 diff known, 1 unknown
						// double with 1 of 2 knowns
						doubleAv += 2 * (currentDie.doubleMultiplier - 1) * (previousIdenticalDiceThrowValues[0] + previousIdenticalDiceThrowValues[1]) / diff;
						
				} else if (previousIdenticalDiceThrowValues.length == 1) {
					// 1 known, 2 unknown
					// 2 * double with 1 known or double with 2 unknown
					doubleAv += 2 * (currentDie.doubleMultiplier - 1) * (2 * previousIdenticalDiceThrowValues[0] + av) / diff;
					// triple if double already happened with 2 unknowns
					doubleAv += 3 * (currentDie.tripleMultiplier - currentDie.doubleMultiplier) * previousIdenticalDiceThrowValues[0] / diff**2;
				} else if (previousIdenticalDiceThrowValues.length == 0) {
					// 3 unknowns
					// 3 * double with 2 unknowns
					doubleAv += 2 * (currentDie.doubleMultiplier - 1) * (3 * av) / diff;
					// triple if double already happened with 2 unknowns
					doubleAv += 3 * (currentDie.tripleMultiplier - currentDie.doubleMultiplier) * av / diff**2;
				}
				
			}


			if (isCurrentThrow)
				avCurrentGain += av + doubleAv;
			else
				avNextGain += av + doubleAv;

			successChance *= diff / (diff + 1);

			if (currentDiceIndex > 0)
				thrownRiskyDice.push(currentDie);
			else {
				currentDiceIndex = riskyDice.length;
				thrownRiskyDice = []
				isCurrentThrow = false;
				for (let die of safeDice)
					if (die.type == "atk")	//todo: account for double/triple chance
						avNextGain += (die.max + die.min + 1) / 2 * die.mul;
			}


			// avGain = avCurrGain * m + avNextGain * avMul
			// x = p * (x + avGain)
			// (1 - p) x = p * avGain
			// x = p / (1 - p) * avGain

			const failMultiplier = successChance / (1 - successChance);
			const avNextGainMul = avNextGain * avMul;

			for (let config of Object.values(multiplierConfigurations)) {
				if (config.done)
					continue;
				let breakEvenPoint = failMultiplier * (avCurrentGain * config.multiplier + avNextGainMul);
				if (breakEvenPoint > config.breakEvenPoint) {
					config.breakEvenPoint = breakEvenPoint;
					if (config.multiplier >= avMul)
						config.done = true;
					else
						anyIncreased = true;
				} else
					config.done = true;
			}

		}
	} while (anyIncreased);

	
	
	console.log(multiplierConfigurations);
}