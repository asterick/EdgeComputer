document.body.innerHTML = require("./templates/main.html")();

var fields = document.querySelectorAll(".field[name]"),
		registers = document.querySelectorAll(".register[name]"),
		flags = document.querySelectorAll(".flag[bit]"),
		buttons = document.querySelectorAll("button"),
		disasm = document.querySelector(".code"),
		forEach = Array.prototype.forEach,
		system = null;

function disassemble(code) {
	"latch_addr", "latch_flags", "alu_op", "alu_carry", "addr_register", "bus_direction", "bus_byte", "mdr_source", "tlb_disable", "l_bus", "r_bus", "immediate"

	var out = code.privileged ? "privileged, " : "",
			condition = ["n", "a", "ge", "gt", "c", "z", "v", "n"],
			zlatch = [],
			memory = null.
			state = "state(" + (code.next_state << 1).toString(16) + ", " + (code.flags_source ? "@" : "") + condition[code.condition_code] +")";

	if (latch_addr) { zlatch.push("a" + z_addr); }
	if (code.z_reg) { zlatch.push([null, "msr", "r0", "r1", "r2", "r3", "r4", "r5"][code.z_reg]); }
	if (code.tlb_write) { zlatch.push([null, "index", "flags", "bank"][code.tlb_write]); }

	if (code.mdr_source) {
		var mdr = code.bus_byte ? "mdr.h" : "mdr.l"
		if (code.bus_direction) { // <- memory

		} else { // -> memory

		}
	} else  if (code.bus_direction) {
		zlatch.push("mdr");
	}

	return out + state;
}

function update() {
	var code = system.microcode[system.state];

	disasm.innerHTML = disassemble(code);

	forEach.call(fields, function (n) {
		n.setAttribute("value", code[n.getAttribute("name")].toString(16).toUpperCase());
	});

	forEach.call(registers, function (n) {
		n.setAttribute("value", system[n.getAttribute("name").toLowerCase()].toString(16).toUpperCase());
	});

	forEach.call(flags, function (n) {
		var bit = 1 << parseInt(n.getAttribute("bit"), 10),
				set = system.msr & bit;

		n.classList[set ? "add" : "remove"]("checked");
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