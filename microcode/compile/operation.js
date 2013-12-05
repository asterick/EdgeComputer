/*
 * THIS IS ALL BUNK BECAUSE OF MICROCODE V2
 */

var TRUE = 1,
		FALSE = 0;

function immediate(v) {
	var invert = v ^ 0xFFFF;
			inverted = invert < v,
			comp = inverted ? invert : v,
			offset = true;

	for (var i = 0; i < 15; i++) {
		var off = (1 << i) - 1,
				on = (1 << i);

		if (on === comp) {
			return { bit: i, inverted: inverted, offset: true };
		} else if(off == comp) {
			return { bit: i, inverted: inverted, offset: false };
		}
	}

	throw new Error("Cannot encode " + v + " as immediate");
}

function encode(microcode) {
	var output = {};

	function assign(key, value) {
		if (typeof value !== "number") {
			throw new Error("Compiler attempted to assign non number to " + key);
		}
		if (output[key] !== undefined && output[key] !== value) {
			throw new Error(key + " is already defined");
		}
		output[key] = value;
	}

	microcode.statements.forEach(function (s) {
		// TODO: MICROCODE COMPILE
	});

	return output;
}

module.exports = {
	encode: encode,
	nop: function () { return encode({ type: "microcode", statements:[] }) }
};
