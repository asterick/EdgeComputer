module.exports = function(grunt) {
	grunt.initConfig({
    watch: {
			code: {
				files: ["grammar/**/*", "microcode/**/*"],
				tasks: ["microcode"]
			}
		},
		connect: {
			server: {
				options: {
					port: 9001,
					base: 'simulator'
				}
			}
		},
		microcode: {
			logisim: {
				grammar: "microcode/microcode.pegjs",
				structjs: "node_modules/struct.js/grammar/struct.peg",

				layout: "microcode/layout.txt",
				source: "microcode/source.txt",
				output: "logisim"
			},
			simulator: {
				grammar: "microcode/microcode.pegjs",
				structjs: "node_modules/struct.js/grammar/struct.peg",
				layout: "microcode/layout.txt",
				source: "microcode/source.txt",

				target: "simulator/microcode.bin",
				output: "binary"
			}
		}
	});

	grunt.loadTasks('microcode');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');

	grunt.registerTask("default", ["microcode"]);
	grunt.registerTask("dev", ["default", "connect", "watch"]);
};
