/*
* grunt-peg
* https://github.com/dvberkel/grunt-peg
*
* Copyright (c) 2013 Daan van Berkel
* Licensed under the MIT license.
*/

'use strict';

var PEG = require('pegjs');

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('peg', 'Generates parsers from PEG grammars.', function() {
		grunt.log.write('Generating parser from ' + this.data.grammar);

		this.data.output = "source";

		var src = grunt.file.read(this.data.grammar),
			parser = PEG.buildParser(src, this.data),
			exportVar = this.data.exportVar || "module.exports";

		grunt.file.write(this.data.outputFile, exportVar + " = " + parser);
	});
};
