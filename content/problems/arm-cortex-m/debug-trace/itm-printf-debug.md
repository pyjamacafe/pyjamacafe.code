+++
date = '2026-07-06T18:01:00+05:30'
draft = false
title = 'ITM printf-style Debug Output'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 14
weight = 4
initial_code = '''#include <stdio.h>

// ITM stimulus port 0 (commonly used for printf output)
#define ITM_STIM0   (*(volatile unsigned int *)0xE0000000)
#define ITM_TER0    (*(volatile unsigned int *)0xE0000E00)
#define ITM_TCR     (*(volatile unsigned int *)0xE0000E80)
#define ITM_LAR     (*(volatile unsigned int *)0xE0000FB0)
#define DEMCR       (*(volatile unsigned int *)0xE000EDFC)

void itm_init(void) {
    DEMCR |= (1 << 24);           // Enable DWT/ITM
    ITM_LAR = 0xC5ACCE55;        // Unlock ITM
    ITM_TCR = 0x0001000D;        // Enable ITM, enable stimulus ports
    ITM_TER0 = 1;                 // Enable stimulus port 0
}

void itm_putchar(char c) {
    // Wait until port is ready, then write
    while (!(ITM_STIM0 & 1));
    ITM_STIM0 = c;
}

void itm_printf(const char *str) {
    while (*str) {
        itm_putchar(*str++);
    }
}

int main(void) {
    itm_init();
    itm_printf("Hello from ITM!\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'ITM output: Hello from ITM!'
+++

## Problem Statement

Configure the ITM (Instrumentation Trace Macrocell) to send character output via the SWO (Serial Wire Output) pin. Implement `itm_putchar` and `itm_printf` functions that redirect standard output through the ITM stimulus port 0, enabling printf-style debugging without a physical UART.

## Theory and Concepts

- The ITM provides up to 32 stimulus ports that can send data to a trace capture tool via SWO.
- Stimulus port 0 is conventionally used for printf-style debug output.
- The ITM must be enabled via the ITM_TCR register, and individual ports enabled via ITM_TER.
- Writing to a stimulus port while it is not ready blocks the CPU (poll ITM_STIMx bit 0).
- A debug probe (J-Link, ST-Link, DAPLink) and viewer (Ozone, STM32CubeMonitor, printf viewer) are required to capture the output on the host.

## Real World Application

ITM printf is the preferred debug output method on ARM Cortex-M when a debugger is connected — it is non-intrusive (uses SWO pin, not a UART), works at very high speed, and does not interfere with the application's timing as much as a UART-based printf.
