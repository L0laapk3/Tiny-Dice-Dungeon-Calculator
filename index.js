


function addDie(prototype, target, variationClone) {
	let die = document.createElement("die");

	die.style.backgroundColor = prototype.color;
	die.setAttribute("data-name", prototype.name);
	die.setAttribute("data-text", prototype.text);

	if (die.type != "empty") {
		die.style.setProperty('--variation-x', variationClone ? variationClone.style.getPropertyValue('--variation-x') : Math.floor(Math.random() * 6));
		die.style.setProperty('--variation-y', variationClone ? variationClone.style.getPropertyValue('--variation-y') : Math.floor(Math.random() * 4));
	}

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
};
let diceOrder = [];
let diceByName = {};
function addDieType(subname, type, min, max, mul, color, text) {
	const name = type + subname;
	let die = {
		name: name,
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
	dice[type][subname] = die;
	diceOrder.push(die);
	diceByName[name] = die;
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
	const originalDieEl = slot.dieEl;
	const originalDie = slot.die;
	selectorExists = selector;
	for (let j = 0; j < diceOrder.length; j += 4) {
		let column = document.createElement("die-selector-column");
		for (let i = j; i < j + 4; ++i) {
			const dieButton = diceOrder[i] == slot.die ? dice.empty : diceOrder[i];
			const dieButtonEl = addDie(dieButton, column);
			dieButtonEl.onclick = function(ev) {
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
			slot.dieEl.onclick = ev => destructSelector(ev);
			
			// if (dieButton == dice.empty)
			// 	dieButton.setAttribute("data-text", "clear die");

		}

		selector.appendChild(column);
	}

	let bgOverlay = document.createElement("die-selector-overlay");
	target.parentNode.appendChild(bgOverlay);
	const oldZIndex = target.style.zIndex;
	target.style.zIndex = 101;
	bgOverlay.onclick = ev => destructSelector(ev);
	target.insertBefore(selector, target.firstChild);

	return selector;


	function destructSelector(ev) {
		originalDieEl.onclick = undefined;
		target.removeChild(selector);
		target.parentNode.removeChild(bgOverlay);
		target.style.zIndex = oldZIndex;
		selectorExists = undefined;
		ev.stopPropagation();
	}
}

function createBar(target, layout) {
	let bar = {
		el: document.createElement("dice-bar"),
		dice: [],
	}
	for (let i = 0; i < 4; i++) {
		const slot = {
			die: layout && layout.length && diceByName[layout[i]] || (i ? dice.empty : dice.atk.single),
			el: document.createElement("die-slot"),
			index: i,
		};

		slot.dieEl = addDie(slot.die, slot.el);

		slot.el.onclick = function() {
			createSelector(slot);
		};

		bar.dice.push(slot);

		bar.el.appendChild(slot.el);
	}

	target.appendChild(bar.el);

	return bar;
}

let resultList, orderList;

window.onload = function() {

	resultList = document.getElementById("result-list-simple");
	orderList = document.getElementById("order-list");

	let restoredBars = JSON.parse(localStorage.bars || "[]");

	diceBarContainer = document.getElementById("dice-bar-container");
	window.bar = createBar(diceBarContainer, restoredBars[0]);

	go(ex => {
		console.error("Problem with stored bar, resetting it.", ex);
		while (diceBarContainer.lastChild)
			diceBarContainer.removeChild(diceBarContainer.lastChild);
		window.bar = createBar(diceBarContainer);
		go(ex => {
			console.error("Problem with default bar.", ex);
			alert("Fatal error when loading page: " + ex);
		});
	});
};





function go(cb_invalid) {


	let bar = window.bar;

	let barDiceCopy = bar.dice.map(slot => ({...slot}));
	let safeDice = barDiceCopy.filter(slot => slot.die.type != "empty" && !slot.die.risky).reverse().sort((a, b) => (a.die.type == "mul") - (b.die.type == "mul") || a.die.min - b.die.min || a.die.max - b.die.max)
	let riskyDice = barDiceCopy.filter(slot => slot.die.type != "empty" && slot.die.risky).reverse().sort((a, b) => a.die.mul - b.die.mul);

	// validate inputs
	try {

		if (riskyDice.length < 1)
			throw new Error("There needs to be at least 1 risky dice to calculate anything meaningful.");

		for (let slot of bar.dice)
			if (slot.die.type == "atk" && bar.dice.filter(s => s.die.name == slot.die.name).length > 3)
				throw new Error("Cannot calculate for 4 of the same die type as the multiplier for rolling the same number on 4 identical dice is unknown.");

	} catch (ex) {
		return cb_invalid(ex);
	}
	


	// reorder
	// let newDiceOrder = [...riskyDice, ...safeDice];
	// let oldDieEls = barDiceCopy.filter((slot, i) => i >= newDiceOrder.length || slot.die.name != newDiceOrder[i].die.name);
	// for (let i = bar.dice.length - 1; i >= 0; i--) {
	// 	const newDice = i < newDiceOrder.length ? newDiceOrder[i].die : dice.empty;
	// 	if (newDice.name != bar.dice[i].die.name) {
	// 		const slot = bar.dice[i];
			
	// 		slot.die = newDice;
	// 		slot.dieEl = oldDieEls.splice(oldDieEls.findIndex(d => d.die.name == newDice.name), 1)[0].dieEl;
	// 		slot.el.appendChild(slot.dieEl);
	// 	}
	// }
	


	

	const avMul = safeDice.filter(d => d.die.type == "mul").map(d => (d.die.min + d.die.max) / 2).reduce((p, q) => p * q, 1);
	
	let multiplierConfigurations = { 1: { multiplier: 1, breakEvenPoint: 0 } };
	for (let dieIndex = 0; dieIndex < safeDice.length; dieIndex++) {
		const die = safeDice[dieIndex].die;
		if (die.type != "mul")
			continue;
		const newMultipliers = {};
		for (let prev of Object.values(multiplierConfigurations))
				for (let nowMultiplier = die.min; nowMultiplier <= die.max; nowMultiplier++)
					newMultipliers[nowMultiplier * prev.multiplier] = { multiplier: nowMultiplier * prev.multiplier, breakEvenPoint: 0 };

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

			let currentDie = riskyDice[--currentDiceIndex].die;
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
				// all dices are reset, throw all safe dice
				currentDiceIndex = riskyDice.length;
				thrownRiskyDice = []
				isCurrentThrow = false;
				for (let slot of safeDice)
					if (slot.die.type == "atk")	//todo: account for double/triple chance
						avNextGain += (slot.die.max + slot.die.min) / 2 * slot.die.mul;
			}


			// avGain = avCurrGain * m + avNextGain * avMul
			// x = p * (x + avGain)
			// (1 - p) x = p * avGain
			// x = p / (1 - p) * avGain

			const failMultiplier = successChance / (1 - successChance);
			const avNextGainMul = avNextGain * avMul;


			for (let config of Object.values(multiplierConfigurations)) {
				let breakEvenPoint = failMultiplier * (avCurrentGain * config.multiplier + avNextGainMul);
				if (breakEvenPoint > config.breakEvenPoint) {
					config.breakEvenPoint = breakEvenPoint;
					anyIncreased = true;
				}
			}

		}
	} while (anyIncreased);

	




	// plot order

	while (orderList.lastChild)
		orderList.removeChild(orderList.lastChild);
	let needsFirstArrow = false;
	for (let i = safeDice.length - 1; i >= 0; i--) {
		const container = document.createElement("small-die-container");
		addDie(safeDice[i].die, container, safeDice[i].dieEl);
		orderList.appendChild(container);
		needsFirstArrow = true;
	}
	let lastDieName;
	for (let i = riskyDice.length - 1; i >= 0; i--) {
		if (needsFirstArrow) {
			if (lastDieName != riskyDice[i].die.name) {
				const arrow = document.createElement("span");
				arrow.innerText = ">";
				orderList.appendChild(arrow)
			}
		} else
			needsFirstArrow = true;
		lastDieName = riskyDice[i].die.name;
		const container = document.createElement("small-die-container");
		addDie(riskyDice[i].die, container, riskyDice[i].dieEl);
		orderList.appendChild(container);
	}





	// plot results

	
	while (resultList.children.length > 1)
		resultList.removeChild(resultList.lastChild);
	if (Object.keys(multiplierConfigurations).length > 1)
		resultList.classList.remove("single-result");
	else
		resultList.classList.add("single-result");
	for (let row of Object.values(multiplierConfigurations).sort((a, b) => a.multiplier - b.multiplier)) {
		const rowEl = document.createElement("tr");
		const mulEl = document.createElement("td");
		mulEl.innerText = row.multiplier;
		rowEl.appendChild(mulEl);
		const resEl = document.createElement("td");
		resEl.innerText = Math.round(row.breakEvenPoint * 10) / 10;
		rowEl.appendChild(resEl);
		resultList.appendChild(rowEl);
	}





	// save configuration

	localStorage.bars = JSON.stringify([ bar.dice.map(d => d.die.name) ]);

}