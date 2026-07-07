+++
date = '2026-07-06T15:01:00+05:30'
draft = false
title = 'Baseline vs Mainline Feature Detection'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 2
initial_code = '''// Detect whether the core is Baseline or Mainline
#include <stdio.h>

#define SCB_CPUID  (*((volatile unsigned int *)0xE000ED00))

int main(void) {
    unsigned int cpuid = SCB_CPUID;
    unsigned int arch  = (cpuid >> 4) & 0xF;
    unsigned int part  = (cpuid >> 4) & 0xFFF;

    // Architecture: 0x2 = ARMv6-M, 0x3 = ARMv7-M, 0x4 = ARMv8-M
    // Part number: 0xC20 = M0, 0xC60 = M0+, 0xD20 = M3, 0xD24 = M4,
    //              0xD21 = M33, 0xD22 = M23, 0xD23 = M55

    printf("Architecture: 0x%X\\n", arch);
    printf("Part number: 0x%X\\n", part);

    // Determine Baseline vs Mainline based on features
    // (Baseline has no MPU, no FPU, limited instruction set)

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Baseline vs Mainline detected'
+++

## Problem Statement

Read the CPUID register and decode the architecture version and part number to distinguish between ARMv8-M Baseline (Cortex-M23) and Mainline (Cortex-M33/M55) cores. Compare the features each supports: MPU, FPU, DSP extension, TrustZone, and instruction set.

## Theory and Concepts

- ARMv8-M Baseline (Cortex-M23): thumb-only, no MPU, no FPU, no DSP extensions, no bit-banding, TrustZone optional.
- ARMv8-M Mainline (Cortex-M33/M35P/M55): full Thumb-2, MPU, optional FPU and DSP, TrustZone, security extensions.
- Baseline is designed for ultra-low-power, cost-sensitive applications; Mainline for higher-performance embedded.
- The part number in CPUID identifies the exact core.
- Some chips implement ARMv8-M Mainline without all optional features — always detect at runtime.

## Real World Application

Feature detection enables a single firmware image to run on different MCU variants (e.g., Cortex-M33 with and without FPU). Automotive and industrial applications often require this to support multiple chip grades with different feature sets.

===EXPLANATION===

The Baseline vs Mainline distinction traces back to ARM's strategy in the early 2000s: compete with 8-bit MCUs using a minimal 32-bit core (Cortex-M0, ARMv6-M) while offering a full-featured line (Cortex-M3, ARMv7-M) for traditional 32-bit applications. ARMv8-M maintained this split with M23 (Baseline) and M33 (Mainline), though the gap narrowed: Baseline gained TrustZone but still lacks FPU, DSP, and the full Thumb-2 ISA. The key insight is that Baseline is not "worse" — it is optimised for die area, power, and interrupt latency where those features would be wasted silicon.

Intuitively, think of Baseline as a RISC-V RV32EC — it strips out multi-cycle and rarely-used instructions to keep the decoder tiny. Mainline is like RV32IMAFD — the full meal deal. The Cortex-M0 decoder is roughly 2500 gates; the M3 decoder is closer to 12000. That gate count directly impacts leakage current and max frequency. Baseline cores achieve interrupt latency of 12-16 cycles; Mainline needs 12-16 cycles for M3 but up to 24 for M7 with FPU stacking. The tradeoff is everywhere.

Open-source firmware handles this split pragmatically. In Zephyr, `arch/arm/core/cortex_m/` has separate fault handlers for Baseline vs Mainline because the exception stack frame layout differs (Mainline always pushes xPSR, PC, LR, R12, R3-R0; Baseline does the same but with fewer optional fields). FreeRTOS port layers for M0+ use `portSAVE_CONTEXT` without FPU registers, while M4/M7 ports conditionally compile `portTASK_USES_FLOATING_POINT`. The Linux kernel's `arch/arm/mm/proc-v7m.S` handles MPU differently for Baseline (no MPU at all) vs Mainline. CMSIS-Core provides `__get_FPSCR()` and `__get_MPU_SREG()` only on Mainline — calling them on Baseline produces a compile-time error unless guarded by `__FPU_PRESENT` or `__MPU_PRESENT`.

Visualize the ISA as a Venn diagram: a small circle for Baseline (56 Thumb instructions, mostly 16-bit) fully contained within a larger circle for Mainline (full Thumb-2 with ~150 instructions, including IT blocks, hardware divide, saturating math, and DSP extensions). The gap between the circles represents instructions that trap as undefined on Baseline — if your compiler emits them, you get a HardFault at runtime.

Key points: (1) Detect via `(CPUID >> 16) & 0xF`: 2 = ARMv6-M, 3 = ARMv7-M, 4 = ARMv8-M. (2) Baseline has no MPU, no FPU, no DSP, no bit-banding. (3) Baseline uses only the MSP (no PSP switching in hardware). (4) Mainline can have all optional features — always probe via the System Control Block ID registers. (5) ARMv8-M Baseline (M23) can still have TrustZone, making it the only "secure" Baseline core.

References: ARMv6-M ARM (DDI0419), ARMv7-M ARM (DDI0403), ARMv8-M ARM (DDI0553), CMSIS-Core 5.9.0 `core_cm0.h` vs `core_cm33.h`, Zephyr `soc/arm/` port structure.
