/**
 ** This is our fitter / conditional mapper
 ** Should be revamped for tail optimzation
 **/

var	make = require("./builder.js"),
		util = require("./util.js"),
		heap = require("./heap.js");

function fit(layout, opcodes) {
	// Compiler constants
	var MICROCODE_ROM 	= 0x2000,
			MICROCODE_WORD = (new layout())._data.byteLength,
			CONDITION_CODES = { "never": 0, "hi": 1, "gt": 2, "ge": 3, "c": 4, "z": 5, "n": 6, "v": 7 };;

	// Allocation and output variables
	var memory = new Uint8Array(MICROCODE_ROM * MICROCODE_WORD)
			allocation = new heap(MICROCODE_ROM);

	// Allocate opcodes from state machine
	util.each(opcodes, function (opcode, i) {
		allocation.clear(parseInt(i));
	});

	// Start assembling them
	util.each(opcodes, function (opcode, i) {
		var i = parseInt(i,10);

		var table = opcode.table,
				placed = {};

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

		mark(i, opcodes[i].entry);
		place(i, opcodes[i].entry);
	});

	console.log("Microcode placed:", (allocation.used / MICROCODE_ROM * 100).toFixed(2) + "%", "used");

	return memory;
}

function compile(layout, read, source, macros, opcodes) {
	var ast = read(source),
			def_op, i;

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

				opcodes[op.code] = make(macros, op.expressions);
				break ;

			case "default":
				def_op = make(macros, op.expressions);
				for (i = op.start; i <= op.end; i++) {
					opcodes[i] || (opcodes[i] = def_op);
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

	// Fit all the opcodes into the state table
	return fit(layout, opcodes);
}

module.exports = {
	compile: compile
};
