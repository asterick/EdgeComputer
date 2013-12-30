'use strict';

var PEG = require('pegjs'),
		flatten = require("./compile/flatten.js"),
		ejs = require('ejs'),
		compile = flatten.compile;

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('microcode', 'Compile microcode.', function() {
		grunt.log.write('Compiling microcode', this.data.source, "\n");

		var options = { output: "parser" },
				structs = PEG.buildParser(grunt.file.read(this.data.structjs), options),
				layout = structs.parse(grunt.file.read(this.data.layout)),
				grammar = PEG.buildParser(grunt.file.read(this.data.grammar), options);

		var output = compile(layout, function (name) { return grammar.parse(grunt.file.read(name)); }, this.data.source);

		var outputs = this.data.output;
		Object.keys(outputs).forEach(function (format) {
			var target = outputs[format];

			switch(format) {
				case 'verilog':
					var base = require("fs").readFileSync("microcode/verilog.v.ejs", 'utf8'),
							tmpl = ejs.compile(base);

					grunt.file.write(target, tmpl({bytes: output}));
					break ;
				case 'binary':
					grunt.file.write(target, new Buffer(output));
					break ;
			}
		});
	});
};
