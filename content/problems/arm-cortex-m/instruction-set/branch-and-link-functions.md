+++
date = '2026-07-06T10:35:00+05:30'
draft = false
title = 'Branch Instructions and Function Calls'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 8
weight = 5
initial_code = '''// Branch instructions and function call mechanisms
#include <stdio.h>
#include <stdint.h>

void unconditional_branch(void) {
    printf("  Entered via unconditional branch\\n");
}

void conditional_branch_example(int32_t a, int32_t b) {
    printf("  Comparing %d and %d:\\n", a, b);

    __asm volatile(
        "CMP %0, %1       \\n\\t"
        "ITT GT             \\n\\t"
        "MOVGT R0, #1      \\n\\t"
        "MOVLE R0, #0      \\n\\t"
        : : "r" (a), "r" (b) : "r0", "cc"
    );
}

uint32_t table_branch(uint32_t index) {
    uint32_t result;

    __asm volatile(
        "CMP %1, #3       \\n\\t"
        "ITT HI             \\n\\t"
        "MOVHI %0, #0      \\n\\t"
        "BXHI LR           \\n\\t"

        "TBB [PC, %1]      \\n\\t"
        "BRANCH_TABLE:      \\n\\t"
        ".byte 0            \\n\\t"
        ".byte 6            \\n\\t"
        ".byte 12           \\n\\t"
        ".byte 18           \\n\\t"
        "CASE0: MOV %0, #100 \\n\\t"
        "B DONE              \\n\\t"
        "CASE1: MOV %0, #200 \\n\\t"
        "B DONE              \\n\\t"
        "CASE2: MOV %0, #300 \\n\\t"
        "B DONE              \\n\\t"
        "CASE3: MOV %0, #400 \\n\\t"
        "DONE:               \\n\\t"
        : "=r" (result)
        : "r" (index)
        : "cc"
    );

    return result;
}

int main(void) {
    printf("Branch Instructions and Function Calls\\n\\n");

    unconditional_branch();

    conditional_branch_example(10, 5);
    conditional_branch_example(3, 7);

    printf("\\nTable branch:\\n");
    for (int i = 0; i <= 3; i++) {
        printf("  TBB(%d) = %u\\n", i, table_branch(i));
    }

    printf("\\nBranch instructions:\\n");
    printf("  B  - Unconditional branch\\n");
    printf("  BL - Branch and link (function call)\\n");
    printf("  BX - Branch and exchange (indirect)\\n");
    printf("  BLX- Branch link and exchange\\n");
    printf("  TBB- Table branch byte\\n");
    printf("  TBH- Table branch halfword\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates all Cortex-M branch instructions: B (unconditional branch), BL (branch and link for function calls), BX (branch and exchange, indirect), cond_B (conditional branches), and TBB/TBH (table branch). Implement a switch-statement equivalent using TBB and show the difference between direct and indirect branches.

## Theory and Concepts

- B: PC-relative branch, range ±4KB to ±16MB depending on encoding.
- BL: branch and link — saves return address in LR, then branches.
- BX: branch to address in register. Used for indirect calls and returns.
- BLX: like BL but switches instruction set (not used in Cortex-M, always Thumb).
- Conditional branches: BEQ, BNE, BCS/BHS, BCC/BLO, BMI, BPL, BVS, BVC, BHI, BLS, BGE, BGT, BLE, BLT.
- TBB: table branch byte — index into a byte table of offsets, useful for dense switch cases.
- TBH: table branch halfword — index into a halfword table for larger offsets.
- BL/BLX save LR with bit 0 set (Thumb state marker). BX LR returns from function.
- PC-relative branches are position-independent (PIC friendly).

## Real World Application

Branch instructions are the foundation of all control flow: function calls (BL), returns (BX LR), conditional execution (Bcc), and efficient switch statements (TBB/TBH). Compilers generate TBB for dense switch cases to avoid long compare-and-branch chains.

===EXPLANATION===

Branch instructions define the control flow of every program, and the Cortex-M offers a rich set of branching primitives inherited from the ARM and Thumb-2 architectures. From the unconditional jump (B) to the table-based switch (TBB), each instruction serves a specific purpose in the compiler's optimization toolkit.

The historical backbone of ARM branch design is the link register (LR) concept. Instead of pushing the return address onto the stack as x86 does, ARM stores it in a dedicated register (R14). This makes leaf function calls — functions that call no other functions — blindingly fast: no stack memory access is needed for the return address. BL saves PC in LR and branches. BX LR returns from the function.

The intuition behind TBB (Table Branch Byte) is that switch statements with consecutive case values are common in C code: `switch (i) { case 0: ... case 1: ... case 2: ...}`. A naive compiler could generate a compare-and-branch chain: `cmp i, #0; beq case0; cmp i, #1; beq case1; ...` — slow for many cases. TBB replaces this with a single instruction that indexes into a byte table of offsets: `TBB [PC, R0]`, where R0 is the case index, and the table at PC gives the relative offset for each case. Execution time is constant regardless of the number of cases.

BX LR is the standard return instruction. It loads the PC from LR and exchanges to Thumb state (bit 0 must be set). The Cortex-M automatically saves LR as EXC_RETURN during exception entry, so returning from an interrupt also uses BX — but with a special EXC_RETURN value instead of a normal function return address.

Conditional branches (Bcc) are the workhorses of loops and if-statements. The condition mnemonics follow a logical pattern: BEQ (equal), BNE (not equal), BCS/BHS (carry set / unsigned higher or same), BCC/BLO (carry clear / unsigned lower), BMI (minus / negative), BPL (plus / positive or zero), BVS (overflow set), BVC (overflow clear), BHI (unsigned higher), BLS (unsigned lower or same), BGE (signed greater or equal), BGT (signed greater than), BLE (signed less or equal), BLT (signed less than).

In professional optimization work, branch instructions are the most impactful targets. A branch that is mispredicted by the pipeline costs several cycles. Compilers use profile-guided optimization to reorder branches for prediction accuracy, use conditional instructions (IT blocks) to eliminate short branches, and use table branches for dense switches.

Visualize branches as a road network. B is a straight highway. BL is a highway with a breadcrumb trail leading back. BX LR is the trail home. Bcc is a conditional exit ramp that opens only when a specific condition is met. TBB is a roundabout with multiple exits indexed by number.

Key points: BL saves PC in LR and branches; BX LR returns; TBB/TBH uses byte/halfword offset table; BLX is used for inter-mode switching (not needed on Cortex-M); conditional branches have ±2KB to ±16MB range; LR bit 0 set indicates Thumb state; TBB table must be within 256 bytes of the instruction.

References: ARM Architecture Reference Manual ARMv7-M (section A6.4 — Branch instructions), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 4.7), ARM Infocenter DDI0403E.

