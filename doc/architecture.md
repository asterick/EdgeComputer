Architecture
============

Should describe the microcode layout here, but it's described in [layout.txt](../microcode/layout.txt)

Specs
-----

* 24 Addressing bus
* 8-bit data bus
* 6 General Purpose registers (16bit)
* 4 Addressing registers (24bit) | 4
* Memory management - 16-index TLB (4k pages)
* Minimal 16-bit ALU
* 8k x 48 microcode storage

Unmapped hardware (no space allocated)
-----------------
* V9938 Video (192k DRAM)
	* 4 bytes mapped
* YM3812 OPL2 audio
	* 2 bytes mapped
* IDE harddrive bus (single port)

TODO: _Removable drive?_

Memory map
----------

Range | Mapping
--- | ---
0x000000 ~ 0x07FFFF | BIOS (flash)
0x080000 ~ 0x0FFFFF | Hardware space
0x100000 ~ 0x7F0000 | Unmapped
0x800000 ~ 0xFFFFFF | SRAM

