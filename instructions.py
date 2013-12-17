SINGLE = ["LSL", "ASL", "LSR", "EXTEND"]
DUAL = ["ADD", "SUB", "XOR", "OR", "AND"]
BRANCH = ["JMP", "CALL"]
CONDITION = ["EQ", "NE", "CS", "CC", "MI", "PL", "VS", "VC", "HI", "LS", "GE", "LT", "GT", "LE"]

def GenMainTable():
	yield "ENTER A"
	yield "RTI"
	yield "RET"
	yield "NOP"
	yield "(MATH)"

	for a in ["INDEX","BANK", "FLAG"]:
		yield "TLB %s, A" % a

	for x in ["BA", "DC", "FE"]:
		for y in ["X", "Y", "Z", "SP", "SSP", "ISP"]:
			yield "MOV %s, %s" % (x, y)
			yield "MOV %s, %s" % (y, x)

	for x in ["A", "B", "C", "D", "E", "F", "X", "Y", "Z", "S"]:
		yield "PUSH %s" % x
		yield "POP %s" % x

	for y in ["A", "B", "C", "D", "E", "F", "S"]:
		for x in ["A", "B", "C", "D", "E", "F", "S", "##"]:
			if not y in x:
				yield "MOV %s, %s" % (y, x)

	for y in [None, "A", "B", "C", "D", "E", "F"]:
		for a in ["X", "Y", "Z"]:
			for x in [None, "#", "##"]:
				yield "[%s]" % '+'.join([z for z in [a,y,x] if z])

	for a in ["SP", "SSP"]:
		for x in ["+##", "-##"]:
			yield "[%s%s]" % (a,x)

	for a in SINGLE:
		yield "%s A" % (a)

	for a in DUAL:
		for y in ["A", "B", "C", "D", "E", "F", "#"]:
			yield "%s A, %s" % (a, y)

	for x in BRANCH:
		yield "%s +##" % x 
		for y in ["Z", "C", "N", "GT", "GE", "HI", "NZ", "NC", "P", "LE", "LT", "LE"]:
			yield "%s.%s +##" % (x, y)

def GenArithTable():
	for x in ["A", "B", "C", "D", "E", "F"]:
		for y in ["A", "B", "C", "D", "E", "F"]:
			if x != y:
				yield "DIV %s, %s" % (x, y)

	for x in ["B", "C", "D", "E", "F"]:
		for a in SINGLE:
			yield "%s %s" % (a, x)

		for a in DUAL:
			for y in ["A", "B", "C", "D", "E", "F", "#", "##"]:
				if x != y:
					yield "%s %s, %s" % (a, x, y)

	for x in ["A", "B", "C", "D", "E", "F"]:
		for a in ["MUL"]:
			for y in ["BA", "DC", "FE"]:
				if not x in y:
					yield "%s %s, %s" % (a, y, x)

	for x in ["CPY.II", "CPY.ID", "CPY.DI", "CPY.DD", "CPY.TO", "CPY.FROM"]:
		yield x

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

def GenTable(inst):
	inst = [x for x in inst]

	print "-" * 80
	for i in range(16):
		print '\t'.join(inst[i::16])

	return len(inst)

totals = [GenTable(l()) for l in GenMainTable, GenArithTable, GenMemTable]
print [t / 2.55 for t in totals]
