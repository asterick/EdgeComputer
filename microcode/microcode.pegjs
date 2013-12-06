body
  = _ o:top_level*
  	{ return o; }

top_level
	= opcode
	/ macro

opcode
  = "opcode"i _ "(" _ o:number _  ")" _ b:block
  	{ return { type: "opcode", code:o, expressions: b }; }
  / "default"i _ "(" _ s:number "," _ e:number ")" _ b:block
  	{ return { type: "default", start:s, end: e, expressions: b }; }

macro
	= "macro"i _ name:identifier statements:block
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
	= v:("hi"i / "gt"i / "ge"i / "c"i / "z"i / "n"i / "v"i) _
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
  = e:expression t:("," _ e:expression { return e; })* ";" _
    { return { type: "microcode", statements: [e].concat(t) }; }
  / ";" _
  	{ return { type: "microcode", statements: [] }; }

expression
  = v:flag
    { return { type: "flag", name: v } }
  / next
  / inc_addr
  / access
  / math

inc_addr
  = "a"i r:[0-7] _  op:postOp
    { return { type: "address_op", address: parseInt(r, 10), operation: op }; }

flag
  = v:("privileged"i) _
    { return v; }

next
  = "next"i _ "(" _ r:register ")" _
    { return { type: 'next', register: r }; }

access
  = r:register_byte "=" _ m:memory
    { return { type: "access", direction: "read", register: r, memory: m }; }
  / m:memory "=" _ r:register_byte
    { return { type: "access", direction: "write", register: r, memory: m }; }

register_byte
  = r:register b:byte _
    { return { register: r, byte:b }; }

byte
  = ".h"i
    { return "high"; }
  / ".l"i
    { return "low"; }

memory
  = phy:"#"? "[" _ "a" r:[0-7] _  op:postOp "]" _
    { return { type:"address", address: parseInt(r, 10), operation:op, physical: Boolean(phy) }; }

postOp
  = "++" _
    { return "increment"; }
  / "--" _
    { return "decrement"; }
  / _
    { return "none"; }

math
  = targets:zbus_latches "=" _ operation:alu_math
    { return { type: "alu", targets: targets, operation: operation }; }

zbus_latches
  = a:zbus_target
    { return [a]; }
  / "(" _ a:zbus_target b:("," _ b:zbus_target { return b; })* ")" _
    { return [a].concat(b); }

zbus_target
  = "msr"i
    { return { type: "status" }; }
  / "flags"i
    { return { type: "flags" }; }
  / address_reg
  / register
  / tlb_register

tlb_register
  = "tlb."i v:("index" / "bank" / "flags")
    { return { type: 'tlb', register: v.toLowerCase() }; }

address_reg
  = r:"a"i r:[0-7] b:byte _
    { return { type:"address_reg", byte: b, register: parseInt(r, 10) }; }

register
  = "r"i r:[0-7] _
    { return { type: 'register', index: parseInt(r, 10) }; }

alu_math
  = l_bus:l_bus op:infix r_bus:r_bus carry:carry
    { return { type: 'binary', operation: op, left: l_bus, right: r_bus, carry: carry }; }
  / op:prefix l_bus:l_bus carry:carry
    { return { type: 'unary', operation: op, value: l_bus, carry: carry }; }
  / l_bus:l_bus
    { return { type: 'move', value: l_bus }; }

prefix
  = ">>>" _
    { return "arithmatic-left"; }
  / ">>" _
    { return "logical-left"; }
  / "<<" _
    { return "logical-right"; }

infix
  = "+" _
    { return "add"; }
  / "-" _
    { return "sub"; }
  / "^" _
    { return "xor"; }
  / "&" _
    { return "and"; }
  / "|" _
    { return "or"; }

l_bus
  = n:number
    { return { type: "immediate", value:n }; }
  / address_reg
  / register

r_bus
  = n:number
    { return { type: "immediate", value:n }; }
  / "msr"i _
    { return { type: "status" }; }
  / "fault_code"i _
    { return { type: "fault_code" }; }
  / register

carry
  = "+" _ "c"i _
    { return true; }
  / _
    { return false; }

// atomic values
identifier
	= v:[a-zA-Z0-9_]+ _
		{ return v.join('').toLowerCase(); }

number
  = "0x"i v:[0-9a-fA-F]+ _
		{ return parseInt(v.join(''), 16); }
  / "0b"i v:[01]+ _
		{ return parseInt(v.join(''), 2); }
	/ "0" v:[0-7]+
		{ return parseInt(v.join(''), 8); }
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
