/**
 ** This is our fitter / conditional mapper
 **/

var	make = require("./builder.js"),
		util = require("./util.js"),
		heap = require("./heap.js");

var MICROCODE_ROM 	= 0x2000,
		CONDITION_CODES = { "never": 0, "hi": 1, "gt": 2, "ge": 3, "c": 4, "z": 5, "n": 6, "v": 7 };;

function fit(layout, table, opcodes) {
	// Compiler constants
	var MICROCODE_WORD = (new layout())._data.byteLength;

	// Allocation and output variables
	var memory = new Uint8Array(MICROCODE_ROM * MICROCODE_WORD)
			allocation = new heap(MICROCODE_ROM);

	// Allocate opcodes from state machine
	Object.keys(opcodes).forEach(function (i) {
		allocation.clear(parseInt(i));
	});

	// Start assembling them
	util.each(opcodes, function (opcode, i) {
		var i = parseInt(i,10);

		var placed = {};

		function getSingle(key) {
			var id;

			if (placed[key]) {
				id = placed[key][0];
			} else {
				id = allocation.allocate(1);
				mark(id, key);
				place(id, key);
			}

			return id;
		}

		function getDouble(whenTrue, whenFalse) {
			var t = placed[whenTrue.name],
					f = placed[whenFalse.name];

			for (var x = 0; t && x < t.length; x++) {
				for (var y = 0; f && y < f.length; y++) {
					var a = t[x],
							b = f[y];

					// States are equal, except for the lower bit
					if (a ^ b === 1) {
						return a;
					}
				}
			}

			var addr = allocation.allocate(2);

			mark(addr, whenFalse.name);
			mark(addr+1, whenTrue.name);

			place(addr, whenFalse.name);
			place(addr+1, whenTrue.name);

			return addr;
		}

		function mark(address, key) {
			// Mark address as placed
			(placed[key] || (placed[key] = [])).push(address);
		}

		function place(address, key) {
			var micro = table[key],
					code = new layout(memory.buffer, MICROCODE_WORD * address),
					next = micro.next_state;

			Object.keys(micro).forEach(function (k) {
				if (k === 'next_state') { return ; }

				if (typeof code[k] !== 'number') {
					throw new Error("Microcode assembler produced unknown field: " + k);
				}
				
				code[k] = micro[k];
			});

			switch (next.type) {
			// This is a raw state, so we simply take it as gospel
			case 'state':
				if (next.register !== undefined) {
					if (micro.r_select !== undefined &&
							micro.r_select !== next.register) {
						throw new Error("Attempting to overload the r_select field");
					}

					code.r_select = next.register;
				}
				code.next_state = next.index;
				break ;
			// Simple branch, check if already placed, if not insert
			case 'key':
				var target = getSingle(next.name);

				code.next_state = target;
				break ;
			case 'condition':
				code.next_state = 
					getDouble(next.true, next.false);

				code.condition_code = CONDITION_CODES[next.condition];
				code.cond_src = next.immediate ? 1 : 0;

				break ; 
			default:
				throw new Error("Cannot handle next state type " + next.type);
			}
		}

		mark(i, opcodes[i]);
		place(i, opcodes[i]);
	});

	console.log("Microcode placed:", (allocation.used / MICROCODE_ROM * 100).toFixed(2) + "%", "used");

	return memory;
}

// Create a key for comparing objects (json)
function describe(o) {
	if (typeof o === "string") {
		return JSON.stringify(o);
	} else if (typeof o === "object") {
		if (Array.isArray(o)) {
			return "[" + o.map(describe).join(",") + "]";
		} else {
			return "{" + Object.keys(o).filter(function (k) { return k[0] !== '$' }).sort().map(function (k) {
				return describe(k)+":"+describe(o[k]);
			}).join(",") + "}";
		}
	} else if (typeof o === "boolean") {
		return o ? "true" : "false";
	}	else if (typeof o === "number") {
		return o.toString();
	} else {
		return (o === undefined) ? "undefined" : "null";
	}
}

function combine(table, remainders, opcodes) {
	while (remainders.length) {
		// Remove first remainder from the list
		var first = remainders.shift();

		// validate that this has already been optimized out
		if (!table[first]) { continue ; }

		// Locate states that are similar
		var name = table[first].$$hash || (table[first].$$hash = describe(table[first])),
				similar = [];

		// Locate all states that have an identical structure
		util.each(table, function (code, second, table) {
			if (first === second) { return ; }
			
			var other_name = code.$$hash || (code.$$hash = describe(code));

			if (other_name === name) {
				similar.push(second);
			}
		});

		// This is a unique state (thus it no longer needs optimization)
		if (similar.length === 0) { continue ; }

		util.each(table, function (code, key) {
			function replace(next) {
				switch (next.type) {
				case 'condition':
					replace(next.true);
					replace(next.false);
					return ;
				case 'key':
					if (similar.indexOf(next.name) >= 0) {
						next.name = first;			// Replace with first found

						remainders.push(key);
						delete code.$$hash;
					} else if (name === first) {
						remainders.push(key);
						delete code.$$hash;
					}
				}
			}

			replace(code.next_state);
		});

		// Remove dangling states
		similar.forEach(function (key) {
			util.each(opcodes, function (v, i) {
				if (v === key) { opcodes[i] = first; }
			});
			delete table[key];
		});
	}

	// Delete hashes
	util.each(table, function (v) { delete v.$$hash; });
}

function reduce(table) {
	util.each(table, function (op) {
		// Filter out simple branch to a no-op
		while (op.next_state.type === 'key') {
			var next = table[op.next_state.name],
					keys = Object.keys(next);

			if (keys.length !== 1 || keys[0] !== 'next_state') { break ; }

			op.next_state = next.next_state;
			break ;
		}
	});
}

function compile(layout, read, source, macros, opcodes) {
	var ast = read(source),
			table = {},
			remainders = [],
			op_state, i;

	opcodes || (opcodes = {});
	macros || (macros = {});

	function process(ast) {
		ast.forEach(function (op) {
			switch (op.type) {
			case "import":
				process(read(op.file));
				break ;

			case "opcode":
				if (opcodes[op.code]) {
					throw new Error("State 0x" + op.code.toString(16) + " is already defined");
				}

				op_state = make(macros, op.expressions, table);
				remainders.push.apply(remainders,op_state.remainder);

				opcodes[op.code] = op_state.entry;
				break ;

			case "default":
				// Attach to global state table
				op_state = make(macros, op.expressions, table);
				remainders.push.apply(remainders,op_state.remainder);

				for (i = op.start; i <= op.end; i++) {
					opcodes[i] || (opcodes[i] = op_state.entry);
				}
				break ;

			case "macro":
				macros[op.name] = op;			
				break ;
			default:
				throw new Error("Cannot handle " + op.type);
			}
		});
	}

	process(ast);

	// Do tail optimization
	combine(table, remainders, opcodes);
	reduce(table);

	// Fit all the opcodes into the state table
	return fit(layout, table, opcodes);
}

module.exports = {
	compile: compile
};
