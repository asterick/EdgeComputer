/*
 * WARNING: LBUS and ZBUS use magic numbers
 * Arrangement:
 * 		LBUS: MDR, MSR, R0, R1, R2, R3, R4, R5, A0.L, A1.L, A2.L, A3.L, A0.H, A1.H, A2.H, A3.H
 *		ADDR: A0.L, A1.L, A2.L, A3.L, A0.H, A1.H, A2.H, A3.H
 */

var TRUE = 1,
		FALSE = 0;

var MDR_WRITE = 0,
		MDR_READ = 1;

var MDR_ZBUS = 0,
		MDR_DBUS = 1;

var LBUS_MDR = 0,
		LBUS_MSR = 1;

var RBUS_IMM = 0,
		RBUS_MDR = 1,
		RBUS_FAULT = 2,
		RBUS_IRQ = 3;

var ZREG_NONE = 0,
		ZREG_MSR = 1;

var TLB_NONE = 0,
		TLB_INDEX = 1,
		TLB_BANK = 2,
		TLB_FLAGS = 3;

var CARRY_ZERO = 0,
		CARRY_ONE = 1,
		CARRY_FLAG = 2,
		CARRY_LBUS = 3;

var	ALU_ADD = 0,
		ALU_AND = 1,
		ALU_BOR = 2,
		ALU_XOR = 3,
		ALU_SUB = 4,
		ALU_NAND = 5,
		ALU_NOR = 6,
		ALU_LEFT = 7;

var IMMEDIATES = [
			0x0001, 0x0002, 0x0004, 0x0008,
			0x0010, 0x0020, 0x0040, 0x0080,
			0x0100, 0x0200, 0x0400, 0x0800,
			0x0000, 0x000F, 0x00FF, 0x0FFF
		];

function encode(microcode) {
	var output = {};

	function assign(key, value) {
		if (typeof value !== "number") {
			throw new Error("Compiler attempted to assign non number to " + key);
		}
		if (output[key] !== undefined) {
			throw new Error(key + " is already defined");
		}
		output[key] = value;
	}

	function assignTarget(target) {
		switch (target.type) {
			case 'address':
				assign("latch_addr", TRUE); 
				assign("z_addr", (target.register << 1) + (target.word === 'high' ? 1 : 0));
				break ;
			case 'register':
				assign("z_reg", 2 + target.register);
				break ;
			case 'status':
				assign("z_reg", ZREG_MSR);	// MSR
				break ;
			case 'data':
				assign("mdr_source", MDR_ZBUS); // MDR Z-bus
				assign("bus_direction", MDR_READ);  // Read mode
				break ;
			case 'flags':
				assign("latch_flags", TRUE);
				break ;
			case 'tlb':
				assign("tlb_write", { "index": TLB_INDEX, "bank": TLB_BANK, "flags": TLB_FLAGS }[target.register]);
				break ;
		}
	}

	function assignLBus(target) {
		switch (target.type) {
		case 'data':
			assign("l_bus", LBUS_MDR);
			break ;
		case 'status':
			assign("l_bus", LBUS_MSR);
			break ;
		case 'register':
			assign("l_bus", 2 + target.register);
			break ;
		case 'address':
			assign("l_bus", 8 + (target.register << 1) + (target.word === 'high' ? 1 : 0));
			break ;
		}
	}

	function assignImmediate(number) {
		var floor = IMMEDIATES.indexOf(number);

		if (floor < 0) {
			throw new Error("Cannot encode constant " + number);
		}

		assign("immediate", floor);
	}

	function assignRBus(statement) {
		if (typeof statement === "number") {
			assign("r_bus", RBUS_IMM); // Immediate mode
			assignImmediate(statement);
			return ;
		}

		switch (statement.type) {
			case 'data':
				assign("r_bus", RBUS_DATA);
				break ;
			case 'fault':
				assign("r_bus", RBUS_FAULT);
				break ;
			case 'irq':
				assign("r_bus", RBUS_IRQ);
				break ;
		}
	}

	function assignCarry(statement) {
		if (!statement) { return ; }

		var v;
		switch (statement.type) {
			case "fixed":
				v = statement.value ? CARRY_ONE : CARRY_ZERO;
				break ;
			case "carry":
				v = CARRY_FLAG;
				break ;
			case "top":
				v = CARRY_LBUS;
				break ;
		}
		assign("alu_carry", v);
	}

	function assignOperator(operator) {
		assign("alu_op", {
			"+": ALU_ADD,
			"and": ALU_AND,
			"or": ALU_BOR,
			"xor": ALU_XOR,
			"-": ALU_SUB,
			"nand": ALU_NAND,
			"nor": ALU_NOR,
			"left": ALU_LEFT
		}[operator]);
	}

	function assignUnary(statement) {
		assignOperator(statement.operator);
		assignLBus(statement.term);
		assignCarry(statement.carry);
	}

	function assignBinary(statement) {
		assignOperator(statement.operator);
		assignLBus(statement.left);
		assignRBus(statement.right);
		assignCarry(statement.carry);
	}

	function assignBus(access) {
		assign("mdr_source", MDR_DBUS);	// Bus
		assign("tlb_disable",  access.address.absolute ? TRUE : FALSE);
		assign("addr_register", access.address.register);
		assign("bus_direction", access.direction === "read" ? MDR_READ : MDR_WRITE);
		assign("bus_byte", access.target.byte === "high" ? TRUE : FALSE);
	}

	microcode.statements.forEach(function (s) {
		switch (s.type){
			// Instruction flags
			case 'flag':
				assign(s.name, TRUE);
				break ;
			case 'databus':
				assignBus(s);
				break ;

			case 'assign':
				s.targets.forEach(assignTarget);
				switch (s.expression.type) {
					case 'register':
					case 'address':
					case 'status':
					case 'data':
						assignLBus(s.expression);
						break ;
					case 'unary':
						assignUnary(s.expression);
						break ;
					case 'binary':
						assignBinary(s.expression);
						break ;
					default:
						throw new Error("Cannot assign alu " + JSON.stringify(s.expression, null, 4));
				}
				break ;
			default:
				throw new Error("Unhandled microcode statement: " + s.type);
				break ;
		}
	});

	return output;
}

module.exports = {
	encode: encode,
	nop: function () { return encode({ type: "microcode", statements:[] }) }
};
