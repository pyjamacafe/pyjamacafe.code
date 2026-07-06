+++
date = '2026-07-06T14:01:00+05:30'
draft = false
title = 'Bit-fields'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 13
weight = 5
initial_code = '''#include <stdio.h>

struct flags {
    unsigned int visible : 1;
    unsigned int enabled : 1;
    unsigned int readonly : 1;
    unsigned int reserved : 5;
};

struct packed {
    unsigned int day   : 5;  // 0-31
    unsigned int month : 4;  // 1-12
    unsigned int year  : 11; // 0-2047
};

int main(void) {
    struct flags f = {1, 0, 1, 0};
    printf("Visible: %d, Enabled: %d, Readonly: %d\\n",
           f.visible, f.enabled, f.readonly);

    struct packed date = {15, 7, 2026};
    printf("Date: %d/%d/%d\\n", date.day, date.month, date.year);

    printf("Size of flags: %zu bytes\\n", sizeof(struct flags));
    printf("Size of packed: %zu bytes\\n", sizeof(struct packed));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Bit-fields demonstrated'
+++

## Problem Statement

Define structures with bit-fields to pack data into fewer bits than a full integer. Create a flags structure with 1-bit fields and a date structure with fields sized to their ranges. Print the values and the total size of each struct.

## Theory and Concepts

- Bit-fields allow specifying the exact number of bits for a member: `type name : width`.
- Adjacent bit-fields are packed into the same storage unit (typically an `unsigned int`).
- Bit-fields are non-portable — the ordering and packing depend on the ABI.
- Unnamed bit-fields can be used for padding.
- A zero-width bit-field forces alignment to the next storage unit.
- Taking the address of a bit-field is not allowed (no pointer to a bit-field).

## Real World Application

Bit-fields are used in hardware register definitions (each bit controls a different function), network protocol headers (TCP flags, IPv4 fields), file system inodes, and any scenario where memory or storage is scarce and individual bits carry meaning.
