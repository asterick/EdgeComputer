body
  = _ o:top_level*
  	{ return o; }

top_level
	= opcode
  / import
	/ macro

import
  = "import"i _ s:string _
    { return { type: "import", file:s }; }

opcode
  = "state"i _ "(" _ o:number _  ")" _ b:block
  	{ return { type: "opcode", code:o, expressions: b }; }
  / "default"i _ "(" _ s:number "," _ e:number ")" _ b:block
  	{ return { type: "default", start:s, end: e, expressions: b }; }

macro
	= "macro"i _ name:identifier args:identifiers statements:block
		{ return { type: "macro", name: name, arguments: args, statements: statements }; }

identifiers
  = "(" _ a:identifier b:("," _ b:identifier { return b; })* ")" _
    { return [a].concat(b); }
  / 
    { return []; }

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
	= "#" _ name:identifier args:arguments ";" _
		{ return { type: 'include', name: name, arguments: args }; }

arguments
  = "(" _ a:argument b:("," _ b:argument { return b; })* ")" _
    { return [a].concat(b); }
  / 
    { return []; }

argument
  = register
  / address_reg
  / immediate

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
	= "goto" whitespace+ l:branch_target ";" _
		{ return { type: "goto", target: l }; }

branch_target
  = register
  / immediate  
  / i:identifier
    { return { type: "identifier", name: i }; }

microcode
  = e:expression ";" _
    { return { type: "microcode", statement: e }; }

expression
  = v:flag
    { return { type: "flag", name: v } }
  / math
  / access
  / inc_addr

inc_addr
  = a:address_reg  op:postOp
    { return { type: "address_op", address: a, operation: op }; }

flag
  = v:("privileged"i) _
    { return v; }

next
  = "next"i _ "(" _ r:register ")" _
    { return { type: 'next', register: r }; }
  / "next"i _ "(" _ n:number ")" _
    { return { type: 'next', state: n }; }

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
  = phy:"#"? "[" _ r:address_reg op:postOp "]" _
    { return { type: "address", address: r, operation:op, physical: Boolean(phy) }; }

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
  = "msr"i _
    { return { type: "status" }; }
  / "flags"i _
    { return { type: "flags" }; }
  / address_reg_byte
  / register
  / tlb_register

tlb_register
  = "tlb."i v:("index" / "bank" / "flags") _
    { return { type: 'tlb', register: v.toLowerCase() }; }

address_reg_byte
  = r:address_reg b:byte _
    { return { type:"address_reg", byte: b, register: r }; }

alu_math
  = l_bus:l_bus op:infix r_bus:r_bus carry:carry
    { return { type: 'binary', operation: op, left: l_bus, right: r_bus, carry: carry }; }
  / op:prefix l_bus:l_bus carry:carry
    { return { type: 'unary', operation: op, value: l_bus, carry: carry }; }
  / l_bus:l_bus
    { return { type: 'move', value: l_bus }; }
  / r_bus:r_bus
    { return { type: 'binary', operation: "or", left: { type: "immediate", value: 0 }, right: r_bus, carry: false }; }

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
  = immediate
  / address_reg_byte
  / register

r_bus
  = immediate
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

// --- Replacible terms ---
address_reg
  = "a"i r:[0-7] _
    { return { type: 'address', index: parseInt(r, 10) }; }
  / ":" i:identifier
    { return { type: 'identifier', name: i }; }

register
  = "r"i r:[0-7] _
    { return { type: 'register', index: parseInt(r, 10) }; }
  / ":" i:identifier
    { return { type: 'identifier', name: i }; }

immediate
  = n:number
    { return { type: "immediate", value:n }; }
  / ":" i:identifier
    { return { type: 'identifier', name: i }; }

// --- atomic values ---
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

string
  = '"' c:(!'"' c:. { return c; })* '"'
    { return c.join(''); }
  / "'" c:(!"'" c:. { return c; })* "'"
    { return c.join(''); }

// These are whitespace tokens, ignored
_
  = whitespace*

whitespace
  = [ \n\r\t]
  / comment

comment
  = "/*" (!"*/" .)* "*/"
  / "//" (!"\n" .)* "\n"
