var util = require("./util.js"),
		operation = require('./operation.js'),
		base_id = 0;

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

				tail = state.next_state ? [] : [{ key: "next_state", target: state }];

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
			case 'include':
				if (macros[f.name] === undefined) {
					throw new Error("Macro " + f.name + " is undefined.");
				}
				
				tail = build(macros, macros[f.name], table, labels, reassigns, tail).tail;

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
					nop = operation.nop();

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
