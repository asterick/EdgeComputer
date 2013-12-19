[4mRunning "instructions:table" (instructions) task[24m

RTI
---
undefined

Opcode: 0

RET
---
undefined

Opcode: 1

PUSH
---
undefined

   | Term
X | 2
Y | 4
Z | 6
A | 8
B | a
C | c
D | e
E | 10
F | 12
S | 14

POP
---
undefined

   | Term
X | 3
Y | 5
Z | 7
A | 9
B | b
C | d
D | f
E | 11
F | 13
S | 15

MOV
---
undefined

    | A | B | BA | C | D | DC | E | F | FE | ISP | S | SP | SSP | X | Y | Z | [$ea]
--- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- 
### |    |    |    |    |    |    |    |    |    | 39 |    | 2b | 32 | 16 | 1d | 24 |   
BA |    |    |    |    |    |    |    |    |    | 3a |    | 2c | 33 | 17 | 1e | 25 |   
X |    |    | 18 |    |    | 1a |    |    | 1c |    |    |    |    |    |    |    |   
DC |    |    |    |    |    |    |    |    |    | 3c |    | 2e | 35 | 19 | 20 | 27 |   
FE |    |    |    |    |    |    |    |    |    | 3e |    | 30 | 37 | 1b | 22 | 29 |   
Y |    |    | 1f |    |    | 21 |    |    | 23 |    |    |    |    |    |    |    |   
Z |    |    | 26 |    |    | 28 |    |    | 2a |    |    |    |    |    |    |    |   
SP |    |    | 2d |    |    | 2f |    |    | 31 |    |    |    |    |    |    |    |   
SSP |    |    | 34 |    |    | 36 |    |    | 38 |    |    |    |    |    |    |    |   
ISP |    |    | 3b |    |    | 3d |    |    | 3f |    |    |    |    |    |    |    |   
B | 40 |    |    | 4f | 56 |    | 5d | 64 |    |    | 6b |    |    |    |    |    | af
C | 41 | 48 |    |    | 57 |    | 5e | 65 |    |    | 6c |    |    |    |    |    | b1
D | 42 | 49 |    | 50 |    |    | 5f | 66 |    |    | 6d |    |    |    |    |    | b3
E | 43 | 4a |    | 51 | 58 |    |    | 67 |    |    | 6e |    |    |    |    |    | b5
F | 44 | 4b |    | 52 | 59 |    | 60 |    |    |    | 6f |    |    |    |    |    | b7
S | 45 | 4c |    | 53 | 5a |    | 61 | 68 |    |    |    |    |    |    |    |    | b9
## | 46 | 4d |    | 54 | 5b |    | 62 | 69 |    |    | 70 |    |    |    |    |    |   
A |    | 47 |    | 4e | 55 |    | 5c | 63 |    |    | 6a |    |    |    |    |    | ad
[$ea] | ac | ae |    | b0 | b2 |    | b4 | b6 |    |    | b8 |    |    |    |    |    |   

LSL
---
undefined

   | Term
A | 71
B | 12
C | 18
D | 1e
E | 24
F | 2a
BA | 7e
DC | 93
FE | a8
[$ea] | 60

ASL
---
undefined

   | Term
A | 72
B | 13
C | 19
D | 1f
E | 25
F | 2b
BA | 7f
DC | 94
FE | a9
[$ea] | 61

LSR
---
undefined

   | Term
A | 73
B | 14
C | 1a
D | 20
E | 26
F | 2c
BA | 80
DC | 95
FE | aa
[$ea] | 62

EXTEND
---
undefined

   | Term
A | 74
B | 15
C | 1b
D | 21
E | 27
F | 2d
BA | 81
DC | 96
FE | ab
[$ea] | 63

INC
---
undefined

   | Term
A | 75
X |   
Y | 2
Z | 4
B | 16
C | 1c
D | 22
E | 28
F | 2e
BA | 82
DC | 97
FE | ac
[$ea] | 64

DEC
---
undefined

   | Term
A | 76
X | 1
Y | 3
Z | 5
B | 17
C | 1d
D | 23
E | 29
F | 2f
BA | 83
DC | 98
FE | ad
[$ea] | 65

ADD
---
undefined

    | A | B | BA | C | D | DC | E | F | FE | S | [$ea]
--- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- 
A | 77 | 30 |    | 53 | 76 |    | 99 | bc |    |    | 67
B | 78 | 31 |    | 54 | 77 |    | 9a | bd |    |    | 69
C | 79 | 32 |    | 55 | 78 |    | 9b | be |    |    | 6b
D | 7a | 33 |    | 56 | 79 |    | 9c | bf |    |    | 6d
E | 7b | 34 |    | 57 | 7a |    | 9d | c0 |    |    | 6f
F | 7c | 35 |    | 58 | 7b |    | 9e | c1 |    |    | 71
## | 7d | 36 |    | 59 | 7c |    | 9f | c2 |    |    |   
BA |    |    | 8e |    |    |    |    |    |    |    |   
DC |    |    |    |    |    | a3 |    |    |    |    |   
FE |    |    |    |    |    |    |    |    | b8 |    |   
[$ea] | 66 | 68 |    | 6a | 6c |    | 6e | 70 |    | 72 |   
S |    |    |    |    |    |    |    |    |    |    | 73

SUB
---
undefined

    | A | B | BA | C | D | DC | E | F | FE | S | [$ea]
--- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- 
A | 7e | 37 |    | 5a | 7d |    | a0 | c3 |    |    | 75
B | 7f | 38 |    | 5b | 7e |    | a1 | c4 |    |    | 77
C | 80 | 39 |    | 5c | 7f |    | a2 | c5 |    |    | 79
D | 81 | 3a |    | 5d | 80 |    | a3 | c6 |    |    | 7b
E | 82 | 3b |    | 5e | 81 |    | a4 | c7 |    |    | 7d
F | 83 | 3c |    | 5f | 82 |    | a5 | c8 |    |    | 7f
## | 84 | 3d |    | 60 | 83 |    | a6 | c9 |    |    |   
BA |    |    | 8f |    |    |    |    |    |    |    |   
DC |    |    |    |    |    | a4 |    |    |    |    |   
FE |    |    |    |    |    |    |    |    | b9 |    |   
[$ea] | 74 | 76 |    | 78 | 7a |    | 7c | 7e |    | 80 |   
S |    |    |    |    |    |    |    |    |    |    | 81

AND
---
undefined

    | A | B | BA | C | D | DC | E | F | FE | S | [$ea]
--- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- 
A | 85 | 3e |    | 61 | 84 |    | a7 | ca |    | e6 | 83
B | 86 | 3f |    | 62 | 85 |    | a8 | cb |    | e7 | 85
C | 87 | 40 |    | 63 | 86 |    | a9 | cc |    | e8 | 87
D | 88 | 41 |    | 64 | 87 |    | aa | cd |    | e9 | 89
E | 89 | 42 |    | 65 | 88 |    | ab | ce |    | ea | 8b
F | 8a | 43 |    | 66 | 89 |    | ac | cf |    | eb | 8d
## | 8b | 44 |    | 67 | 8a |    | ad | d0 |    | ec |   
# |    |    |    |    |    |    |    |    |    | ed |   
BA |    |    | 90 |    |    |    |    |    |    |    |   
DC |    |    |    |    |    | a5 |    |    |    |    |   
FE |    |    |    |    |    |    |    |    | ba |    |   
[$ea] | 82 | 84 |    | 86 | 88 |    | 8a | 8c |    | 8e |   
S |    |    |    |    |    |    |    |    |    |    | 8f

OR
---
undefined

    | A | B | BA | C | D | DC | E | F | FE | S | [$ea]
--- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- 
A | 8c | 45 |    | 68 | 8b |    | ae | d1 |    | ee | 91
B | 8d | 46 |    | 69 | 8c |    | af | d2 |    | ef | 93
C | 8e | 47 |    | 6a | 8d |    | b0 | d3 |    | f0 | 95
D | 8f | 48 |    | 6b | 8e |    | b1 | d4 |    | f1 | 97
E | 90 | 49 |    | 6c | 8f |    | b2 | d5 |    | f2 | 99
F | 91 | 4a |    | 6d | 90 |    | b3 | d6 |    | f3 | 9b
## | 92 | 4b |    | 6e | 91 |    | b4 | d7 |    | f4 |   
# |    |    |    |    |    |    |    |    |    | f5 |   
BA |    |    | 91 |    |    |    |    |    |    |    |   
DC |    |    |    |    |    | a6 |    |    |    |    |   
FE |    |    |    |    |    |    |    |    | bb |    |   
[$ea] | 90 | 92 |    | 94 | 96 |    | 98 | 9a |    | 9c |   
S |    |    |    |    |    |    |    |    |    |    | 9d

XOR
---
undefined

    | A | B | BA | C | D | DC | E | F | FE | S | [$ea]
--- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- 
A | 93 | 4c |    | 6f | 92 |    | b5 | d8 |    | f6 | 9f
B | 94 | 4d |    | 70 | 93 |    | b6 | d9 |    | f7 | a1
C | 95 | 4e |    | 71 | 94 |    | b7 | da |    | f8 | a3
D | 96 | 4f |    | 72 | 95 |    | b8 | db |    | f9 | a5
E | 97 | 50 |    | 73 | 96 |    | b9 | dc |    | fa | a7
F | 98 | 51 |    | 74 | 97 |    | ba | dd |    | fb | a9
## | 99 | 52 |    | 75 | 98 |    | bb | de |    | fc |   
# |    |    |    |    |    |    |    |    |    | fd |   
BA |    |    | 92 |    |    |    |    |    |    |    |   
DC |    |    |    |    |    | a7 |    |    |    |    |   
FE |    |    |    |    |    |    |    |    | bc |    |   
[$ea] | 9e | a0 |    | a2 | a4 |    | a6 | a8 |    | aa |   
S |    |    |    |    |    |    |    |    |    |    | ab

JMP
---
undefined

   | Term
+/-## | a8
$ea | c9
[$ea] | bb

CALL
---
undefined

   | Term
+/-## | b7
$ea | d9
[$ea] | cb

NEG
---
undefined

   | Term
A | 6
B | 8
C | a
D | c
E | e
F | 10

CPL
---
undefined

   | Term
A | 7
B | 9
C | b
D | d
E | f
F | 11

ENTER
---
undefined

   | Term
A | df
B | e0
C | e1
D | e2
E | e3
F | e4
## | e5

ADC
---
undefined

    | A | B | C | D | E | F
--- | -- | -- | -- | -- | -- | -- 
A |    | e | 1c | 2a | 38 | 46
B | 2 | 10 | 1e | 2c | 3a | 48
C | 4 | 12 | 20 | 2e | 3c | 4a
D | 6 | 14 | 22 | 30 | 3e | 4c
E | 8 | 16 | 24 | 32 | 40 | 4e
F | a | 18 | 26 | 34 | 42 | 50
## | c | 1a | 28 | 36 | 44 | 52

SBC
---
undefined

    | A | B | C | D | E | F
--- | -- | -- | -- | -- | -- | -- 
A | 1 | f | 1d | 2b | 39 | 47
B | 3 | 11 | 1f | 2d | 3b | 49
C | 5 | 13 | 21 | 2f | 3d | 4b
D | 7 | 15 | 23 | 31 | 3f | 4d
E | 9 | 17 | 25 | 33 | 41 | 4f
F | b | 19 | 27 | 35 | 43 | 51
## | d | 1b | 29 | 37 | 45 | 53

MUL
---
undefined

    | BA | DC | FE
--- | -- | -- | -- 
A |    | 54 | 55
B |    | 5b | 5c
C | 62 |    | 63
D | 69 |    | 6a
E | 70 | 71 |   
F | 77 | 78 |   

DIV
---
undefined

    | A | B | C | D | E | F
--- | -- | -- | -- | -- | -- | -- 
B | 56 |    | 65 | 6c | 73 | 7a
C | 57 | 5e |    | 6d | 74 | 7b
D | 58 | 5f | 66 |    | 75 | 7c
E | 59 | 60 | 67 | 6e |    | 7d
F | 5a | 61 | 68 | 6f | 76 |   
A |    | 5d | 64 | 6b | 72 | 79

LEA
---
undefined

    | ISP | SP | SSP | X | Y | Z
--- | -- | -- | -- | -- | -- | -- 
$ea | 5 | 3 | 4 |    | 1 | 2

COPY
---
undefined

    | [$ea] | [X++] | [X--] | [Y++] | [Y--] | [Z++] | [Z--]
--- | -- | -- | -- | -- | -- | -- | -- 
[X++] | da |    |    |    |    |    |   
[$ea] |    | db |    | df |    | e3 |   
[$ea++] |    | dc |    | e0 |    | e4 |   
[$ea--] |    |    | dd |    | e1 |    | e5
[Y++] | de |    |    |    |    |    |   
[Z++] | e2 |    |    |    |    |    |   

TLB
---
undefined

    | BANK | FLAG | INDEX
--- | -- | -- | -- 
[$ea] | e8 | e9 | e6
[$ea]++ |    |    | e7

LEAVE
---
undefined

    | $ea | [$ea]
--- | -- | -- 
A | ea | eb
B | ec | ed
C | ee | ef
D | f0 | f1
E | f2 | f3
F | f4 | f5

[32mDone, without errors.[39m
