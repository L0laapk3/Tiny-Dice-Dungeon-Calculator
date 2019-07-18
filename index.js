

function init(die) {
	die.style.backgroundPosition = Math.floor(Math.random() * 6) * -90 + "px " + Math.floor(Math.random() * 4) * -99	 + "px"
}

for (let die of [...document.getElementsByTagName("dice")])
	init(die)




function addDie(prot, target) {
	let die = document.createElement("die");

	die.style.backgroundColor = prot.color;
	die.setAttribute("data-name", prot.name);
	die.setAttribute("data-text", prot.text);

	target.appendChild(die);

	init(die);
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
		text: text
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


function createSelector(target) {
	let selector = document.createElement("die-selector");
	let clearRow = document.createElement("die-selector-clear-row");
	let clearDie = addDie(dice.empty, clearRow);
	clearDie.setAttribute("data-text", "remove die");
	selector.appendChild(clearRow);
	for (let j = 0; j < diceOrder.length; j += 4) {
		let column = document.createElement("die-selector-column");
		for (let i = j; i < j + 4; ++i)
			addDie(diceOrder[i], column);
		selector.appendChild(column);
	}

	target.insertBefore(selector, target.firstChild);

	return selector;
}

window.onload = function() {

	let diceBar = document.getElementById("dice-bar");
	for (let i = 0; i < diceBar.children.length; i++) {
		const dieSlot = diceBar.children[i], prot = i ? dice.empty : dice.atk.core;

		addDie(prot, dieSlot);

		dieSlot.onclick = function() {
			createSelector(dieSlot);
		}
	}
}