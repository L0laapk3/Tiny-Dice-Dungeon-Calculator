const DEBUG = true;

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





function Die(properties) {
	Object.assign(this, properties);
	this._json = _ => this.name;
	return this;
}
let dice = {
	atk: { },
	mul: { },
	empty: new Die({
		type: "empty",
		name: "empty",
		text: "empty slot"
	})
};
let diceOrder = [];
let diceByName = { empty: Die.empty };
let globalIsEvolved = false;
function addDieType(subname, type, min, max, mul, color, text) {
	const name = type + subname;
	let die = new Die({
		name: name,
		type: type,
		min: min,
		_max: max,
		mul: mul,
		color: color,
		text: text,
		risky: type == "atk" && min == 1,
		doubleMultiplier: mul == 1 ? 2 : 3,
		tripleMultiplier: mul == 1 ? 5 : 11 + 2/3,
	});
	Object.defineProperty(die, "max", {
		get: _ => globalIsEvolved ? die._max + 1 : die._max
	});
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

	const barDiceIndex = getDiceBarIndex(slot.el.parentNode);
	if (barDiceIndex != saveState.selectedBar)
		return;

	scrollDiceBarContainer(barDiceIndex);
	lockDiceBarContainerScroll();


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
	target.classList.add("selected");
	bgOverlay.onclick = ev => destructSelector(ev);
	let container = document.createElement("die-selector-container");
	container.appendChild(selector);
	target.insertBefore(container, target.firstChild);


	function destructSelector(ev) {
		unlockDiceBarContainerScroll();
		originalDieEl.onclick = undefined;
		target.removeChild(container);
		target.parentNode.removeChild(bgOverlay);
		target.classList.remove("selected");
		selectorExists = undefined;
		ev.stopPropagation();
	}


	return container;
}

function Slot(properties) {
	Object.assign(this, properties);
	this._json = _ => this.die._json();
	return this;
}

function createBar(layout) {
	let bar = {
		el: document.createElement("dice-bar"),
		dice: [],
		isEvolved: !!(layout && layout.isEvolved),
	}
	for (let i = 0; i < 4; i++) {
		const slot = new Slot({
			die: layout && layout.dice && diceByName[layout.dice[i]] || (i ? dice.empty : dice.atk.single),
			el: document.createElement("die-slot"),
			index: i,
		});

		slot.dieEl = addDie(slot.die, slot.el);

		slot.el.onclick = function() {
			createSelector(slot);
		};
		slot.el.oncontextmenu = function() {
			if (slot.el.classList.contains("selected"))
				return;
			const originalDieEl = slot.dieEl;
			const originalDie = slot.die;
			slot.el.removeChild(originalDieEl);
			slot.die = dice.empty;
			slot.dieEl = addDie(dice.empty, slot.el);
			go(ex => {
				console.error(ex);
				alert(ex);
				slot.el.removeChild(slot.dieEl);
				slot.die = originalDie;
				slot.dieEl = originalDieEl;
				slot.el.appendChild(slot.dieEl);
			});
			return false;
		};

		bar.dice.push(slot);

		bar.el.appendChild(slot.el);

		bar.el.onclick = ev => {
			scrollDiceBarContainer(getDiceBarIndex(bar.el), true);
		};
	}


	let deleteEl = document.createElement("dice-bar-delete");
	bar.el.appendChild(deleteEl);
	deleteEl.onclick = function() {

		if (saveState.bars.length == 1) {
			for (let i = 0; i < 4; i++) {
				const slot = bar.dice[i];
				slot.el.removeChild(slot.dieEl);
				slot.die = i ? dice.empty : dice.atk.single;
				slot.dieEl = addDie(slot.die, slot.el);
			}
			go();
			saveStateUpdated();
			return;
		}

		bar.el.onclick = undefined;
		for (let slot of bar.dice) {
			slot.el.onclick = undefined;
			slot.el.oncontextmenu = undefined;
		}
		evolvedEl.onclick = undefined;
		deleteEl.onclick = undefined;

		const diceBarIndex = getDiceBarIndex(bar.el);
		saveState.bars.splice(diceBarIndex, 1);

		if (diceBarIndex >= saveState.bars.length) {
			saveState.selectedBar = diceBarIndex - 1;
			scrollDiceBarContainer(saveState.selectedBar, true);
		}
		go();
		saveStateUpdated();

		const deleteWrapper = document.createElement("dice-bar-deleter");
		diceBarContainer.insertBefore(deleteWrapper, bar.el);
		deleteWrapper.appendChild(bar.el);
		setTimeout(_ => {
			deleteWrapper.style.height = 0;
			setTimeout(_ => {
				diceBarContainer.removeChild(deleteWrapper);
			}, 600);
		}, 0);
	}


	let evolvedEl = document.createElement("dice-bar-evolved");
	if (bar.isEvolved)
		evolvedEl.classList.add("selected");
	bar.el.appendChild(evolvedEl);
	evolvedEl.onclick = function() {
		bar.isEvolved = !bar.isEvolved;
		if (bar.isEvolved)
			evolvedEl.classList.add("selected");
		else
			evolvedEl.classList.remove("selected");
		go(ex => {
			console.error(ex);
			alert(ex);
			bar.isEvolved = !bar.isEvolved;
			if (bar.isEvolved)
				evolvedEl.classList.add("selected");
			else
				evolvedEl.classList.remove("selected");
		});
	}


	return bar;
}

