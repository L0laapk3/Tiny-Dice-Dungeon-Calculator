


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
	};
	dice[type][name] = die;
	diceOrder.push(die);
}

addDieType("core"	, "atk", 1, 6, 1, "#ffffff", "core");

addDieType("x2"		, "atk", 1, 6, 2, "#781713", "double");
addDieType("x3"		, "atk", 1, 6, 3, "#921514", "triple");
addDieType("x4"		, "atk", 1, 6, 4, "#A91514", "quadruple");
addDieType("x5"		, "atk", 1, 6, 5, "#C01710", "quintuple");
addDieType("x6"		, "atk", 1, 6, 6, "#E01710", "sextuple");

addDieType("p1"		, "atk", 2, 6, 1, "#773712", "> 1");
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
				slot.dieEl.onclick = undefined;
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
			die: i ? dice.empty : dice.atk.core,
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

	try {		// validation

		if (riskyDice.length < 1)
			throw new Error("There needs to be at least 1 risky dice to calculate anything meaningful.");

	} catch (ex) {
		cb_invalid(ex);
	}
	

	let newDiceOrder = [...riskyDice, ...safeDice];

	// reorder
	let oldDieEls = bar.dice.map(slot => ({ name: slot.die.name, el: slot.dieEl }) );
	for (let i = bar.dice.length - 1; i >= 0; i--) {
		const newDice = i < newDiceOrder.length ? newDiceOrder[i] : dice.empty;
		if (newDice.name != allDice[i].name) {
			const slot = bar.dice[i];
			
			slot.die = newDice;
			slot.dieEl = oldDieEls.splice(oldDieEls.findIndex(d => d.name == newDice.name), 1)[0].el;
			slot.el.appendChild(slot.dieEl);
		}
	}
	


		

	let current = riskyDice[0];
	let diff = current.max - current.min;
	let avg = (current.max + current.min + 1) / 2 * current.mul;

	
	
	console.log(calcBreakEvenForTurns(1, diff / (diff + 1), avg ));
}


function calcBreakEvenForTurns(n, chanceOfSuccess, avgGain) {

	console.log(arguments);

	// for n turns
	// current multipliers: M

	// x = (5/6)² * (x + 4)
	// x - (5/6)² x = (5/6)² * 4
	// x = (5/6)² / (1 - (5/6)²) * 4
	// x = 4 / ((6/5)² - 1)
	let x = avgGain / (Math.pow(1/chanceOfSuccess, n) - 1);

	return x;
}