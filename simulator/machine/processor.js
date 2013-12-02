var Fault = require("./fault.js");

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

var REG_MSR = 0,
		REG_MDR = 1,
		REG_ADDR_OFFSET = 8;

function Processor() {
	// Current machine state (0 = reset)
	this.state = 0;

	// Initalize the address bus
	this.reg = new Uint16Array(16);
	this.mar = new Uint32Array(this.reg.buffer, REG_ADDR_OFFSET * 2, 4);
	this.mar_word = new Uint16Array(this.reg.buffer, REG_ADDR_OFFSET * 2, 8);
	this.mdr_byte = new Uint8Array(this.reg.buffer, REG_MDR * 2, 2);

	// TLB Circuit
	this.tlb_index = 0;
	this.tlb_flag = new Uint16Array(16);
	this.tlb_bank = new Uint16Array(16);

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
				case 1: // always
					this.conditions[f][i] = 1;
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

Object.defineProperties(Processor.prototype, {
	mdr: {
		get: function() { return this.reg[REG_MDR]; },
		set: function(v) { this.reg[REG_MDR] = v; }
	},
	msr: {
		get: function() { return this.reg[REG_MSR]; },
		set: function(v) { this.reg[REG_MSR] = v; }
	},


	// These are only used for the debugger
	a0: {
		get: function() { return this.mar[0]; }
	},
	a1: {
		get: function() { return this.mar[1]; }
	},
	a2: {
		get: function() { return this.mar[2]; }
	},
	a3: {
		get: function() { return this.mar[3]; }
	},
	r0: {
		get: function() { return this.reg[2]; }
	},
	r1: {
		get: function() { return this.reg[3]; }
	},
	r2: {
		get: function() { return this.reg[4]; }
	},
	r3: {
		get: function() { return this.reg[5]; }
	},
	r4: {
		get: function() { return this.reg[6]; }
	},
	r5: {
		get: function() { return this.reg[7]; }
	},

	// Constant table for immediate lookup
	immediates: {
		value: new Uint16Array([
			0x0001, 0x0002, 0x0004, 0x0008, 
			0x0010, 0x0020, 0x0040, 0x0080, 
			0x0100, 0x0200, 0x0400, 0x0800, 
			0x0000, 0x000f, 0x00ff, 0x0fff
		])
	}
})

Processor.prototype.reset = function () {
	state = 0;
}

Processor.prototype.bus_read = function (code) {
	var tlb = !code.tlb_disable && (this.msr & MSR_TLB),
			address = this.mar[code.addr_register];

	// Bypass TLB
	if (!tlb) { return this.read(address); }

	return 0;
}

Processor.prototype.bus_write = function (code, data) {
	var tlb = !code.tlb_disable && (this.msr & MSR_TLB),
			address = this.mar[code.addr_register];

	// Bypass TLB
	if (!tlb) { return this.write(address, data); }
}

Processor.prototype.translate = function (address) {
	var bank = this.tlb_bank

	return address;
}

Processor.prototype.fault_code = function () { return 0 ; }
Processor.prototype.irq_vector = function () { return 0 ; }


require("./microcode.js").then(function (mc) {
	// Setup microcode
	Processor.prototype.microcode = mc;

	// Pending state for step instruction
	Processor.prototype.step = function () {
		var code = this.microcode[this.state],
				lbus, rbus, zbus,
				carry_out, carry_in,
				alu_flags;
			
		// Check if we are executing a priviledged instruction
		if (code.privileged && (!this.msr & MSR_SV)) {
			throw new Fault(Fault.PRIVILEGE_DENIED, "Privileged instruction execution");
		}

		// Latch l-bus
		lbus = this.reg[code.l_bus];

		// Latch r-bus
		switch (code.r_bus) {
		case 1:
			rbus = this.immediates[code.immediate];
			break ;
		case 0:
			rbus = this.mdr;
			break ;
		case 2:
			rbus = this.fault_code();
			break ;
		case 3:
			rbus = this.irq_vector();
			break ;
		}

		// Set carry in
		switch (code.alu_carry) {
			case 0:
				carry_in = 0;
				break ;
			case 1:
				carry_in = 1;
				break ;
			case 2:
				carry_in = this.msr & MSR_C;
			case 3:
				carry_in = (lbus & 0x8000) ? 1 : 0;
		}

		// Execute alu
		rbus = rbus ^ ((code.alu_op & 4) ? 0xFFFF : 0);

		switch (code.alu_op) {
			case 0: // a + b
			case 4:
				zbus = lbus + rbus + (carry_in ^ (code.alu_op >> 3));
				break ;
			case 1: // a & b
			case 5:
				zbus = lbus & rbus;
				break ;
			case 2: // a | b
			case 6:
				zbus = lbus | rbus;
				break ;
			case 3: // a ^ b
				zbus = lbus ^ rbus;
				break ;
			case 7: // a << 1
				zbus = (lbus << 1) | carry;
				break ;
		}

		carry_out = (code.alu_op & 3) ? (lbus & 0x8000) : (zbus & 0x10000);

		alu_flags =
			(carry_out ? MSR_C : 0) |
			((zbus & 0x08000) ? MSR_N : 0) |
			((zbus & 0x0FFFF) ? 0 : MSR_Z) |
			(((lbus ^ ~rbus) & (lbus ^ zbus) & 0x8000) ? MSR_V : 0);

		// Memory access
		switch (code.mdr_source){
			case 0: // Z-Bus (memory bus idle)
				if (code.bus_direction) { this.mdr = zbus; }
				break ;
			case 1: // Memory
				if (code.bus_direction) { // Read
					this.mdr_byte[code.bus_byte] = 
						this.bus_read(code);
				} else { // Write
					this.bus_write(code, 
						this.mdr_byte[code.bus_byte]);
				}
				break ;
		}

		// Calculate next state
		if (!code.next_state) {
			this.state = this.mdr_byte[0];
		} else {
			var cond_flags = (code.flags_source) ? alu_flags : (this.msr & MSR_FLAGS);
			this.state = (code.next_state << 1) | this.conditions[code.condition_code][cond_flags];
		}

		// Configure TLB
		switch (code.tlb_write) {
			case 1: // Index
				this.tlb_index = zbus & TLB_INDEX;
				break ;
			case 2: // Bank
				this.tlb_bank[this.tlb_index] = zbus;
				break ;
			case 3: // Flags
				this.tlb_flag[this.tlb_index] = zbus;
				break ;
		}

		// Latch registers and flags
		if (code.latch_addr) {
			this.mar_word[code.z_addr] = zbus;
		}
		if (code.z_reg) {
			this.reg[code.z_reg] = zbus;
		}
		if (code.latch_flags) {
			this.msr = (this.msr & ~MSR_FLAGS) | alu_flags;
		}
	};
});

// Overrides
Processor.prototype.read = function (v) { return 0; }
Processor.prototype.write = function (a,v) {}
Processor.prototype.step = function () { };

module.exports = Processor;
