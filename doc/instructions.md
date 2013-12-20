Effective address prefix
------------------------

      |    Modes  
----- |    -----  
  BA  |     ###   
  BB  |  SP++/-###
  BC  | SSP++/-###
  BD  |      X    
  BE  |     X+#   
  BF  |    X+##   
  C0  |      Y    
  C1  |     Y+#   
  C2  |    Y+##   
  C3  |      Z    
  C4  |     Z+#   
  C5  |    Z+##   
  C6  |     X+A   
  C7  |    X+A+#  
  C8  |   X+A+##  
  C9  |     Y+A   
  CA  |    Y+A+#  
  CB  |   Y+A+##  
  CC  |     Z+A   
  CD  |    Z+A+#  
  CE  |   Z+A+##  
  CF  |     X+B   
  D0  |    X+B+#  
  D1  |   X+B+##  
  D2  |     Y+B   
  D3  |    Y+B+#  
  D4  |   Y+B+##  
  D5  |     Z+B   
  D6  |    Z+B+#  
  D7  |   Z+B+##  
  D8  |     X+C   
  D9  |    X+C+#  
  DA  |   X+C+##  
  DB  |     Y+C   
  DC  |    Y+C+#  
  DD  |   Y+C+##  
  DE  |     Z+C   
  DF  |    Z+C+#  
  E0  |   Z+C+##  
  E1  |     X+D   
  E2  |    X+D+#  
  E3  |   X+D+##  
  E4  |     Y+D   
  E5  |    Y+D+#  
  E6  |   Y+D+##  
  E7  |     Z+D   
  E8  |    Z+D+#  
  E9  |   Z+D+##  
  EA  |     X+E   
  EB  |    X+E+#  
  EC  |   X+E+##  
  ED  |     Y+E   
  EE  |    Y+E+#  
  EF  |   Y+E+##  
  F0  |     Z+E   
  F1  |    Z+E+#  
  F2  |   Z+E+##  
  F3  |     X+F   
  F4  |    X+F+#  
  F5  |   X+F+##  
  F6  |     Y+F   
  F7  |    Y+F+#  
  F8  |   Y+F+##  
  F9  |     Z+F   
  FA  |    Z+F+#  
  FB  |   Z+F+##  


RTI
---
Return from interrupt

Opcode: 02

RET
---
Return from subroutine

Opcode: 03

PUSH
---
Write value to stack

      |  Code
----- | -----
  A   |   0A 
  B   |   0C 
  C   |   0E 
  D   |   10 
  E   |   12 
  F   |   14 
  S   |   16 
  X   |   04 
  Y   |   06 
  Z   |   08 

POP
---
Load value from stack

      |  Code
----- | -----
  A   |   0B 
  B   |   0D 
  C   |   0F 
  D   |   11 
  E   |   13 
  F   |   15 
  S   |   17 
  X   |   05 
  Y   |   07 
  Z   |   09 

MOV
---
Load register or memory with value

      |   A   |   B   |   C   |   D   |   E   |   F   |   S   |   X   |   Y   |   Z   |   ##  |   BA  |   DC  |   FE  |   SP  |  ###  |  ISP  |  SSP  | [$ea]
