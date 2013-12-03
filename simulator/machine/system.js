var file = require("../util/file.js"),
		Fault = require("./fault.js"),
		Processor = require("./processor.js"),
		V9938 = require("./v9938.js");

function System() {
	Processor.call(this);

	this.ram = new Uint8Array(0x800000);
	this.video = new V9938();
}

System.prototype = Object.create(Processor.prototype, { constructor: System });

System.prototype.read = function (address) {
	switch (address & 0xF80000)	{
	case 0x000000:
		return this.bios[address];
	
	// This is the currently unmapped regions of my memory map (7.5mB)
	case 0x080000:
	case 0x100000:
	case 0x180000:
	case 0x200000:
	case 0x280000:
	case 0x300000:
	case 0x380000:
	case 0x400000:
	case 0x480000:
	case 0x500000:
	case 0x580000:
	case 0x600000:
	case 0x680000:
	case 0x700000:
	case 0x780000:
		return 0;
	default:
		return this.ram[address & 0x7FFFFF];
	}
}

System.prototype.step = function () {};

file.read("bios.bin").then(function (bios) {
	System.prototype.bios = new Uint8Array(bios);
	delete System.prototype.step;
});

module.exports = System;
