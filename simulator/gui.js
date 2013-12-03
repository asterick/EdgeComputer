document.body.innerHTML = require("./templates/main.html")();

var fields = document.querySelectorAll(".field[name]"),
		registers = document.querySelectorAll(".register[name]"),
		flags = document.querySelectorAll(".flag[bit]"),
		buttons = document.querySelectorAll("button"),
		disasm = document.querySelector(".code"),
		forEach = Array.prototype.forEach,
		system = null;

// Holy hell this is ugly
function disassemble(code) {
	var privileged = code.privileged ? "privileged, " : "",
			condition = ["n", "a", "ge", "gt", "c", "z", "v", "n"],
			zlatch = [],
			memory = "",
			alu = "",
			state = "state(" + (code.next_state << 1).toString(16) + ", " + (code.flags_source ? "@" : "") + condition[code.condition_code] +")";

	if (code.latch_addr) { zlatch.push(["A0.L", "A0.H", "A1.L", "A1.H", "A2.L", "A2.H", "A3.L", "A3.H"][code.z_addr]); }
	if (code.z_reg) { zlatch.push([null, "MSR", "R0", "R1", "R2", "R3", "R4", "R5"][code.z_reg]); }
	if (code.tlb_write) { zlatch.push([null, "TLB_INDEX", "TLB_FLAGS", "TLB_BANK"][code.tlb_write]); }

	if (code.mdr_source) {
		var mdr = code.bus_byte ? "MSR.H" : "MDR.L",
				addr = "[" + (code.tlb_disable ? "#" : "") + "A" + code.addr_register + "]";
		
		if (code.bus_direction) { // <- memory
			memory = mdr + " = " + addr + ", ";
		} else { // -> memory
			memory = addr + " = " + mdr + ", ";
		}
	} else  if (code.bus_direction) {
		zlatch.push("MDR");
	}

	if (zlatch.length) {
		var op = [" + ", " & ", " | ", " ^ ", " - ", " & ~", " | ~", " << 1"][code.alu_op],
				l = ["MSR", "MDR", "R0", "R1", "R2", "R3", "R4", "R5", "A0.L", "A0.H", "A1.L", "A1.H", "A2.L", "A2.H", "A3.L", "A3.H"][code.l_bus],
				r = (code.alu_op !== 7) ? [null, "MSR", "FAULT_CODE", "IRQ_VECTOR"][code.r_bus] || [0, 15, 255, 4095, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048][code.immediate].toString(16) : "";
				c = (code.alu_carry ? [" + 0", " + 1", " + c", " + top"][code.alu_carry]: "")

		alu = zlatch.join(", ") + " = " + l + op + r + c + ", ";
	}

	return privileged + alu + memory + state;
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