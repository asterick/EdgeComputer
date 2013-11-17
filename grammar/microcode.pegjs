body
  = _ o:opcode*
  	{ return o; }

opcode
  = "opcode"i _ "(" _ o:number _  ")" _ b:block
  	{ return { type: "opcode", code:o, expressions: b }; }

statement
  = if
  / microcode

if
  = "if"i _ "(" _ invert:"!"? _ condition:identifier ")" _ statements:block otherwise:else?
  	{ return { type: 'if', invert: invert, condition: condition, otherwise: otherwise, statements: statements }; }

else
  = "else"i _ b:block
  	{ return b; }

block
  = "{" _ a:microcode b:(";" _ v:microcode { return v; })* ";"? _ "}" _
  	{ return [a].concat(b); }

microcode
  = a:expression b:(","_ v:expression { return v; })*
  	{ return [a].concat(b); }

expression
	= targets:target_list "=" _ expression:source
		{ return { type: "assign", targets:targets, expression: expression }; }
	/ v:target_list
		{ return { type: "flag", name: v }; }

source
	= l:atomic o:operator r:source
		{ return { type: "expression", operator: o, left: l, right: r}; }
	/ atomic

operator
	= v:("+" / "-" / "^" / "&" / "|") _
		{ return v; }

target_list
	= "(" _ a:register b:("," _ v:register { return v; })* ")" _
		{ return [a].concat(b); }
	/ register

// atomic values
atomic
	= register
	/ identifier
	/ number

register
	= i:[a-zA-Z0-9]+ w:word? s:".b"i? _
		{ return { type: 'register', name: i.join(''), word: w || null, byte: Boolean(s) }; }

word
	= ".h"i
		{ return "top"; }
	/ ".l"i
		{ return "bottom"; }

identifier
	= v:[a-zA-Z0-9]+ _
		{ return v.join('').toLowerCase(); }

number
	= hex
	/ integer

integer
	= v:[0-9]+ _
		{ return parseInt(v.join(''), 10); }

hex
  = "0x"i v:[0-9a-fA-F]+ _
		{ return parseInt(v.join(''), 16); }

// These are whitespace tokens, ignored
_
  = whitespace*

whitespace
  = [ \n\r\t]
  / comment

comment
  = "/*" (!"*/" .)* "*/"
