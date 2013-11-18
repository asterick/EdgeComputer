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
