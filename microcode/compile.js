'use strict';

var PEG = require('pegjs'),
		flatten = require("./compile/flatten.js"),
		compile = flatten.compile;

function short(v) {
	return new Uint16Array(v.buffer);
}

function logisim(data, i) {
	var lines = ["v2.0 raw"],
			bytes = data.map(function (v) {
				return v[i].toString(16);
			});

	for (var i = 0; i < bytes.length; i += 8) {
		lines.push(bytes.slice(i, i+8).join(" "));
	}

	return lines.join("\n");
}

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

		switch(this.data.output) {
			case 'logisim':
				var data = output.map(short);
				for (var i = 0; i < data[0].length; i++) {
					grunt.file.write("rom/logisim"+i+".hex",logisim(data, i));
				}
				break ;
			case 'binary':
				grunt.file.write("rom/microcode.bin", binary(output));
				break ;
		}
	});
};
