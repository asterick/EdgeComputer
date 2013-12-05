Microcode
=========

The microcode is broken into 4 major categories:

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

[Microcode layout](../microcode/source.txt)
[Current source](../microcode/layout.txt)
