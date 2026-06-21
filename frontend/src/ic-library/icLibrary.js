/**
 * IC Library — 7400-series TTL/CMOS-compatible IC definitions
 */

export const IC_LIBRARY = [
  {
    id: '7400',
    name: '74HC00 — Quad 2-Input NAND',
    gateType: 'NAND',
    gatesPerChip: 4,
    inputsPerGate: 2,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 7, // ns typical
    delay: 7,
    powerConsumption: 10, // mW
    power: 10,
    cost: 0.30, // USD
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['General logic inversion', 'Universal gate implementation', 'Signal gating'],
    pinLabels: ['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '1Y', type: 'output' },
      { pin: 4, name: '2A', type: 'input' },
      { pin: 5, name: '2B', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '4Y', type: 'output' },
      { pin: 12, name: '4A', type: 'input' },
      { pin: 13, name: '4B', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, Y: 1 },
      { A: 0, B: 1, Y: 1 },
      { A: 1, B: 0, Y: 1 },
      { A: 1, B: 1, Y: 0 }
    ]
  },
  {
    id: '7402',
    name: '74HC02 — Quad 2-Input NOR',
    gateType: 'NOR',
    gatesPerChip: 4,
    inputsPerGate: 2,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 8,
    delay: 8,
    powerConsumption: 10,
    power: 10,
    cost: 0.32,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Active-low control logic', 'Universal NOR building blocks', 'Decoders'],
    pinLabels: ['1Y', '1A', '1B', '2Y', '2A', '2B', 'GND', '3A', '3B', '3Y', '4A', '4B', '4Y', 'VCC'],
    pinout: [
      { pin: 1, name: '1Y', type: 'output' },
      { pin: 2, name: '1A', type: 'input' },
      { pin: 3, name: '1B', type: 'input' },
      { pin: 4, name: '2Y', type: 'output' },
      { pin: 5, name: '2A', type: 'input' },
      { pin: 6, name: '2B', type: 'input' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3A', type: 'input' },
      { pin: 9, name: '3B', type: 'input' },
      { pin: 10, name: '3Y', type: 'output' },
      { pin: 11, name: '4A', type: 'input' },
      { pin: 12, name: '4B', type: 'input' },
      { pin: 13, name: '4Y', type: 'output' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, Y: 1 },
      { A: 0, B: 1, Y: 0 },
      { A: 1, B: 0, Y: 0 },
      { A: 1, B: 1, Y: 0 }
    ]
  },
  {
    id: '7404',
    name: '74HC04 — Hex Inverter (NOT)',
    gateType: 'NOT',
    gatesPerChip: 6,
    inputsPerGate: 1,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 6,
    delay: 6,
    powerConsumption: 8,
    power: 8,
    cost: 0.30,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Signal logic inversion', 'Clock generators', 'Square-wave oscillators'],
    pinLabels: ['1A', '1Y', '2A', '2Y', '3A', '3Y', 'GND', '4Y', '4A', '5Y', '5A', '6Y', '6A', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1Y', type: 'output' },
      { pin: 3, name: '2A', type: 'input' },
      { pin: 4, name: '2Y', type: 'output' },
      { pin: 5, name: '3A', type: 'input' },
      { pin: 6, name: '3Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '4Y', type: 'output' },
      { pin: 9, name: '4A', type: 'input' },
      { pin: 10, name: '5Y', type: 'output' },
      { pin: 11, name: '5A', type: 'input' },
      { pin: 12, name: '6Y', type: 'output' },
      { pin: 13, name: '6A', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, Y: 1 },
      { A: 1, Y: 0 }
    ]
  },
  {
    id: '7408',
    name: '74HC08 — Quad 2-Input AND',
    gateType: 'AND',
    gatesPerChip: 4,
    inputsPerGate: 2,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 9,
    delay: 9,
    powerConsumption: 12,
    power: 12,
    cost: 0.35,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Boolean AND logic', 'Enable/disable control signals', 'Digital signal selection'],
    pinLabels: ['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '1Y', type: 'output' },
      { pin: 4, name: '2A', type: 'input' },
      { pin: 5, name: '2B', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '4Y', type: 'output' },
      { pin: 12, name: '4A', type: 'input' },
      { pin: 13, name: '4B', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 0 },
      { A: 1, B: 0, Y: 0 },
      { A: 1, B: 1, Y: 1 }
    ]
  },
  {
    id: '7432',
    name: '74HC32 — Quad 2-Input OR',
    gateType: 'OR',
    gatesPerChip: 4,
    inputsPerGate: 2,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 9,
    delay: 9,
    powerConsumption: 12,
    power: 12,
    cost: 0.35,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Boolean OR logic', 'Combining logic equations', 'Fault detection systems'],
    pinLabels: ['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '1Y', type: 'output' },
      { pin: 4, name: '2A', type: 'input' },
      { pin: 5, name: '2B', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '4Y', type: 'output' },
      { pin: 12, name: '4A', type: 'input' },
      { pin: 13, name: '4B', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 1 },
      { A: 1, B: 0, Y: 1 },
      { A: 1, B: 1, Y: 1 }
    ]
  },
  {
    id: '7486',
    name: '74HC86 — Quad 2-Input XOR',
    gateType: 'XOR',
    gatesPerChip: 4,
    inputsPerGate: 2,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 11,
    delay: 11,
    powerConsumption: 14,
    power: 14,
    cost: 0.40,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Half/Full Adders', 'Parity checkers/generators', 'Phase comparators'],
    pinLabels: ['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '1Y', type: 'output' },
      { pin: 4, name: '2A', type: 'input' },
      { pin: 5, name: '2B', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '4Y', type: 'output' },
      { pin: 12, name: '4A', type: 'input' },
      { pin: 13, name: '4B', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 1 },
      { A: 1, B: 0, Y: 1 },
      { A: 1, B: 1, Y: 0 }
    ]
  },
  {
    id: '7410',
    name: '74HC10 — Triple 3-Input NAND',
    gateType: 'NAND',
    gatesPerChip: 3,
    inputsPerGate: 3,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 8,
    delay: 8,
    powerConsumption: 10,
    power: 10,
    cost: 0.38,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Multi-input logic gating', 'Decoders', 'Control logic'],
    pinLabels: ['1A', '1B', '2A', '2B', '2C', '2Y', 'GND', '3Y', '3A', '3B', '3C', '1Y', '1C', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '2A', type: 'input' },
      { pin: 4, name: '2B', type: 'input' },
      { pin: 5, name: '2C', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '3C', type: 'input' },
      { pin: 12, name: '1Y', type: 'output' },
      { pin: 13, name: '1C', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, C: 0, Y: 1 },
      { A: 0, B: 0, C: 1, Y: 1 },
      { A: 0, B: 1, C: 0, Y: 1 },
      { A: 0, B: 1, C: 1, Y: 1 },
      { A: 1, B: 0, C: 0, Y: 1 },
      { A: 1, B: 0, C: 1, Y: 1 },
      { A: 1, B: 1, C: 0, Y: 1 },
      { A: 1, B: 1, C: 1, Y: 0 }
    ]
  },
  {
    id: '7411',
    name: '74HC11 — Triple 3-Input AND',
    gateType: 'AND',
    gatesPerChip: 3,
    inputsPerGate: 3,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 10,
    delay: 10,
    powerConsumption: 12,
    power: 12,
    cost: 0.40,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Multi-input condition checking', 'System state decoders', 'Address decoding'],
    pinLabels: ['1A', '1B', '2A', '2B', '2C', '2Y', 'GND', '3Y', '3A', '3B', '3C', '1Y', '1C', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '2A', type: 'input' },
      { pin: 4, name: '2B', type: 'input' },
      { pin: 5, name: '2C', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '3C', type: 'input' },
      { pin: 12, name: '1Y', type: 'output' },
      { pin: 13, name: '1C', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, C: 0, Y: 0 },
      { A: 0, B: 0, C: 1, Y: 0 },
      { A: 0, B: 1, C: 0, Y: 0 },
      { A: 0, B: 1, C: 1, Y: 0 },
      { A: 1, B: 0, C: 0, Y: 0 },
      { A: 1, B: 0, C: 1, Y: 0 },
      { A: 1, B: 1, C: 0, Y: 0 },
      { A: 1, B: 1, C: 1, Y: 1 }
    ]
  },
  {
    id: '7420',
    name: '74HC20 — Dual 4-Input NAND',
    gateType: 'NAND',
    gatesPerChip: 2,
    inputsPerGate: 4,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 9,
    delay: 9,
    powerConsumption: 10,
    power: 10,
    cost: 0.38,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Multi-variable logic minimization', 'Decoders', 'Signal coincidence detection'],
    pinLabels: ['1A', '1B', 'NC', '1C', '1D', '1Y', 'GND', '2Y', '2A', '2B', 'NC', '2C', '2D', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: 'NC', type: 'unconnected' },
      { pin: 4, name: '1C', type: 'input' },
      { pin: 5, name: '1D', type: 'input' },
      { pin: 6, name: '1Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '2Y', type: 'output' },
      { pin: 9, name: '2A', type: 'input' },
      { pin: 10, name: '2B', type: 'input' },
      { pin: 11, name: 'NC', type: 'unconnected' },
      { pin: 12, name: '2C', type: 'input' },
      { pin: 13, name: '2D', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, C: 0, D: 0, Y: 1 },
      { A: 1, B: 1, C: 1, D: 0, Y: 1 },
      { A: 1, B: 1, C: 1, D: 1, Y: 0 }
    ]
  },
  {
    id: '7421',
    name: '74HC21 — Dual 4-Input AND',
    gateType: 'AND',
    gatesPerChip: 2,
    inputsPerGate: 4,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 11,
    delay: 11,
    powerConsumption: 12,
    power: 12,
    cost: 0.42,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Multi-variable AND logic', 'Wide address decoding', 'System enable gates'],
    pinLabels: ['1A', '1B', 'NC', '1C', '1D', '1Y', 'GND', '2Y', '2A', '2B', 'NC', '2C', '2D', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: 'NC', type: 'unconnected' },
      { pin: 4, name: '1C', type: 'input' },
      { pin: 5, name: '1D', type: 'input' },
      { pin: 6, name: '1Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '2Y', type: 'output' },
      { pin: 9, name: '2A', type: 'input' },
      { pin: 10, name: '2B', type: 'input' },
      { pin: 11, name: 'NC', type: 'unconnected' },
      { pin: 12, name: '2C', type: 'input' },
      { pin: 13, name: '2D', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, C: 0, D: 0, Y: 0 },
      { A: 1, B: 1, C: 1, D: 0, Y: 0 },
      { A: 1, B: 1, C: 1, D: 1, Y: 1 }
    ]
  },
  {
    id: '7427',
    name: '74HC27 — Triple 3-Input NOR',
    gateType: 'NOR',
    gatesPerChip: 3,
    inputsPerGate: 3,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 9,
    delay: 9,
    powerConsumption: 10,
    power: 10,
    cost: 0.40,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Multi-input NOR logic', 'Decoders', 'Active-low state checking'],
    pinLabels: ['1A', '1B', '2A', '2B', '2C', '2Y', 'GND', '3Y', '3A', '3B', '3C', '1Y', '1C', 'VCC'],
    pinout: [
      { pin: 1, name: '1A', type: 'input' },
      { pin: 2, name: '1B', type: 'input' },
      { pin: 3, name: '2A', type: 'input' },
      { pin: 4, name: '2B', type: 'input' },
      { pin: 5, name: '2C', type: 'input' },
      { pin: 6, name: '2Y', type: 'output' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: '3Y', type: 'output' },
      { pin: 9, name: '3A', type: 'input' },
      { pin: 10, name: '3B', type: 'input' },
      { pin: 11, name: '3C', type: 'input' },
      { pin: 12, name: '1Y', type: 'output' },
      { pin: 13, name: '1C', type: 'input' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, C: 0, Y: 1 },
      { A: 0, B: 0, C: 1, Y: 0 },
      { A: 1, B: 1, C: 1, Y: 0 }
    ]
  },
  {
    id: '7430',
    name: '74HC30 — 8-Input NAND',
    gateType: 'NAND',
    gatesPerChip: 1,
    inputsPerGate: 8,
    pinCount: 14,
    package: 'DIP-14',
    packageType: 'DIP-14',
    propagationDelay: 13,
    delay: 13,
    powerConsumption: 12,
    power: 12,
    cost: 0.45,
    availability: 'Common',
    technology: 'CMOS / TTL Compatible',
    applications: ['Multi-variable logic compression', 'Large word decoders', 'Bus interface gating'],
    pinLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'GND', 'Y', 'NC', 'NC', 'G', 'H', 'NC', 'VCC'],
    pinout: [
      { pin: 1, name: 'A', type: 'input' },
      { pin: 2, name: 'B', type: 'input' },
      { pin: 3, name: 'C', type: 'input' },
      { pin: 4, name: 'D', type: 'input' },
      { pin: 5, name: 'E', type: 'input' },
      { pin: 6, name: 'F', type: 'input' },
      { pin: 7, name: 'GND', type: 'power' },
      { pin: 8, name: 'Y', type: 'output' },
      { pin: 9, name: 'NC', type: 'unconnected' },
      { pin: 10, name: 'NC', type: 'unconnected' },
      { pin: 11, name: 'G', type: 'input' },
      { pin: 12, name: 'H', type: 'input' },
      { pin: 13, name: 'NC', type: 'unconnected' },
      { pin: 14, name: 'VCC', type: 'power' }
    ],
    truthTable: [
      { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, Y: 1 },
      { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 0, Y: 1 },
      { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1, Y: 0 }
    ]
  }
];

