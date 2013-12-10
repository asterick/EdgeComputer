/**
 ** This generates a fittable state mapping
 **/

var util = require("./util.js"),
		operation = require('./operation.js'),
		base_id = 0;

// Does a reduction step on macros (this is kinda ugly because we don't need speed)
function reduce(macros, statements) {
	if (!statements) { return statements; }

	function replace(state, macro, args) {
		if (!state || typeof state !== 'object') {
			return state;
		} else if (Array.isArray(state)) {
			return state.map(replace);
		} else if (!state.type || state.type !== 'identifier') {
			var r = {}
			util.each(state, function (v, k) { r[k] = replace(v, macro, args); });
			return r;
		}

		var idx = macro.arguments.indexOf(state.name);

		if (idx < 0) {
			throw new Error("Identifier " + state.name + " was not defined in the macro");
		}

		return args[idx];
	}

	// Locate all include statements, and replace them inline
	return statements.reduce(function (acc, f) {
		switch (f.type) {
		case 'include':
			var macro = macros[f.name];

			if (!macro) {
				throw new Error("Macro " + f.name + " is undefined.");
			} else if (macro.arguments.length !== f.arguments.length) {
				throw new Error("Argument mismatch for macro " + macro.name);
			}

			return acc.concat(reduce(macros, replace(macro.statements, macro, f.arguments)));
		default:
			return acc.concat(f);
		}
	}, []);
}

// Build statement chain
function build(macros, statements, table, labels, reassigns, tail) {
	table || (table = {});
	tail || (tail = []);
	labels || (labels = {});
	reassigns || (reassigns = []);

	var entry = base_id;

	function setStates(next, branch) {
		// Insert NOP when nessessary

		if (branch && tail.length === 0) {
			var state = {};
			table[base_id++] = state;
			tail = [{ key: "next_state", target: state }];
		}

		tail.forEach(function (o) {
			o.target[o.key] = next;
		});
	}

	// microcodes should be packed in the order of:
	// flag -> flag, alu -> access, address_op

	statements = reduce(macros,statements);

	// TODO: FLATTEN ALL THE MICROCODE CHUNKS INTO SINGLE INSTRUCTIONS

	console.log (statements);
	(statements || []).forEach(function (f) {
		switch (f.type) {
			case 'microcode':
				var stateId = base_id++,
						state = {};

				operation.encode(state, f.statement);

				table[stateId] = state;
				setStates({ type: 'key', name: stateId });
				tail = [{ key: "next_state", target: state }];

				break ;
			case 'if':
				var branch = { type: 'condition', condition: f.condition, immediate: f.immediate },
						onTrue, onFalse;

				if (f.invert) {
					onFalse = build(macros, f.statements, table, labels, reassigns, [{ key: 'false', target: branch }]);
					onTrue  = build(macros,  f.otherwise, table, labels, reassigns, [{ key:  'true', target: branch }]);
				} else {
					onFalse = build(macros,  f.otherwise, table, labels, reassigns, [{ key: 'false', target: branch }]);
					onTrue  = build(macros, f.statements, table, labels, reassigns, [{ key:  'true', target: branch }]);
				}

				setStates(branch, true);
				tail = onFalse.tail.concat(onTrue.tail);

				break ;
			case 'goto':
				var next;

				switch (f.target.type) {
				case "identifier":
					next = { type: 'key', name: f.target.name };
					reassigns.push(next);
					break ;
				case "immediate":
					next = { type: 'state', name: f.target.value };
					break ;
				case "register":
					next = { type: 'state', index: 0, register: f.target.index };
					break ;
				}

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

function make(macros, statements) {
	var state = build(macros, statements);

	// Remap labels to their next state address
	state.reassigns.forEach(function (r) {
		if (state.labels[r.name] === undefined) {
			throw new Error("Cannot reassign label " + r.name);
		}

		r.name = state.labels[r.name];
	});

	// If there are any tail's, throw an exception
	if (state.tail.length > 0) {
		throw new Error("Operation has a dangling tail");
	}


	function breakOut(term) {
		switch (term.type) {

		// Force NOP in the case where a condition goes anywhere other than a key
		case 'condition':
		case 'state':
			var stateId = base_id++,
					nop = {};

			nop.next_state = term;
			state.table[stateId] = nop;

			return { type: 'key', name: stateId };

		// Does not need to be broken out
		default:
			return term;
		}
	}

	// Break out the terms chained conditionals (delinquent case)
	util.each(state.table, function (o, k) {
		if (o.next_state.type !== "condition") { return ;}
		o.next_state.true = breakOut(o.next_state.true);
		o.next_state.false = breakOut(o.next_state.false);
	});

	return {
		table: state.table, 
		entry: state.entry
	}
}

module.exports = make;
