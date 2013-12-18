#!/usr/bin/env python
import itertools

# Registers
ADDRESS = ["X", "Y", "Z"]
GENERAL = ["A", "B", "C", "D", "E", "F"]
STATUS = ["S"]
WORD = ["BA", "DC", "FE"]
STACK = ["SP", "SSP"]
POINTER = STACK + ["ISP"]

REGISTERS = ADDRESS + GENERAL

SINGLE = ["LSL", "ASL", "LSR", "EXTEND", "INC", "DEC"]
BITWISE = ["AND", "OR", "XOR"]
DUAL = ["ADD", "SUB"] + BITWISE
BRANCH = ["JMP", "CALL"]
INVERT = ["NEG", "CPL"]
INCREMENT = ["INC", "DEC"]

CONDITION = ["EQ", "NE", "CS", "CC", "MI", "PL", "VS", "VC", "HI", "LS", "GE", "LT", "GT", "LE"]

# * Missing ADC and SBC

def GenMainTable():
	yield "RTI"
	yield "RET"

	# --- Stack block ---
	for x in REGISTERS + STATUS:
		yield "PUSH %s" % x
		yield "POP %s" % x

	# --- Move block ---
	for y in ADDRESS + POINTER:
		yield "MOV %s, ###" % (y)
		for x in WORD:
			yield "MOV %s, %s" % (x, y)
			yield "MOV %s, %s" % (y, x)

	for y in GENERAL + STATUS:
		for x in GENERAL + STATUS + ["##"]:
			if y != x:
				yield "MOV %s, %s" % (y, x)

	# --- Arith block ---
	for a in SINGLE:
		yield "%s %s" % (a, GENERAL[0])

	for a in DUAL:
		for y in GENERAL + ["#"]:
			yield "%s %s, %s" % (a, GENERAL[0], y)

	for x in BRANCH:
		yield "%s +##" % x
		for y in CONDITION:
			yield "%s.%s +##" % (x, y)

	# --- EXT codes ---
	yield "(SHIFT1)"
	yield "(SHIFT2)"

	# --- Memory function ---
	yield "MEM[###]"

	for a in STACK:
		for x in ["+##", "-##"]:
			yield "MEM[%s%s]" % (a,x)

	for y in [None] + GENERAL:
		for a in ADDRESS:
			for x in [None, "#", "##"]:
				yield "MEM[%s]" % '+'.join([z for z in [a,y,x] if z])

def GenShift1Table():
	# --- Address math ---
	for x in ADDRESS:
		for a in INCREMENT:
			yield "%s %s" % (a, x)

	for x in GENERAL:
		for y in INVERT:
			yield "%s %s" % (y, x)

	# --- Arith codes ---
	for x in GENERAL[1:]:
		for a in SINGLE:
			yield "%s %s" % (a, x)

	for x in GENERAL[1:]:
		for a in DUAL:
			for y in GENERAL + ["##"]:
				yield "%s %s, %s" % (a, x, y)

	for y in GENERAL + ["##"]:
		yield "ENTER %s" % y

	for x in BITWISE:
		for y in GENERAL + ["##", "#"]:
			yield "%s S, %s" % (x, y)

def GenShift2Table():
	for x in GENERAL:
		for y in GENERAL + ["##"]:
			for z in ["ADC", "SBC"]:
				yield "%s %s, %s" % (z, x, y)

	for x in GENERAL:
		for y in WORD:
			if not x in y:
				yield "MUL %s, %s" % (y, x)
		for y in GENERAL:
			if x != y:
				yield "DIV %s, %s" % (x, y)

	for x in WORD:
		for a in SINGLE:
			yield "%s %s" % (a, x)
		for y in WORD:
			for a in DUAL:
				yield "%s %s, %s" % (a, x, y)

def GenMemTable():
	for x in ADDRESS + POINTER:
		yield "LEA %s, $ea" % x

	for x in ["[$ea].b", "[$ea].h"]:
		for a in SINGLE:
			yield "%s %s" % (a, x)

		for a in DUAL + ["MOV"]:
			for y in GENERAL + STATUS:
				yield "%s %s, %s" % (a, x, y)
				yield "%s %s, %s" % (a, y, x)

	for x in BRANCH:
		yield "%s $ea" % x
		yield "%s [$ea]" % x

 		for y in CONDITION:
			yield "%s.%s $ea" % (x, y)

	for y in ADDRESS:
		yield "COPY [$ea].b, [%s++]" % (y)
		yield "COPY [%s++], [$ea].b" % (y)
		for x in ["++", "--"]:
			yield "COPY [%s%s], [$ea%s].b" % (y, x, x)

	# --- PRIVILEGED INSTRUCTIONS ---
	yield "TLB INDEX, [$ea].b"
	yield "TLB INDEX, [$ea].b++"
	for a in ["BANK", "FLAG"]:
		yield "TLB %s, [$ea].h" % a

	for a in GENERAL:
		yield "LEAVE $ea, %s" % a
		yield "LEAVE [$ea], %s" % a

def GenTable(inst):
	inst = [x for x in inst]

	k = len(inst)
	if k > 0x100:
		raise Exception("Table size overflow")

	inst += ['-'] * (0x100 - k)

	print "-" * 80
	for i in range(0,0x100,0x10):
		print '\t'.join(inst[i:i+16])

	return k

totals = [GenTable(l()) / 2.56 for l in GenMainTable, GenShift1Table, GenShift2Table, GenMemTable]
print totals
