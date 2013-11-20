body
  = _ o:opcode*
  	{ return o; }

opcode
  = "opcode"i _ "(" _ o:number _  ")" _ b:block
  	{ return { type: "opcode", code:o, expressions: b }; }

block
  = "{" _ list:statement* _ "}" _
  	{ return list; }

statement
  = if
  / goto
  / label
  / microcode

if
  = "if"i _ "(" _ invert:"!"? _ condition:identifier ")" _ statements:block otherwise:else?
  	{ return { type: 'if', invert: Boolean(invert), condition: condition, otherwise: otherwise || null, statements: statements }; }

else
  = "else"i _ b:block
  	{ return b; }

label
	= l:identifier ":" _
		{ return { type: "label", label: l }; }

goto
	= "goto" whitespace+ l:identifier ";" _
		{ return { type: "goto", label: l }; }

microcode
  = a:expression b:(","_ v:expression { return v; })* ";" _
  	{ return [a].concat(b); }

expression
	= "priviledged"i _
		{ return { type: "flag", name: "priviledged"}; }
	/ address:address "=" _ target:mdr_byte
		{ return { type: "databus", address: address, direction: "write", target: target }; }
	/ target:mdr_byte "=" _ address:address
		{ return { type: "databus", address: address, direction: "read", target: target }; }
	/ targets:target_list "=" _ expression:z_bus
		{ return { type: "assign", targets:targets, expression: expression }; }

target_list
	= "(" _ a:z_target b:("," _ v:z_target { return v; })* ")" _
		{ return [a].concat(b); }
	/ z_target

z_target
	= "a"i v:[1-4] ".h"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "high" }; }
	/ "a"i v:[1-4] ".l"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "low" }; }
	/ "r"i v:[1-6] _
		{ return { type: 'register', register: parseInt(v, 10) }; }
	/ "msr"i _
		{ return { type: 'status' }; }
	/ "mdr"i _
		{ return { type: 'data' }; }
	/ "flags"i _
		{ return { type: 'flags' }; }
	/ "tlb."i v:("index"i / "bank"i / "flags"i) _
		{ return { type: 'tlb', register: v }; }

mdr_byte
	= "mdr.h"
		{ return { type: 'data' }; }
	/ "mdr.l" _
		{ return { type: 'data' }; }

address
	= absolute:"#"? "[" _ a:address_reg _ "]" _
		{ return { type: 'address', register: a, absolute: Boolean(absolute) }; }

address_reg
	= "a"i v:[1-4]
		{ return parseInt(v, 10); }

z_bus
	= o:prefix r:l_bus ("+" _ c:carry)?
		{ return { type: "unary", term: r, carry: c || null }; }
	/ l:l_bus o:infix r:r_bus c:("+" _ c:carry { return c; })?
		{ return { type: "binary", left: l, right: r, operator: o, carry: c || null }; }
	/ l_bus

l_bus
	= "a"i v:[1-4] ".h"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "high" }; }
	/ "a"i v:[1-4] ".l"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "low" }; }
	/ "r"i v:[1-6] _
		{ return { type: 'register', register: parseInt(v, 10) }; }
	/ "msr"i _
		{ return { type: 'status' }; }
	/ "mdr"i _
		{ return { type: 'data' }; }

r_bus
	= "mdr"i _
		{ return { type: 'data' }; }
	/ "fault_code"i _
		{ return { type: 'data' }; }
	/ "irq_vector"i _
		{ return { type: 'data' }; }
	/ number

carry
	= "0" _
		{ return { type: "fixed", value: 0 }; }
	/ "1" _
		{ return { type: "fixed", value: 1 }; }
	/ "c" _
		{ return { type: "carry" }; }
	/ "top" _	
		{ return { type: "top" }; }

prefix
	= v:("left" / "right") whitespace+
		{ return v; }

infix
	= v:("+" / "-" / "xor" / "and" / "or") whitespace+
		{ return v; }


// atomic values
identifier
	= v:[a-zA-Z0-9]+ _
		{ return v.join('').toLowerCase(); }

number
  = "0x"i v:[0-9a-fA-F]+ _
		{ return parseInt(v.join(''), 16); }
	/ v:[0-9]+ _
		{ return parseInt(v.join(''), 10); }

// These are whitespace tokens, ignored
_
  = whitespace*

whitespace
  = [ \n\r\t]
  / comment

comment
  = "/*" (!"*/" .)* "*/"
  / "//" (!"\n" .)* "\n"