----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |       |   42  |   43  |   44  |   45  |   46  |   47  |       |       |       |   48  |       |       |       |       |       |       |       | ab B0
  B   |   49  |       |   4A  |   4B  |   4C  |   4D  |   4E  |       |       |       |   4F  |       |       |       |       |       |       |       | ab B2
  C   |   50  |   51  |       |   52  |   53  |   54  |   55  |       |       |       |   56  |       |       |       |       |       |       |       | ab B4
  D   |   57  |   58  |   59  |       |   5A  |   5B  |   5C  |       |       |       |   5D  |       |       |       |       |       |       |       | ab B6
  E   |   5E  |   5F  |   60  |   61  |       |   62  |   63  |       |       |       |   64  |       |       |       |       |       |       |       | ab B8
  F   |   65  |   66  |   67  |   68  |   69  |       |   6A  |       |       |       |   6B  |       |       |       |       |       |       |       | ab BA
  S   |   6C  |   6D  |   6E  |   6F  |   70  |   71  |       |       |       |       |   72  |       |       |       |       |       |       |       | ab BC
  X   |       |       |       |       |       |       |       |       |       |       |       |   19  |   1B  |   1D  | 01 55 |   18  | 01 61 | 01 5B |      
  Y   |       |       |       |       |       |       |       |       |       |       |       |   20  |   22  |   24  | 01 57 |   1F  | 01 63 | 01 5D |      
  Z   |       |       |       |       |       |       |       |       |       |       |       |   27  |   29  |   2B  | 01 59 |   26  | 01 65 | 01 5F |      
  BA  |       |       |       |       |       |       |       |   1A  |   21  |   28  |       |       |       |       |   2F  |       |   3D  |   36  |      
  DC  |       |       |       |       |       |       |       |   1C  |   23  |   2A  |       |       |       |       |   31  |       |   3F  |   38  |      
  FE  |       |       |       |       |       |       |       |   1E  |   25  |   2C  |       |       |       |       |   33  |       |   41  |   3A  |      
  SP  |       |       |       |       |       |       |       | 01 54 | 01 56 | 01 58 |       |   2E  |   30  |   32  |       |   2D  |       |       |      
 ISP  |       |       |       |       |       |       |       | 01 60 | 01 62 | 01 64 |       |   3C  |   3E  |   40  |       |   3B  |       |       |      
 SSP  |       |       |       |       |       |       |       | 01 5A | 01 5C | 01 5E |       |   35  |   37  |   39  |       |   34  |       |       |      
[$ea] | ab B1 | ab B3 | ab B5 | ab B7 | ab B9 | ab BB | ab BD |       |       |       |       |       |       |       |       |       |       |       |      

LSL
---
Logical shift left

      |  Code
----- | -----
  A   |   73 
  B   | 00 12
  C   | 00 18
  D   | 00 1E
  E   | 00 24
  F   | 00 2A
  BA  | 01 90
  DC  | 01 A5
  FE  | 01 BA
[$ea] | ab 62

ASR
---
Arithmatic shift right

      |  Code
----- | -----
  A   |   74 
  B   | 00 13
  C   | 00 19
  D   | 00 1F
  E   | 00 25
  F   | 00 2B
  BA  | 01 91
  DC  | 01 A6
  FE  | 01 BB
[$ea] | ab 63

LSR
---
Logical shift right

      |  Code
----- | -----
  A   |   75 
  B   | 00 14
  C   | 00 1A
  D   | 00 20
  E   | 00 26
  F   | 00 2C
  BA  | 01 92
  DC  | 01 A7
  FE  | 01 BC
[$ea] | ab 64

EXTEND
---
Sign extend 8-bit value to 16-bit word

      |  Code
----- | -----
  A   |   76 
  B   | 00 15
  C   | 00 1B
  D   | 00 21
  E   | 00 27
  F   | 00 2D
  BA  | 01 93
  DC  | 01 A8
  FE  | 01 BD
[$ea] | ab 65

INC
---
Increment value

      |  Code
----- | -----
  A   |   77 
  B   | 00 16
  C   | 00 1C
  D   | 00 22
  E   | 00 28
  F   | 00 2E
  X   | 00 00
  Y   | 00 02
  Z   | 00 04
  BA  | 01 94
  DC  | 01 A9
  FE  | 01 BE
[$ea] | ab 68

DEC
---
Decrement value

      |  Code
----- | -----
  A   |   78 
  B   | 00 17
  C   | 00 1D
  D   | 00 23
  E   | 00 29
  F   | 00 2F
  X   | 00 01
  Y   | 00 03
  Z   | 00 05
  BA  | 01 95
  DC  | 01 AA
  FE  | 01 BF
[$ea] | ab 69

ADD
---
Add values without carry-in

      |   A   |   B   |   C   |   D   |   E   |   F   |   S   |   ##  |   BA  |   DC  |   FE  | [$ea]
