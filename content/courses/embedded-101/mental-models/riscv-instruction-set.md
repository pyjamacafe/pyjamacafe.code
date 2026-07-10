+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'RISC-V Instruction Set'
difficulty = 'medium'
language = 'asm'
topic_weight = -20
subtopic_weight = 0
weight = 4
initial_code = '''# RV32I example: compute (a + b) - c and return result
# a0 = a, a1 = b, a2 = c
add  t0, a0, a1        # t0 = a + b
sub  a0, t0, a2        # a0 = (a + b) - c
ret                     # return a0
'''
+++

## Problem Statement

Why was RISC-V created? What makes it fundamentally different from ARM and x86? Examine the design philosophy of the RISC-V ISA and its base integer instruction formats (R, I, S, B, U, J). Why would a university, a startup, or a government choose RISC-V over proprietary ISAs?

## Theory and Concepts

- **RISC vs CISC**: RISC (Reduced Instruction Set Computer) uses simple, fixed-width instructions that each do one operation. CISC (Complex Instruction Set Computer, e.g., x86) uses variable-length instructions that can perform multi-step operations. RISC trades code density for simpler hardware — the CPU needs less transistor area for decoding, leaving more room for pipelines and caches.
- **What makes RISC-V different**:
  - **Open ISA**: RISC-V is not owned by any company. The specification is open (BSD-licensed). Anyone can design a RISC-V core without paying royalties. ARM charges license fees and royalties per chip. x86 is owned by Intel/AMD and cannot be licensed for new designs.
  - **Extensible**: The base ISA (RV32I) is minimal (~40 instructions). Extensions (M = multiply/divide, F = single-precision float, D = double-precision float, C = compressed 16-bit instructions, V = vector) are layered on top as optional modules. A chip designer implements only the extensions their application needs.
  - **Academic roots**: Designed at UC Berkeley in 2010 by Krste Asanović and David Patterson (of Patterson & Hennessy fame), RISC-V was created as a clean-slate ISA for computer architecture research and teaching.
