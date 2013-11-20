module.exports = function(grunt) {
	grunt.initConfig({
    watch: {
			code: {
				files: ["grammar/**/*", "microcode/**/*"],
				tasks: ["microcode"]
			}
		},
		microcode: {
			main : {
				grammar: "grammar/microcode.pegjs",
				structjs: "node_modules/struct.js/grammar/struct.peg",

				layout: "microcode/layout.txt",
				source: "microcode/source.txt",
				outputFile: "microcode.bin"
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask("default", ["microcode"]);
	grunt.registerTask("dev", ["default", "watch"]);
};
