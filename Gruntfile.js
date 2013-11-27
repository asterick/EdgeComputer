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

		// Simulator
	  uglify: {
	    options: {
	      mangle: true,
	      compress: {
        	global_defs: {
	          "DEBUG": false
        	},
        	dead_code: true,
	      	warnings: false
	      },
	      preserveComments: 'some'
	    },
	    prod: {
	      files: {
	        'web/edge.min.js': ['web/edge.js']
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

		// Microcode builder
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

				target: "web/microcode.bin",
				output: "binary"
			}
		}
	});

	grunt.loadTasks('microcode');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask("default", ["microcode", "browserify", "uglify"]);
	grunt.registerTask("dev", ["default", "connect", "watch"]);
};
