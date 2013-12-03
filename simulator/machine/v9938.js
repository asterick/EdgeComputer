function V9938() {
	this._ram				= new Uint8Array(0x30000);
}

V9938.prototype.reset = function () {
	this._palette		= new Uint16Array(this.default_palette);

	// Reset VDP
	for (var i = 0; i < 0x3F; i++) { this._write_register(i, 0); }
}

V9938.prototype.bind = function (element) {
	this._ctx = element.getContext("2d");
};

V9938.prototype.read = function (address) {
	switch (address) {
	case 0: // VDP Ram
	case 1: // VDP Status
		break ;
	case 2:
	case 3:
		console.error("Invalid access to VDP register:", address);
		return 0;
	}
}

V9938.prototype.write = function (address, data) {
	switch (address) {
	case 0: // VDP Ram
		// TODO
	case 1: // VDP Address / Setup
		// TODO:
	case 2: // VDP Palette data
		if (!this._write_pal_first) {
			this._write_pal_first = true;
			this._write_pal_byte = data;
		} else {
			this._write_pal_first = false;
			this._write_palette((data << 8) | this._write_pal_byte);
		}
		break ;
	case 3: // VDP Register Indirect
		var addr = this._indirect_reg_increment ? this._indirect_reg++ : this._indirect_reg;
		this._write_register(reg, data);
		this._indirect_reg &= 0x3F;
		break ;
	}
}

V9938.prototype._write_palette = function (data) {
	// TODO: WRITE DATA
}

V9938.prototype._write_register = function (index, data) {

}

// Pre-calculate all our color LUTs 
V9938.prototype.color_lut = new Uint32Array(0x10000);
V9938.prototype.bw_lut = new Uint32Array(0x10000);
V9938.prototype.G7_palette = new Uint32Array(0x100);
V9938.prototype.default_palette = [
		0x000, 0x000, 0x611, 0x733, 
		0x117, 0x327, 0x151, 0x627,
	 	0x171, 0x373, 0x661, 0x664,
	 	0x411, 0x265, 0x555, 0x777
	];

// 3:3:3 -> 32BPP ABGR
for (var word = 0; word < 0x10000; word++) {
	var b = ((word >>  0) & 7) * 0x49 >> 1,
			r = ((word >>  4) & 7) * 0x49 >> 1,
			g = ((word >>  8) & 7) * 0x49 >> 1,
			v = (b * 0.1 + r * 0.2 + g * 0.7 | 0) * 0x010101;

	V9938.prototype.color_lut[word] = r | (g << 8) | (b << 16) | 0xFF000000;
	V9938.prototype.bw_lut[word] = v | 0xFF000000;
}

// 3:3:2 -> 32BPP ABGR
for (word = 0; word < 0x100; word++) {
	var b = (((word << 1 & 6) | (b >> 1 & 1))) * 0x55,
			r = ((word >> 2) & 7) * 0x49 >> 1,
			g = ((word >> 5) & 7) * 0x49 >> 1;

	V9938.prototype.G7_palette[word] =
		(b << 16) | (r) | (g << 8) | 0xFF000000;
}

module.exports = V9938;
