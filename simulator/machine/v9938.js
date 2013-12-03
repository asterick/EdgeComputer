function V9938(element) {
	this._ram				= new Uint8Array(0x30000);
	this._status		= new Uint8Array(16);
	this._palette		= new Uint16Array([
		0x000, 0x000, 0xC22, 0xE66, 
		0x22E, 0x64E, 0x2A2, 0xC4E,
	 	0x2E2, 0x6E6, 0xCC2, 0xCC8,
	 	0x822, 0x4CA, 0xAAA, 0xEEE
	]);
}

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
	case 1: // VDP Address / Setup
	case 2: // VDP Palette data
	case 3: // VDP Register Indirect
	}
}

// Bootstrap the V9938 with the 9bpp color palette
V9938.prototype.color_lut = new Uint32Array(0x10000);

for (var word = 0; word < 0x10000; word++) {
	var b = ((word >>  0) & 7) * 0x24,
			r = ((word >>  4) & 7) * 0x24,
			g = ((word >>  8) & 7) * 0x24;

	V9938.prototype.color_lut[word] = r | (g << 8) | (b << 16) | 0xFF000000;
}


module.exports = V9938;
