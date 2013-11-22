body
  = _ o:top_level*
  	{ return o; }

top_level
	= opcode
	/ macro

opcode
  = "opcode"i _ "(" _ o:number _  ")" _ b:block
  	{ return { type: "opcode", code:o, expressions: b }; }
  / "default"i _ b:block
  	{ return { type: "default", expressions: b }; }

macro
	= "macro"i _ "(" _ name:identifier ")" _ statements:block
		{ return { type: "macro", name: name, statements: statements }; }

block
  = "{" _ list:statement* _ "}" _
  	{ return list; }

statement
  = if
  / include
  / goto
  / label
  / microcode

include
	= "#" _ name:identifier ";" _
		{ return { type: 'include', name: name }; }

if
  = "if"i _ "(" _ immediate:"@"? _ invert:"~"? _ condition:condition ")" _ statements:block otherwise:else?
  	{ return { type: 'if', immediate: Boolean(immediate), invert: Boolean(invert), condition: condition, otherwise: otherwise || null, statements: statements }; }

condition
	= v:("never"i / "ab"i / "gt"i / "ge"i / "c"i / "s"i / "v"i / "n"i) _
		{ return v.toLowerCase(); }

else
  = "else"i _ b:block
  	{ return b; }

label
	= l:identifier ":" _ &(microcode / include)
		{ return { type: "label", label: l }; }

goto
	= "goto" whitespace+ l:identifier ";" _
		{ return { type: "goto", label: l }; }

microcode
  = a:expression b:(","_ v:expression { return v; })* ";" _
  	{ return { type: "microcode", statements: [a].concat(b) }; }
  / ";" _
  	{ return { type: "microcode", statements: [] }; }

expression
	= "privileged"i _
		{ return { type: "flag", name: "privileged"}; }
	/ address:address "=" _ target:mdr_byte
		{ return { type: "databus", address: address, direction: "write", target: target }; }
	/ target:mdr_byte "=" _ address:address
		{ return { type: "databus", address: address, direction: "read", target: target }; }
	/ targets:target_list "=" _ expression:z_bus
		{ return { type: "assign", targets:targets, expression: expression }; }

target_list
	= "(" _ a:z_target b:("," _ v:z_target { return v; })* ")" _
		{ return [a].concat(b); }
	/ v:z_target
		{ return [v]; }

z_target
	= "a"i v:[0-3] ".h"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "high" }; }
	/ "a"i v:[0-3] ".l"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "low" }; }
	/ "r"i v:[0-5] _
		{ return { type: 'register', register: parseInt(v, 10) }; }
	/ "msr"i _
		{ return { type: 'status' }; }
	/ "mdr"i _
		{ return { type: 'data' }; }
	/ "flags"i _
		{ return { type: 'flags' }; }
	/ "tlb."i v:("index"i / "bank"i / "flags"i) _
		{ return { type: 'tlb', register: v.toLowerCase() }; }

mdr_byte
	= "mdr.h"i _
		{ return { type: 'data', byte: "high" }; }
	/ "mdr.l"i _
		{ return { type: 'data', byte: "low" }; }

address
	= absolute:"#"? "[" _ a:address_reg _ "]" _
		{ return { type: 'address', register: a, absolute: Boolean(absolute) }; }

address_reg
	= "a"i v:[0-3]
		{ return parseInt(v, 10); }

z_bus
	= o:prefix r:l_bus c:("+" _ c:carry  { return c; })?
		{ return { type: "unary", term: r, operator: o, carry: c || null }; }
	/ l:l_bus o:infix r:r_bus c:("+" _ c:carry { return c; })?
		{ return { type: "binary", left: l, right: r, operator: o, carry: c || null }; }
	/ l_bus

l_bus
	= "a"i v:[0-3] ".h"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "high" }; }
	/ "a"i v:[0-3] ".l"i _
		{ return { type: 'address', register: parseInt(v, 10), word: "low" }; }
	/ "r"i v:[0-5] _
		{ return { type: 'register', register: parseInt(v, 10) }; }
	/ "msr"i _
		{ return { type: 'status' }; }
	/ "mdr"i _
		{ return { type: 'data' }; }

r_bus
	= "mdr"i _
		{ return { type: 'data' }; }
	/ "fault_code"i _
		{ return { type: 'fault' }; }
	/ "irq_vector"i _
		{ return { type: 'irq' }; }
	/ number

carry
	= "0" _
		{ return { type: "fixed", value: 0 }; }
	/ "1" _
		{ return { type: "fixed", value: 1 }; }
	/ "c"i _
		{ return { type: "carry" }; }
	/ "top"i _	
		{ return { type: "top" }; }

prefix
	= v:("left" / "right" / "swap") whitespace+
		{ return v.toLowerCase(); }

infix
	= v:("+" / "-" / "xor" / "and" / "or") whitespace+
		{ return v.toLowerCase(); }


// atomic values
identifier
	= v:[a-zA-Z0-9_]+ _
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
