/*
* grunt-peg
* https://github.com/dvberkel/grunt-peg
*
* Copyright (c) 2013 Daan van Berkel
* Licensed under the MIT license.
*/

'use strict';

var PEG = require('pegjs');

function build(statements) {
	console.log(statements);
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

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('microcode', 'Generates parsers from PEG grammars.', function() {
		grunt.log.write('Compiling microcode ' + this.data.source);

		var source = grunt.file.read(this.data.source),
				parser = PEG.buildParser(grunt.file.read(this.data.grammar), this.data),
				ast = parser.parse(source);

		grunt.file.write(this.data.outputFile, compile(ast));
	});
};
