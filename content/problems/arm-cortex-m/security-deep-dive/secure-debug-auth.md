+++
date = '2026-07-06T18:17:00+05:30'
draft = false
title = 'Secure Debug Authentication'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 17
weight = 5
initial_code = '''#include <stdio.h>

#define DHCSR  (*(volatile unsigned int *)0xE000EDF0)
#define DEMCR  (*(volatile unsigned int *)0xE000EDFC)

#define DBGKEY (0xA05F << 16)

void enable_debug(void) {
    // Enable debug by writing the debug key
    DHCSR = DBGKEY | (1 << 0);  // C_DEBUGEN
    DEMCR |= (1 << 24);         // TRCENA
    printf("Debug enabled\\n");
}

void disable_debug(void) {
    DHCSR = DBGKEY;  // Clear C_DEBUGEN, disable debug
    printf("Debug disabled\\n");
}

int main(void) {
    // Debug authentication proceeds:
    // 1. Debug probe sends authentication key
    // 2. Firmware verifies key
    // 3. Debug access granted or denied
    enable_debug();
    // ... debug session ...
    disable_debug();
    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'Debug authentication demonstrated'
+++

## Problem Statement

Implement a secure debug authentication mechanism. Show how the firmware can control debug access by enabling or disabling the Debug Halting Control and Status Register (DHCSR). Explain the secure debug authentication protocol where the device verifies an authentication key before granting debug access.

## Theory and Concepts

- The DHCSR (Debug Halting Control and Status Register) controls debug access — bit 0 (C_DEBUGEN) enables debug.
- Writing to DHCSR requires a key (0xA05F in the upper 16 bits) to prevent accidental writes.
- The DEMCR (Debug Exception and Monitor Control Register) bit 24 (TRCENA) enables trace functionality.
- In TrustZone, debug authentication is separate for secure and non-secure worlds — a device may allow non-secure debug while locking secure debug.
- Secure debug typically requires an authentication challenge-response protocol using a secret key stored in OTP fuses.
- The Debug Access Port (DAP) can be locked to prevent all external debug access.

## Real World Application

Debug authentication protects intellectual property in production devices — manufacturers can disable debug access on shipped products, while still allowing debug on development units. Secure debug authentication enables failure analysis on returned devices without exposing all firmware secrets.
