/*
	unsigned:1 disable_tlb;		// Bypass TLB (memory)
	unsigned:1 mem_active;		// 0: bus idle
	unsigned:1 mem_byte;			// Low or High byte
	unsigned:1 mem_dir;				// Read or Write
	unsigned:3 mem_addr;			// A0-A7
	unsigned:2 mem_addr_op;		// none, post-increment, none, post-decrement
*/

var external = require("./external.js"),
		Fault = require("./fault.js");

var MSR_PID 			 = 12,
		MSR_PID_MASK	 = 0xF,
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

var REG_PITCH			 = 4,
		WIDE_PITCH		 = 2,
		BANK_ADDR_L		 = 0,
		BANK_ADDR_H    = 1,
		BANK_REG			 = 2,
		BYTE_LOW			 = 0,
		BYTE_HIGH			 = 1,
		BANK_REG_BYTE  = 4,
		BYTE_PITCH     = 8;

function Processor() {
	this.registers = new Uint16Array(8*4); // 4x8x16b Register files
	this.byte_registers = new Uint8Array(this.registers.buffer);
	this.wide_regs = new Uint32Array(this.registers.buffer);

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
					this.conditions[f][i] = (c && !z) ? 1 : 0;
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
	// Current machine state, everything is zero (except registers)
	this.state = 0;
	this.pid = 0;
	this.sv = 0;
	this.ie = 0;
	this.tlb = 0;
	this.n = 0;
	this.v = 0;
	this.c = 0;
	this.z = 0;

	// TLB Circuit
	this.tlb_index = 0;
	this.tlb_flag = new Uint16Array(16);
	this.tlb_bank = new Uint16Array(16);
}


Object.defineProperties(Processor.prototype, {
	msr: { 
		get: function () {
			return (this.pid << MSR_PID) |
				(this.tlb ? MSR_TLB : 0) |
				(this.sv  ? MSR_SV : 0) |
				(this.ie  ? MSR_IE : 0) |
				(this.n   ? MSR_N : 0) |
				(this.v   ? MSR_V : 0) |
				(this.c   ? MSR_C : 0) |
				(this.z   ? MSR_Z : 0);
		},
		set: function (v) {
			this.pid = (v >> MSR_PID) & MSR_PID_MASK;
			this.tlb = Boolean(v & MSR_TLB);
			this.sv  = Boolean(v & MSR_SV);
			this.ie  = Boolean(v & MSR_IE);
			this.n   = Boolean(v & MSR_N);
			this.v   = Boolean(v & MSR_V);
			this.c   = Boolean(v & MSR_C);
			this.z   = Boolean(v & MSR_Z);
		}
	},
 
	r0:  {
		get: function () { return this.registers[BANK_REG +  0]; },
		set: function (v) { this.registers[BANK_REG +  0] = v; }
	},
	r1:  { 
		get: function () { return this.registers[BANK_REG +  4]; },
		set: function (v) { this.registers[BANK_REG +  4] = v; }
	 },
	r2:  { 
		get: function () { return this.registers[BANK_REG +  8]; },
		set: function (v) { this.registers[BANK_REG +  8] = v; }
	 },
	r3:  { 
		get: function () { return this.registers[BANK_REG + 12]; },
		set: function (v) { this.registers[BANK_REG + 12] = v; }
	 },
	r4:  { 
		get: function () { return this.registers[BANK_REG + 16]; },
		set: function (v) { this.registers[BANK_REG + 16] = v; }
	 },
	r5:  { 
		get: function () { return this.registers[BANK_REG + 20]; },
		set: function (v) { this.registers[BANK_REG + 20] = v; }
	 },
	r6:  { 
		get: function () { return this.registers[BANK_REG + 24]; },
		set: function (v) { this.registers[BANK_REG + 24] = v; }
	 },
	r7:  { 
		get: function () { return this.registers[BANK_REG + 28]; },
		set: function (v) { this.registers[BANK_REG + 28] = v; }
	 },

	a0:  { 
		get: function () { return this.wide_regs[ 0]; },
		set: function (v) { this.wide_regs[ 0] = v; }
	 },
	a1:  { 
		get: function () { return this.wide_regs[ 2]; },
		set: function (v) { this.wide_regs[ 2] = v; }
	 },
	a2:  { 
		get: function () { return this.wide_regs[ 4]; },
		set: function (v) { this.wide_regs[ 4] = v; }
	 },
	a3:  { 
		get: function () { return this.wide_regs[ 6]; },
		set: function (v) { this.wide_regs[ 6] = v; }
	 },
	a4:  { 
		get: function () { return this.wide_regs[ 8]; },
		set: function (v) { this.wide_regs[ 8] = v; }
	 },
	a5:  { 
		get: function () { return this.wide_regs[10]; },
		set: function (v) { this.wide_regs[10] = v; }
	 },
	a6:  { 
		get: function () { return this.wide_regs[12]; },
		set: function (v) { this.wide_regs[12] = v; }
	 },
	a7:  { 
		get: function () { return this.wide_regs[14]; },
		set: function (v) { this.wide_regs[14] = v; }
	 }
});

Processor.prototype.bus_read = function (code) {
	return 0;
}

Processor.prototype.bus_write = function (code, data) {
}

Processor.prototype.fault_code = function () {
	return 0 ;
}

