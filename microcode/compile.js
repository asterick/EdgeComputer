'use strict';

var PEG = require('pegjs');

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

		function encode(microcode) {
			var output = {};

			function assign(key, value) {
				if (typeof value !== "number") {
					throw new Error("Compiler attempted to assign non number to " + key);
				}
				if (output[key] !== undefined) {
					throw new Error(key + " is already defined");
				}
				output[key] = value;
			}

			function assignTarget(target) {
				switch (target.type) {
					case 'address':
						assign("latch_addr", 1); 
						assign("z_addr", target.register - 1 + (target.word === 'high' ? 4 : 0));
						break ;
					case 'register':
						assign("z_reg", 1 + target.register);
						break ;
					case 'status':
						assign("z_reg", 1);	// MSR
						break ;
					case 'data':
						assign("mdr_source", 0); // MDR Z-bus
						assign("bus_direction", 1);  // Read mode
						break ;
					case 'flags':
						assign("latch_flags", 1); 
						break ;
					case 'tlb':
						assign("tlb_write", { "index": 1, "bank": 2, "flags": 3 }[target.register]);
						break ;
				}
			}

			function assignLBus(target) {
				switch (target.type) {
				case 'data':
					assign("l_bus", 0);
					break ;
				case 'status':
					assign("l_bus", 1);
					break ;
				case 'register':
					assign("l_bus", 2 + target.register - 1);
					break ;
				case 'address':
					assign("l_bus", 8 + target.register - 1 + (target.word === 'high' ? 4 : 0));
					break ;
				}
			}

			function assignImmediate(number) {
				var floor = {
					0x0000: 0,
					0x0001: 1,
					0x0002: 2,
					0x0004: 3,
					0x0008: 4,
					0x0010: 5,
					0x0100: 6,
					0x0200: 7,
					0xFFFF: 8,
					0xFFFE: 9,
					0xFFFD: 10,
					0xFFFB: 11,
					0xFFF7: 12,
					0xFFEF: 13,
					0xFEFF: 14,
					0xFDFF: 15,
				}[number];

				if (floor === undefined) {
					throw new Error("Cannot encode constant " + number);
				}

				assign("immediate", floor);
			}

			function assignRBus(statement) {
				if (typeof statement === "number") {
					assign("r_bus", 1); // Immediate mode
					assignImmediate(statement);
					return ;
				}

				switch (statement.type) {
					case 'data':
						assign("r_bus", 0);
						break ;
					case 'fault':
						assign("r_bus", 2);
						break ;
					case 'irq':
						assign("r_bus", 3);
						break ;
				}
			}

			function assignCarry(statement) {
				if (!statement) { return ; }

				var v;
				switch (statement.type) {
					case "fixed":
						v = statement.value;
						break ;
					case "carry":
						v = 2;
						break ;
					case "top":
						v = 3;
						break ;
				}
				assign("alu_carry", v);
			}

			function assignOperator(operator) {
				assign("alu_op", {
					"+": 0,
					"-": 1,
					"and": 2,
					"or": 3,
					"xor": 4,
					"left": 5,
					"right": 6,
					"swap": 7
				}[operator]);
			}

			function assignUnary(statement) {
				assignOperator(statement.operator);
				assignLBus(statement.term);
				assignCarry(statement.carry);
			}

			function assignBinary(statement) {
				assignOperator(statement.operator);
				assignLBus(statement.left);
				assignRBus(statement.right);
				assignCarry(statement.carry);
			}

			function assignBus(access) {
				assign("mdr_source", 1);	// Bus
				assign("tlb_disable",  access.address.absolute ? 1 : 0);
				assign("addr_register", access.address.register - 1);
				assign("bus_direction", access.direction === "read" ? 1 : 0);
				assign("bus_byte", access.target.byte === "high" ? 1 : 0);
			}

			microcode.statements.forEach(function (s) {
				switch (s.type){
					// Instruction flags
					case 'flag':
						assign(s.name, 1);
						break ;
					case 'databus':
						assignBus(s);
						break ;

					case 'assign':
						s.targets.forEach(assignTarget);
						switch (s.expression.type) {
							case 'register':
							case 'address':
							case 'status':
							case 'data':
								assignLBus(s.expression);
								break ;
							case 'unary':
								assignUnary(s.expression);
								break ;
							case 'binary':
								assignBinary(s.expression);
								break ;
							default:
								throw new Error("Cannot assign alu " + JSON.stringify(s.expression, null, 4));
						}
						break ;
					default:
						throw new Error("Unhandled microcode statement: " + s.type);
						break ;
				}
			});

			return output;
		}

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

		output = compile(ast);

		//grunt.file.write(this.data.outputFile, output);
	});
};
