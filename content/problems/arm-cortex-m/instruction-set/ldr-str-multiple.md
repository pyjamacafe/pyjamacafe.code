+++
date = '2026-07-06T10:32:00+05:30'
draft = false
title = 'LDR and STR Multiple Operations'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 8
weight = 2
initial_code = '''// Use LDM and STM for block memory operations
#include <stdio.h>
#include <stdint.h>

void stm_block(uint32_t *addr, uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    __asm volatile(
        "STM %0!, {%1, %2, %3, %4}"
        : "+r" (addr)
        : "r" (a), "r" (b), "r" (c), "r" (d)
        : "memory"
    );
}

void ldm_block(uint32_t *addr, uint32_t *a, uint32_t *b,
               uint32_t *c, uint32_t *d) {
    uint32_t ra, rb, rc, rd;
    __asm volatile(
        "LDM %0!, {%1, %2, %3, %4}"
        : "+r" (addr), "=r" (ra), "=r" (rb), "=r" (rc), "=r" (rd)
        :
        : "memory"
    );
    *a = ra; *b = rb; *c = rc; *d = rd;
}

void memcpy_word(uint32_t *dst, uint32_t *src, uint32_t count) {
    __asm volatile(
        "LOOP:                  \\n\\t"
        "LDMIA %0!, {R0-R3}    \\n\\t"
        "STMIA %1!, {R0-R3}    \\n\\t"
        "SUBS %2, %2, #4       \\n\\t"
        "BNE LOOP               \\n\\t"
        : "+r" (src), "+r" (dst), "+r" (count)
        :
        : "r0", "r1", "r2", "r3", "memory"
    );
}

int main(void) {
    uint32_t buffer[8] = {0};

    stm_block(buffer, 0xAAAA, 0xBBBB, 0xCCCC, 0xDDDD);
    printf("After STM:\\n");
    for (int i = 0; i < 4; i++) {
        printf("  [%d] = 0x%08X\\n", i, buffer[i]);
    }

    uint32_t a, b, c, d;
    ldm_block(buffer, &a, &b, &c, &d);
    printf("\\nAfter LDM: 0x%08X 0x%08X 0x%08X 0x%08X\\n", a, b, c, d);

    uint32_t src[8] = {1, 2, 3, 4, 5, 6, 7, 8};
    uint32_t dst[8] = {0};
    memcpy_word(dst, src, 8);
    printf("\\nmemcpy result: ");
    for (int i = 0; i < 8; i++) printf("%u ", dst[i]);
    printf("\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program using LDM (Load Multiple) and STM (Store Multiple) instructions to efficiently copy blocks of data. Implement a word-aligned memcpy that transfers 4 words per loop iteration using LDMIA and STMIA. Demonstrate loading and storing multiple registers from/to memory.

## Theory and Concepts

- LDM loads multiple registers from consecutive memory starting at the base address.
- STM stores multiple registers to consecutive memory starting at the base address.
- LDMIA/LDMFD: load multiple, increment address after each access.
- STMIA/STMFD: store multiple, increment address after each access.
- LDMDB/LDMEA: load multiple, decrement address before each access.
- STMDB/STMFD: store multiple, decrement address before each access.
- The base register can be optionally updated (write-back with ! suffix).
- Register list can be any subset of R0-R12, LR, PC.
- LDM and STM are 32-bit Thumb-2 instructions on Cortex-M.

## Real World Application

LDM/STM are used in context switching (saving/restoring registers to/from stack), memcpy implementation, and data transfer routines. The Cortex-M exception stacking (push of R0-R3, R12, LR, PC, xPSR) is essentially an STM operation.

