+++
date = '2026-07-06T10:45:00+05:30'
draft = true
title = 'Custom Vector Table Override and Weak Aliases'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 10
weight = 5
initial_code = '''// Override vector table entries with weak aliases
#include <stdio.h>
#include <stdint.h>

typedef void (*handler_t)(void);

__attribute__((weak))
void Default_Handler(void) {
    printf("Default handler called for unhandled interrupt\n");
    while (1);
}

void __attribute__((weak, alias("Default_Handler"))) NMI_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) HardFault_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) MemManage_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) BusFault_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) UsageFault_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) SVC_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) PendSV_Handler(void);
void __attribute__((weak, alias("Default_Handler"))) SysTick_Handler(void);

void __attribute__((weak, alias("Default_Handler")))
TIM2_IRQHandler(void);

void __attribute__((weak, alias("Default_Handler")))
UART1_IRQHandler(void);

void Reset_Handler(void);

void override_handler(const char *name, const char *override) {
    printf("  %-20s -> %s\n", name, override);
}

__attribute__((used))
handler_t __isr_vector[16 + 2] __attribute__((section(".isr_vector"))) = {
    (handler_t)0x20010000,
    Reset_Handler,
    NMI_Handler,
    HardFault_Handler,
    MemManage_Handler,
    BusFault_Handler,
    UsageFault_Handler,
    [11] = SVC_Handler,
    [14] = PendSV_Handler,
    [15] = SysTick_Handler,
    [16] = TIM2_IRQHandler,
    [17] = UART1_IRQHandler,
};

int main(void) {
    printf("Custom Vector Table with Weak Aliases\n\n");

    printf("Weak alias mappings:\n");
    override_handler("NMI_Handler", "Default_Handler");
    override_handler("HardFault_Handler", "Default_Handler");
    override_handler("MemManage_Handler", "Default_Handler");
    override_handler("BusFault_Handler", "Default_Handler");
    override_handler("UsageFault_Handler", "Default_Handler");
    override_handler("SVC_Handler", "Default_Handler");
    override_handler("PendSV_Handler", "Default_Handler");
    override_handler("SysTick_Handler", "Default_Handler");
    override_handler("TIM2_IRQHandler", "Default_Handler");
    override_handler("UART1_IRQHandler", "Default_Handler");

    printf("\nWhen a strong definition exists, it overrides\n");
    printf("the weak default. This allows applications to\n");
    printf("define only the handlers they need.\n");

    printf("\nVector table entries:\n");
    for (int i = 0; i < 18; i++) {
        printf("  [%2u] 0x%08X\n", i, (uint32_t)__isr_vector[i]);
    }

    return 0;
}

void Reset_Handler(void) {
    printf("Reset_Handler (strong definition)\n");
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the weak alias pattern used in CMSIS startup files. Define a Default_Handler that loops forever, then use __attribute__((weak, alias("Default_Handler"))) to create weak aliases for all exception and interrupt handlers. Show how a strong definition can override a weak one.

## Theory and Concepts

- Weak functions: when a function is weak, a strong definition elsewhere overrides it at link time.
- GCC: __attribute__((weak)) makes a symbol weak. __attribute__((alias("name"))) creates an alias.
- CMSIS startup files provide weak aliases for all interrupt handlers, defaulting to Default_Handler.
- The application defines only the handlers it needs (strong definitions), which override the weak ones.
- The linker will not report duplicate symbol errors for weak symbols.
- If an interrupt fires and no handler is defined, it hits Default_Handler (infinite loop).
- This pattern keeps startup files reusable across projects while allowing custom handlers.
- ARM Compiler 6 (armclang) supports similar functionality with __attribute__((weak)).

## Real World Application

Every CMSIS-compliant Cortex-M project uses this weak alias pattern. Developers only write the specific handlers their application needs (e.g., SysTick_Handler for the OS tick) without modifying the startup file, making project upgrades and porting simpler.

===EXPLANATION===

The weak alias pattern is the standard mechanism by which CMSIS startup files provide default interrupt handlers that can be overridden by application code without linker errors. Every exception and interrupt entry in the vector table initially points to a single infinite-loop function called Default_Handler. The application then defines only the handlers it actually uses—SysTick_Handler, UART_IRQHandler, etc.—and the linker automatically substitutes these strong definitions for the weak aliases in the startup file.

This pattern originated in the early days of Cortex-M toolchain support. Before CMSIS, each chip vendor or IDE had its own startup file that defined every handler as a strong symbol—users had to edit the file to add handlers, which made project upgrades a painful merge exercise. CMSIS standardized the approach: provide every handler as a weak alias to Default_Handler, and let the application define only what it needs. The linker's rule is simple: a strong (non-weak) symbol always overrides a weak symbol. If no strong definition exists, the weak alias stays.

The intuition is that weak aliases provide sensible defaults without imposing overhead. If the application does not define SysTick_Handler, the vector table entry points to Default_Handler, which loops forever—a safe behavior that makes accidentally unhandled interrupts obvious. As soon as the application provides `void SysTick_Handler(void) { ... }`, the linker replaces the weak alias with the strong definition. No startup file changes are needed, no `#ifdef` guards, no manual editing. The linker handles everything at link time.

In professional CMSIS-based projects, this pattern is used in every startup file for every vendor. The STM32Cube HAL startup files, NXP MCUXpresso SDK, Silicon Labs Gecko SDK, and all ARM Keil MDK projects follow this convention. The pattern also extends to the SystemInit and Reset_Handler functions, which are typically strong in the startup file but can be overridden if needed. Some RTOSes, like FreeRTOS, provide their own PendSV_Handler and SysTick_Handler implementations (strong symbols) that override the weak defaults, seamlessly integrating into any CMSIS startup file.

Picture the link process: the object file from startup.o contains `__isr_vector[]` with entry 15 being `SysTick_Handler`. The symbol `SysTick_Handler` in startup.o is weak and aliased to `Default_Handler`. The application file app.o contains a strong definition of `SysTick_Handler`. The linker resolves references: wherever `SysTick_Handler` is used, it points to the strong definition in app.o. The weak symbol in startup.o is discarded. The vector table entry 15 now holds the address of the application's SysTick handler. If app.o had not defined it, the weak alias would survive, and the vector table would point to Default_Handler.

Key points:
1. GCC syntax: `__attribute__((weak))` makes a symbol weak; `__attribute__((alias("target")))` creates an alias. ARM Compiler 5 (armcc) uses `__weak` and `__attribute__((used))`; ARM Compiler 6 (armclang) uses the same GCC syntax.
2. The linker resolves weak symbols at link time—they are not resolved at compile time.
3. A weak symbol can be overridden by a strong symbol in any object file or library.
4. The Default_Handler should never return—it typically contains `while.
5. ;` or calls a fault logging function and then resets the device.
6. This pattern also works for custom interrupt vectors beyond the standard 16 system exceptions (e.g., TIM2_IRQHandler, UART1_IRQHandler).


References:
1. CMSIS-Core documentation (ARM), GCC documentation on weak symbols and aliases, ARM Compiler Reference Guide, "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 4), and the startup files in STM32Cube_FW_F4 or any CMSIS-Pack example.
