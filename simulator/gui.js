document.body.innerHTML = require("./templates/main.html")({ 
	microcode_fields: require("./machine/microcode.js").fields
});

var fields = document.querySelectorAll(".field[name]"),
		registers = document.querySelectorAll(".register[name]"),
		flags = document.querySelectorAll(".flag[bit]"),
		buttons = document.querySelectorAll("button"),
		disasm = document.querySelector(".code"),
		forEach = Array.prototype.forEach,
		system = null;


function immediate(code) {
	var value = 1 << code.imm_bit

	if (!code.imm_offset) value -= 1;
	if (code.imm_invert) value ^= 0xFFFF;
	
	var val = value.toString(16);
	return "0x" + "0000".substr(val.length) + val;
}

function disassemble(code) {
	var parts = [];

	// Flags portion
	if (code.privileged) { parts.push("privileged"); }

	// Memory access
	if (code.mem_active) {
		var addr = (code.disable_tlb ? "#" : "") + "[" + "a" + code.mem_addr.toString() + ["","++","","--"][code.mem_addr_op] + "]",
				targ = "r" + code.r_select.toString() + (code.mem_byte ? ".h" : ".l");

		parts.push(code.mem_dir ? (addr + " = " + targ) : (targ + " = " + addr));
	}

	// Latches
	if (code.latch_aflags || code.latch_zflags || code.latch_tlb || code.latch_zreg) {
		var targets = [],
				l_bus, r_bus, action;

		if (code.latch_aflags) { targets.push("flags"); }
		if (code.latch_zflags) { targets.push("msr"); }
		if (code.latch_tlb) { targets.push(["", "tlb.index", "tlb.bank", "tlb.flags"][code.latch_tlb]); }
		if (code.latch_zreg) { targets.push("r" + code.z_reg); }

		switch (code.l_term) {
		case 0: // imm
			l_bus = immediate(code);
			break ;
		case 1: // reg
			l_bus = "r" + code.l_select;
			break ;
		case 2: // addr.l
			l_bus = "a" + code.l_select + ".l";
			break ;
		case 3: // addr.h
			l_bus = "a" + code.l_select + ".h";
			break ;
		}

		switch (code.r_term) {
		case 0: // imm
			r_bus = immediate(code);
			break ;
		case 1: // reg
			r_bus = "r" + code.r_select;
			break ;
		case 2: // addr.l
			r_bus = "msr";
			break ;
		case 3: // addr.h
			r_bus = "fault_code";
			break ;
		}

		switch (code.alu_op) {
		case 0: // or
			action = l_bus + " | " + r_bus;
			break ;
		case 1: // and
			action = l_bus + " & " + r_bus;
			break ;
		case 2: // xor
			action = l_bus + " ^ " + r_bus;
			break ;
		case 3: // asl
			action = ">>> " + l_bus;
			break ;
		case 4: // lsl
			action = ">> " + l_bus;
			break ;
		case 5: // sr
			action = "<< " + l_bus;
			break ;
		case 6: // add
			action = l_bus + " + " + r_bus;
			break ;
		case 7: // sub
			action = l_bus + " - " + r_bus;
			break ;
		}

		parts.push(targets.join(",") + " = " + action + (code.carry ? " + c" : ""));
	}

	if (code.condition) {
		var conditions = 
			["never", "hi", "ge", "gt", "c", "z", "v", "n"];

		parts.push("state(" + code.next_state + "," + (code.cond_src ? "@" : "") + conditions[code.condition] + ")")
	} else if (code.next_state) {
		parts.push("state(" + code.next_state + ")")
	} else {
		parts.push("state(r" + code.r_select + ")")
	}

	// THIS NEEDS TO BE UPDATED TO V2
	return parts.join(", ");
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
	bind: function (sys) {
		system = sys;
	},
	canvas: document.querySelector(".screen canvas"),
	update: update
};
