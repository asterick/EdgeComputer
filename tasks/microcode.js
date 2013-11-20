'use strict';

var PEG = require('pegjs');

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks


	grunt.registerMultiTask('microcode', 'Generates parsers from PEG grammars.', function() {
		grunt.log.write('Compiling microcode ' + this.data.source);

		var source = grunt.file.read(this.data.source),
				structs = PEG.buildParser(grunt.file.read(this.data.structjs), this.data),
				parser = PEG.buildParser(grunt.file.read(this.data.grammar), this.data),
				layout = structs.parse(grunt.file.read(this.data.layout)),
				ast = parser.parse(source),
				output;


		function build(statements) {
			console.log(JSON.stringify(statements, null, 4));
		}

		function compile(ast) {
			var opcodes = [];

			ast.forEach(function (op) {
				if (opcodes[op.code]) {
					throw new Error("Opcode " + op.code + " is already defined");
				}

				opcodes[op.code] = build(op.expressions);
			});

			return "does nothing yet";
		}

		output = compile(ast);

		//grunt.file.write(this.data.outputFile, output);
	});
};
