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
				inc = 0,
				output;

		function guid() {
			return (inc++).toString(36);
		}

		function encode(microcode) {
			var output = {};

			function assign(key, value) {
				if (typeof value !== "number") {
					throw new Error("Compiler attempted to assign non number");
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
						assign("mdr_source", 1); // MDR Z-bus
						assign("bus_direction", 0);  // Read mode
						break ;
					case 'flags':
						assign("latch_flags", 1); 
						break ;
					case 'tlb':
						assign("tlb_write", { "index": 1, "bank": 2, "flags": 3}[target.register]);
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
				assign("immediate", {
					1: 0,
					2: 1,
					4: 2,
					8: 3,
					16: 4,
					32: 5,
					64: 6,
					128: 7,
					256: 8,
					512: 9,
					1024: 10,
					2048: 11,
					4096: 12,
					8192: 13,
					16384: 14,
					32768: 15
				}[number]);
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
					"+": 1,
					"-": 2,
					"and": 3,
					"or": 4,
					"xor": 5,
					"left": 6,
					"right": 7
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
				assign("invert_r", statement.invert ? 1 : 0);
				assignCarry(statement.carry);
			}

			function assignBus(access) {
				assign("mdr_source", 0);	// Bus
				assign("tlb_disable",  access.address.absolute ? true : false);
				assign("addr_register", access.address.register - 1);
				assign("bus_direction", access.direction === "write" ? 1 : 0);
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

		function build(statements) {
			statements.forEach(function (f) {
				switch (f.type) {
					case 'microcode':
						f = encode(f);
						break ;
					case 'if':
					case 'label':
					case 'goto':
				}

				console.log(JSON.stringify(f, null, 4));
			});

			return null;
		}

		function compile(ast) {
			var opcodes = [];

			ast.forEach(function (op) {
				if (opcodes[op.code]) {
					throw new Error("Opcode " + op.code + " is already defined");
				}

				opcodes[op.code] = build(op.expressions);
			});

			//return "does nothing yet";
		}

		output = compile(ast);

		//grunt.file.write(this.data.outputFile, output);
	});
};
