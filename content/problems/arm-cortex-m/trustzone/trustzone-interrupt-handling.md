+++
date = '2026-07-06T10:14:00+05:30'
draft = false
title = 'TrustZone Secure and Non-Secure Interrupt Handling'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 5
initial_code = '''// Configure interrupts as secure or non-secure
#include <stdio.h>
#include <stdint.h>

#define NVIC_ISER0  (*((volatile uint32_t *)0xE000E100))
#define NVIC_ICER0  (*((volatile uint32_t *)0xE000E180))
#define NVIC_ISPR0  (*((volatile uint32_t *)0xE000E200))

#define NVIC_ITNS0 (*((volatile uint32_t *)0xE000E900))

void set_interrupt_secure(uint32_t irq_num, uint32_t secure) {
    if (secure) {
        NVIC_ITNS0 &= ~(1UL << irq_num);
    } else {
        NVIC_ITNS0 |= (1UL << irq_num);
    }

    printf("IRQ %u configured as %s\\n",
           irq_num, secure ? "Secure" : "Non-Secure");
}

void enable_interrupt(uint32_t irq_num) {
    NVIC_ISER0 = (1UL << irq_num);
    printf("IRQ %u enabled\\n", irq_num);
}

void disable_interrupt(uint32_t irq_num) {
    NVIC_ICER0 = (1UL << irq_num);
    printf("IRQ %u disabled\\n", irq_num);
}

int main(void) {
    set_interrupt_secure(0, 1);
    set_interrupt_secure(1, 0);
    set_interrupt_secure(2, 0);
    set_interrupt_secure(3, 1);

    enable_interrupt(0);
    enable_interrupt(1);

    printf("\\nSecure interrupts (ITNS=0): IRQ 0, IRQ 3\\n");
    printf("Non-Secure interrupts (ITNS=1): IRQ 1, IRQ 2\\n");

    uint32_t itns = NVIC_ITNS0;
    printf("ITNS0 register: 0x%08X\\n", itns);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Configure interrupt targets for security (NVIC_ITNS registers) to designate some interrupts as Secure and others as Non-Secure. Write a function that assigns security for each interrupt, enables secure-only interrupts, and verifies that non-secure software cannot modify the configuration of secure interrupts.

## Theory and Concepts

- In ARMv8-M with TrustZone, the NVIC is banked: Secure NVIC and Non-Secure NVIC.
- NVIC_ITNS (Interrupt Target Non-Secure) register determines if an interrupt is Secure (0) or Non-Secure (1).
- Secure software can configure all interrupts. Non-secure software can only configure interrupts marked as Non-Secure.
- Secure interrupts can preempt non-secure code; the reverse is not possible.
- Non-secure interrupts cannot be pending while secure code is executing (unless explicitly configured).
- The vector table is also banked: secure and non-secure copies.
- The security of each interrupt is locked after first use; a reset is needed to change it.
- Airplane (not yet pended) interrupts can be reassigned; once pended or enabled, the assignment is locked.

## Real World Application

Secure IoT firmware uses secure interrupts for trusted operations like cryptographic processing and secure timers. Non-secure interrupts handle user-facing features (keyboard, display, connectivity). The separation ensures that an exploited non-secure component cannot compromise secure operations.

===EXPLANATION===

Interrupt handling in TrustZone was a fundamental addition in ARMv8-M. Before TrustZone, the NVIC had a single set of enable/clear/pending/priority registers — any code with privileged access could modify any interrupt's configuration. In ARMv8-M, the NVIC is banked into Secure and Non-Secure copies. The Interrupt Target Non-Secure (NVIC_ITNS) register at `0xE000E900` defines each interrupt's security assignment: 0 = Secure, 1 = Non-Secure. Secure code can configure all interrupts; Non-Secure code can only see and modify interrupts marked as Non-Secure. This is enforced in hardware — a Non-Secure write to a Secure interrupt's registers is silently ignored or faults depending on the access type.

The intuition: the ITNS register is a "security guard" at the door of each interrupt. When ITNS[n] = 0 (Secure), only the secure world can enable/disable/prioritize/pend interrupt n. The non-secure world cannot even see that this interrupt exists — reading its enable bit returns 0. When ITNS[n] = 1 (Non-Secure), both worlds can see it, but only the non-secure world configures it. There is also a critical rule: once an interrupt is pended or enabled, its security assignment is locked until the next reset. This prevents non-secure code from changing an interrupt's security at runtime.

In professional TrustZone firmware, interrupt partitioning is the first step in system design. Zephyr's secure partition manager in `arch/arm/core/trustzone.c` assigns all secure peripheral interrupts (crypto accelerator, secure timer, RTC) to the secure world and all user-facing interrupts (UART, GPIO, USB) to non-secure. FreeRTOS's `xInstallSecureInterrupt` function writes to NVIC_ITNS before enabling the interrupt. mbed OS uses NVIC_ITNS to split interrupt handlers between the secure bootloader and the application. The CMSIS-Core `NVIC_SetTargetState` function writes ITNS and is only available when `__TZ_PRESENT` is defined.

Visualise the banked NVIC as two stacked register files: the Secure NVIC at `0xE000E100-0xE000E4FF` and the Non-Secure NVIC at `0xE002E100-0xE002E4FF`. The ITNS register acts as a multiplexer — each interrupt's actual control bits are physically in the Secure or Non-Secure bank based on ITNS[n]. Non-Secure accesses to Secure-banked addresses are blocked.

Key points: (1) ITNS registers are only writable from Secure state. (2) The vector table is also banked — Secure and Non-Secure have separate VTORs at `0xE000ED08` (Secure) and `0xE002ED08` (Non-Secure). (3) A Secure interrupt can preempt any Non-Secure code; a Non-Secure interrupt cannot preempt Secure code. (4) The security assignment locks when the interrupt is first pended or enabled — plan assignments at boot. (5) Non-secure interrupts can still trigger while Secure code runs if AIRCR.PRIS or SCR.SEC is configured appropriately.

References: ARMv8-M ARM (DDI0553) B2.2, Zephyr `trustzone.c`, FreeRTOS `secure_interrupt_port.c`, CMSIS-Core `core_cm33.h` NVIC functions, PSA Firmware Framework for M (FF-M) specification, ARM AN326 "TrustZone for Cortex-M" app note.

