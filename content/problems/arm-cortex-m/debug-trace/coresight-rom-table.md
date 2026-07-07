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

===EXPLANATION===

The CoreSight ROM table is a discoverable directory of all debug and trace components inside a Cortex-M based system-on-chip. Located at fixed address 0xE00FF000, it contains a sequence of entries, each pointing to a debug component (DWT, ITM, FPB, ETM, TPIU, CTI, etc.) and indicating whether it is present. By walking this table, a debug tool or firmware monitor can enumerate the chip's debug capabilities without knowing the specific microcontroller variant.

CoreSight is ARM's standardized debug and trace infrastructure, introduced with the Cortex-M3 and pervasive in all modern ARM Cortex processors. Before CoreSight, each chip vendor laid out debug registers in their own way—OpenOCD and protocol adapters had to know the exact memory map for each target. CoreSight solved this by specifying a standard ROM table at a known base address. The table is traversed breadth-first: the root ROM table points to component entries and optionally to sub-ROM tables (for chips with multiple debug domains, like TrustZone secure/non-secure).

The intuition is that the ROM table works like a directory listing on a filesystem. Each entry is a 32-bit word: bit 31 (the "present" flag) tells you if the component exists, and bits 12–0 give you an offset from the ROM table base to the component's register block. You walk entries sequentially until you hit an entry of 0x00000000 or 0xFFFFFFFF (end of table marker). At each component base, you can read the Component ID registers (CIDR at base+0xFF0–0xFF3) which encode a unique identifier for the component type—0xB1050D for DWT, 0xB1051D for ITM, 0xB1020D for FPB, etc. The Peripheral ID registers (PIDR at base+0xFE0–0xFEF) provide the component's manufacturer, part number, and revision.

In professional debug tools, the ROM table is the first thing read after establishing a SWD/JTAG connection. OpenOCD, PyOCD, Segger J-Link, and ARM Keil MDK all parse the ROM table to auto-configure their debug sessions. Firmware-level debug monitors (like ARM's CoreSight Access Library or the open-source "CoreSight DT" driver in Linux) also walk the ROM table at boot to register available trace sources for the Linux coresight framework. The table makes it possible for a single version of a debug tool to support thousands of different chip variants without per-chip configuration files.

Picture the ROM table as an array at 0xE00FF000. Entry 0 might read 0x80010003: bit 31 = 1 (present), offset = 0x003 → component at 0xE00FF000 + 0x003000 = 0xE0100000 (ITM). Entry 1 might be 0x80020005 → component at 0xE00FF000 + 0x005000 = 0xE0102000 (DWT). Entry 2 might be 0x00000000 → end of table. The debug tool reads each entry, computes the component base, reads CIDR at base+0xFF0, sees 0xB1051D for ITM, and knows it can use ITM stimulus ports. The entire discovery takes a few hundred microseconds.

Key points: (1) The ROM table is always at 0xE00FF000 (the "CoreSight ROM base") on Cortex-M3/M4/M7/M33. On some chips it may be relocated; the debugger can find it via a TPIU register or the "Device Affinity" register. (2) Not all components listed are present on all chips—the ROM table reflects the exact integration; always check bit 31. (3) The table can include class 0x1 entries (ROM table entries that point to another ROM table) for hierarchical component trees. (4) TrustZone systems have separate ROM tables for secure and non-secure debug domains. (5) The ROM table is read-only and located in the system peripheral address space—it is memory-mapped and accessible at any time.

References: ARM CoreSight Architecture Specification v2.0 (ARM IHI 0029D), ARM Debug Interface v5 (ADIv5, ARM IHI 0031A), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 16), and the Linux kernel drivers/hwtracing/coresight/ documentation for practical examples of ROM table walking.
