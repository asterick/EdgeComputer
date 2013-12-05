var external = require("./external.js"),
		Fault = require("./fault.js");

var MSR_PID 			 = 0xF000,
		MSR_SV 			   = 0x0200,
		MSR_TLB 		   = 0x0100,
		MSR_IE 			   = 0x0010,
		MSR_N	  			 = 0x0008,
		MSR_V	  			 = 0x0004,
		MSR_Z	  			 = 0x0002,
		MSR_C	  			 = 0x0001,
		MSR_FLAGS 		 = 0x000F;

var TLB_INDEX 		 = 0x000F,
		TLB_FLAG_PID   = 0x000F,
		TLB_FLAG_TOP   = 0x0FFF,
		TLB_BANK_READ  = 0x8000,
		TLB_BANK_WRITE = 0x4000,
		TLB_BANK_INIT  = 0x2000,
		TLB_BANK_TOP   = 0x0FFF;

function Processor() {
	this.reset();

	// Create a LUT for conditions
	this.conditions = [];
	for (var f = 0; f <= MSR_FLAGS; f++) {
		var c = (f & MSR_C) ? 1 : 0,
				z = (f & MSR_Z) ? 1 : 0,
				n = (f & MSR_N) ? 1 : 0,
				v = (f & MSR_V) ? 1 : 0;
		this.conditions[f] = [];

		for (var i = 0; i < 8; i++) {
			switch (i) {
				case 0: // never
					this.conditions[f][i] = 0;
					break ;
				case 1: // hi
					this.conditions[f][i] = (c && !z);
					break ;
				case 2: // ge
					this.conditions[f][i] = (n === v) ? 1 : 0;
					break ;
				case 3: // gt
					this.conditions[f][i] = (n === v && !z) ? 1 : 0;
					break ;
				case 4: // c
					this.conditions[f][i] = c ? 1 : 0;
					break ;
				case 5: // z
					this.conditions[f][i] = z ? 1 : 0;
					break ;
				case 6: // v
					this.conditions[f][i] = v ? 1 : 0;
					break ;
				case 7: // n
					this.conditions[f][i] = n ? 1 : 0;
					break ;
			}
		}
	}
}

Processor.prototype.reset = function () {
	// Current machine state (0 = reset)
	this.state = 0;

	// TLB Circuit
	this.tlb_index = 0;
	this.tlb_flag = new Uint16Array(16);
	this.tlb_bank = new Uint16Array(16);
}

Processor.prototype.bus_read = function (code) {
	return 0;
}

Processor.prototype.bus_write = function (code, data) {
}

Processor.prototype.fault_code = function () {
	return 0 ;
}


external.then(function (microcode, bios) {
	// Setup microcode
	Processor.prototype.microcode = microcode[0];

	// Pending state for step instruction
	Processor.prototype.step = function () {
		var code = this.microcode[this.state],
				alu_flags;

		// Check if we are executing a priviledged instruction
		if (code.privileged && !(this.msr & MSR_SV)) {
			throw new Fault(Fault.PRIVILEGE_DENIED, "Privileged instruction execution");
		}

		// TODO: 
	};
});

// Overrides
Processor.prototype.read = function (v) { return 0; }
Processor.prototype.write = function (a,v) {}
Processor.prototype.step = function () { };

module.exports = Processor;