// Pending state for step instruction
Processor.prototype.step = function () {
	var code = this.microcode[this.state],
			l_bus, r_bus, z_bus,
			carry_out, overflow_out, negative_out, zero_out,
			carry_in,
			flags;

	// --- INSTRUCTION FLAGS -------
	if (code.privileged && !this.sv) {
		throw new Fault(Fault.PRIVILEGE_DENIED, "Privileged instruction execution");
	}

	// --- ALU OPERATIONS ----------
	switch (code.l_term) {
	case 0: // immediate
		l_bus = code._immediate;
		break ;
	case 1: // Register
		l_bus = this.registers[REG_PITCH*code.l_select+BANK_REG];
		break ;
	case 2: // Address low
		l_bus = this.registers[REG_PITCH*code.l_select+BANK_ADDR_L];
		break ;
	case 3: // Address high
		l_bus = this.registers[REG_PITCH*code.l_select+BANK_ADDR_H];
		break ;
	}

	switch (code.r_term) {
	case 0: // immediate
		r_bus = code._immediate;
		break ;
	case 1: // Register
		r_bus = this.registers[REG_PITCH*code.r_select+BANK_REG];
		break ;
	case 2: // MSR
		r_bus = this.msr;
		break ;
	case 3: // fault code
		r_bus = this.fault_code;
		break ;
	}

	// Calculate z-bus
	carry_in = code.carry && this.c;

	switch (code.alu_op) {
	case 0: // or,
		z_bus = (l_bus | r_bus);
		carry_out = carry_in;
		overflow_out = z_bus & 0x4000;
		break ;
	case 1: // xor
		z_bus = (l_bus & r_bus);
		carry_out = carry_in;
		overflow_out = z_bus & 0x4000;
		break ;
	case 2: // and
		z_bus = (l_bus ^ r_bus);
		carry_out = carry_in;
		overflow_out = z_bus & 0x4000;
		break ;
	case 3: // >>>
		z_bus = (l_bus >> 1) | (l_bus * 0x8000);
		carry_out = l_bus & 1;
		overflow_out = z_bus & 0x4000;
		break ;
	case 4: // >>
		z_bus = (l_bus >> 1) | (carry_in ? 0x8000 : 0);;
		carry_out = l_bus & 1;
		overflow_out = z_bus & 0x4000;
		break ;
	case 5: // <<
		z_bus = (l_bus << 1) | (carry_in ? 0x0001 : 0);
		carry_out = l_bus & 0x8000;
		overflow_out = z_bus & 0x4000;
		break ;
	case 6: // +
		z_bus = (l_bus + r_bus + carry_in);
		carry_out = z_bus & 0x10000;
		overflow_out = (l_bus ^ ~r_bus) & (l_bus ^ z_bus) & 0x8000;
		break ;
	case 7: // -
		z_bus = (l_bus - r_bus - carry_in);
		carry_out = z_bus & 0x10000;
		overflow_out = (l_bus ^ r_bus) & (l_bus ^ z_bus) & 0x8000;
		break ;
	}

	negative_out = z_bus & 0x8000;
	zero_out = !(z_bus & 0xFFFF);

	if (code.next_state) {
		// Calculate condition code
		switch (code.cond_src) {
			case 0:
				flags = this.msr & MSR_FLAGS;
				break ;
			case 1:
				flags = 
					(negative_out   ? MSR_N : 0) |
					(overflow_out ? MSR_V : 0) |
					(carry_out ? MSR_C : 0) |
					(zero_out ? MSR_Z : 0);
				break ;
		}

		this.state = code.next_state ^ this.conditions[flags][code.condition];
	} else {
		this.state = this.registers[REG_PITCH*code.r_select+BANK_REG];
	}

	// --- MEMORY BUS ACCESS ------

	if (code.mem_active) {
		var addr = BYTE_PITCH*code.r_select+BANK_REG_BYTE;

		// BUS IS OPERATING
		if (code.mem_dir) { // write
			this.bus_write(code.disable_tlb, this.wide_regs[WIDE_PITCH*code.mem_addr], this.byte_registers[addr]);
		} else { // read
			this.byte_registers[addr] = this.bus_read(code.disable_tlb, this.wide_regs[WIDE_PITCH*code.mem_addr])
		}
	}

	switch (code.mem_addr_op) {
	case 1: // increment
		this.wide_regs[WIDE_PITCH*code.mem_addr]++;
		break ;
	case 3: // decrement
		this.wide_regs[WIDE_PITCH*code.mem_addr]--;
		break ;
	}

	// --- LATCH REGISTERS --------
	if (code.latch_zflags) {
		this.msr = z_bus;
	}
	
	if (code.latch_aflags) {
		this.c = carry_out;
		this.n = negative_out;
		this.z = zero_out;
		this.v = overflow_out;
	}

	switch (code.latch_tlb) {
	case 1: // Index
		this.tlb_index = z_bus & TLB_INDEX;
		break ;
	case 2: // Bank
		this.tlb_bank[this.tlb_index] = z_bus;
		break ;
	case 3: // Flag
		this.tlb_flag[this.tlb_index] = z_bus;
		break ;
	}

	switch (code.latch_zreg) {
	case 1: // Register
		this.registers[REG_PITCH*code.z_reg+BANK_REG] = z_bus;
		break ;
	case 2: // Addr.low
		this.registers[REG_PITCH*code.z_reg+BANK_ADDR_L] = z_bus;
		break ;
	case 2: // Addr.high
		this.registers[REG_PITCH*code.z_reg+BANK_ADDR_H] = z_bus;
		break ;
	}
};

// Setup microcode
external.then(function (microcode, bios) {
	Processor.prototype.microcode = microcode[0];
});

// Overrides
Processor.prototype.read = function (v) { return 0; }
Processor.prototype.write = function (a,v) {}

module.exports = Processor;
