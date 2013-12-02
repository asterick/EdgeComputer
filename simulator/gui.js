document.body.innerHTML = require("./templates/main.html")();

var fields = document.querySelectorAll(".field[name]"),
		registers = document.querySelectorAll(".register[name]"),
		flags = document.querySelectorAll(".flag[bit]"),
		buttons = document.querySelectorAll("button"),
		forEach = Array.prototype.forEach,
		system = null;

function update() {
	var code = system.microcode[system.state];

	forEach.call(fields, function (n) {
		n.setAttribute("value", code[n.getAttribute("name")].toString(16).toUpperCase());
	});

	forEach.call(flags, function (n) {
		var bit = 1 << parseInt(n.getAttribute("bit"), 10),
				set = system.msr & bit;

		n.classList[set ? "add" : "remove"]("checked");
	});

	forEach.call(registers, function (n) {
		n.setAttribute("value", system[n.getAttribute("name").toLowerCase()].toString(16));
	});
}

var actions = {
	'reset': function () {
		system.reset();
		update();
	},
	'step': function () {
		system.step();
		update();
	}
}

forEach.call(buttons, function (b) {
	b.addEventListener("click", actions[b.getAttribute("action")]);
});

module.exports = {
	bind: function (s) { system = s; },
	update: update
}