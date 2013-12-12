Microcode
=========

The microcode is broken into 4 major categories:
* Control flags
  * privileged
* 16-bit ALU
  * latch_aflags, latch_zflags, latch_tlb, latch_zreg, z_reg, l_select, r_select, imm_bit, imm_offset, imm_invert, carry, alu_op, l_term, r_term
* Memory bus
  * disable_tlb, mem_active, mem_byte, mem_dir, mem_addr, mem_addr_op
* Next State
  * cond_src, condition, next_state

Current layout
--------------

       Field | Width | Description
------------ | ----- | -----------
  privileged |     1 | 1: Will produce privileged fault if MSR.SV is not set
 disable_tlb |     1 | 1: Memory access will not use virtual space
  mem_active |     1 | 0: Bus inactive
    mem_byte |     1 | 0: Lower byte / 1: High byte (r_select register)
     mem_dir |     1 | 0: Read / 1: Write
    mem_addr |     3 | a0 ... a7
 mem_addr_op |     2 | none, mem_addr++, none, mem_addr--
latch_aflags |     1 | alu flags  -> MSR[3:0]
latch_zflags |     1 | alu result -> MSR[15:0]
   latch_tlb |     2 | none, index, bank, flags
  latch_zreg |     2 | none, reg, addr.l, addr.h
       z_reg |     3 | a0..a7, r0..r7
    l_select |     3 | r0..r7 -> l_term (when used)
    r_select |     3 | r0..r7 -> r_term (when used), mem_bus (read / write)
     imm_bit |     4 | imm = 1 << value
  imm_offset |     1 | imm = imm - ~value
  imm_invert |     1 | imm = value ? ~imm : imm
       carry |     1 | 0: 0, 1: MSR.carry
      alu_op |     3 | or, and, xor, asl, lsl, sr, add, sub
      l_term |     2 | imm, l_reg, addr.l, addr.h
      r_term |     2 | imm, r_reg, msr, fault
    cond_src |     1 | 0: flags, 1: alu
   condition |     3 | never, hi, ge, gt, c, z, v, n
  next_state |    13 | 0 ... 8191

Total bit size: **56** ( _7 bytes_ )

**NOTE:** Immediates are designed to cover most of the instruction constants, not general purpose ones

The compiler
------------

The compiler handles inserting opcodes into the 8Kx57 rom, currently with a very naive fitter.
If I ever hit my instruction limit, I'll make it do tail optimization to reduce the number of
repeated instructions required for doing things like loading the next byte.

After a major refactor, the compiler is a little smarter.  It features inlining macros that support
most of the atomic terms (registers and immediates).  It also does not allow compounded statements
any longer, as the fitter will not combine sequential statements that are safe to execute in the
pipeline (legibility / macroing).

Wishlist
--------
 * Tail optimizing fitter (space)
 * Safe microcode block reordering (speed, can be done by hand)

[Microcode layout](../microcode/source.txt)
[Current source](../microcode/layout.txt)
