/*
 * This flattens all the non-conditional fields of an operation
 */

var TRUE = 1,
		FALSE = 0;

var BYTE_LOW = 0,
		BYTE_HIGH = 1;

var MEMORY_READ = 0,
		MEMORY_WRITE = 1,
		MEMORY_OPS = { 'none': 0, 'increment': 1, 'decrement': 3 };

var TLB_INDEX = 1,
		TLB_BANK = 2,
		TLB_FLAGS = 3;

var ZREG_REGISTER = 1,
		ZREG_ADDR_LOW = 2,
		ZREG_ADDR_HIGH = 3;

var L_TERM_IMM = 0,
		L_TERM_REG = 1,
		L_TERM_ADDR_LOW = 2,
		L_TERM_ADDR_HIGH = 3;

var R_TERM_IMM = 0,
		R_TERM_REGISTER = 1,
		R_TERM_STATUS = 2,
		R_TERM_FAULT_CODE = 3;

var ALU_OPS = {
  "or": 0,
  "and": 1,
  "xor": 2,
  "arithmatic-left": 3,
  "logical-left": 4,
  "logical-right": 5,
  "add": 6,
  "sub": 7
};

function encode(microcode) {
	var output = {};

	function assign(key, value) {
		if (typeof value !== "number") {
			throw new Error("Compiler attempted to assign non number to " + key);
		}
		if (output[key] !== undefined && output[key] !== value) {
			throw new Error(key + " is already defined, with a different value");
		}
		output[key] = value;
	}

	function assignImm(v) {
		var invert = v ^ 0xFFFF;
				inverted = invert < v,
				comp = inverted ? invert : v,
				offset = true;

		for (var i = 0; i < 15; i++) {
			var off = (1 << i) - 1,
					on = (1 << i);

			if (on === comp) {
				assign("imm_bit", i);
				assign("imm_offset", TRUE);
				assign("imm_invert", inverted ? TRUE : FALSE);
				return ;
			} else if(off == comp) {
				assign("imm_bit", i);
				assign("imm_offset", FALSE);
				assign("imm_invert", inverted ? TRUE : FALSE);
				return ;
			}
		}

		throw new Error("Cannot encode " + v + " as immediate");
	}

	function assignLBus(op) {
		switch (op.type) {
			case 'immediate':
				assignImm(op.value);
				assign("l_term", L_TERM_IMM);
				break ;
			case 'register':
				assign("l_term", L_TERM_REG);
				assign("l_select", op.index);
				break ;
			case 'address_reg':
				assign("l_term", op.byte === "high" ? L_TERM_ADDR_HIGH : L_TERM_ADDR_LOW);
				assign("l_select", op.register.index);
				break ;
			default:
				throw new ("Cannot use " + op.type + " as l-term");
		}
	}

	function assignRBus(op) {
		switch (op.type) {
			case 'immediate':
				assignImm(op.value);
				assign("r_term", R_TERM_IMM);
				break ;
			case 'register':
				assign("r_term", R_TERM_REGISTER);
				assign("r_select", op.index);
				break ;
			case 'status':
				assign("r_term", R_TERM_STATUS);
				break ;
			case 'fault_code':
				assign("r_term", R_TERM_FAULT_CODE);
				break ;
			default:
				throw new ("Cannot use " + op.type + " as r-term");
		}
	}

	function assignALU(code) {
		code.targets.forEach(function (target) {
			switch (target.type) {
			case 'address_reg':
				assign('z_reg', target.register.index);
				assign('latch_zreg', (target.byte === 'high') ? ZREG_ADDR_HIGH : ZREG_ADDR_LOW);
				break ;
			case 'register':
				assign('z_reg', target.index);
				assign('latch_zreg', ZREG_REGISTER);
				break ;
			case 'tlb':
				switch (target.register) {
				case 'index':
					assign('latch_tlb', TLB_INDEX);
					break ;
				case 'bank':
					assign('latch_tlb', TLB_BANK);
					break ;
				case 'flags':
					assign('latch_tlb', TLB_FLAGS);
					break ;
				}
				break ;
			case 'status':
				assign('latch_aflags', FALSE);	// Prevent double latching
				assign('latch_zflags', TRUE);
				break ;
			case 'flags':
				assign('latch_aflags', TRUE);
				assign('latch_zflags', FALSE);	// Prevent double latching
				break ;
			default:
				throw new ("Cannot use " + op.type + " as ALU target");
			}
		});

		switch(code.operation.type) {
		case 'binary':
			assignLBus(code.operation.left);
			assignRBus(code.operation.right);
			assign('alu_op', ALU_OPS[code.operation.operation])
			assign('carry', code.operation.carry ? TRUE : FALSE);
			break ;
		case 'unary':
			assignLBus(code.operation.value);
			assign('alu_op', ALU_OPS[code.operation.operation])
			assign('carry', code.operation.carry ? TRUE : FALSE);
			break ;
		case 'move':
			assign('alu_op', ALU_OPS.or);
			assignLBus(code.operation.value);
			assign('carry', FALSE);

			if (code.operation.value.type === 'immediate') {
				assignRBus(code.operation.value);
			} else {
				assignRBus({ type: "immediate", value: 0 });
			}
			break ;
		default:
			console.log(code.operation);
			break ;
		}
	}

	function assignMemory(code) {
		assign("mem_active", TRUE);
		assign("mem_byte", code.register.byte === "high" ? BYTE_HIGH : BYTE_LOW);
		assign("mem_dir", code.direction === "read" ? MEMORY_READ : MEMORY_WRITE);
		assign("mem_addr", code.memory.address.index);
		assign("r_select", code.register.register.index);
		assign("mem_addr_op", MEMORY_OPS[code.memory.operation]);
		assign("disable_tlb", code.memory.physical ? TRUE : FALSE);
	}

	function assignMemoryOp(code) {
		assign("mem_active", FALSE);
		assign("mem_addr", code.address.index);
		assign("mem_addr_op", MEMORY_OPS[code.operation]);
	}

	function assignNext(code) {
		if (code.register) {
			// We are branching to an index
			assign("r_select", code.register.index);
			output.next_state = { type: 'state', index: 0 };
		} else {
			// We are branching to a state number
			output.next_state = { type: 'state', index: code.state };
		}
	}

	microcode.statements.forEach(function (s) {
		switch (s.type) {
			case 'flag':
				output[s.name] = TRUE;
				break;
			case 'access':
				assignMemory(s);
				break ;
			case 'next':
				assignNext(s);
				break ;
			case 'alu':
				assignALU(s);
				break ;
			case 'address_op':
				assignMemoryOp(s);
				break ;
			default:
				console.error("UNHANDLED: ", s);
				break ;
		}
	});

	return output;
}

module.exports = {
	encode: encode,
	nop: function () { return encode({ type: "microcode", statements:[] }) }
};
