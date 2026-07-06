+++
date = '2026-07-06T10:45:00+05:30'
draft = false
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
    printf("Default handler called for unhandled interrupt\\n");
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
    printf("  %-20s -> %s\\n", name, override);
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
    printf("Custom Vector Table with Weak Aliases\\n\\n");

    printf("Weak alias mappings:\\n");
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

    printf("\\nWhen a strong definition exists, it overrides\\n");
    printf("the weak default. This allows applications to\\n");
    printf("define only the handlers they need.\\n");

    printf("\\nVector table entries:\\n");
    for (int i = 0; i < 18; i++) {
        printf("  [%2u] 0x%08X\\n", i, (uint32_t)__isr_vector[i]);
    }

    return 0;
}

void Reset_Handler(void) {
    printf("Reset_Handler (strong definition)\\n");
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