let resultList, orderList, hiddenResultsLink, saveState;
try {
	saveState = JSON.parse(localStorage.saveState);
	if (!(saveState.selectedBar < saveState.bars.length))
		saveState.selectedBar = saveState.bars.length;
	
	saveState.bars = saveState.bars.map(createBar);

} catch (_) {
	saveState = {
		selectedBar: 0,
		bars: [ ],
	};
}
if (!saveState.bars.length)
	saveState.bars[0] = createBar([ dice.empty.name, dice.atk.single.name, dice.atk.single.name, dice.atk.single.name ]);


window.onload = function() {
	


	resultList = document.getElementById("result-list-simple");
	orderList = document.getElementById("order-list");
	for (let a of [...document.getElementsByClassName("hidden-results-toggle")])
		a.onclick = _ => {
			if (a.parentNode.classList.contains("show-hidden-results"))
				a.parentNode.classList.remove("show-hidden-results");
			else
				a.parentNode.classList.add("show-hidden-results");
			return false;
		};

	diceBarContainer = document.getElementById("dice-bar-container");

	for (let bar of saveState.bars)
		diceBarContainer.insertBefore(bar.el, diceBarContainer.lastElementChild);

	diceBarContainer.onscroll = ev => {
		let bar = getDiceBarPosition();
		if (bar < 0 || bar >= saveState.bars.length || bar == saveState.selectedBar)
			return;
		
		saveState.selectedBar = bar;
		saveStateUpdated();

		go();
	}

	scrollDiceBarContainer(saveState.selectedBar);
	resize();

	diceBarContainer.firstElementChild.onclick = function() {
		let bar = createBar();
		diceBarContainer.insertBefore(bar.el, diceBarContainer.firstElementChild.nextElementSibling);
		saveState.bars.unshift(bar);

		scrollDiceBarContainerRelative(1);

		setTimeout(scrollDiceBarContainer, 1, 0, true);
	}
	diceBarContainer.lastElementChild.onclick = function() {
		let bar = createBar();
		diceBarContainer.insertBefore(bar.el, diceBarContainer.lastElementChild);
		saveState.bars.push(bar);

		scrollDiceBarContainer(saveState.bars.length - 1, true);
	}

	go(ex => {
		console.error("Problem with stored bar, resetting config.", ex);
		if (DEBUG)
			return;

		for (let bar of diceBarContainer.getElementsByTagName("dice-bar"))
			diceBarContainer.removeChild(bar);
		saveState = {
			selectedBar: 0,
			bars: [ createBar([ dice.empty.name, dice.atk.single.name, dice.atk.single.name, dice.atk.single.name ]) ],
		}
		diceBarContainer.insertBefore(saveState.bars[0].el, diceBarContainer.lastElementChild);

		go(ex => {
			console.error("Problem with default bar.", ex);
			alert("Fatal error when loading page: " + ex);
		});
	});

	saveStateUpdated();
};

