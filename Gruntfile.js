module.exports = function(grunt) {
	grunt.initConfig({
    shell: {
        compile: {
            options: {                      // Options
                stdout: true
            },
            command: './compile.js microcode/source.txt microcode/microcode.bin'
        }
    },
    watch: {
			javascript: {
				files: ["grammar/**/*"],
				tasks: ["peg", "shell"]
			},
			code: {
				files: ["microcode/**/*", "compile.js"],
				tasks: ["shell"]
			}
		},
		peg: {
			microcode : {
				grammar: "grammar/microcode.pegjs",
				outputFile: "parsers/microcode.js",
				exportVar: "module.exports"
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.loadNpmTasks('grunt-shell');

	grunt.registerTask("default", ["peg", "shell"]);
	grunt.registerTask("dev", ["default", "watch"]);
};
