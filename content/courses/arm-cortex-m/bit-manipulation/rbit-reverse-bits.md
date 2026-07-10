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
    printf("RBIT: Reverse Bit Order\n\n");

    uint32_t val = 0x12345678;
    printf("Original:  0x%08X\n", val);
    printf("Bit rev:   0x%08X\n\n", rbit(val));

    printf("Byte reversal:\n");
    uint8_t byte = 0xB1;
    printf("  0x%02X (%s) -> 0x%02X (%s)\n",
           byte, print_binary_byte(byte),
           reverse_byte(byte), print_binary_byte(reverse_byte(byte)));
    printf("\n");

    printf("Bit reversal of nibbles:\n");
    for (uint8_t nibble = 0; nibble < 16; nibble++) {
        uint32_t rev_nib = rbit(nibble) >> 28;
        printf("  0x%X -> 0x%X  ", nibble, (unsigned)rev_nib);
        if ((nibble + 1) % 8 == 0) printf("\n");
    }
    printf("\n\n");

    printf("CRC reflection:\n");
    uint32_t poly = 0x04C11DB7;
    uint32_t reflected = crc_reflect(poly, 32);
    printf("  CRC-32 poly:     0x%08X\n", poly);
    printf("  Reflected poly:  0x%08X\n", reflected);

    printf("\nApplications:\n");
    printf("  - CRC computation (reflect data and polynomial)\n");
    printf("  - FFT bit-reversed addressing\n");
    printf("  - SPI/LSB-first data format conversion\n");
    printf("  - DES/3DES initial permutation\n");

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

===EXPLANATION===

RBIT (Reverse Bits) is an ARM instruction that reverses the bit order of a 32-bit register in a single cycle: bit 31 becomes bit 0, bit 30 becomes bit 1, and so on. While it sounds niche, RBIT is actually a workhorse instruction in communications, cryptography, and signal processing firmware. It is the key to efficient CRC computation, FFT bit-reversed addressing, DES/3DES initial permutation, and software-based SPI/LSB-first data conversion.

RBIT was introduced with the ARMv7-M architecture as part of the DSP extension. Before RBIT, bit reversal required a loop that iterated 32 times, shifting and accumulating bits one at a time—costing 32+ cycles. RBIT reduces this to a single cycle. It is available on Cortex-M3/M4/M7/M33/M55 but not on Cortex-M0/M0+ (ARMv6-M). The instruction is also present in the ARMv7-A and ARMv8-A profiles for application processors.

The intuition is that many communication protocols transmit data LSB (Least Significant Bit) first. When a UART sends the byte 'A' (0x41 = 0b01000001), the bits go on the wire as 1-0-0-0-0-0-1-0. For CRC computation, the polynomial convention also matters: CRC-32 (Ethernet) uses a reflected polynomial (0xEDB88320) and processes data LSB-first, while CRC-32C (iSCSI) uses a non-reflected polynomial (0x1EDC6F41) and processes MSB-first. RBIT lets you switch between these conventions instantly: reflect the polynomial with RBIT, reflect the data with RBIT, and use a standard shift-register CRC implementation.

In professional firmware, RBIT usage is everywhere. Ethernet controllers in MCUs compute CRC-32 in hardware, but software fallback uses RBIT. Zephyr's CRC module and many custom CRC implementations use RBIT intrinsics for performance. FFT functions (e.g., CMSIS-DSP) use RBIT for bit-reversed addressing when reordering FFT output. CAN controllers compute CRC with bit reflection at the byte level—RBIT handles the per-byte reversal efficiently. Cryptographic libraries for hardware-constrained devices use RBIT for DES initial and final permutations.

Visualize the transformation: RBIT(0x12345678) reverses every bit. 0x12345678 in binary is 0001_0010_0011_0100_0101_0110_0111_1000. After RBIT: 0001_1110_0110_1010_0010_1100_0100_1000 = 0x1E6A2C48. You can verify: the MSB (bit 31) of the original is 0; the LSB (bit 0) of the result is 0. The LSB of the original is 0; the MSB of the result is 0. For byte reversal (reverse the order of 8 bits within a byte), combine RBIT with a shift: `reverse_byte(b) = RBIT(b) >> 24`. The 32-bit RBIT result has the byte's bits reversed and located in bits [31:24]; shifting right by 24 aligns them to [7:0].

Key points:
1. RBIT reverses all 32 bits—bit 31 ↔ bit 0, bit 30 ↔ bit 1, etc.
2. Single-cycle on Cortex-M3/M4/M7/M33/M55.
3. For 8-bit byte reversal: RBIT >> 24. For 16-bit halfword reversal: RBIT >> 16.
4. CRC reflection (data or polynomial) uses RBIT then a shift: `REF reflected_data = RBIT(data) >> (32 - bits)` to reflect an N-bit value.
5. Available via intrinsic `__rbit()` in ARM Compiler, `__RBIT` in IAR, and inline assembly or built-in in GCC (`__builtin_arm_rbit`).
6. ARMv6-M (Cortex-M0/M0+) does not support RBIT—fall back to a loop for those targets.


References:
1. ARM Architecture Reference Manual ARMv7-M (RBIT instruction), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 4 on DSP instructions), CMSIS-DSP library source (cfft_f32.c for bit-reversal), and Ross Williams' "A Painless Guide to CRC Error Detection Algorithms" (documenting reflected vs non-reflected CRC conventions).
