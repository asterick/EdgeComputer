/*
 * TODO: COMPLETE FOR V2 (alu, memory)
 */

var TRUE = 1,
		FALSE = 0;

var BYTE_LOW = 0,
		BYTE_HIGH = 1;

var MEMORY_READ = 0,
		MEMORY_WRITE = 1,
		MEMORY_OPS = { 'none': 0, 'increment': 1, 'decrement': 3 };

function immediate(v) {
	var invert = v ^ 0xFFFF;
			inverted = invert < v,
			comp = inverted ? invert : v,
			offset = true;

	for (var i = 0; i < 15; i++) {
		var off = (1 << i) - 1,
				on = (1 << i);

		if (on === comp) {
			return { bit: i, inverted: inverted, offset: true };
		} else if(off == comp) {
			return { bit: i, inverted: inverted, offset: false };
		}
	}

	throw new Error("Cannot encode " + v + " as immediate");
}

function encode(microcode) {
	var output = {};

	function assign(key, value) {
		if (typeof value !== "number") {
			throw new Error("Compiler attempted to assign non number to " + key);
		}
		if (output[key] !== undefined && output[key] !== value) {
			throw new Error(key + " is already defined");
		}
		output[key] = value;
	}

	function assignMemory(code) {
		assign("mem_active", TRUE);
		assign("mem_byte", code.register.byte === "high" ? BYTE_HIGH : BYTE_LOW);
		assign("mem_dir", code.direction === "read" ? MEMORY_READ : MEMORY_WRITE);
		assign("mem_addr", code.memory.address);
		assign("r_select", code.register.register.index);
		assign("mem_addr_op", MEMORY_OPS[code.memory.operation]);
		assign("disable_tlb", code.memory.physical ? TRUE : FALSE);
	}

	function assignNext(code) {
		assign("r_select", code.register.index);
		output.next_state = { type: 'state', index: 0 };
	}

	microcode.statements.forEach(function (s) {
		switch (s.type) {
			case 'flag':
				output[s.name] = TRUE;
				break;
			case 'access':
				assignMemory(s);
				break ;
			case 'next':
				assignNext(s);
				break ;
			default:
				console.error("UNHANDLED: ", s);
				break ;
		}
	});

	return output;
}

module.exports = {
	encode: encode,
	nop: function () { return encode({ type: "microcode", statements:[] }) }
};
