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
	= targets:target_list "=" _ expression:source
		{ return { type: "assign", targets:targets, expression: expression }; }
	/ v:target_list
		{ return { type: "flag", name: v }; }

source
	= "d"i whitespace+
		{ return { type: "databus" }; }
	/ o:prefix r:property c:atomic?
		{ return { type: "unary", term: r, carry: c || null }; }

	/ l:property (o:infix r:atomic c:atomic?)?

prefix
	= v:("left" / "right") whitespace+
		{ return v; }

infix
	= v:("+" / "-" / "xor" / "and" / "or") whitespace+
		{ return v; }

target_list
	= "(" _ a:property b:("," _ v:property { return v; })* ")" _
		{ return [a].concat(b); }
	/ property

// atomic values
atomic
	= property
	/ number

property
	= s:identifier "." p:property
		{ return { type: "property", source: s, property: p }; }
	/ i:identifier
		{ return { type: "identifer", name: i }; }

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