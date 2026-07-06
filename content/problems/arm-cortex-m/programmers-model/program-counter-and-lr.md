+++
date = '2026-07-06T10:01:00+05:30'
draft = false
title = 'Program Counter and Link Register'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 2
weight = 2
initial_code = '''// Track function call nesting using LR
#include <stdio.h>
#include <stdint.h>

#define LR_UNKNOWN 0xFFFFFFFF

void print_return_address(const char *func_name) {
    uint32_t lr_value;

    __asm volatile("MOV %0, LR" : "=r" (lr_value));

    printf("%s: return address = 0x%08X\\n", func_name, lr_value);

    if (lr_value & 1) {
        printf("  -> Thumb mode (bit 0 set)\\n");
    }
}

void func_a(void) {
    print_return_address("func_a");
}

void func_b(void) {
    print_return_address("func_b");
    func_a();
}

int main(void) {
    printf("Call stack trace:\\n");
    func_b();
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Call stack trace:'
+++

## Problem Statement

Implement a call trace utility that captures and displays the Link Register (LR, R14) value at each function call level. Show the return address for each nested call. Use inline assembly to read LR, and demonstrate how LR bit 0 indicates Thumb state.

## Theory and Concepts

- R14 (LR) holds the return address when a function call is made via BL, BLX instructions.
- LR bit 0 is always 1 in Thumb mode (interworking). The actual branch target address has bit 0 cleared.
- On exception entry, LR is updated with EXC_RETURN to indicate return mode and stack pointer selection.
- Nested function calls require saving LR to the stack before a new BL overwrites it.
- The Program Counter (R15, PC) is read as current instruction address + 4 due to pipelining.

## Real World Application

Call stack tracing is critical for debugging crashes and hangs on embedded systems. When a fault occurs, reading LR from the stacked context reveals where the code was executing. RTOS task stacks use LR to manage return paths.

