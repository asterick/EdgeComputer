#!/usr/bin/env node
var parser = require("./parsers/microcode.js"),
		fs = require("fs");

var file = fs.readFileSync(process.argv[2], "utf8"),
		ast = parser.parse(file);

console.log(ast);
