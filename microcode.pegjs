body
  = _ opcode*

opcode
  = "opcode"i _ "(" _ o:hex _  ")" _ block

microcode
  = "bla"i _

block
  = "{" _ statement (";" _ statement)* ";"? _ "}" _

statement
  = if
  / microcode

if
  = "if"i _ "(" _ invert:"!"? _ condition:condition ")" _ block else?

else
  = "else"i _ block

condition
  = "ab"i _
  / "gt"i _
  / "ge"i _
  / "c"i _
  / "z"i _
  / "n"i _
  / "v"i _

hex
  = [0-9a-f]+

_
  = whitespace*

whitespace
  = [ \n\r\t]
  / comment

comment
  = "/*" (!"*/" .)* "*/"
