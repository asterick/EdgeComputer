// Centralize all our external dependancies
var file = require("../util/file.js"),
		promise = require("../util/promise.js"),
		microcode = require("./microcode.js");

module.exports = promise.all(microcode, file.read("bios.bin"));
