#!/usr/bin/env python
# TODO: MODIFY THIS TO GENERATE MICROCODE SOURCE, AND ASSEMBLER TABLE

import itertools, json

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
	yield { "instruction": "RTI" }
	yield { "instruction": "RET" }

	# --- Stack block ---
	for x in REGISTERS + STATUS:
		yield { "instruction": "PUSH", "terms": [x] }
		yield { "instruction": "POP", "terms": [x] }

	# --- Move block ---
	for y in ADDRESS + POINTER:
		yield { "instruction": "MOV", "terms": [y, "###"] }
		for x in WORD:
			yield { "instruction": "MOV", "terms": [y, x] }
			yield { "instruction": "MOV", "terms": [x, y] }

	for y in GENERAL + STATUS:
		for x in GENERAL + STATUS + ["##"]:
			if y != x:
				yield { "instruction": "MOV", "terms": [y, x] }

	# --- Arith block ---
	for a in SINGLE:
		yield { "instruction": a, "terms": [GENERAL[0]] }

	for a in DUAL:
		for y in GENERAL + ["#"]:
			yield { "instruction": a, "terms": [GENERAL[0], y] }

	for x in BRANCH:
		yield { "instruction": x, "terms": ["+/-##"] }
		for y in CONDITION:
			yield { "instruction": x, "condition": y, "terms": ["+/-##"] }

	# --- EXT codes ---
	yield { "shift_table": 0x200 }
	yield { "shift_table": 0x300 }

	# --- Memory function ---
	yield { "shift_table": 0x400, "effective_address": ["###"] }

	for a in STACK:
		yield { "shift_table": 0x400, "effective_address": [a, "+/-###"] }

	for y in [None] + GENERAL:
		for a in ADDRESS:
			for x in [None, "#", "##"]:
				yield { "shift_table": 0x400, "effective_address": [z for z in [a,y,x] if z] }

def GenShift1Table():
	# --- Address math ---
	for x in ADDRESS:
		for a in INCREMENT:
			yield { "instruction": a, "terms": [x] }

	for x in GENERAL:
		for y in INVERT:
			yield { "instruction": y, "terms": [x] }

	# --- Arith codes ---
	for x in GENERAL[1:]:
		for a in SINGLE:
			yield { "instruction": a, "terms": [x] }

	for x in GENERAL[1:]:
		for a in DUAL:
			for y in GENERAL + ["##"]:
				yield { "instruction": a, "terms": [x, y] }

	for y in GENERAL + ["##"]:
		yield { "instruction": "ENTER", "terms": [y] }

	for x in BITWISE:
		for y in GENERAL + ["##", "#"]:
			yield { "instruction": x, "terms": ["S", y] }

def GenShift2Table():
	for x in GENERAL:
		for y in GENERAL + ["##"]:
			for z in ["ADC", "SBC"]:
				yield { "instruction": z, "terms": [x, y] }

	for x in GENERAL:
		for y in WORD:
			if not x in y:
				yield { "instruction": "MUL", "terms": [y, x] }
		for y in GENERAL:
			if x != y:
				yield { "instruction": "DIV", "terms": [x, y] }

	for x in WORD:
		for a in SINGLE:
			yield { "instruction": a, "terms": [x] }
		for y in WORD:
			for a in DUAL:
				yield { "instruction": a, "terms": [x, x] }

def GenMemTable():
	for x in ADDRESS + POINTER:
		yield { "instruction": "LEA", "terms": [x, "$ea"] }

	for x in ["byte", "word"]:
		for a in SINGLE:
			yield { "instruction": a, "width": x, "terms": ["[$ea]"] }

		for a in DUAL + ["MOV"]:
			for y in GENERAL + STATUS:
				yield { "instruction": a, "width": x, "terms": [y, "[$ea]"] }
				yield { "instruction": a, "width": x, "terms": ["[$ea]", y] }

	for x in BRANCH:
		yield { "instruction": x, "terms": ["$ea"] }
		yield { "instruction": x, "width": "long", "terms": ["[$ea]"] }

 		for y in CONDITION:
			yield { "instruction": x, "condition": y, "terms": ["$ea"] }

	for y in ADDRESS:
		yield { "instruction": "COPY", "width": "byte", "terms": ["[$ea]", "["+y+"++]"] }
		yield { "instruction": "COPY", "width": "byte", "terms": ["["+y+"++]", "[$ea]"] }
		for x in ["++", "--"]:
			yield { "instruction": "COPY", "width": "byte", "terms": ["["+y+x+"]", "[$ea"+x+"]"] }

	# --- PRIVILEGED INSTRUCTIONS ---
	yield { "instruction": "TLB", "width": "byte", "terms": ["INDEX", "[$ea]"] }
	yield { "instruction": "TLB", "width": "byte", "terms": ["INDEX", "[$ea]++"] }

	for a in ["BANK", "FLAG"]:
		yield { "instruction": "TLB", "width": "word", "terms": [a, "[$ea]"] }

	for a in GENERAL:
		yield { "instruction": "LEAVE", "terms": ["$ea", a] }
		yield { "instruction": "LEAVE", "width": "long", "terms": ["[$ea]", a] }

def GenTable(inst):
	inst = [x for x in inst()]

	if len(inst) > 0x100:
		raise Exception("Table size overflow")

	return inst

output = { hex((i+1)*0x100):GenTable(t) for (i, t) in enumerate([GenMainTable, GenShift1Table, GenShift2Table, GenMemTable]) }
file("table.json", "w").write(json.dumps(output, indent=4))