let scrollbarWidth = 0;
let diceScale = 3;
function resize() {
	if (window.innerWidth > document.body.clientWidth)
		scrollbarWidth = window.innerWidth - document.body.clientWidth;
	
	let oldDiceScale = diceScale;
	if (window.devicePixelRatio > 1.5)
		diceScale = Math.min(3, (window.innerWidth - scrollbarWidth) * window.devicePixelRatio / 246 / window.devicePixelRatio);
	else
		diceScale = Math.min(3, Math.floor((window.innerWidth - scrollbarWidth) * window.devicePixelRatio / 222) / window.devicePixelRatio);
	document.body.style.setProperty("--dice-scale", diceScale);

	diceBarContainer.scrollTop *= diceScale / oldDiceScale;
}
window.onresize = resize;


function getDiceBarIndex(el) {
	const index = [...diceBarContainer.getElementsByTagName("dice-bar")].indexOf(el);
	if (index < 0)
		throw new error("Negative dice bar index", el);
	return index;
}
function getDiceBarPosition() {
	return Math.round((diceBarContainer.scrollTop / diceScale - 2) / 60) - 1;
}
function _diceBarContainerScrollOffset(offset) {
	return diceScale * 60 * offset;
}
function _diceBarContainerScrollPosition(position) {
	return diceScale * 2 + _diceBarContainerScrollOffset(position + 1);
}
function scrollDiceBarContainerRelative(offset) {
	diceBarContainer.scrollTop += _diceBarContainerScrollOffset(offset);
}
function scrollDiceBarContainer(position, smooth) {
	diceBarContainer.onscroll();
	diceBarContainer.scrollTo({
		top: _diceBarContainerScrollPosition(position),
		behavior: smooth ? "smooth" : "auto",
	});
}
function lockDiceBarContainerScroll() {
	diceBarContainer.classList.add("locked");
}
function unlockDiceBarContainerScroll() {
	diceBarContainer.classList.remove("locked");
}


