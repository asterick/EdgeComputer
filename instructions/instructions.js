var description = {
	RTI: "Return from interrupt",
	RET: "Return from subroutine",
	ENTER: "Enter supervisor routine",
	LEAVE: "Leave supervisor mode",
	TLB: "Load TLB register from memory",
	ADD: "Add values without carry-in",
	SUB: "Subtract values without borrow",
	ADC: "Add values with carry",
	SBC: "Subtract values with borrow",
	INC: "Increment value",
	DEC: "Decrement value",
	ASR: "Arithmatic shift right",
	LSL: "Logical shift left",
	LSR: "Logical shift right",
	XOR: "Exclusive OR values",
	AND: "Bit-wise AND values",
	OR: "Bit-wise OR values",
	NEG: "Two's complement negate value",
	CPL: "Bitwise complement value",
	EXTEND: "Sign extend 8-bit value to 16-bit word",
	MOV: "Load register or memory with value",
	PUSH: "Write value to stack",
	POP: "Load value from stack",
	COPY: "Block copy operation (C = byte count)",
	JMP: "Load PC with effective address",
	CALL: "Push PC to stack, and load PC with effective address",
	LEA: "Load register with effective address",
	MUL: "Multiply 32-bit value with 16-bit value",
	DIV: "Divide two 16-bit values",
};


function sort(a) {
	return a.sort(function (a, b) {
		if (a.length != b.length) {
			return a.length - b.length;
		}

		if (a == b) { return 0 ; }
		return (a > b) ? 1 : -1;
	});
}

function unique(a) {
	return a.filter(function (v, i, a) {
		return a.indexOf(v, i+1) < 0;
	});
}

function hex(a) {
	return ((a < 16) ? "0" : "") + a.toString(16).toUpperCase();
}

function table(columns, write) {
	var rows = sort(unique(Object.keys(columns).reduce(function (acc, v) {
			acc.push.apply(acc, Object.keys(columns[v]));
			return acc;
		}, []))),
		table = [['']],
		widths;

	function set(x, y, v) {
		(table[x] || (table[x] = []))[y] = v;
	}

	set (0, 1, "-----");
	sort(Object.keys(columns)).forEach(function (k, x) {
		var c = columns[k];
		set(x + 1, 0, k);
		set(x + 1, 1, "-----");

		rows.forEach(function (k, y) {
			var r = c[k];
			set(    0, y + 2, k);
			set(x + 1, y + 2, r || "");
		})
	})

	widths = table.map(function (c) {
		return Math.max.apply(null, c.map(function (s) { return s.length; }));
	});

	function pad(v, i) {
		while (v.length < i) { v = " " + v + " "; }
		return v.substr(0, i);
	}


	for (var r = 0; r <= rows.length + 1; r++) {
		var line = [];
		for (var c = 0; c < table.length; c++) {
			line[c] = pad(table[c][r], widths[c])
		}
		write(line.join(" | "));
	}
}

function markdown(instructions, shifts) {
	var output = "";

	function write() {
		output +=
			Array.prototype.slice.call(arguments, 0).join(" ") + "\n";
	}

	function code(s) {
		var c = hex(s & 0xFF),
				b = s & ~0xFF,
				sh = shifts[b];

		if (b == 0x100) {
			return c;
		}

		if (sh.length === 1) {
			return hex(sh[0].code & 0xFF) + " " + c;
		}

		return "ab " + c;
	}

	write("Effective address prefix");
	write("------------------------");
	write("");

	Object.keys(shifts).forEach(function (s) {
		var sh = shifts[s],
				grid;

		sh.forEach(function (s) {
			if (!s.effective_address) { return ; }
			grid || (grid = { Modes: {} });
			grid.Modes[hex(s.code & 0xFF)] = s.effective_address.join("+");
		})

		if (!grid) { return ; }

		table(grid, write);
	});

	write("");

	Object.keys(instructions).forEach(function(k) {
		var inst = instructions[k],
				grid = {};

		write("");

		write(k);
		write("---");
		write(description[k]);

		write("");

		switch (inst[0].terms.length) {
		case 2:
			inst.forEach(function (i) {
				var a = i.terms[0],
						b = i.terms[1];

				(grid[b] || (grid[b] = {}))[a] = code(i.code);
			});
			table(grid, write);
			break ;
		case 1:
			inst.forEach(function (i) {
				var a = i.terms[0];

				grid[a] = code(i.code);
			});
			table({ Code: grid }, write);
			break ;
		case 0:
			write("Opcode:", code(inst[0].code));
			break ;
		}
	});

	return output;
}

function statecode(instruction) {
	Object.keys(instructions).forEach(function(k) {
		var inst = instructions[k],
				grid = {};

		var terms = unique(inst.reduce(function (acc, i) {
			acc.push.apply(acc, i.terms);
			return acc;
		}, []));

		console.log(k+":", terms.join(", "));
	});
}

module.exports = function (grunt) {
	grunt.registerMultiTask('instructions', 'Generates parsers from PEG grammars.', function() {
		var input = JSON.parse(grunt.file.read(this.data.table)),
				instructions = {},
				shifts = {},
				options = [];

		function process(entry, table) {
			table.forEach(function (code, index) {
				if (code.shift_table) {
					var insert = shifts[code.shift_table] || (shifts[code.shift_table] = []);

					insert.push({
						code: entry + index,
						effective_address: code.effective_address || null
					});
				}

				if (code.instruction) {
					var insert = instructions[code.instruction] || (instructions[code.instruction] = []);

					insert.push({
						code: entry + index,
						terms: code.terms
					});

					options.push.apply(options, code.terms)
				}
			});
		}

		Object.keys(input).sort().forEach(function (v) {
			process(parseInt(v), input[v]);
		});

		if (this.data.documentation) {
			grunt.file.write(this.data.documentation + ".md", markdown(instructions, shifts))
		}
	});
};