----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |   79  |   7A  |   7B  |   7C  |   7D  |   7E  |       |   7F  |       |       |       | ab 6A
  B   | 00 30 | 00 31 | 00 32 | 00 33 | 00 34 | 00 35 |       | 00 36 |       |       |       | ab 6C
  C   | 00 53 | 00 54 | 00 55 | 00 56 | 00 57 | 00 58 |       | 00 59 |       |       |       | ab 6E
  D   | 00 76 | 00 77 | 00 78 | 00 79 | 00 7A | 00 7B |       | 00 7C |       |       |       | ab 70
  E   | 00 99 | 00 9A | 00 9B | 00 9C | 00 9D | 00 9E |       | 00 9F |       |       |       | ab 72
  F   | 00 BC | 00 BD | 00 BE | 00 BF | 00 C0 | 00 C1 |       | 00 C2 |       |       |       | ab 74
  S   |       |       |       |       |       |       |       |       |       |       |       | ab 76
  BA  |       |       |       |       |       |       |       |       | 01 96 | 01 9B | 01 A0 |      
  DC  |       |       |       |       |       |       |       |       | 01 AB | 01 B0 | 01 B5 |      
  FE  |       |       |       |       |       |       |       |       | 01 C0 | 01 C5 | 01 CA |      
[$ea] | ab 6B | ab 6D | ab 6F | ab 71 | ab 73 | ab 75 | ab 77 |       |       |       |       |      

SUB
---
Subtract values without borrow

      |   A   |   B   |   C   |   D   |   E   |   F   |   S   |   ##  |   BA  |   DC  |   FE  | [$ea]
----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |   80  |   81  |   82  |   83  |   84  |   85  |       |   86  |       |       |       | ab 78
  B   | 00 37 | 00 38 | 00 39 | 00 3A | 00 3B | 00 3C |       | 00 3D |       |       |       | ab 7A
  C   | 00 5A | 00 5B | 00 5C | 00 5D | 00 5E | 00 5F |       | 00 60 |       |       |       | ab 7C
  D   | 00 7D | 00 7E | 00 7F | 00 80 | 00 81 | 00 82 |       | 00 83 |       |       |       | ab 7E
  E   | 00 A0 | 00 A1 | 00 A2 | 00 A3 | 00 A4 | 00 A5 |       | 00 A6 |       |       |       | ab 80
  F   | 00 C3 | 00 C4 | 00 C5 | 00 C6 | 00 C7 | 00 C8 |       | 00 C9 |       |       |       | ab 82
  S   |       |       |       |       |       |       |       |       |       |       |       | ab 84
  BA  |       |       |       |       |       |       |       |       | 01 97 | 01 9C | 01 A1 |      
  DC  |       |       |       |       |       |       |       |       | 01 AC | 01 B1 | 01 B6 |      
  FE  |       |       |       |       |       |       |       |       | 01 C1 | 01 C6 | 01 CB |      
[$ea] | ab 79 | ab 7B | ab 7D | ab 7F | ab 81 | ab 83 | ab 85 |       |       |       |       |      

AND
---
Bit-wise AND values

      |   #   |   A   |   B   |   C   |   D   |   E   |   F   |   S   |   ##  |   BA  |   DC  |   FE  | [$ea]
----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |       |   87  |   88  |   89  |   8A  |   8B  |   8C  |       |   8D  |       |       |       | ab 86
  B   |       | 00 3E | 00 3F | 00 40 | 00 41 | 00 42 | 00 43 |       | 00 44 |       |       |       | ab 88
  C   |       | 00 61 | 00 62 | 00 63 | 00 64 | 00 65 | 00 66 |       | 00 67 |       |       |       | ab 8A
  D   |       | 00 84 | 00 85 | 00 86 | 00 87 | 00 88 | 00 89 |       | 00 8A |       |       |       | ab 8C
  E   |       | 00 A7 | 00 A8 | 00 A9 | 00 AA | 00 AB | 00 AC |       | 00 AD |       |       |       | ab 8E
  F   |       | 00 CA | 00 CB | 00 CC | 00 CD | 00 CE | 00 CF |       | 00 D0 |       |       |       | ab 90
  S   | 00 ED | 00 E6 | 00 E7 | 00 E8 | 00 E9 | 00 EA | 00 EB |       | 00 EC |       |       |       | ab 92
  BA  |       |       |       |       |       |       |       |       |       | 01 98 | 01 9D | 01 A2 |      
  DC  |       |       |       |       |       |       |       |       |       | 01 AD | 01 B2 | 01 B7 |      
  FE  |       |       |       |       |       |       |       |       |       | 01 C2 | 01 C7 | 01 CC |      
[$ea] |       | ab 87 | ab 89 | ab 8B | ab 8D | ab 8F | ab 91 | ab 93 |       |       |       |       |      

OR
---
Bit-wise OR values

      |   #   |   A   |   B   |   C   |   D   |   E   |   F   |   S   |   ##  |   BA  |   DC  |   FE  | [$ea]
