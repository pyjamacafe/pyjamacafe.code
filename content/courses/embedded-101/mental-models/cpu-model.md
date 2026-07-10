+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'CPU Model and the Fetch-Decode-Execute Cycle'
difficulty = 'easy'
language = 'c'
topic_weight = -20
subtopic_weight = 0
weight = 3
initial_code = '''int add(int a, int b) {
    return a + b;
}

int main(void) {
    int x = 5;
    int y = 10;
    int z = add(x, y);
    return z;
}
'''
+++

## Problem Statement

Describe the fetch-decode-execute cycle in detail. What happens in each step at the hardware level? Trace how the simple C function `int add(int a, int b) { return a + b; }` is executed step by step inside the CPU.

## Theory and Concepts

- **CPU core components**:
  - **Program Counter (PC)**: Contains the address of the next instruction to fetch. Auto-increments after each fetch (by 4 bytes for 32-bit instructions).
  - **Instruction Register (IR)**: Holds the currently fetched instruction during decode and execution.
  - **Register File**: A small, fast array of storage locations (e.g., 16 or 32 general-purpose registers in RISC-V). Registers are the fastest storage in the memory hierarchy.
  - **Arithmetic Logic Unit (ALU)**: Combinational circuit that performs arithmetic (add, sub, mul) and logic (and, or, xor, shift) operations on register values.
  - **Control Unit**: Finite state machine that decodes the instruction in the IR and generates control signals (reg_file_write_enable, alu_op_select, memory_read, memory_write, pc_source_select, etc.).
  - **Clock**: Square wave signal that drives the state machine. Each clock cycle advances the CPU through its micro-operations.

- **The Fetch-Decode-Execute cycle**:
  1. **Fetch**: The address in the PC is placed on the address bus. Memory returns the instruction word, which is loaded into the IR. The PC is incremented (PC ← PC + 4 for a 32-bit ISA).
  2. **Decode**: The Control Unit examines the opcode and funct fields of the instruction in the IR. It asserts the appropriate control signals: register read addresses are sent to the register file, ALU operation is selected, and data paths are configured.
  3. **Execute**: The ALU performs the requested operation (e.g., ADD reads two registers, computes the sum, and writes the result back to the destination register). For memory instructions (load/store), the address is computed and sent to the memory system.
  4. **Write-back** (sometimes a separate stage): The result from the ALU or memory is written into the destination register.

- **Pipelining**: Modern CPUs overlap the stages — while instruction N is executing, instruction N+1 is being decoded, and instruction N+2 is being fetched. A 5-stage pipeline (Fetch, Decode, Execute, Memory, Writeback) is the classic RISC design. Hazards (data dependencies, branches) stall or flush the pipeline.

## Real World Application

The fetch-decode-execute cycle is not just theory — it directly determines software performance. A tight loop running entirely from registers (no memory access) can execute one iteration per clock cycle in a pipelined CPU. A loop that accesses memory may stall for 10–100 cycles per cache miss. This is why optimizing compilers spend enormous effort on register allocation (keeping frequently-used values in registers rather than memory). On the ARM Cortex-M4, the three-stage pipeline (Fetch, Decode, Execute) with branch speculation means that a correctly predicted conditional branch costs zero extra cycles — but a mispredicted branch flushes the pipeline, costing 2–3 cycles of wasted work.

===EXPLANATION===

![CPU Programmer's Model](/images/embedded-101/mental-models/cpu-programmers-model.jpeg)

![Instruction Memory](/images/embedded-101/mental-models/inst-mem.jpeg)

![LDR Instruction](/images/embedded-101/mental-models/ldr.jpeg)

![STR Instruction](/images/embedded-101/mental-models/str.jpeg)

The fetch-decode-execute cycle is the heartbeat of every computer. Every program, from a bootloader to a web browser, is ultimately a sequence of machine words stored in memory, and the CPU's job is to march through this sequence one instruction at a time. The elegance of the stored-program concept is that the CPU is a simple automaton: read a word from memory at the address in the PC, figure out what it means, do it, repeat. The complexity of a modern OS (scheduling, virtual memory, interrupts, multi-core synchronization) is all built on top of this primitive foundation. When you understand the cycle, you understand why certain C constructs are expensive (function calls involve saving/restoring registers and jumping the PC) and others are cheap (arithmetic on register variables).

The intuition is that the CPU is a factory assembly line. The PC is the blueprints showing which page to work from next. The Fetch step is the warehouse worker pulling the blueprint page (the instruction word) and handing it to the foreman. The Decode step is the foreman reading the blueprints and deciding which machines and workers to activate: "Smith, you operate the welding machine on part A and part B. Jones, get the riveter ready." The Execute step is actual production: the machines run, parts are assembled, and the result comes out. The Write-back step is storing the finished part in the finished-goods bin (a register). The clock is the production line speed — every tick, one step of the process advances. A pipeline is multiple assembly lines running in parallel: while station 1 is welding, station 2 is riveting the previous part, and station 3 is painting the one before that.

The RISC philosophy (exemplified by RISC-V and ARM) is to make each station in the assembly line do exactly one simple job per cycle. A RISC instruction always fits in one 32-bit word, always has three operands (two source registers, one destination), and always does one thing (add, load, branch). This simplicity means the pipeline never stalls because an instruction needs multiple cycles to finish. In contrast, CISC ISAs like x86 have variable-length instructions (1–15 bytes) and instructions that do complex things (e.g., `REP MOVSB` copies a string — microcoded as dozens of micro-ops). The RISC trade-off is code size (more instructions per program) for predictable performance (almost everything executes in one cycle).

References: Patterson & Hennessy, "Computer Organization and Design" §4.1–4.5 (the classic 5-stage pipeline); ARM Cortex-M4 Technical Reference Manual, §2.3 (Pipeline). For the original IBM Stretch (the first pipelined computer): "Planning a Computer System" by Buchholz et al. (1962). The landmark paper: "The Case for the Reduced Instruction Set Computer" by Patterson and Ditzel (ACM SIGARCH, 1980).

===QUIZ===

## During the fetch stage of the fetch-decode-execute cycle, what two things happen to the Program Counter (PC)?
- [ ] It is reset to zero
- [ ] It is used to address memory for the instruction, then incremented by the instruction size
- [ ] It is copied to the Instruction Register
- [ ] It is decremented to point to the previous instruction
Correct: B
Explanation: During the fetch stage, the CPU places the current PC value on the address bus to read the instruction word from memory (which is loaded into the Instruction Register). Simultaneously, the PC is incremented (typically by 4 for 32-bit instructions) to point to the next instruction in sequence, preparing for the next fetch cycle.

## What happens when a CPU pipeline encounters a branch instruction (e.g., a conditional jump)?
- [ ] Nothing special — all instructions after the branch execute normally
- [ ] The pipeline must flush instructions fetched after the branch, causing a bubble of wasted cycles
- [ ] The CPU stops permanently
- [ ] The branch is always predicted as "not taken"
Correct: B
Explanation: When a branch is executed, instructions already fetched from the sequential path after the branch may be wrong. The pipeline must flush those speculatively-fetched instructions and refetch from the correct branch target. This creates "pipeline bubbles" — wasted cycles where no useful work is done. Modern CPUs use branch prediction to guess whether branches are taken to minimize these flushes.
