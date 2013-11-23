'use strict';

var PEG = require('pegjs'),
		flatten = require("./compile/flatten.js"),
		compile = flatten.compile;

function logisim(data, i) {
	var lines = ["v2.0 raw"];

	return lines.join("\n");
}

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks


	grunt.registerMultiTask('microcode', 'Generates parsers from PEG grammars.', function() {
		grunt.log.write('Compiling microcode', this.data.source, "\n");

		var source = grunt.file.read(this.data.source),
				structs = PEG.buildParser(grunt.file.read(this.data.structjs), this.data),
				parser = PEG.buildParser(grunt.file.read(this.data.grammar), this.data),
				layout = structs.parse(grunt.file.read(this.data.layout)),
				ast = parser.parse(source);

		var output = compile(layout, ast);

		switch(this.data.output) {
			case 'logisim':
				for (var i = 0; i < 5; i++) {
					grunt.file.write("rom/logisim"+i+".hex",logisim(output, i));
				}
		}
	});
};