----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |       |   8E  |   8F  |   90  |   91  |   92  |   93  |       |   94  |       |       |       | ab 94
  B   |       | 00 45 | 00 46 | 00 47 | 00 48 | 00 49 | 00 4A |       | 00 4B |       |       |       | ab 96
  C   |       | 00 68 | 00 69 | 00 6A | 00 6B | 00 6C | 00 6D |       | 00 6E |       |       |       | ab 98
  D   |       | 00 8B | 00 8C | 00 8D | 00 8E | 00 8F | 00 90 |       | 00 91 |       |       |       | ab 9A
  E   |       | 00 AE | 00 AF | 00 B0 | 00 B1 | 00 B2 | 00 B3 |       | 00 B4 |       |       |       | ab 9C
  F   |       | 00 D1 | 00 D2 | 00 D3 | 00 D4 | 00 D5 | 00 D6 |       | 00 D7 |       |       |       | ab 9E
  S   | 00 F5 | 00 EE | 00 EF | 00 F0 | 00 F1 | 00 F2 | 00 F3 |       | 00 F4 |       |       |       | ab A0
  BA  |       |       |       |       |       |       |       |       |       | 01 99 | 01 9E | 01 A3 |      
  DC  |       |       |       |       |       |       |       |       |       | 01 AE | 01 B3 | 01 B8 |      
  FE  |       |       |       |       |       |       |       |       |       | 01 C3 | 01 C8 | 01 CD |      
[$ea] |       | ab 95 | ab 97 | ab 99 | ab 9B | ab 9D | ab 9F | ab A1 |       |       |       |       |      

XOR
---
Exclusive OR values

      |   #   |   A   |   B   |   C   |   D   |   E   |   F   |   S   |   ##  |   BA  |   DC  |   FE  | [$ea]
----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |       |   95  |   96  |   97  |   98  |   99  |   9A  |       |   9B  |       |       |       | ab A2
  B   |       | 00 4C | 00 4D | 00 4E | 00 4F | 00 50 | 00 51 |       | 00 52 |       |       |       | ab A4
  C   |       | 00 6F | 00 70 | 00 71 | 00 72 | 00 73 | 00 74 |       | 00 75 |       |       |       | ab A6
  D   |       | 00 92 | 00 93 | 00 94 | 00 95 | 00 96 | 00 97 |       | 00 98 |       |       |       | ab A8
  E   |       | 00 B5 | 00 B6 | 00 B7 | 00 B8 | 00 B9 | 00 BA |       | 00 BB |       |       |       | ab AA
  F   |       | 00 D8 | 00 D9 | 00 DA | 00 DB | 00 DC | 00 DD |       | 00 DE |       |       |       | ab AC
  S   | 00 FD | 00 F6 | 00 F7 | 00 F8 | 00 F9 | 00 FA | 00 FB |       | 00 FC |       |       |       | ab AE
  BA  |       |       |       |       |       |       |       |       |       | 01 9A | 01 9F | 01 A4 |      
  DC  |       |       |       |       |       |       |       |       |       | 01 AF | 01 B4 | 01 B9 |      
  FE  |       |       |       |       |       |       |       |       |       | 01 C4 | 01 C9 | 01 CE |      
[$ea] |       | ab A3 | ab A5 | ab A7 | ab A9 | ab AB | ab AD | ab AF |       |       |       |       |      

JMP
---
Load PC with effective address

      |  Code
----- | -----
 $ea  | ab CD
+/-## |   AA 
[$ea] | ab BF

CALL
---
Push PC to stack, and load PC with effective address

      |  Code
----- | -----
 $ea  | ab DD
+/-## |   B9 
[$ea] | ab CF

NEG
---
Two's complement negate value

      |  Code
----- | -----
  A   | 00 06
  B   | 00 08
  C   | 00 0A
  D   | 00 0C
  E   | 00 0E
  F   | 00 10

CPL
---
Bitwise complement value

      |  Code
----- | -----
  A   | 00 07
  B   | 00 09
  C   | 00 0B
  D   | 00 0D
  E   | 00 0F
  F   | 00 11

ENTER
---
Enter supervisor routine

      |  Code
----- | -----
  A   | 00 DF
  B   | 00 E0
  C   | 00 E1
  D   | 00 E2
  E   | 00 E3
  F   | 00 E4
  ##  | 00 E5

