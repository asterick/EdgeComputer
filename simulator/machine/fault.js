function Fault(code, message) {
	this.code = code;
	this.message = message;
}

Fault.prototype = {
	constructor: Fault,

	PRIVILEGE_DENIED: 10000,
	TLB_MISS: 				10001,
	TLB_ACCESS_READ: 	10002,
	TLB_ACCESS_WRITE: 10003
};

module.exports = Fault;
