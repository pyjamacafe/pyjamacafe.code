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

===EXPLANATION===

R14 (LR) and R15 (PC) are the two most important registers for understanding program flow. The PC always contains the address of the next instruction to execute; in Cortex-M it is always aligned to a halfword (bit 0 = 1 to indicate Thumb state). Reading PC via `MOV Rd, PC` returns the current instruction address + 4 due to pipeline pre-fetch — a classic source of off-by-one errors when computing branch offsets manually. The LR holds the return address after a `BL` or `BLX` instruction, with bit 0 set to 1 (Thumb interworking). When a function is called, the hardware sets LR to the address of the next instruction after the BL, and the function's `BX LR` returns there.

The historical design: ARM's `BL` instruction (Branch with Link) has existed since the original ARM1 (1985). Cortex-M inherits the same semantics but always runs in Thumb state, so LR bit 0 is always 1. The clever part is what happens on exception entry: the hardware overwrites LR with a special EXC_RETURN value (0xFFFFFFFx) that encodes how to return from the exception — which stack pointer to use (MSP or PSP), which mode to return to (Handler or Thread), and which security state (Secure or Non-Secure). The EXC_RETURN pattern has the high byte as 0xFF, distinguishing it from any valid code address.

Professional debugging tools exploit this. In FreeRTOS, when a task crash occurs, the `vApplicationStackOverflowHook` receives the task handle; the debugger can walk the stacked LR values to reconstruct the call path. Zephyr's `arch_fault_handler` saves the stacked PC and LR, printing them in the fault output. The Linux kernel's `arch/arm/mm/fault.c` on Cortex-M reads `current_thread_info()->cpu_context.pc` and `cpu_context.lr` for backtraces. CMSIS-DAP debuggers use the PC and LR from the Dhrystone register window to show the call stack in IDEs.

Visualize program flow as a stack of frames: each `BL` pushes LR (implicitly) and a frame pointer, creating a linked list of call frames. On exception entry, the hardware pushes PC+LR (and other registers) onto the stack as part of the 8-word exception frame. Reading the stacked PC shows exactly where the fault occurred.

Key points: (1) PC bit 0 = 1 always in Cortex-M (Thumb state). (2) LR after BL = return address with bit 0 = 1. (3) On exception entry, LR becomes EXC_RETURN (0xFFFFFFFx). (4) To read the true return address during an exception, read stacked LR from the stack frame. (5) Nested calls require the callee to push LR onto the stack — the compiler does this automatically for non-leaf functions.

References: ARMv7-M ARM (DDI0403) B1.5, AAPCS (IHI0042) section 5.2, FreeRTOS `vTaskSwitchContext` stack frame inspection, Zephyr `arch/arm/core/fault.c`, ARM Infocenter KB "Reading LR in Exception Handlers".

