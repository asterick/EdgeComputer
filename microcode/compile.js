'use strict';

var PEG = require('pegjs'),
		operation = require('./compile/operation.js'),
		encode = operation.encode;

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks


	grunt.registerMultiTask('microcode', 'Generates parsers from PEG grammars.', function() {
		grunt.log.write('Compiling microcode', this.data.source, "\n");

		var source = grunt.file.read(this.data.source),
				structs = PEG.buildParser(grunt.file.read(this.data.structjs), this.data),
				parser = PEG.buildParser(grunt.file.read(this.data.grammar), this.data),
				layout = structs.parse(grunt.file.read(this.data.layout)),
				ast = parser.parse(source),
				macros = {},
				inc = 0,
				output;

		// My crappy GUID system
		var base_id = 0;

		// Build statement chain
		function build(statements, table, labels, reassigns, tail) {
			table || (table = {});
			tail || (tail = []);
			labels || (labels = {});
			reassigns || (reassigns = []);

			var entry = base_id;

			function setStates(next, branch) {
				if (branch && tail.length === 0) {
					throw new Error("Leading with a conditional or goto statement is unsupported");
				}

				tail.forEach(function (o) {
					o.target[o.key] = next;
				});
			}

			(statements || []).forEach(function (f) {
				switch (f.type) {
					case 'microcode':
						var stateId = base_id++,
								state = encode(f);

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
						var next = { type: 'key', target: f.label };

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

			// Remap labels to state addresses
			for (var i = reassigns.length - 1; i >= 0; i--) {
				var target = reassigns[i].target,
						value = labels[target];

				if (value === undefined) { continue ; }
				reassigns[i].target = value;
				reassigns.splice(i, 1);
			}

			return { table: table, tail: tail, entry: entry };
		}

		function fit(opcodes) {

		}

		function compile(ast) {
			var opcodes = [];

			ast.forEach(function (op) {
				switch (op.type) {
				case "opcode":
					if (opcodes[op.code]) {
						throw new Error("Opcode " + op.code + " is already defined");
					}

					opcodes[op.code] = build(op.expressions);
					break ;
				case "macro":
					macros[op.name] = op.statements;
					break ;
				default:
					throw new Error("Cannot handle " + op.type);

				}
			});


			var fitted = fit(opcodes);

			// TODO: COMPILE, RETURN BINARY
			//return "does nothing yet";
		}

		//output = compile(ast);

		//grunt.file.write(this.data.outputFile, output);
	});
};
