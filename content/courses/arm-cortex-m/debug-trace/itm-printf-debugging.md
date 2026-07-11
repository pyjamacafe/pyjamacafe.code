+++
date = '2026-07-06T11:02:00+05:30'
draft = true
title = 'ITM Printf Debugging'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 14
weight = 2
initial_code = '''// Use ITM stimulus ports for printf-style debugging
#include <stdio.h>
#include <stdint.h>

#define ITM_BASE     0xE0000000
#define ITM_STIM0    (*((volatile uint32_t *)(ITM_BASE + 0x000)))
#define ITM_TER      (*((volatile uint32_t *)(ITM_BASE + 0xE00)))
#define ITM_TCR      (*((volatile uint32_t *)(ITM_BASE + 0xE80)))
#define ITM_LAR      (*((volatile uint32_t *)(ITM_BASE + 0xFB0)))
#define ITM_LSR      (*((volatile uint32_t *)(ITM_BASE + 0xFB4)))

#define DEMCR        (*((volatile uint32_t *)0xE000EDFC))

void itm_init(void) {
    DEMCR |= (1UL << 24);
    ITM_LAR = 0xC5ACCE55;
    ITM_TCR = (1UL << 0) | (1UL << 2) | (1UL << 3) | (1UL << 4);
    ITM_TER = 1;
}

void itm_write_char(char c) {
    while (!(ITM_STIM0 & 1));
    ITM_STIM0 = c;
}

void itm_write_string(const char *s) {
    while (*s) {
        itm_write_char(*s++);
    }
}

void itm_printf(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    char buf[128];
    vsnprintf(buf, sizeof(buf), fmt, args);
    itm_write_string(buf);
    va_end(args);
}

int main(void) {
    itm_init();

    printf("ITM Printf Debugging\n\n");

    itm_write_string("Hello from ITM!\n");

    printf("ITM TCR:  0x%08X\n", ITM_TCR);
    printf("ITM TER:  0x%08X\n", ITM_TER);
    printf("ITM LSR:  0x%08X\n\n", ITM_LSR);

    printf("ITM features:\n");
    printf("  - 32 stimulus ports (SWO) / 256 (serial wire)\n");
    printf("  - Non-blocking writes to debugger\n");
    printf("  - Zero overhead when no debugger attached\n");
    printf("  - Works with SWO pin and debuggers (JLink, STLink)\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that initializes and uses the ITM (Instrumentation Trace Macrocell) stimulus ports for printf-style debugging over SWO (Serial Wire Output). Implement itm_write_char, itm_write_string, and itm_printf functions that output to ITM stimulus port 0.

## Theory and Concepts

- ITM is part of the ARM CoreSight debug infrastructure, providing software-driven trace.
- 32 stimulus ports (8-bit, 16-bit, or 32-bit access) allow tagged trace output.
- ITM_TCR: Trace Control Register — enables ITM, sets timestamp and synchronization.
- ITM_TER: Trace Enable Register — enables individual stimulus ports.
- ITM_LAR: Lock Access Register — unlock ITM for configuration (key: 0xC5ACCE55).
- DEMCR bit 24 (TRCENA) must be set before accessing DWT/ITM.
- SWO (Serial Wire Output) pin carries ITM data to the debugger.
- When no debugger is connected, writes to ITM are dropped automatically (no overhead).
- ITM is available on Cortex-M3/M4/M7/M33/M55. Not on M0/M0+/M23.

## Real World Application

ITM is the preferred debug output method in production firmware because it is non-blocking (unlike UART), has zero overhead when no debugger is attached, and works with standard tools like JLink RTT Viewer and ST-Link.

===EXPLANATION===

The Instrumentation Trace Macrocell (ITM) is one of the most powerful yet underutilized debug features on Cortex-M processors. It provides software-driven trace output through dedicated stimulus ports, allowing printf-style debugging without consuming a UART, without interrupting the application's real-time behavior, and with zero overhead when no debugger is connected. For firmware developers, ITM is the closest thing to a "printf that just works" in the embedded world.

The ITM is part of ARM's CoreSight debug and trace infrastructure, introduced with Cortex-M3 and refined in subsequent generations. CoreSight provides a standardized framework for debug, trace, and profiling across ARM devices. ITM specifically fills the gap between hardware breakpoints (too limited for complex debugging) and full ETM trace (too expensive and power-hungry). It gives the programmer 32 stimulus ports (or 256 on some implementations) that can output data over the SWO (Serial Wire Output) pin at speeds up to the CPU clock.

The intuition is that ITM is like a dedicated high-speed telemetry channel built into the silicon. You write a character to a memory-mapped register (ITM_STIM0), and the debug hardware serializes it onto the SWO pin, where a debug probe captures it and forwards it to a host viewer. The write is non-blocking: if the port is busy, the CPU waits a cycle; if no debugger is connected, the write drops silently—no hangs, no faults. This is radically different from UART-based debug, where a missing receiver or buffer overflow can stall the application.

In real-world development, ITM is used extensively by professional firmware teams. Segger's J-Link and Ozone debugger support ITM natively; ARM Keil MDK and IAR Embedded Workbench can display ITM output in real time. STM32CubeIDE and MCUXpresso both support ITM. Engineers use ITM for logging state changes, dumping sensor data, tracing RTOS scheduling decisions, and profiling interrupt latency. Because ITM works over a single SWD/SWO pin (SWDIO for programming + SWCLK + SWO), it requires no extra hardware beyond a standard debug probe.

Picture the data flow: software writes to ITM_STIM0 (address 0xE0000000). The ITM hardware encodes the byte into a trace packet: header byte (0 to 31 = stimulus port), data byte, optional timestamp. The TPIU (Trace Port Interface Unit) serializes these packets onto the SWO pin. The debug probe captures the bitstream, decodes packets, and sends them over USB to the host. The host software (Ozone, ST-Link Utility, putty) displays the characters. The entire path is asynchronous and buffered, so application timing is minimally affected.

Key points:
1. ITM requires enabling TRCENA (DEMCR bit 24), unlocking ITM_LAR (key 0xC5ACCE55), configuring ITM_TCR, and enabling stimulus ports in ITM_TER.
2. ITM is available on Cortex-M3/M4/M7/M33/M55 but NOT on Cortex-M0/M0+/M23.
3. SWO pin must be connected and SWO frequency configured correctly for the host to decode.
4. Stimulus port 0 is conventional for simple text output; different ports can carry different data types (e.g., port 1 for RTOS events, port 2 for sensor data).
5. ITM can also be used for instrumentation on hardware (DWT comparator match events, ETM triggers), not just software output.


References:
1. ARM CoreSight Architecture Specification (ARM IHI 0029E), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" Chapter 16, ARM AN454 (ITM and SWO), Segger J-Link ITM documentation, and STM32CubeProgrammer SWO viewer guide.
