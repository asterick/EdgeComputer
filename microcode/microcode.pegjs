/**
 TODO: MICROCODE FORMAT FOR INSTRUCTIONS
 **/

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
  = e:expression t:("," _ e:expression { return e; })*
    { return { type: "microcode", statements: [e].concat(t) }; }
  / ";" _
  	{ return { type: "microcode", statements: [] }; }

expression
  = v:flag
    { return { type: "flag", name: v } }
    // TODO: MEMORY
    // TODO: ALU

flag
  = v:("privileged"i) _
    { return v; }

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
