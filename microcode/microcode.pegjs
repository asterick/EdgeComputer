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

// --- Blocks and statements ---
block
  = "{" _ list:statement* _ "}" _
  	{ return list; }

statement
  = if
  / include
  / goto
  / label
  / microcode

// -- macroing
include
	= "#" _ name:identifier args:arguments ";" _
		{ return { type: 'include', name: name, arguments: args }; }

arguments
  = "(" _ a:term b:("," _ b:term { return b; })* ")" _
    { return [a].concat(b); }
  / 
    { return []; }


// --- Microcode statements ----
microcode
  = e:expression ";" _
    { return { type: "microcode", statement: e }; }

expression
  = assignment
  / increment
  / v:identifier
    { return { type: "flag", name: v } }

next
  = "next"i _ "(" _ r:register ")" _
    { return { type: 'next', register: r }; }
  / "next"i _ "(" _ n:number ")" _
    { return { type: 'next', state: n }; }

assignment
  = targets:zbus_latches "=" _ operation:alu_math
    { return { type: "assignment", targets: targets, operation: operation }; }

zbus_latches
  = a:term b:("," _ b:term { return b; })* 
    { return [a].concat(b); }

increment
  = a:term  op:postOp
    { return { type: "incrementer", address: a, operation: op }; }

alu_math
  = l_bus:term op:infix r_bus:term carry:carry
    { return { type: 'binary', operation: op, left: l_bus, right: r_bus, carry: carry }; }
  / op:prefix l_bus:term carry:carry
    { return { type: 'unary', operation: op, value: l_bus, carry: carry }; }
  / l_bus:term
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

postOp
  = "++" _
    { return "increment"; }
  / "--" _
    { return "decrement"; }

carry
  = "+" _ "c"i _
    { return true; }
  / _
    { return false; }

// --- If block -----
if
  = "if"i _ "(" _ immediate:"@"? _ invert:"~"? _ condition:condition ")" _ statements:block otherwise:else?
    { return { type: 'if', immediate: Boolean(immediate), invert: Boolean(invert), condition: condition, otherwise: otherwise || null, statements: statements }; }

condition
  = v:("hi"i / "gt"i / "ge"i / "c"i / "z"i / "n"i / "v"i) _
    { return v.toLowerCase(); }

else
  = "else"i _ b:block
    { return b; }

// --- Goto / label targets ---
label
  = l:identifier ":" _ &(microcode / include)
    { return { type: "label", label: l }; }

goto
  = "goto" whitespace+ l:term ";" _
    { return { type: "goto", target: l }; }

// --- Replacible terms ---
term
  = register
  / address
  / immediate
  / "msr"i _
    { return { type: "status" }; }
  / "fault_code"i _
    { return { type: "fault_code" }; }
  / "tlb."i v:("index" / "bank" / "flags") _
    { return { type: 'tlb', register: v.toLowerCase() }; }
  / "flags"i _
    { return { type: "flags" }; }
  / phy:"#"? "[" _ r:address op:postOp? "]" _
    { return { type: "memory", address: r, operation:op || null, physical: Boolean(phy) }; }
  / i:identifier
    { return { type: "identifier", name: i }; }

address
  = "a"i r:[0-7] u:unit? _
    { return { type: 'address', index: parseInt(r, 10), unit: u || null }; }

register
  = "r"i r:[0-7] u:unit? _
    { return { type: 'register', index: parseInt(r, 10), unit: u || null }; }

immediate
  = n:number
    { return { type: "immediate", value:n }; }

unit
  = ".h"i
    { return "high"; }
  / ".l"i
    { return "low"; }

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
