#!/usr/bin/env python
SINGLE = ["LSL", "ASL", "LSR", "EXTEND", "INC", "DEC"]
DUAL = ["ADD", "SUB", "XOR", "OR", "AND"]
BRANCH = ["JMP", "CALL"]
CONDITION = ["EQ", "NE", "CS", "CC", "MI", "PL", "VS", "VC", "HI", "LS", "GE", "LT", "GT", "LE"]

def GenMainTable():
	yield "RTI"
	yield "RET"
	yield "(SHIFT1)"

	# --- Stack block ---
	for x in ["A", "B", "C", "D", "E", "F", "X", "Y", "Z", "S"]:
		yield "PUSH %s" % x
		yield "POP %s" % x

	# --- Move block ---
	for x in ["BA", "DC", "FE"]:
		for y in ["X", "Y", "Z", "SP", "SSP", "ISP"]:
			yield "MOV %s, %s" % (x, y)
			yield "MOV %s, %s" % (y, x)

	for y in ["A", "B", "C", "D", "E", "F", "S"]:
		for x in ["A", "B", "C", "D", "E", "F", "S", "##"]:
			if not y in x:
				yield "MOV %s, %s" % (y, x)

	for y in ["X", "Y", "Z", "SP", "SSP", "ISP"]:
			yield "MOV %s, ###" % (y)

	# --- Arith block ---
	for a in SINGLE:
		yield "%s A" % (a)

	for a in DUAL:
		for y in ["A", "B", "C", "D", "E", "F", "#"]:
			yield "%s A, %s" % (a, y)

	for x in BRANCH:
		yield "%s +##" % x 
		for y in CONDITION:
			yield "%s.%s +##" % (x, y)

	yield "MEM[###]"

	for a in ["SP", "SSP"]:
		for x in ["+##", "-##"]:
			yield "MEM[%s%s]" % (a,x)

	for y in [None, "A", "B", "C", "D", "E", "F"]:
		for a in ["X", "Y", "Z"]:
			for x in [None, "#", "##"]:
				yield "MEM[%s]" % '+'.join([z for z in [a,y,x] if z])

def GenShift1Table():
	for x in ["X", "Y", "Z"]:
		for a in ["INC", "DEC"]:
			yield "%s %s" % (a, x)

	for x in ["B", "C", "D", "E", "F"]:
		for a in SINGLE:
			yield "%s %s" % (a, x)

	for x in ["B", "C", "D", "E", "F"]:
		for a in DUAL:
			for y in ["A", "B", "C", "D", "E", "F", "##"]:
				yield "%s %s, %s" % (a, x, y)

	for x in ["A", "B", "C", "D", "E", "F"]:
		for y in ["A", "B", "C", "D", "E", "F"]:
			if x != y:
				yield "DIV %s, %s" % (x, y)

		for y in ["BA", "DC", "FE"]:
			if not x in y:
				yield "MUL %s, %s" % (y, x)

	yield "ENTER A"
	yield "LEAVE X, A"

def GenMemTable():
	for x in ["X", "Y", "Z", "SP", "SSP", "ISP"]:
		yield "LEA %s" % x

	for x in ["[byte]", "[word]"]:
		for a in SINGLE:
			yield "%s %s" % (a, x)

		for a in DUAL:
			for y in ["A", "B", "C", "D", "E", "F"]:
				yield "%s %s, %s" % (a, x, y)
				yield "%s %s, %s" % (a, y, x)

	for x in BRANCH:
		yield x
		yield "%s ind" % x		
 		
 		for y in CONDITION:
			yield "%s.%s" % (x, y)

	for y in ["X", "Y", "Z"]:
		yield "COPY [#], [%s++]" % (y)
		yield "COPY [%s++], [#]" % (y)
		for x in ["++", "--"]:
			yield "COPY [%s%s], [#%s]" % (y, x, x)


	yield "TLB INDEX, [#]"
	yield "TLB INDEX, [#]++"
	for a in ["BANK", "FLAG"]:
		yield "TLB %s, [##]" % a

def GenTable(inst):
	inst = [x for x in inst]

	print "-" * 80
	for i in range(16):
		print '\t'.join(inst[i::16])

	return len(inst)

totals = [GenTable(l()) for l in GenMainTable, GenShift1Table, GenMemTable]
print [t / 2.56 for t in totals]