ADC
---
Add values with carry

      |   A   |   B   |   C   |   D   |   E   |   F   |   ## 
----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   | 01 00 | 01 02 | 01 04 | 01 06 | 01 08 | 01 0A | 01 0C
  B   | 01 0E | 01 10 | 01 12 | 01 14 | 01 16 | 01 18 | 01 1A
  C   | 01 1C | 01 1E | 01 20 | 01 22 | 01 24 | 01 26 | 01 28
  D   | 01 2A | 01 2C | 01 2E | 01 30 | 01 32 | 01 34 | 01 36
  E   | 01 38 | 01 3A | 01 3C | 01 3E | 01 40 | 01 42 | 01 44
  F   | 01 46 | 01 48 | 01 4A | 01 4C | 01 4E | 01 50 | 01 52

SBC
---
Subtract values with borrow

      |   A   |   B   |   C   |   D   |   E   |   F   |   ## 
----- | ----- | ----- | ----- | ----- | ----- | ----- | -----
  A   | 01 01 | 01 03 | 01 05 | 01 07 | 01 09 | 01 0B | 01 0D
  B   | 01 0F | 01 11 | 01 13 | 01 15 | 01 17 | 01 19 | 01 1B
  C   | 01 1D | 01 1F | 01 21 | 01 23 | 01 25 | 01 27 | 01 29
  D   | 01 2B | 01 2D | 01 2F | 01 31 | 01 33 | 01 35 | 01 37
  E   | 01 39 | 01 3B | 01 3D | 01 3F | 01 41 | 01 43 | 01 45
  F   | 01 47 | 01 49 | 01 4B | 01 4D | 01 4F | 01 51 | 01 53

MUL
---
Multiply 32-bit value with 16-bit value

      |   A   |   B   |   C   |   D   |   E   |   F  
----- | ----- | ----- | ----- | ----- | ----- | -----
  BA  |       |       | 01 74 | 01 7B | 01 82 | 01 89
  DC  | 01 66 | 01 6D |       |       | 01 83 | 01 8A
  FE  | 01 67 | 01 6E | 01 75 | 01 7C |       |      

DIV
---
Divide two 16-bit values

      |   A   |   B   |   C   |   D   |   E   |   F  
----- | ----- | ----- | ----- | ----- | ----- | -----
  A   |       | 01 68 | 01 69 | 01 6A | 01 6B | 01 6C
  B   | 01 6F |       | 01 70 | 01 71 | 01 72 | 01 73
  C   | 01 76 | 01 77 |       | 01 78 | 01 79 | 01 7A
  D   | 01 7D | 01 7E | 01 7F |       | 01 80 | 01 81
  E   | 01 84 | 01 85 | 01 86 | 01 87 |       | 01 88
  F   | 01 8B | 01 8C | 01 8D | 01 8E | 01 8F |      

LEA
---
Load register with effective address

      |  $ea 
----- | -----
  X   | ab 00
  Y   | ab 01
  Z   | ab 02
  SP  | ab 03
 ISP  | ab 05
 SSP  | ab 04

COPY
---
Block copy operation (C = byte count)

      | [$ea] | [X++] | [Y++] | [Z++] | [$ea++] | [$ea--]
----- | ----- | ----- | ----- | ----- |  -----  |  ----- 
[$ea] |       | ab DE | ab E2 | ab E6 |         |        
[X++] | ab DF |       |       |       |  ab E0  |        
[X--] |       |       |       |       |         |  ab E1 
[Y++] | ab E3 |       |       |       |  ab E4  |        
[Y--] |       |       |       |       |         |  ab E5 
[Z++] | ab E7 |       |       |       |  ab E8  |        
[Z--] |       |       |       |       |         |  ab E9 

TLB
---
Load TLB register from memory

      | [$ea] | [$ea]++
----- | ----- |  ----- 
 BANK | ab EC |        
 FLAG | ab ED |        
INDEX | ab EA |  ab EB 

LEAVE
---
Leave supervisor mode

      |   A   |   B   |   C   |   D   |   E   |   F  
----- | ----- | ----- | ----- | ----- | ----- | -----
 $ea  | ab EE | ab F0 | ab F2 | ab F4 | ab F6 | ab F8
[$ea] | ab EF | ab F1 | ab F3 | ab F5 | ab F7 | ab F9
