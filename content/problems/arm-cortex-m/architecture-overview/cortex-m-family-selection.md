+++
date = '2026-07-06T10:20:00+05:30'
draft = false
title = 'Cortex-M Family Selection Guide'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 5
initial_code = '''// Cortex-M family selection guide generator
#include <stdio.h>
#include <stdint.h>

typedef struct {
    const char *name;
    uint32_t part_no;
    const char *arch;
    uint32_t has_mpu;
    uint32_t has_fpu;
    uint32_t has_trustzone;
    uint32_t has_dsp;
    const char *best_for;
} cortex_m_info_t;

cortex_m_info_t cortex_m_parts[] = {
    {"Cortex-M0",  0xC20, "ARMv6-M",     0, 0, 0, 0, "Ultra-low-cost"},
    {"Cortex-M0+", 0xC60, "ARMv6-M",     0, 0, 0, 0, "Low-power I/O"},
    {"Cortex-M3",  0xD20, "ARMv7-M",     1, 0, 0, 0, "General purpose"},
    {"Cortex-M4",  0xD24, "ARMv7-M",     1, 1, 0, 0, "DSP/Audio"},
    {"Cortex-M7",  0xD27, "ARMv7-M",     1, 1, 0, 0, "High perf"},
    {"Cortex-M23", 0xD22, "ARMv8-M BL",  0, 0, 1, 0, "Secure low-power"},
    {"Cortex-M33", 0xD21, "ARMv8-M ML",  1, 1, 1, 1, "Secure general"},
    {"Cortex-M55", 0xD23, "ARMv8.1-M ML",1, 1, 1, 1, "ML/AI at edge"},
    {NULL, 0, NULL, 0, 0, 0, 0, NULL}
};

void print_selection_table(void) {
    printf("%-12s %-10s %-7s %-4s %-4s %-5s %s\\n",
           "Core", "Part No", "Arch", "MPU",
           "FPU", "TZ", "Best for");
    printf("------------------------------------------------------------\\n");

    for (int i = 0; cortex_m_parts[i].name != NULL; i++) {
        printf("%-12s 0x%04X   %-7s %-4s %-4s %-5s %s\\n",
               cortex_m_parts[i].name,
               cortex_m_parts[i].part_no,
               cortex_m_parts[i].arch,
               cortex_m_parts[i].has_mpu ? "Yes" : "No",
               cortex_m_parts[i].has_fpu ? "Yes" : "No",
               cortex_m_parts[i].has_trustzone ? "Yes" : "No",
               cortex_m_parts[i].best_for);
    }
}

int main(void) {
    printf("Cortex-M Family Selection Guide\\n\\n");
    print_selection_table();

    printf("\\nSelection criteria:\\n");
    printf("  - Need TrustZone? Choose M23/M33/M55\\n");
    printf("  - Need FPU? Choose M4/M7/M33/M55\\n");
    printf("  - Need DSP? Choose M4/M7/M33/M55\\n");
    printf("  - Lowest power? Choose M0+/M23\\n");
    printf("  - Maximum perf? Choose M7/M55\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Create a Cortex-M family selection guide program. Define a data structure for each Cortex-M core containing its name, part number, architecture version, and feature flags (MPU, FPU, TrustZone, DSP). Print a formatted table of all Cortex-M families and include decision criteria for selecting the appropriate core for different application requirements.

## Theory and Concepts

- ARM Cortex-M includes Baseline (M0, M0+, M23) and Mainline (M3, M4, M7, M33, M55, M85).
- Baseline: limited instruction set, lower performance, lower power.
- Mainline: full Thumb-2, higher performance, more features.
- ARMv6-M: M0/M0+/M1. ARMv7-M: M3/M4/M7. ARMv8-M: M23/M33. ARMv8.1-M: M55/M85.
- Feature progression: M0 < M3 < M4 < M7 for performance; M23 < M33 < M55 for security + performance.

## Real World Application

System architects use selection guides to choose the optimal Cortex-M processor for their product requirements, balancing cost, power, performance, and security features. Automotive, industrial, and consumer IoT each have different sweet spots.

===EXPLANATION===

The Cortex-M family began in 2004 with the ARMv6-M Cortex-M0, designed to displace 8/16-bit microcontrollers with a 32-bit core at comparable power. ARMv7-M followed with the Cortex-M3 (2005), M4 (2010) adding DSP+FPU, and M7 (2014) pushing into high-performance real-time control. The ARMv8-M revision (2016) introduced TrustZone security to the microcontroller class, and ARMv8.1-M (2020) added Helium vector extensions for ML at the edge. Each generation addresses a specific market segment while maintaining backward source compatibility.

Your mental model of the Cortex-M lineup should be two axes: architectural generation (v6-M → v7-M → v8-M → v8.1-M) and class (Baseline vs Mainline). Baseline cores (M0, M0+, M23) use a 16-bit-heavy Thumb subset, have no hardware divide, and target ultra-low-power. Mainline cores (M3, M4, M7, M33, M55, M85) implement the full Thumb-2 ISA with hardware divide, MPU, and optional FPU/DSP. TrustZone is available only on v8-M and later — M23 (Baseline) or M33/M55/M85 (Mainline).

Professional firmware projects make selection decisions based on quantifiable criteria. Zephyr RTOS, for instance, defines three tier levels: Tier 1 for widely-used cores (M3, M4, M33), Tier 2 for specialized cores (M7, M55), and Tier 3 for Baseline. FreeRTOS mainline supports M0+ through M7 with conditional compilation for FPU context saving. The CMSIS-Core specification abstracts the differences — your application code can target `__FPU_PRESENT`, `__MPU_PRESENT`, and `__TZ_PRESENT` macros and compile for any core. In production, hardware teams often select a range (e.g., STM32G0 with M0+ for cost-sensitive variants and STM32H7 with M7 for high-end), so firmware must detect features at runtime via the CPUID register.

Visualize the family as a bubble chart: x-axis = performance (DMIPS/MHz), y-axis = feature richness, bubble size = market adoption. M0/M0+ sit low-left (smallest), M3 centers as the sweet spot, M4 shifts right with FPU, M7 goes upper-right. M23 occupies M0+ territory plus TrustZone, M33 sits near M4. This chart explains why M4 dominates audio/DSP, M7 dominates motor control, and M33 dominates secure IoT.

Key points: (1) Part number 0xD2x identifies Mainline, 0xCxx identifies Baseline. (2) M0+ has a vector table relocation feature that M0 lacks. (3) M7 can have up to two FPUs (double-precision and single-precision). (4) M55/M85 add Helium (MVE) for SIMD. (5) ARMv8.1-M introduces branch target identification and pointer authentication for safety.

References: ARM Cortex-M Processor Comparison Table, CMSIS-Core documentation, Zephyr RTOS board ports at `arch/arm/core/cortex_m/`, STM32Cube MCU selection guides, and the ARM Architecture Reference Manual for ARMv8-M (DDI0553).

