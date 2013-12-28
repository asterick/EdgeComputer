module.exports = function(grunt) {
	grunt.initConfig({
    watch: {
			microcode: {
				files: ["grammar/**/*", "microcode/**/*"],
				tasks: ["microcode"]
			},
			simulator: {
				files: ["simulator/**/*"],
				tasks: ["browserify"]
			},
			instructions: {
				files: ["instructions/**/*"],
				tasks: ["instructions"]
			}
		},

		connect: {
			server: {
				options: {
					port: 9001,
					base: 'web'
				}
			}
		},

		browserify: {
		  dist: {
		  	options: {
		  		debug: true,
		  		transform: ["browserify-ejs", "brfs"]
		  	},
		    files: {
		      'web/edge.js': ['simulator/**/*.js']
		    }
		  }
		},

		// Instruction table generator
		instructions: {
			table: {
				table: "instructions/table.json",
				microcode: "microcode/micro/table.txt",
				documentation: "doc/instructions"
			}
		},

		// Microcode builder
		microcode: {
			logisim: {
				grammar: "microcode/microcode.pegjs",
				structjs: "node_modules/struct.js/grammar/struct.peg",

				layout: "microcode/layout.txt",
				source: "microcode/micro/main.txt",

				output: {
					"binary": "web/microcode.bin"
				}
			}
		}
	});

	grunt.loadTasks('instructions');
	grunt.loadTasks('microcode');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');

	grunt.registerTask("default", ["instructions", "microcode", "browserify"]);
	grunt.registerTask("dev", ["default", "connect", "watch"]);
};
