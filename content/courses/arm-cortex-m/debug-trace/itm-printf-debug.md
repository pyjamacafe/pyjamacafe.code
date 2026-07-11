+++
date = '2026-07-06T18:01:00+05:30'
draft = true
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
    itm_printf("Hello from ITM!\n");
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

===EXPLANATION===

The Instrumentation Trace Macrocell (ITM) provides a dedicated channel for software-driven trace output that operates independently of the main application. By redirecting printf output through ITM stimulus port 0, developers gain real-time, non-blocking, high-speed debug logging that does not consume a UART peripheral, does not interrupt the application's timing, and has zero footprint when no debugger is attached.

ITM is a key component of the ARM CoreSight debug ecosystem, alongside the DWT (Data Watchpoint and Trace) and FPB (Flash Patch and Breakpoint). While early embedded debugging relied entirely on JTAG boundary scan and hardware breakpoints, the need for low-intrusion visibility drove the development of trace buffers and serial wire output. ITM provides the critical link between software and the debugger: the CPU writes data to memory-mapped stimulus ports, and the hardware serializes it onto the SWO pin without CPU intervention for the data movement.

The intuition is that ITM acts as a high-speed out-of-band telemetry channel. Your application writes a character to `ITM_STIM0` as if writing to any other memory-mapped register. If the port is ready, the character is accepted and transmitted; if not, the CPU stalls one cycle. The data flows over the SWO pin (a dedicated trace output pin distinct from the SWD two-pin debug interface) to the debug probe, which forwards it over USB to a host viewer. The whole mechanism is asynchronous to the CPU pipeline, meaning your application's real-time behavior is preserved.

In practice, ITM printf is widely adopted across the ARM ecosystem over UART-based printf. Segger J-Link probes support ITM natively with their RTT (Real-Time Transfer) and SWO viewers. ARM Keil MDK's Debug (printf) Viewer, IAR Embedded Workbench's Terminal I/O, and STM32CubeProgrammer all show ITM output. The key advantage is that SWO uses a single dedicated pin rather than a full UART TX pin, freeing UART peripherals for their intended communication functions. When no debugger is connected, writes to ITM_STIMx are silently dropped—the application never hangs waiting for a UART that is not connected.

Picture the data path: `printf("Hello\n")` → `fputc()` (retargeted by the C library) → `ITM_STIM0 = 'H'` → ITM hardware packetizes it → TPIU encodes it as NRZ bitstream on SWO → debug probe decodes → USB to host → viewer displays "Hello". The total latency from printf to display is a few microseconds, and the CPU is only involved for the register write (1 cycle). Compare this to a UART, where each character requires configuring the baud rate generator, waiting for the TX register to be ready, waiting for the shift register to complete, and handling potential TX interrupts—hundreds of cycles per character.

Key points:
1. ITM requires TRCENA in DEMCR, ITM_LAR unlock (0xC5ACCE55), ITM_TCR configuration (enable ITM and stimulus ports), and ITM_TER enable for each port.
2. The SWO pin must be connected and the SWO frequency must match between the chip and the debug probe (typically configured by the debug probe automatically via SWD).
3. ITM is available on Cortex-M3/M4/M7/M33/M55 but NOT on Cortex-M0/M0+/M23.
4. Stimulus port 0 is conventional for text; ports 1–31 can carry binary data, RTOS events, or custom instrumentation.
5. The ITM hardware includes a timestamp generator that can be enabled to annotate trace data with cycle counts.


References:
1. ARM CoreSight Primer (ARM white paper), ARM ITM Technical Reference Manual, "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 16), Segger J-Link ITM User Guide, and STM32CubeProgrammer SWO documentation.
