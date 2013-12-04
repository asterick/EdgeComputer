function V9938() {
	this._vram = new Uint8Array(0x30000);

	this.reset();
}

V9938.prototype.reset = function () {
	// Preset all values
	this._vram_address				= 0;
	this._color_table_addr		= 0;
	this._sprite_attr_addr 		= 0;
	this._sprite_pattern_addr	= 0;
	this._display_mode 				= 0;

	// Init our palette
	this._palette = new Uint16Array(this.default_palette);

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
		break ;
	case 1: // VDP Address / Setup
		if (!this._write_pal_first) {
			this._write_cmd_first = true;
			this._write_cmd_byte = data;
		} else {
			this._write_cmd_first = false;
			if (data & 0x80) {
				// Write register
				this._write_register(data & 0x3F, this._write_cmd_byte);
			} else {
				// Setup addr A0..A13
				this._vram_address = 
					(this._vram_address & ~0x3FFF) |
					(this._write_cmd_byte) |
					((data & 0x3F) << 8);
			}
		}
		return ;
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
		var reg = this._indirect_reg;

		if (this._indirect_reg_increment) {
			this._indirect_reg = (this._indirect_reg + 1) & 0x3F;
		}

		this._write_register(reg, data);
		break ;
	}

	this._write_cmd_first = false;
}

V9938.prototype._write_palette = function (data) {
	this._palette[this._palette_index++] = data;
	this._palette_index &= 0xF;
}

V9938.prototype._register_mask = 	[
	0x7e, 0x7b, 0x7f, 0xff, 0x3f, 0xff, 0x3f, 0xff,
	0xfb, 0xbf, 0x07, 0x03, 0xff, 0xff, 0x07, 0x0f,
	0x0f, 0xbf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0x01, 0xff, 0x03, 0xff, 0x01, 0xff, 0x03,
	0xff, 0x01, 0xff, 0x03, 0xFF, 0x7F, 0xFF
];

V9938.prototype._write_register = function (index, data) {
	data &= this._register_mask[index] || 0xFF;

	switch (index) {
	// Core registers
	case  0: // Mode register 0
		this._digitize_mode = data & 0x40;
		this._IE2 = data & 0x20;
		this._IE1 = data & 0x10;

		this._display_mode = ((data << 1) & 0x1C) | (this._display_mode & ~0x1C);

		break ;
	case  1: // Mode register 1
		this._blank_screen = data & 0x40;
		this._IE0 = data & 0x20;

		this._display_mode &= ~0x03;
		this._display_mode |= (data & 0x10) ? 1 : 0;
		this._display_mode |= (data & 0x08) ? 2 : 0;

		this._sprite_size = data & 0x02;
		this._sprite_enlarge = data & 0x01;
		break ;
	case  8: // Mode register 2
		this._color_0 = data & 0x20;
		this._sprite_disable = data & 0x02;
		this._color_table = (data & 0x01) ? this.bw_lut : this.color_lut;
		break ;
	case  9: // Mode register 3
		this._line_height = data & 0x80;
		this._simultaneous_mode = data & 0x30;
		this._interlace = data & 0x08;
		this._even_odd_screens = data & 0x04;
		break ;

	case  2: // Pattern layout table
		this._pattern_layout_addr = data << 10;
		break ;
	case  3: // Color table low
		this._color_table_addr = (data << 6) | (this._color_table_addr & ~(0xFF << 6));
		break ;
	case  4: // Pattern generator table
		this._pattern_generator_addr = data << 11;
		break ;
	case  5: // Sprite attribute table low
		this._sprite_attr_addr = (data << 7) | (this._sprite_attr_addr & ~(0xFF << 7));
		break ;
	case  6: // Sprite pattern generator table
		this._sprite_pattern_addr = (data << 11) | (this._sprite_pattern_addr & ~(0xFF << 11));
		break ;
	case 10: // Color table high
		this._color_table_addr = (data << 14) | (this._color_table_addr & ~(0xFF << 14));
		break ;
	case 11: // Sprite attribute table high
		this._sprite_attr_addr = (data << 15) | (this._sprite_attr_addr & ~(0xFF << 15));
		break ;
	case 14: // VRAM access base address
		this._vram_address = (data << 14) | (this._vram_address & ~(0xFF << 14));
		break ;
	case 15: // Status register base address
		this._status_index = data;
		break ;
	case 16: // Color palette address register
		this._palette_index = data;
		break ;
	case 17: // Control register pointer
		this._indirect_reg_increment = Boolean(data & 0x80);
		this._indirect_reg = data & 0x3F;
		break ;
	case  7: // Text / Margin color
		this._text_color = data >> 4;
		this._margin_color = data & 0xF;
		break ;
	case 12: // Text and background blink color
		this._blink_text_color = data >> 4;
		this._blink_margin_color = data & 0xF;
		break ;
	case 13: // Blinking period register
		this._blink_on_period = data >> 4;
		this._blink_off_period = data & 0xF;
		break ;
	case 18: // Display adjust register
		// !!! TODO !!!
		break ;
	case 19: // Interrupt line register
		// !!! TODO !!!
		break ;
	case 23: // Vertical offset register
		// !!! TODO !!!
		break ;

	// Blitter functionality (Incomplete)
	case 32: // Source X low register
	case 33: // Source X high register
	case 34: // Source Y low register 
	case 35: // Source Y high register
	case 36: // Destination X low register
	case 37: // Destination X high register
	case 38: // Destination Y low register 
	case 39: // Destination Y high register
	case 40: // Number of dots X low register
	case 41: // Number of dots X high register
	case 42: // Number of dots Y low register
	case 43: // Number of dots Y high register
	case 44: // Color register
	case 45: // Argument register
	case 46: // Command register
	}
}

// Video mode prototypes
V9938.prototype._video_modes = {
	 0: V9938.prototype.G1,
	 4: V9938.prototype.G2,
	 8: V9938.prototype.G3,
	12: V9938.prototype.G4,
	16: V9938.prototype.G5,
	20: V9938.prototype.G6,
	28: V9938.prototype.G7,
	 1: V9938.prototype.MC,
	 2: V9938.prototype.TEXT1,
	10: V9938.prototype.TEXT2
};

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
