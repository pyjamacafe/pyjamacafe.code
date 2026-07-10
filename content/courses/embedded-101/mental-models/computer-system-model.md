+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Computer System Model'
difficulty = 'easy'
language = 'c'
topic_weight = -20
subtopic_weight = 0
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    int data = 42;          // write to memory (store)
    int result = data + 1;  // read from memory, ALU operation
    printf("%d\n", result); // output to peripheral (console)
    return 0;
}
'''
+++

## Problem Statement

Draw the block diagram of a computer system. Explain each component's role in executing a simple program like `int x = 5; int y = x + 3;`. Trace the flow of data through the system during each step of execution.

## Theory and Concepts

- **von Neumann architecture (stored-program concept)**: Instructions and data share the same memory space and bus. The CPU fetches instructions from memory, decodes them, and executes them using the ALU and registers. This is the universal model that virtually all general-purpose computers follow.
- **Harvard architecture**: Separate address spaces for instructions and data (used in most microcontrollers — e.g., AVR, PIC, 8051). Allows simultaneous access to instruction and data memory, improving throughput. Modern Cortex-M processors use a modified Harvard architecture (separate buses but unified address space).
- **Block diagram components**:
  - **CPU (Central Processing Unit)**: Contains the Control Unit (decodes instructions, generates control signals), ALU (Arithmetic Logic Unit — performs arithmetic/logic ops), and registers (fast internal storage for operands and results, e.g., Program Counter, Instruction Register, Accumulator).
  - **Memory**: Stores instructions (code) and data. Organized as a linear array of bytes, each with a unique address. Three levels: cache (SRAM, on-chip), main memory (DRAM), secondary storage (Flash/SSD/HDD).
  - **Input devices**: Keyboards, sensors, ADCs, network interfaces — bring data into the system.
  - **Output devices**: Displays, LEDs, DACs, actuators, network interfaces — send data out.
  - **System bus**: The communication highway connecting all components. Three sub-buses: address bus (carries memory addresses), data bus (carries data values), control bus (carries read/write signals, clock, interrupts).
  - **Clock**: Synchronizes all operations. Each clock cycle advances the state machine of the CPU.

## Real World Application

The von Neumann bottleneck — the single bus between CPU and memory — is the fundamental performance limit in most computers. In 2025, the gap between CPU speed and DRAM latency (the "memory wall") means a CPU may stall for hundreds of cycles waiting for data from main memory. This is why modern CPUs have multi-level caches (L1, L2, L3) — small, fast SRAM buffers that keep recently used data close to the processor. The Apple M3 Ultra has 192 MB of unified memory (HBM) accessible to CPU and GPU on a single die, effectively eliminating the bottleneck for graphics workloads. In embedded systems, Harvard architectures (like the ARM Cortex-M4) avoid the bottleneck by allowing the CPU to fetch the next instruction from Flash while simultaneously reading/writing data in SRAM.

===EXPLANATION===

![Simple Computer System Model](/images/embedded-101/mental-models/simple-cs-model.jpeg)

![Simple Computer System Model With Peripherals](/images/embedded-101/mental-models/simple-cs-mode-with-peripherial.jpeg)

![Memory](/images/embedded-101/mental-models/mem.jpeg)

![Instruction](/images/embedded-101/mental-models/instruction.jpeg)

The computer system model is the single most important abstraction in all of computing. Every programmer — whether writing a web app in Python or a bootloader in assembly — is ultimately interacting with this model. The CPU does not understand `printf("Hello")`; it understands machine code: load a value from address 0x1234 into register R0, add 1 to R0, store R0 to address 0x5678. Every high-level construct (functions, loops, objects) must be compiled down to this model. Understanding the model means you can reason about performance, memory usage, and correctness even without knowing the exact machine — because every machine is approximately this model.

The intuition is that a computer is a data-processing factory. Memory is the warehouse (shelves of numbered boxes). The bus is the conveyor belt between the warehouse and the factory floor. The CPU is the factory floor: the Control Unit is the foreman reading the instruction manual, the ALU is the machinery that does the actual work (adding, comparing, shifting), and the registers are the workbench — small, fast, within arm's reach. Input devices bring raw materials (sensor readings, keystrokes); output devices ship finished products (LCD pixels, motor torques). The clock is the factory whistle: every tick, the foreman reads the next manual page and starts the next operation.

In embedded systems, this model takes on concrete form. On an STM32F4 microcontroller, reading `GPIOA->IDR` is a load from address 0x40020010 — the input data register for Port A. Writing `GPIOA->ODR = 0x01` is a store to address 0x40020014 — the output data register. These addresses are fixed in the chip's memory map (documented in the reference manual). The system bus connects the Cortex-M4 CPU to the GPIO peripheral block, the SRAM at address 0x20000000, and the Flash at address 0x08000000. The CPU does not "know" it's talking to a GPIO pin — it just reads and writes memory addresses. The peripheral hardware (address decoder, bus interface, I/O pad logic) translates those memory transactions into pin voltages. This is memory-mapped I/O, and it is the foundation of all embedded programming.

References: Patterson & Hennessy, "Computer Organization and Design" §1.3–1.4; von Neumann, "First Draft of a Report on the EDVAC" (1945); ARM Cortex-M4 Technical Reference Manual, §3 (Memory Map). For the memory wall: Wulf & McKee, "Hitting the Memory Wall: Implications of the Obvious" (ACM SIGARCH, 1995).

===QUIZ===

## In the von Neumann architecture, what is the key defining characteristic that distinguishes it from the Harvard architecture?
- [ ] It uses vacuum tubes instead of transistors
- [ ] Instructions and data share the same memory space and bus
- [ ] It separates instruction and data memory into distinct address spaces
- [ ] It has no ALU
Correct: B
Explanation: The von Neumann architecture (stored-program concept) stores both instructions and data in the same memory and uses a single bus to access them. The Harvard architecture separates instruction and data memory paths, allowing simultaneous access to both. Most embedded microcontrollers use a modified Harvard architecture for performance.

## What is the primary function of the system bus in a computer?
- [ ] To provide power to all components
- [ ] To connect the CPU, memory, and I/O devices for data transfer
- [ ] To cool the processor
- [ ] To store the operating system
Correct: B
Explanation: The system bus is the communication backbone that connects the CPU, memory, and peripherals. It consists of three sub-buses: the address bus (selects which memory/peripheral to talk to), the data bus (carries the actual data), and the control bus (carries read/write signals, clock, and interrupt lines). Without the bus, no component can communicate with any other.
