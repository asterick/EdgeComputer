var description = {

};

function unique(a) {
	return a.filter(function (v, i, a) {
		return a.indexOf(v, i+1) < 0;
	});
}

module.exports = function (grunt) {
	grunt.registerMultiTask('instructions', 'Generates parsers from PEG grammars.', function() {
		var table = JSON.parse(grunt.file.read(this.data.table)),
				instructions = {},
				shifts = {},
				options = [];

		function process(entry, table) {
			table.forEach(function (code, index) {
				if (code.shift_table) {
					var insert = shifts[code.shift_table] || (shifts[code.shift_table] = []);

					insert.push({
						code: entry + index,
						effective_address: code.effective_address || null
					});
				}

				if (code.instruction) {
					var insert = instructions[code.instruction] || (instructions[code.instruction] = []);

					insert.push({
						code: entry + index,
						terms: code.terms
					});

					options.push.apply(options, code.terms)
				}
			});
		}

		Object.keys(table).sort().forEach(function (v) {
			process(parseInt(v), table[v]);
		});

		Object.keys(instructions).forEach(function(k) {
			var inst = instructions[k],
					grid = {};

			console.log("");

			console.log(k);
			console.log("---");
			console.log(description[k]);

			console.log("");

			function sort(a) {
				return a.sort(function (a, b) {
					if (a.length != b.length) {
						return a.length - b.length;
					}

					if (a == b) { return 0 ; }
					return (a > b) ? 1 : -1;
				});
			}

			function genTable2(grid) {
				var top = sort(unique(Object.keys(grid).reduce(function (acc, v) {
									return Object.keys(grid[v]).concat(acc);
								}, [])));

				var l = Math.max.apply(null, top.map(function (v) { return v.length; }).concat(2));

				function pad(v) {
					return (v + "          ").substr(0,l);
				}

				console.log(pad(""), "|", top.map(pad).join(" | "));
				console.log(pad("---------"), "|", top.map(function (v) { return pad("---------"); }).join(" | "));
				sort(Object.keys(grid)).forEach(function (k) {
					console.log(pad(k), "|", top.map(function (v) {
						return pad(grid[k][v] ? grid[k][v].toString(16) : "");
					}).join(" | "));
				})
			}

			function genTable1(grid) {
				var top = sort(Object.keys(grid)),
						l = Math.max.apply(null, Object.keys(grid).map(function (v) { return v.length; }).concat(2));

				function pad(v) {
					return (v + "          ").substr(0,l);
				}

				console.log(pad(""), "|", top.map(pad).join(" | "));
				console.log(pad("--------"),"|",top.map(function(){return pad("--------")}).join(" | "));

				console.log(pad("Op"), "|", top.map(function (v) { return pad(grid[v]); }).join(" | "));
			}

			switch (inst[0].terms.length) {
			case 2:
				inst.forEach(function (i) {
					var a = i.terms[0],
							b = i.terms[1],
							c = i.code & 0xFF;

					(grid[b] || (grid[b] = {}))[a] = c;
				});
				genTable2(grid);
				break ;
			case 1:
				inst.forEach(function (i) {
					var a = i.terms[0],
							c = i.code & 0xFF;

					grid[a] = c;
				});
				genTable1(grid);
				break ;
			case 0:
				grid = inst[0].code & 0xFF;
				console.log("Opcode:", grid.toString(16));
				break ;
			}

			//console.log(grid);
		});
	});
};
