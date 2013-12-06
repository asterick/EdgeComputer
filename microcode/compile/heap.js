var util = require("./util.js");

function heap(size) {
	this.available = { 0: size };
	this.used = 0;
}

heap.prototype.trim = function (size, start, address, count) {
	// Clear from previous part of heap
	delete this.available[start];

	var a_start = start, 
			a_count = address - start,
			b_start = address + count, 
			b_count = size - (address - start + count);

	// Insert new bits into the heap
	if (a_count) { this.available[a_start] = a_count; }
	if (b_count) { this.available[b_start] = b_count; }

	this.used += count;
}

heap.prototype.clear = function (address, count) {
	var deleted = false,
			that = this;

	count || (count = 1);

	util.each(that.available, function (size, start) {
		start = parseInt(start, 10);
		
		if (address < start || (address + count) > (start + size)) {
			return ;
		}

		that.trim(size, start, address, count);
		deleted = true;
	});

	if (!deleted) { throw new Error("Could not allocate " + count + " instruction words"); }
}

heap.prototype.allocate = function (count) {
	var that = this,
			address;

	util.each(that.available, function (size, start) {
		if (address !== undefined) { return ;}

		start = parseInt(start, 10);

		var delta = start % count,
				offset = delta ? (count - delta) : 0;

		if (size - offset >= count) {
			address = start + offset;
			that.trim(size, start, address, count);
		}
	});

	if (address === undefined) {
		throw new Error("Could not allocate " + count + " instruction words");
	}

	return address;
}

module.exports = heap;
