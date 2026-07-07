+++
date = '2026-07-06T18:21:00+05:30'
draft = false
title = 'CONTROL.FPCA and FPU Context Tracking'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 4
initial_code = '''#include <stdio.h>

unsigned int get_control(void) {
    unsigned int result;
    __asm("MRS %0, CONTROL" : "=r" (result));
    return result;
}

int main(void) {
    // Check FPCA bit (bit 2 of CONTROL)
    unsigned int control = get_control();

    if (control & (1 << 2)) {
        printf("FPCA set: FPU context is active\\n");
    } else {
        printf("FPCA clear: FPU context is inactive\\n");
    }

    // The FPCA bit is set automatically when any FPU instruction executes
    // It is cleared on exception return if lazy stacking was used

    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'FPCA bit state read'
+++

## Problem Statement

Read the CONTROL register and examine the FPCA (Floating-point Context Active) bit. Perform a floating-point operation and re-read the CONTROL register to observe how the FPCA bit is automatically set by the hardware when an FPU instruction executes.

## Theory and Concepts

- CONTROL.FPCA (bit 2) indicates whether the FPU has been used since the last exception entry or return.
- The bit is set automatically by hardware when any FPU instruction executes.
- The bit is cleared on exception return if lazy stacking was used and the FPU state was not modified.
- The OS can use the FPCA bit to determine whether floating-point context needs to be saved during a context switch — if FPCA is clear, there is no need to save FPU registers.
- In an RTOS, the FPCA bit is checked during context switching to optimise FPU register save/restore.

## Real World Application

The FPCA bit enables RTOSes to implement FPU-lazy context switching — a task that never uses the FPU does not incur the overhead of FPU register save/restore during context switches. This is critical for systems with many tasks where only a few use floating-point.

===EXPLANATION===

CONTROL.FPCA (bit 2) is a hardware‑managed flag that records whether the FPU has been used since the last exception entry or return. It is set automatically by any FPU instruction (VMOV, VADD, VLDR, etc.) and cleared on exception return when lazy stacking is enabled and the FPU state was not modified in the handler. The OS can read this bit to decide whether to save FPU registers during a context switch.

Why is this important? A context switch that saves and restores 32 S registers plus FPSCR adds about 100‑120 cycles of overhead. In a system with 20 tasks where only 3 use floating‑point, eager saving would waste 1700 cycles per switch cycle even for the 17 tasks that never touch the FPU. With FPCA‑aware scheduling, the RTOS skips FPU save/restore for tasks where FPCA is clear, reducing the switch overhead by 85%.

The mechanism works in concert with lazy stacking (FPCCR.LSPEN). When lazy stacking is enabled, the CPU does not automatically save FPU registers on exception entry — it records the save location in FPCAR. If the PendSV handler (used for context switching) checks FPCA and finds it clear, it knows the current task did not use the FPU and skips the VPUSH. The next task's FPCA is then set by the RTOS based on whether that task is FPU‑capable.

A practical example: an audio processing system has one audio task (uses FPU for FFT), one UI task, and one communication task. The audio task runs at 500 Hz and uses the FPU heavily. The UI and comms tasks never use the FPU. With FPCA‑based scheduling, each context switch between non‑FPU tasks costs zero FPU overhead. The only FPU saves occur when switching to or from the audio task.

Visualise a blackboard in a classroom where only the maths tutor writes equations. The FPCA bit is a light above the board — it lights up when someone writes a formula. The cleaner (context switcher) only erases the board if the light is on; otherwise, they leave it untouched.

Key points: (1) FPCA is read‑only; only hardware sets and clears it. (2) Clearing FPCA does not clear FPU registers — the state remains. (3) RTOS must save FPCA in the TCB and restore it on switch. (4) FPCA is also set by CMSIS intrinsic functions that touch the FPU. (5) On Cortex‑M33 with TrustZone, FPCA is banked per security state.

The ARMv7‑M and ARMv8‑M Architecture Reference Manuals, "CONTROL register" section, document FPCA. FreeRTOS's Cortex‑M4 port (`port.c`) and Zephyr's ARM64 FPU context switch routines demonstrate production FPCA usage.
