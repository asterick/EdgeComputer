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

function encode(output, statement) {
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
				if (op.unit) { throw new Error("Must assign full-register when assigning register to l-bus"); }

				assign("l_term", L_TERM_REG);
				assign("l_select", op.index);
				break ;
			case 'address':
				if (!op.unit) { throw new Error("Must assign word-register when assigning address register to l-bus"); }
				assign("l_term", op.unit === "high" ? L_TERM_ADDR_HIGH : L_TERM_ADDR_LOW);
				assign("l_select", op.index);
				break ;
			default:
				throw new Error("Cannot use " + op.type + " as l-term");
		}
	}

	function assignRBus(op) {
		switch (op.type) {
			case 'immediate':
				assignImm(op.value);
				assign("r_term", R_TERM_IMM);
				break ;
			case 'register':
				if (op.unit) { throw new Error("Must assign full-register when assigning register to l-bus"); }

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
				throw new Error("Cannot use " + op.type + " as r-term");
		}
	}

	function assignALU(code) {
		code.targets.forEach(function (target) {
			switch (target.type) {
			case 'address':
				if (!target.unit) { throw new Error("Must assign word when assigning address register from z-bus"); }

				assign('z_reg', target.index);
				assign('latch_zreg', (target.unit === 'high') ? ZREG_ADDR_HIGH : ZREG_ADDR_LOW);
				break ;
			case 'register':
				if (target.unit) { throw new Error("Must assign full-register when assigning register from z-bus"); }
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
				throw new Error("Cannot use " + target.type + " as ALU target");
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
			assign('carry', FALSE);

			switch (code.operation.value.type) {
			case "register":
			case "address":
				assignLBus(code.operation.value);
				assignRBus({ type: "immediate", value: 0 });
				break ;
			case 'status':
			case 'fault_code':
				assignLBus({ type: "immediate", value: 0 });
				assignRBus(code.operation.value);
				break ;
			case "immediate":
				assignLBus(code.operation.value);
				assignRBus(code.operation.value);
				break ;
			default:
				throw new Error("Cannot use " + code.operation.value.type + " as move source");
			}

			break ;

		default:
			throw new Error("Cannot use " + code.operation.type + " as ALU source");
			break ;
		}
	}

	function assignMemory(code) {
		var memory, register, dir;

		if (code.operation.value.type === "memory") {
			memory = code.operation.value;
			register = code.targets[0];
			dir = MEMORY_READ;
		} else {
			register = code.operation.value;
			memory = code.targets[0];
			dir = MEMORY_WRITE;
		}

		if (memory.address.type !== "address" || memory.address.unit) {
			throw new Error("Source address must be a full width address register");
		}

		if (register.type !== "register" || !register.unit) {
			throw new Error("Memory operators require register source/target w/byte selected");
		}

		assign("mem_active", TRUE);
		assign("mem_dir", dir);
		assign("mem_addr", memory.address.index);
		assign("disable_tlb", memory.physical ? TRUE : FALSE);
		assign("mem_addr_op", MEMORY_OPS[memory.operation]);
		assign("mem_byte", register.byte === "high" ? BYTE_HIGH : BYTE_LOW);
		assign("r_select", register.index);
	}

	function assignComplex(code) {
		if (code.targets.length === 1 &&
				code.operation.type === "move" &&
				(code.operation.value.type === "memory" || code.targets[0].type === "memory")) {
			assignMemory(code);
		} else {
			assignALU(code);
		}
	}

	function assignMemoryOp(code) {
		// If we are messing with an operator that is not a raw address, treat as ALU operator
		if (code.address.type !== 'address' || code.address.unit) {
			assignComplex({ type: 'assignment',
			  targets: [ code.address ],
  			operation: { 
  				type: 'binary',
     			operation: code.operation === "increment" ? "add" : "sub",
     			left: code.address,
		     	right: { type: 'immediate', value: 1 },
     			carry: false 
     		} 
     	});

     	return ;
		}

		assign("mem_active", FALSE);
		assign("mem_addr", code.address.index);
		assign("mem_addr_op", MEMORY_OPS[code.operation]);
	}

	switch (statement.type) {
		case 'flag':
			output[statement.name] = TRUE;
			break;
		case 'assignment':
			assignComplex(statement);
			break ;
		case 'incrementer':
			assignMemoryOp(statement);
			break ;
		default:
			console.error("UNHANDLED: ", statement);
			break ;
	}

	return output;
}

module.exports = {
	encode: encode
};
