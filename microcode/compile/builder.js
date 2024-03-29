/**
 ** This generates a fittable state mapping
 ** TODO: Add microcode reordering for speed
 **/

var util = require("./util.js"),
		operation = require('./operation.js'),
		base_id = 0;

function peek_id() {
	return base_id.toString();
}

function next_id() {
	return (base_id++).toString();
}

// Does a reduction step on macros (this is kinda ugly because we don't need speed)
function reduce(macros, statements) {
	if (!statements) { return []; }

	function replace(state, macro, args) {
		if (!state || typeof state !== 'object') {
			return state;
		} else if (Array.isArray(state)) {
			return state.map(function(v) { return replace(v, macro, args); });
		} else if (!state.type || state.type !== 'identifier') {
			var r = {}
			util.each(state, function (v, k) { r[k] = replace(v, macro, args); });
			return r;
		}

		var idx = macro.arguments.indexOf(state.name);

		if (idx < 0) {
			return state;
		}

		if (args[idx].type === "identifier") {
			throw new Error("Cannot reassign to identifier");
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

function microcode(statements, table) {
	if (!statements) { return statements; }

	var last = null;
	return statements.reduce(function (acc,f) {
		switch (f.type) {
		case "microcode":
			var code = operation.encode(f.statement);

			// Check if codes can be combined
			if (operation.safe(last, code)) {
				util.each(code, function (v, k) { last[k] = v; });
			} else {
				return acc.concat({ type: "instruction", code: last = code });
			}
			return acc;			
		default:
			last = null;
			return acc.concat(f);
		}
	}, []);
}

// Build statement chain
function build(macros, statements, table, labels, reassigns, tail) {
	tail || (tail = []);
	labels || (labels = {});
	reassigns || (reassigns = []);

	var entry = peek_id();

	function setStates(next, branch) {
		// Insert NOP when nessessary

		if (branch && tail.length === 0) {
			var state = {};
			table[next_id()] = state;
			tail = [{ key: "next_state", target: state }];
		}

		tail.forEach(function (o) {
			o.target[o.key] = next;
		});
	}

	// microcodes should be packed in the order of:
	// flag -> flag, alu -> access, address_op

	// Replace all the macros in a statement, and combine microcodes in a way that makes them easier to fit
	microcode(reduce(macros,statements)).forEach(function (f) {
		switch (f.type) {
			case 'instruction':
				var stateId = next_id();

				table[stateId] = f.code;
				setStates({ type: 'key', name: stateId });
				tail = [{ key: "next_state", target: f.code }];

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
				labels[f.label] = peek_id();
				break ;
			default:
				throw new Error("Unhandled AST element: " + f.type);
		}
	});

	return { table: table, tail: tail, entry: entry, reassigns: reassigns, labels: labels };
}

function make(macros, statements, table) {
	var state = build(macros, statements, table);

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
			// Recursive check 
			term.true = breakOut(term.true);
			term.false = breakOut(term.false);

		case 'state':
			var stateId = next_id();

			state.table[stateId] = { next_state: term };

			return { type: 'key', name: stateId };

		// Does not need to be broken out
		default:
			return term;
		}
	}

	// Break out the terms chained conditionals (delinquent case)
	util.each(state.table, function (o, k) {
		if (o.next_state.type === "condition") {
			o.next_state.true = breakOut(o.next_state.true);
			o.next_state.false = breakOut(o.next_state.false);
		}
	});

	var remainder = [];
	util.each(state.table, function (o, k) {
		if (o.next_state.type === 'state') { remainder.push(k); }
	});

	return {
		entry: state.entry,
		remainder: remainder
	}
}

module.exports = make;
