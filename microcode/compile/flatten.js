var conditionCodes = { "never": 0, "hi": 1, "gt": 2, "ge": 3, "c": 4, "z": 5, "n": 6, "v": 7 };

var	operation = require('./operation.js'),
		util = require("./util.js");

// Global constants (sad face)
var MICROCODE_ROM 	= 0x2000,
		macros = {},
		base_id = 0;

// Build statement chain
function build(statements, table, labels, reassigns, tail) {
	table || (table = {});
	tail || (tail = []);
	labels || (labels = {});
	reassigns || (reassigns = []);

	var entry = base_id;

	function setStates(next, branch) {
		// Insert NOP when nessessary

		if (branch && tail.length === 0) {
			var state = operation.nop();
			table[base_id++] = state;
			tail = [{ key: "next_state", target: state }];
		}

		tail.forEach(function (o) {
			o.target[o.key] = next;
		});
	}

	(statements || []).forEach(function (f) {
		switch (f.type) {
			case 'microcode':
				var stateId = base_id++,
						state = operation.encode(f);

				table[stateId] = state;
				setStates({ type: 'key', name: stateId });
				tail = [{ key: "next_state", target: state }];

				break ;
			case 'if':
				var branch = { type: 'condition', condition: f.condition, immediate: f.immediate },
						onTrue, onFalse;

				if (f.invert) {
					onFalse = build(f.statements, table, labels, reassigns, [{ key: 'false', target: branch }]);
					onTrue  = build( f.otherwise, table, labels, reassigns, [{ key:  'true', target: branch }]);
				} else {
					onFalse = build( f.otherwise, table, labels, reassigns, [{ key: 'false', target: branch }]);
					onTrue  = build(f.statements, table, labels, reassigns, [{ key:  'true', target: branch }]);
				}

				setStates(branch, true);
				tail = onFalse.tail.concat(onTrue.tail);

				break ;
			case 'include':
				if (macros[f.name] === undefined) {
					throw new Error("Macro " + f.name + " is undefined.");
				}
				
				tail = build(macros[f.name], table, labels, reassigns, tail).tail;

				break ;
			case 'goto':
				var next = { type: 'key', name: f.label };

				reassigns.push(next);

				setStates(next, true);
				tail = [];
				break ;
			case 'label':
				labels[f.label] = base_id;
				break ;
			default:
				throw new Error("Unhandled AST element: " + f.type);
		}
	});

	return { table: table, tail: tail, entry: entry, reassigns: reassigns, labels: labels };
}

function make(statements) {
	var state = build(statements);

	// Remap labels to their next state address
	state.reassigns.forEach(function (r) {
		if (state.labels[r.name] === undefined) {
			throw new Error("Cannot reassign label " + r.name);
		}

		r.name = state.labels[r.name];
	});

	// All tails jump to state 0 (next operation)
	state.tail.forEach(function (t) {
		t.target[t.key] = { type: 'state', index: 0 };
	})

	return {
		table: state.table, 
		entry: state.entry
	}
}

// NOTE: THIS IS A NAIVE PLACER, WILL NOT ATTEMPT TO DO TAIL OVERLAP OPTIMIZATION
function fit(layout, opcodes) {
	var MICROCODE_WORD = (new layout())._data.byteLength,
			memory = new Uint8Array(MICROCODE_ROM * MICROCODE_WORD),
			available = { 0: MICROCODE_ROM };

	function clear(address, count) {
		var deleted = false;

		count || (count = 1);

		util.each(available, function (size, start) {
			start = parseInt(start, 10);
			
			if (address < start || (address + count) > (start + size)) {
				return ;
			}

			// Clear from previous part of heap
			delete available[start];
			deleted = true;

			var a_start = start, 
					a_count = address - start,
					b_start = address + count, 
					b_count = size - (address - start + count);

			// Insert new bits into the heap
			if (a_count) { available[a_start] = a_count; }
			if (b_count) { available[b_start] = b_count; }
		});

		if (!deleted) { throw new Error("Could not allocate " + count + " instruction words"); }
	}

	function allocate(count) {
		var address;

		util.each(available, function (size, start) {
			if (address !== undefined) { return ;}

			start = parseInt(start, 10);

			var delta = start % count,
					offset = delta ? (count - delta) : 0;

			if (size - offset >= count) {
				clear(start + offset, count);
				address = start;
			}
		});
	}

	// Allocate opcodes from state machine
	util.each(opcodes, function (opcode, i) { clear(parseInt(i)); });

	// Start assembling them
	util.each(opcodes, function (opcode, i) {
		var i = parseInt(i,10);

		var table = opcode.table,
				placed = {};

		function breakOut(state) {
			switch (state.type) {

			// Force NOP in the case where a condition goes anywhere other than a key
			case 'condition':
			case 'state':
				var stateId = base_id++,
						nop = operation.nop();

				nop.next_state = state;
				table[stateId] = nop;

				return { type: 'key', name: stateId };

			// This is what we expect
			case 'key':
				return state;

			default:
				throw new Error("Cannot handle " + state.type);
			}
		}

		function getSingle(key) {
			var id;

			if (placed[key]) {
				id = placed[key][0];
			} else {
				id = allocate(1);
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

			var addr = allocate(2);

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
				next.true = breakOut(next.true);
				next.false = breakOut(next.false);

				code.next_state = 
					getDouble(next.true, next.false);

				code.condition_code = conditionCodes[next.condition];
				code.cond_src = next.immediate ? 1 : 0;

				break ; 
			default:
				throw new Error("Cannot handle next state type " + next.type);
			}
		}

		mark(i, opcodes[i].entry);
		place(i, opcodes[i].entry);
	});

	var used = MICROCODE_ROM;
	util.each(available, function (size) { used -= size; });

	console.log("Microcode placed:", (used / MICROCODE_ROM * 100).toFixed(2) + "%", "used");

	return memory;
}

function compile(layout, ast) {
	var opcodes = [],
			def_op, i;

	ast.forEach(function (op) {
		switch (op.type) {
		case "opcode":
			if (opcodes[op.code]) {
				throw new Error("Opcode " + op.code + " is already defined");
			}

			opcodes[op.code] = make(op.expressions);
			break ;
		case "default":
			def_op = make(op.expressions);
			for (i = op.start; i <= op.end; i++) {
				opcodes[i] || (opcodes[i] = def_op);
			}
			break ;
		case "macro":
			macros[op.name] = op.statements;
			break ;
		default:
			throw new Error("Cannot handle " + op.type);
		}
	});

	// Fit all the opcodes into the state table
	return fit(layout, opcodes);
}

module.exports = {
	build: build,
	compile: compile
};