- **RV32I base instruction formats** (all 32 bits wide):
  - **R-type** (Register): `funct7 | rs2 | rs1 | funct3 | rd | opcode` — for arithmetic on two registers (ADD, SUB, XOR, SLT). Three register operands.
  - **I-type** (Immediate): `imm[11:0] | rs1 | funct3 | rd | opcode` — for arithmetic with one register and a 12-bit immediate (ADDI, SLTI) or loads (LW, LH, LB).
  - **S-type** (Store): `imm[11:5] | rs2 | rs1 | funct3 | imm[4:0] | opcode` — for store instructions (SW, SH, SB). The immediate is split across two fields to share hardware with R-type.
  - **B-type** (Branch): `imm[12|10:5] | rs2 | rs1 | funct3 | imm[4:1|11] | opcode` — for conditional branches (BEQ, BNE, BLT). The immediate encodes the branch offset in a compressed format (bit 0 of the offset is always 0, so it's not stored).
  - **U-type** (Upper immediate): `imm[31:12] | rd | opcode` — for loading a 20-bit upper immediate (LUI, AUIPC). The lower 12 bits are zeroed.
  - **J-type** (Jump): `imm[20|10:1|11|19:12] | rd | opcode` — for JAL (jump and link). The immediate encodes a 21-bit signed offset (bit 0 always 0).

## Real World Application

RISC-V has seen explosive adoption since 2018. Western Digital uses RISC-V cores in SSD controllers (replacing proprietary designs). NVIDIA uses a RISC-V microcontroller for GPU management (the "Falcon" processor). SiFive (founded by RISC-V's creators) sells commercial RISC-V cores used in IoT, AI accelerators, and automotive. The Indian government's "Digital India RISC-V" (DIRV) program is developing indigenous RISC-V processors for national strategic needs. The European Processor Initiative uses RISC-V for accelerator cores. In the embedded space, the ESP32-C6 from Espressif is a dual-core chip with a RISC-V application processor.

===EXPLANATION===

![RISC-V Core Instructions](/images/embedded-101/mental-models/risc-v-core-inst.jpeg)

![RISC-V Encode/Decode](/images/embedded-101/mental-models/rv-encode-decode.png)

![Add Instruction](/images/embedded-101/mental-models/add-instruction.png)

RISC-V is not just another ISA — it is a institutional response to the centralization of computing architecture. Since the 1990s, x86 (Intel/AMD) and ARM (Arm Ltd.) controlled virtually every processor on earth. To build a chip, you had to license one of these two architectures. This created a barrier: startups paid millions in ARM licensing fees; researchers couldn't modify x86 or ARM internals; governments worried about supply-chain security (could an ARM core in a Chinese chip have hidden backdoors?). RISC-V solves all of these problems with a single insight: make the ISA free, open, and extensible. The specification is a PDF (the "RISC-V Unprivileged Specification") that anyone can download, implement, and modify. If you want to add a custom instruction for AI tensor operations, you just define it and build a core that supports it — no NDA, no license fee, no permission needed.

The six instruction formats (R, I, S, B, U, J) are the masterwork of the RISC-V design. Every instruction is exactly 32 bits. Every format has the opcode in the same position (bits 6:0), so the decoder can identify the format before fully decoding the instruction. The source register fields (rs1, rs2) are always in the same bit positions (rs1 at 19:15, rs2 at 24:20) across all formats. The destination register (rd) is in the same position for R, I, U, and J types. This uniformity means the register file addressing logic is shared across all instructions — a simpler decoder, smaller die area, lower power. The S-type and B-type formats intentionally rearrange the immediate bits to maximize overlap with R-type's rs2 field, again simplifying the hardware. The compressed extension (RVC, "C" extension) adds 16-bit instructions for common operations (addi, lw, sw, jr) — these are transparently expanded into full 32-bit instructions during decode, so the pipeline sees only normal instructions. The result is an ISA that is smaller, simpler, and more regular than any competing design.

The intuition: think of RISC-V instructions as standardized shipping containers. Every container is exactly 32 feet long (32-bit fixed width). Every container has the shipping label (opcode) in the exact same location on the right side. If the label says "R-type", the next two fields are the source addresses (like "send from warehouses A and B"), the next is the operation type (add, subtract, compare), and the last is the destination warehouse ("send result to warehouse C"). If the label says "I-type", the second field is one warehouse plus an immediate value ("send from warehouse A plus 42 to warehouse C"). The decoder at the receiving port (the CPU's control unit) never has to search for the label — it's always in the same place. This simplicity is the entire point: RISC-V chose universality and extensibility over the dense, irregular encoding that made x86 profitable but impenetrable.

References: "The RISC-V Instruction Set Manual, Volume I: Unprivileged ISA", Document Version 20191213; Patterson & Hennessy, "Computer Organization and Design" RISC-V Edition, Appendix A; Waterman & Asanović, "The RISC-V Reader: An Open Architecture Atlas" (Strawberry Canyon, 2017). For the RISC vs CISC debate: "A Case for the Reduced Instruction Set Computer" by Patterson & Ditzel (1980) and "A Case for the Complex Instruction Set Computer" by Colwell et al. (1985).

===QUIZ===

## In the RISC-V base instruction formats, what is the key design feature that simplifies the hardware decoder?
- [ ] All instructions are variable-length and self-terminating
- [ ] The opcode is always in the same bit position (bits 6:0) and the source register fields are in fixed positions across all formats
- [ ] Instructions are decoded using a lookup table in DRAM
- [ ] There is only one instruction format
Correct: B
Explanation: All six RV32I formats place the opcode in bits 6:0 (the same location), and the source register fields (rs1 at 19:15, rs2 at 24:20) are in fixed positions across R, I, S, and B types. The destination register (rd) is in a fixed position for R, I, U, and J. This means the register file addressing and opcode decode logic is shared across all instruction types, dramatically reducing decoder complexity and die area.

## What is the primary reason RISC-V is described as an "open ISA" rather than a "proprietary ISA"?
- [ ] RISC-V chips are manufactured only by open-source foundries
- [ ] The ISA specification is publicly available under a permissive license, and anyone can implement a RISC-V core without paying royalties
- [ ] RISC-V compilers are free but the hardware must be licensed
- [ ] RISC-V is owned by the Linux Foundation
Correct: B
Explanation: The RISC-V ISA specification is released under BSD-like open licenses. Anyone can download the spec, design a processor core that implements it, and manufacture/sell chips without any licensing fees. This is fundamentally different from ARM (requires paid licenses and royalties per chip) and x86 (owned by Intel/AMD, effectively closed to new implementors).
