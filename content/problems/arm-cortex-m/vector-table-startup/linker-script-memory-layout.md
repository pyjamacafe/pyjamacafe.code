+++
date = '2026-07-06T10:44:00+05:30'
draft = false
title = 'Linker Script Memory Layout'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 10
weight = 4
initial_code = '''// Define memory layout using linker script concepts
#include <stdio.h>
#include <stdint.h>

#define FLASH_ORIGIN 0x08000000
#define FLASH_SIZE   0x00100000
#define SRAM_ORIGIN  0x20000000
#define SRAM_SIZE    0x00020000

typedef struct {
    uint32_t origin;
    uint32_t size;
    const char *name;
    uint32_t used;
} memory_region_t;

memory_region_t flash = {FLASH_ORIGIN, FLASH_SIZE, "FLASH", 0};
memory_region_t sram  = {SRAM_ORIGIN, SRAM_SIZE, "SRAM", 0};

typedef struct {
    const char *name;
    uint32_t vma;
    uint32_t lma;
    uint32_t size;
    const char *region;
} section_t;

section_t sections[] = {
    {".isr_vector", 0x08000000, 0x08000000, 0x00000100, "FLASH"},
    {".text",       0x08000100, 0x08000100, 0x0001FF00, "FLASH"},
    {".rodata",     0x08020000, 0x08020000, 0x00008000, "FLASH"},
    {".data",       0x20000000, 0x08028000, 0x00004000, "SRAM"},
    {".bss",        0x20004000, 0x20004000, 0x0000C000, "SRAM"},
    {".heap",       0x20010000, 0x20010000, 0x00008000, "SRAM"},
    {".stack",      0x20018000, 0x20018000, 0x00008000, "SRAM"},
};

void print_memory_map(void) {
    printf("Memory Map:\\n");
    printf("%-15s Origin    End       Size\\n", "Region");
    printf("----------------------------------------\\n");
    printf("%-15s 0x%08X 0x%08X %u KB\\n",
           flash.name, flash.origin, flash.origin + flash.size,
           flash.size / 1024);
    printf("%-15s 0x%08X 0x%08X %u KB\\n",
           sram.name, sram.origin, sram.origin + sram.size,
           sram.size / 1024);
    printf("\\nSection Layout:\\n");
    printf("%-15s VMA        LMA        Size      Region\\n", "Section");
    printf("----------------------------------------\\n");

    for (int i = 0; i < 7; i++) {
        section_t *s = &sections[i];
        printf("%-15s 0x%08X 0x%08X %-9u %s\\n",
               s->name, s->vma, s->lma, s->size, s->region);
        if (s->region[0] == 'F') flash.used += s->size;
        else sram.used += s->size;
    }

    printf("\\nMemory Usage:\\n");
    printf("  FLASH: %u / %u bytes (%u%%)\\n",
           flash.used, flash.size, (flash.used * 100) / flash.size);
    printf("  SRAM:  %u / %u bytes (%u%%)\\n",
           sram.used, sram.size, (sram.used * 100) / sram.size);
}

int main(void) {
    printf("Linker Script Memory Layout\\n\\n");
    print_memory_map();

    printf("\\nKey concepts:\\n");
    printf("  VMA = Virtual Memory Address (runtime address)\\n");
    printf("  LMA = Load Memory Address (flash storage address)\\n");
    printf("  .data is copied from LMA (flash) to VMA (SRAM)\\n");
    printf("  .bss is zero-initialized at startup\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that models the memory layout of a typical Cortex-M linker script. Define memory regions (FLASH, SRAM) with their base addresses and sizes. Define sections (.isr_vector, .text, .rodata, .data, .bss, .heap, .stack) with their VMA, LMA, and sizes. Calculate and display memory usage percentages.

## Theory and Concepts

- The linker script defines the memory layout of the application by placing sections in memory regions.
- FLASH (or ROM) is non-volatile, typically 0x08000000 (STM32) or 0x00000000 (other MCUs).
- SRAM is volatile memory for runtime data, typically 0x20000000.
- .isr_vector: the vector table, must be at the start of flash.
- .text: program code and constants.
- .rodata: read-only data (const variables, string literals).
- .data: initialized global/static variables. VMA in SRAM, LMA in flash.
- .bss: zero-initialized global/static variables. SRAM only.
- .heap: dynamic memory allocation region.
- .stack: stack memory. Top of SRAM is usually the initial SP.

## Real World Application

Understanding the linker script is essential for: adding custom memory sections, placing data in specific memory regions (e.g., DMA buffers in non-cacheable SRAM), optimizing memory usage, and debugging linker errors.

