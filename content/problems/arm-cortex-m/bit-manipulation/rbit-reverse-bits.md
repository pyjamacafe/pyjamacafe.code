+++
date = '2026-07-06T10:54:00+05:30'
draft = false
title = 'RBIT and Bit Reverse Operations'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 12
weight = 4
initial_code = '''// Reverse bits using RBIT instruction
#include <stdio.h>
#include <stdint.h>

uint32_t rbit(uint32_t value) {
    uint32_t result;
    __asm volatile("RBIT %0, %1" : "=r" (result) : "r" (value));
    return result;
}

uint8_t reverse_byte(uint8_t byte) {
    uint32_t extended = byte;
    uint32_t rev = rbit(extended);
    return (uint8_t)(rev >> 24);
}

void print_binary_byte(uint8_t val) {
    for (int i = 7; i >= 0; i--) {
        putchar((val >> i) & 1 ? '1' : '0');
    }
}

uint32_t crc_reflect(uint32_t data, int bits) {
    uint32_t reflected = rbit(data);
    return reflected >> (32 - bits);
}

int main(void) {
    printf("RBIT: Reverse Bit Order\\n\\n");

    uint32_t val = 0x12345678;
    printf("Original:  0x%08X\\n", val);
    printf("Bit rev:   0x%08X\\n\\n", rbit(val));

    printf("Byte reversal:\\n");
    uint8_t byte = 0xB1;
    printf("  0x%02X (%s) -> 0x%02X (%s)\\n",
           byte, print_binary_byte(byte),
           reverse_byte(byte), print_binary_byte(reverse_byte(byte)));
    printf("\\n");

    printf("Bit reversal of nibbles:\\n");
    for (uint8_t nibble = 0; nibble < 16; nibble++) {
        uint32_t rev_nib = rbit(nibble) >> 28;
        printf("  0x%X -> 0x%X  ", nibble, (unsigned)rev_nib);
        if ((nibble + 1) % 8 == 0) printf("\\n");
    }
    printf("\\n\\n");

    printf("CRC reflection:\\n");
    uint32_t poly = 0x04C11DB7;
    uint32_t reflected = crc_reflect(poly, 32);
    printf("  CRC-32 poly:     0x%08X\\n", poly);
    printf("  Reflected poly:  0x%08X\\n", reflected);

    printf("\\nApplications:\\n");
    printf("  - CRC computation (reflect data and polynomial)\\n");
    printf("  - FFT bit-reversed addressing\\n");
    printf("  - SPI/LSB-first data format conversion\\n");
    printf("  - DES/3DES initial permutation\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the RBIT instruction for reversing the bit order in a 32-bit register. Implement utility functions: byte bit-reversal, CRC reflection (reflecting polynomial/data for bit-ordering conventions), and nibble reversal. Compare RBIT-based reversal with loop-based implementations.

## Theory and Concepts

- RBIT reverses the bit order of a 32-bit register. Bit 31 becomes bit 0, etc.
- Single-cycle instruction on Cortex-M3/M4/M7/M33/M55.
- Byte reversal: RBIT followed by a 24-bit shift. Reverse 8 bits: RBIT >> 24.
- CRC computation requires bit reversal to match the bit ordering of the data stream.
- Most CRC polynomials are specified MSB-first; LSB-first implementations need reflection.
- Without RBIT: bit reversal takes 32 iterations of a loop (32 cycles).
- RBIT is useful for both bit-reversed addressing and endianness conversion.
- Available in ARMv7-M and ARMv8-M, not in ARMv6-M.

## Real World Application

RBIT is critical for CRC computation in communication protocols (Ethernet, CAN, USB) where data bits arrive LSB-first but the CRC polynomial is defined MSB-first. FFT implementations also use RBIT for bit-reversed addressing of twiddle factors.

