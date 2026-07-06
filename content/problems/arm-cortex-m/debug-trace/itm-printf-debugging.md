+++
date = '2026-07-06T11:02:00+05:30'
draft = false
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

    printf("ITM Printf Debugging\\n\\n");

    itm_write_string("Hello from ITM!\\n");

    printf("ITM TCR:  0x%08X\\n", ITM_TCR);
    printf("ITM TER:  0x%08X\\n", ITM_TER);
    printf("ITM LSR:  0x%08X\\n\\n", ITM_LSR);

    printf("ITM features:\\n");
    printf("  - 32 stimulus ports (SWO) / 256 (serial wire)\\n");
    printf("  - Non-blocking writes to debugger\\n");
    printf("  - Zero overhead when no debugger attached\\n");
    printf("  - Works with SWO pin and debuggers (JLink, STLink)\\n");

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