export const GATE_TO_IC_MAP = {
  'AND_2': '7408',
  'AND_3': '7411',
  'AND_4': '7421',
  'OR_2': '7432',
  'NOT': '7404',
  'NAND_2': '7400',
  'NAND_3': '7410',
  'NAND_4': '7420',
  'NAND_8': '7430',
  'NOR_2': '7402',
  'NOR_3': '7427',
  'XOR_2': '7486'
};

/**
 * Returns the best matching IC for a given gate type and input count.
 */
export function getICForGateType(gateType, inputCount = 2) {
  const normalizedType = gateType.toUpperCase();
  const searchKey = normalizedType === 'NOT' ? 'NOT' : `${normalizedType}_${inputCount}`;
  
  // Try direct map
  const mappedId = GATE_TO_IC_MAP[searchKey];
  if (mappedId) {
    return getICById(mappedId);
  }
  
  // Fallback: search the library
  const candidates = IC_LIBRARY.filter(
    ic => ic.gateType === normalizedType && ic.inputsPerGate >= inputCount
  ).sort((a, b) => a.inputsPerGate - b.inputsPerGate);
  
  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Returns the best-matching IC for a given gate type and input count (backward compatible name)
 */
export function findICForGate(gateType, requiredInputs = 2) {
  return getICForGateType(gateType, requiredInputs);
}

/**
 * Get all IC definitions for a given gate type.
 */
export function getICsForType(gateType) {
  const normalizedType = gateType.toUpperCase();
  return IC_LIBRARY.filter(ic => ic.gateType === normalizedType);
}

/**
 * Look up an IC by its chip ID string (e.g. '7408').
 */
export function getICById(id) {
  return IC_LIBRARY.find(ic => ic.id === id) || null;
}
