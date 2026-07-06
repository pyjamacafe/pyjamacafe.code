+++
date = '2026-07-06T18:02:00+05:30'
draft = false
title = 'SWD and CoreSight Debug Topology'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 14
weight = 5
initial_code = '''#include <stdio.h>

// Debug registers (CoreSight ROM table)
#define ROM_TABLE_BASE 0xE00FF000

struct rom_entry {
    unsigned int entry;
};

int main(void) {
    volatile struct rom_entry *rom = (volatile struct rom_entry *)ROM_TABLE_BASE;
    int idx = 0;

    // Walk the CoreSight ROM table
    while (1) {
        unsigned int entry = rom[idx].entry;
        if (entry == 0 || entry == 0xFFFFFFFF) break;

        unsigned int component_base = ROM_TABLE_BASE + (entry & 0xFFFFF000);
        unsigned int present = entry >> 31;

        printf("ROM entry %d: base=0x%08X present=%d\\n",
               idx, component_base, present);

        // Check component ID registers to identify it
        // CIDs at base+0xFF0: 0x0D, 0x10, 0x05, 0xB1 for CoreSight

        idx++;
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'CoreSight ROM table walked'
+++

## Problem Statement

Write a program that walks the CoreSight ROM table starting at address 0xE00FF000 to enumerate all debug components in the system. For each entry, extract the component base address and check the Component ID registers (CIDR) to identify the component type (DWT, ITM, FPB, ETM, etc.).

## Theory and Concepts

- The CoreSight debug infrastructure uses a discoverable topology via ROM tables.
- Each ROM table entry is a 32-bit word: bit 31 indicates presence, bits 12–0 provide the offset from the ROM table base.
- The Component ID registers (at base+0xFF0–0xFF3) identify the component class: 0xB1050D for DWT, 0xB1051D for ITM, 0xB1020D for FPB, etc.
- The Peripheral ID registers (at base+0xFE0–0xFEF) provide more detailed identification.
- Understanding the ROM table enables tools to auto-detect debug capabilities.

## Real World Application

Debug tools and firmware debug monitors use the CoreSight ROM table to discover available debug hardware without prior knowledge of the chip. This enables plug-and-play debugging across different ARM Cortex-M microcontrollers from various vendors.