function go(cb_invalid) {

	if (!cb_invalid)
		cb_invalid = ex => {
			console.error("Problem with bar.", ex);
			alert("Fatal error while simulating dice bar: " + ex);

			// TODO: delete bar
		}

	let bar = saveState.bars[saveState.selectedBar];

	globalIsEvolved = bar.isEvolved;

	let barDiceCopy = bar.dice.map(slot => ({...slot}));
	let safeDieSlots = barDiceCopy.filter(slot => slot.die.type != "empty" && !slot.die.risky).reverse().sort((a, b) => (a.die.type == "mul") - (b.die.type == "mul") || a.die.min - b.die.min || a.die.max - b.die.max)
	let riskyDieSlots = barDiceCopy.filter(slot => slot.die.type != "empty" && slot.die.risky).reverse().sort((a, b) => a.die.mul - b.die.mul);

	// validate inputs
	try {

		if (riskyDieSlots.length < 1)
			throw new Error("There needs to be at least 1 risky dice to calculate anything meaningful.");

		for (let slot of bar.dice)
			if (slot.die.type == "atk" && bar.dice.filter(s => s.die.name == slot.die.name).length > 3)
				throw new Error("Cannot calculate results for 4 of the same dice type as the behaviour for rolling 4 of the same is unknown.");

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
	

	const avMul = safeDieSlots.filter(d => d.die.type == "mul").map(d => (d.die.min + d.die.max) / 2).reduce((p, q) => p * q, 1);
	
	let multiplierConfigurationTemplate = { 1: { multiplier: 1, breakEvenPoint: 0, hidden: false, maxIncreaseFromPreviousSet: 0 } };
	for (let dieIndex = 0; dieIndex < safeDieSlots.length; dieIndex++) {
		const die = safeDieSlots[dieIndex].die;
		if (die.type != "mul")
			continue;
		const newMultipliers = {};
		for (let prev of Object.values(multiplierConfigurationTemplate))
				for (let nowMultiplier = die.min; nowMultiplier <= die.max; nowMultiplier++)
					newMultipliers[nowMultiplier * prev.multiplier] = { multiplier: nowMultiplier * prev.multiplier, breakEvenPoint: 0, hidden: false, maxIncreaseFromPreviousSet: 0 };

		multiplierConfigurationTemplate = newMultipliers;
	}

	let multiplierConfigurationsPerStartDie = [];

	
	// plot  throw order
	while (orderList.lastChild)
		orderList.removeChild(orderList.lastChild);
	let needsFirstArrow = false;
	for (let i = safeDieSlots.length - 1; i >= 0; i--) {
		const container = document.createElement("small-die-container");
		addDie(safeDieSlots[i].die, container, safeDieSlots[i].dieEl);
		orderList.appendChild(container);
		needsFirstArrow = true;
	}
	let lastDieName;
	for (let i = riskyDieSlots.length - 1; i >= 0; i--) {
		if (lastDieName != riskyDieSlots[i].die.name) {
			const mulConfig = {}
			for (let [key, value] of Object.entries(multiplierConfigurationTemplate))
				mulConfig[key] = {...value};
			const config = {
				startDieIndex: i,
				multiplierConfigurations: mulConfig,
			};
			multiplierConfigurationsPerStartDie.push(config);
		}
		if (needsFirstArrow) {
			if (lastDieName != riskyDieSlots[i].die.name) {
				const arrow = document.createElement("span");
				arrow.innerText = ">";
				orderList.appendChild(arrow)
			}
		} else
			needsFirstArrow = true;
		lastDieName = riskyDieSlots[i].die.name;
		const container = document.createElement("small-die-container");
		addDie(riskyDieSlots[i].die, container, riskyDieSlots[i].dieEl);
		orderList.appendChild(container);
	}




	let previousThrows = [];
	// TODO: something with this maybe, i think its not needed, only needed for 2 identical dice and it might be safe to assume that its always worth throwing the second one
	// if the double dice multipliers ever get nerfed, will have to look into this.
	
	for (let globalConfig of multiplierConfigurationsPerStartDie) {
		let currentDieIndex = globalConfig.startDieIndex;

		let isCurrentThrow = true;
		let successChance = 1;
		let avCurrentGain = 0, avNextGain = 0;	// average gains before multiplied my multiplier dice in current throw (with predetermined multiplier) and in subsequent throws
		let thrownRiskyDice = [];

		let anyIncreased;
		do {
			anyIncreased = false;

			for (let _ of riskyDieSlots) {

				let currentDie = riskyDieSlots[currentDieIndex].die;
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

				if (--currentDieIndex >= 0)
					thrownRiskyDice.push(currentDie);
				else {
					// all dices are reset, throw all safe dice
					currentDieIndex = riskyDieSlots.length - 1;
					thrownRiskyDice = []
					isCurrentThrow = false;
					for (let slot of safeDieSlots)
						if (slot.die.type == "atk")	//todo: account for double/triple chance
							avNextGain += (slot.die.max + slot.die.min) / 2 * slot.die.mul;
				}


				// avGain = avCurrGain * m + avNextGain * avMul
				// x = p * (x + avGain)
				// (1 - p) x = p * avGain
				// x = p / (1 - p) * avGain

				const failMultiplier = successChance / (1 - successChance);
				const avNextGainMul = avNextGain * avMul;


				for (let config of Object.values(globalConfig.multiplierConfigurations)) {
					let breakEvenPoint = failMultiplier * (avCurrentGain * config.multiplier + avNextGainMul);
					if (breakEvenPoint > config.breakEvenPoint) {
						config.breakEvenPoint = breakEvenPoint;
						anyIncreased = true;
					}
				}

			}
		} while (anyIncreased);

	}

	



	// calculate max gains between each throw step to hide unnecessary results

	const highestLastConfig = Object.values(multiplierConfigurationsPerStartDie[multiplierConfigurationsPerStartDie.length-1].multiplierConfigurations).reduce((r, p) => p.multiplier > r.multiplier ? p : r);
	const lastSlot = riskyDieSlots[multiplierConfigurationsPerStartDie[multiplierConfigurationsPerStartDie.length-1].startDieIndex];

	// this assumes that a dice set has only 1 type of dice.
	let highestValueWithLastDiceSet = lastSlot.die.max * lastSlot.die.mul * (multiplierConfigurationsPerStartDie[multiplierConfigurationsPerStartDie.length-1].startDieIndex + 1);
	if (multiplierConfigurationsPerStartDie[multiplierConfigurationsPerStartDie.length-1].startDieIndex == 1)
		highestValueWithLastDiceSet *= lastSlot.die.doubleMultiplier;
	if (multiplierConfigurationsPerStartDie[multiplierConfigurationsPerStartDie.length-1].startDieIndex == 2)
		highestValueWithLastDiceSet *= lastSlot.die.tripleMultiplier;

	const highestLastPoint = highestLastConfig.breakEvenPoint + highestLastConfig.multiplier * highestValueWithLastDiceSet;



	// plot results

	
	while (resultList.lastChild)
		resultList.removeChild(resultList.lastChild);

	if (Object.keys(multiplierConfigurationsPerStartDie[0].multiplierConfigurations).length > 1)
		resultList.classList.remove("single-result");
	else
		resultList.classList.add("single-result");
		
		
	const rowEl = document.createElement("tr");
	const mulEl = document.createElement("th");
	mulEl.innerHTML = "Total<br/>Current<br/>Multiplier";
	rowEl.appendChild(mulEl);

	lastDieName = undefined;
	let resEl, beforeEl;
	for (let i = riskyDieSlots.length - 1; i >= 0; i--) {
		if (lastDieName != riskyDieSlots[i].die.name) {
			if (lastDieName) {
				beforeEl = document.createElement("br");
				resEl.appendChild(beforeEl);
				resEl.appendChild(document.createTextNode("Roll until"));
				rowEl.appendChild(resEl);
			}
			resEl = document.createElement("th");
		}
		lastDieName = riskyDieSlots[i].die.name;
		const container = document.createElement("small-die-container");
		addDie(riskyDieSlots[i].die, container, riskyDieSlots[i].dieEl);
		resEl.appendChild(container);
	}
	beforeEl = document.createElement("br");
	resEl.appendChild(beforeEl);
	resEl.appendChild(document.createTextNode("Roll until"));
	rowEl.appendChild(resEl);
	resultList.appendChild(rowEl);

	let hasHiddenResults = false;

	for (let multiplier of Object.values(multiplierConfigurationsPerStartDie[0].multiplierConfigurations).map(c => c.multiplier).sort((a, b) => a - b)) {

		const rowEl = document.createElement("tr");
		const mulEl = document.createElement("td");
		mulEl.innerText = multiplier;
		rowEl.appendChild(mulEl);


		let highestPoint = highestLastPoint;

		lastDieName = undefined;
		let j = 0, sameDieCount;
		for (let i = riskyDieSlots.length - 1; i >= 0; i--) {
			if (lastDieName != riskyDieSlots[i].die.name) {
				const resEl = document.createElement("td");
				const breakEvenValue = multiplierConfigurationsPerStartDie[j++].multiplierConfigurations[multiplier].breakEvenPoint;
				resEl.setAttribute("data-value", Math.round(breakEvenValue * 10) / 10);

				if (breakEvenValue - 0.1 >= highestPoint) {
					resEl.classList.add("result-hidden");
					hasHiddenResults = true;
				} else
					highestPoint = breakEvenValue;

				rowEl.appendChild(resEl);

				sameDieCount = 1;
			} else {
				if (++sameDieCount == 2)
					highestPoint += riskyDieSlots[i].die.max * riskyDieSlots[i].die.mul * multiplier * 2 * (riskyDieSlots[i].die.doubleMultiplier - 1);
				if (sameDieCount == 3)
					highestPoint += riskyDieSlots[i].die.max * riskyDieSlots[i].die.mul * multiplier * (3 * (riskyDieSlots[i].die.tripleMultiplier - 1) - (2 * (riskyDieSlots[i].die.doubleMultiplier - 1)));
			}
			highestPoint += riskyDieSlots[i].die.max * riskyDieSlots[i].die.mul * multiplier;

			lastDieName = riskyDieSlots[i].die.name;
		}
		resultList.appendChild(rowEl);
	}
	
	if (hasHiddenResults)
		resultList.parentNode.classList.add("has-hidden-results");
	else
		resultList.parentNode.classList.remove("has-hidden-results", "show-hidden-results");
}



function saveStateUpdated() {
	localStorage.saveState = JSON.stringify(saveState, (k, v) => k[0] == '_' || v instanceof HTMLElement ? undefined : v._json ? v._json() : v);
}