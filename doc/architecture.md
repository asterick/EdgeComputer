Architecture
============

The EdgeCPU is designed to be very memory intensive, while reducing the size of the instruction word
without compromizing on speed or ability.  To get around this, the machine is signed with a large
number of semi-ortho registers (in abundance) organized in 16x8 register files.  Additionally, there
is a general purpose ALU, as well as a simple incrementer used for address modifications.

The bulk of the machine's complexity comes from the use of a TLB for memory management, which may
eventually be moved to a CPLD for the sake of performance.

Currently, the external hardware is unmapped as I've not decided how I want to handle removable media.
3.5" floppy is very likely going to be the direction taken for this, but will require a controller.

Specs
-----

* 8k x 48 microcode storage
* 24x8 memory interface
* dual ALU: 16-bit general, 24-bit incrementer (address)
* Memory management - 16-index TLB (4k pages)
* 8 General Purpose registers (16bit, one allocated for scratch)
* 8 Addressing registers (32bit)

Unmapped hardware
-----------------
* V9938 Video (192k DRAM)
	* 4 bytes mapped
* YM3812 OPL2 audio
	* 2 bytes mapped
* Super I/O
	* IDE, UART, Parallel port and Floppy controller
	* 2048 bytes mapped

Memory map
----------

              Range |     Type | Description
------------------- | -------- | -------------------
0x000000 ~ 0x07FFFF |     BIOS | Socketed Flash
0x080000 ~ 0x0FFFFF | Hardware | 512kB space allocated for additinal hardware
0x100000 ~ 0x3F0000 |      RAM | Hardwired SRAM 
0x400000 ~ 0xFFFFFF |     DRAM | 3x 30-pin simm

