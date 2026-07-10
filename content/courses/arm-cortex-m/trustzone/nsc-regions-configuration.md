+++
date = '2026-07-06T10:11:00+05:30'
draft = false
title = 'NSC Region Configuration with SAU'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 2
initial_code = '''// Configure NSC regions using the SAU
#include <stdio.h>
#include <stdint.h>

#define SAU_CTRL    (*((volatile uint32_t *)0xE000EDD0))
#define SAU_TYPE    (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RNR     (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RBAR    (*((volatile uint32_t *)0xE000EDD8))
#define SAU_RLAR    (*((volatile uint32_t *)0xE000EDDC))

#define SAU_REGION_ENABLE   1
#define SAU_REGION_NSC      (1UL << 1)

void sau_configure_region(uint32_t region, uint32_t base,
                          uint32_t limit, uint32_t attrs) {
    SAU_RNR = region;
    SAU_RBAR = base;
    SAU_RLAR = (limit & 0xFFFFFFC0) | SAU_REGION_ENABLE | attrs;

    printf("SAU Region %u: 0x%08X - 0x%08X [%s]\n",
           region, base, limit,
           (attrs & SAU_REGION_NSC) ? "NSC" : "NS");
}

int main(void) {
    printf("Configuring SAU with NSC region\n");

    sau_configure_region(0, 0x00000000, 0x001FFFFF, 0);
    sau_configure_region(1, 0x00200000, 0x00200FFF, SAU_REGION_NSC);
    sau_configure_region(2, 0x20000000, 0x3FFFFFFF, 0);

    SAU_CTRL = 1;

    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("SAU enabled: Region 0=Secure, 1=NSC, 2=Non-Secure\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Configure the SAU (Security Attribution Unit) to define three memory regions: a Secure region covering the full code area (0x00000000-0x001FFFFF), an NSC region for secure gateway functions (0x00200000-0x00200FFF), and a Non-Secure region for the rest of memory (0x20000000-0x3FFFFFFF). Enable the SAU and verify the configuration.

## Theory and Concepts

- SAU defines security attributes for each memory region: Secure, Non-Secure (NS), or Non-Secure Callable (NSC).
- NSC regions are Non-Secure memory that can contain SG instructions as entry points.
- SAU_RBAR holds the base address (aligned to 32 bytes).
- SAU_RLAR includes the upper limit address plus the enable bit and NSC attribute bit.
- Each SAU region has variable size from 32 bytes to 4 GB (power of 2 alignment required in v8.0-M, any alignment in v8.1-M).
- The IDAU may override SAU settings. If IDAU and SAU disagree, the more secure attribute wins.
- SAU_CTRL enables the SAU. Before enabling, all memory is Secure by default.
- The number of SAU regions is implementation defined (read from SAU_TYPE).

## Real World Application

TrustZone deployments must carefully partition memory between secure and non-secure worlds. NSC regions are particularly important as they define the attack surface — every non-secure to secure transition must go through a properly configured NSC entry point.

===EXPLANATION===

Non-Secure Callable (NSC) regions are a TrustZone concept introduced with ARMv8-M. When the SAU defines a region as NSC, it marks that memory as Non-Secure for data accesses but with a special property: if the CPU executes an SG (Secure Gateway) instruction at that address, the processor transitions from Non-Secure to Secure state. Without the SG instruction, branching to an NSC address causes a SecureFault or HardFault. This one-way gate mechanism ensures that non-secure code can only enter secure code at precisely defined entry points — you cannot jump into the middle of a secure function.

The intuition: NSC regions are the "airlock" between two worlds. The non-secure world can walk up to the airlock door (NSC address), present the password (SG instruction), and the door opens into secure state. Any attempt to crash through the wall (branch to a secure address not marked as NSC) fails. The SG instruction is the only way to transition from Non-Secure to Secure — there is no direct branch instruction that crosses the boundary. The NSC region is typically 32 bytes per entry point (aligned) and contains the SG instruction followed by a branch into the secure function body.

Professional TrustZone projects define NSC regions in the SAU configuration at boot. Zephyr's `arm_trustzone_configure.c` sets up an NSC region covering the `.nsc_func` section. FreeRTOS's secure entry points (e.g., `SecureContext_Init`, `SecureContext_Load`) are placed in NSC regions via the linker script. The mbed OS TZ bootloader's `startup_M23.s` defines an NSC region at `0x00200000-0x00200FFF` for its secure gateways. CMSIS-Pack TrustZone examples use `SAU_RLAR` with the NSC bit (bit 1) set to define the region.

Visualise a memory map with three colours: Secure (blue) containing secure code and data, NSC (yellow) as small islands at the boundary, and Non-Secure (grey) for everything else. The yellow islands are the only bridges from grey to blue — each island has a guard (SG) and a path function. The SAU ensures that jumping to a blue address from grey causes a fault.

Key points:
1. NSC = Non-Secure for data, Secure for entry via SG.
2. Each NSC region must be aligned to 32 bytes (ARMv8.0-M) or arbitrary (ARMv8.1-M).
3. The first instruction in an NSC entry must be SG — any other instruction causes a fault.
4. More than one secure function can share an NSC region if properly spaced.
5. The linker script must place NSC functions in a separate, aligned section — use `__attribute__((section(".nsc_func")))`.


References:
1. ARMv8-M ARM (DDI0553) section B4.4, Zephyr `include/linker/arm/nsc.ld`, FreeRTOS `secure_port_mem.h`, CMSIS-Core `core_cm33.h` SAU functions, ARM AN326 "TrustZone for Cortex-M".
