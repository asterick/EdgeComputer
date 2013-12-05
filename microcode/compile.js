'use strict';

var PEG = require('pegjs'),
		flatten = require("./compile/flatten.js"),
		compile = flatten.compile;

function binary(data) {
	var d = data.reduce(function (acc, b) {
		return acc.concat(b[0], b[1], b[2], b[3], b[4], b[5]);
	}, []);
	return new Buffer(d);
}

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('microcode', 'Generates parsers from PEG grammars.', function() {
		grunt.log.write('Compiling microcode', this.data.source, "\n");

		var options = { output: "parser" },
				source = grunt.file.read(this.data.source),
				structs = PEG.buildParser(grunt.file.read(this.data.structjs), options),
				parser = PEG.buildParser(grunt.file.read(this.data.grammar), options),
				layout = structs.parse(grunt.file.read(this.data.layout)),
				ast = parser.parse(source);

		var output = compile(layout, ast);

		var outputs = this.data.output;
		Object.keys(outputs).forEach(function (format) {
			var target = outputs[format];

			switch(format) {
				case 'binary':
					grunt.file.write(target, output);
					break ;
			}
		});
	});
};
