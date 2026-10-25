/**
 * LevelConfig.js
 * Definitions and thematic settings for all 10 game levels.
 */

export const LEVEL_CONFIGS = [
  {
    id: 1,
    name: 'PROVING GROUNDS',
    subtitle: 'Training Facility — Compact Labyrinth',
    difficulty: 'EASY',
    size: 13,
    description: 'Learn ball handling, momentum control, and banking turns in a compact industrial test cell.',
    theme: {
      accentColor: '#00f5d4',
      beaconColor: 0x00f5d4,
      fogColor: 0x111417,
      fogDensity: 0.014,
      ambientColor: 0x2a333d,
      sunColor: 0xdce7f2,
      sunIntensity: 2.4,
      rimColor: 0x48cae4,
      elevatedSectors: [
        { x1: 0.55, x2: 0.85, z1: 0.55, z2: 0.85, maxRamps: 2 }
      ]
    }
  },
  {
    id: 2,
    name: 'FOUNDRY COMPLEX',
    subtitle: 'Smelting Works — Industrial Plant',
    difficulty: 'MEDIUM',
    size: 17,
    description: 'Navigate past warm slag pits and elevated catwalks in an expansive heavy machinery sector.',
    theme: {
      accentColor: '#ff9e00',
      beaconColor: 0xff9e00,
      fogColor: 0x19120e,
      fogDensity: 0.016,
      ambientColor: 0x36271c,
      sunColor: 0xffd2a8,
      sunIntensity: 2.5,
      rimColor: 0xff6b35,
      elevatedSectors: [
        { x1: 0.50, x2: 0.85, z1: 0.15, z2: 0.45, maxRamps: 3 }
      ]
    }
  },
  {
    id: 3,
    name: 'CATWALK NETWORK',
    subtitle: 'Skyway Grid — High Elevation',
    difficulty: 'ADVANCED',
    size: 19,
    description: 'Master multi-tier catwalks, bridges, and sloped ramps suspended high above the ground floor.',
    theme: {
      accentColor: '#48cae4',
      beaconColor: 0x48cae4,
      fogColor: 0x0c131a,
      fogDensity: 0.014,
      ambientColor: 0x1b2836,
      sunColor: 0xcfe2f7,
      sunIntensity: 2.3,
      rimColor: 0x00b4d8,
      elevatedSectors: [
        { x1: 0.15, x2: 0.45, z1: 0.55, z2: 0.85, maxRamps: 2 },
        { x1: 0.55, x2: 0.85, z1: 0.15, z2: 0.45, maxRamps: 3 }
      ]
    }
  },
  {
    id: 4,
    name: 'CONTAINMENT LAB',
    subtitle: 'Sector 04 — Tight Corners & Long Corridors',
    difficulty: 'HARD',
    size: 21,
    description: 'A sprawling subterranean bio-containment facility with narrow turns and deceptive dead ends.',
    theme: {
      accentColor: '#70e000',
      beaconColor: 0x70e000,
      fogColor: 0x0a140f,
      fogDensity: 0.015,
      ambientColor: 0x18281e,
      sunColor: 0xd4eed8,
      sunIntensity: 2.2,
      rimColor: 0x38b000,
      elevatedSectors: [
        { x1: 0.35, x2: 0.65, z1: 0.35, z2: 0.65, maxRamps: 3 }
      ]
    }
  },
  {
    id: 5,
    name: "TITAN'S LABYRINTH",
    subtitle: 'Master Gauntlet — Colossal Megastructure',
    difficulty: 'EXPERT',
    size: 25,
    description: 'The ultimate test: a colossal 25x25 megastructure with twin elevated platforms and complex paths.',
    theme: {
      accentColor: '#ff0054',
      beaconColor: 0xff0054,
      fogColor: 0x140b17,
      fogDensity: 0.013,
      ambientColor: 0x2d1a33,
      sunColor: 0xf3d6ea,
      sunIntensity: 2.4,
      rimColor: 0x9e0059,
      elevatedSectors: [
        { x1: 0.15, x2: 0.45, z1: 0.15, z2: 0.45, maxRamps: 3 },
        { x1: 0.55, x2: 0.85, z1: 0.55, z2: 0.85, maxRamps: 3 }
      ]
    }
  },
  {
    id: 6,
    name: 'SUB-ZERO VAULT',
    subtitle: 'Cryo Chamber — Glacial Fortress',
    difficulty: 'HARD',
    size: 23,
    description: 'Deep frozen subterranean coolant chambers with pale blue ice mist and sweeping multi-elevation platforms.',
    theme: {
      accentColor: '#00f0ff',
      beaconColor: 0x00f0ff,
      fogColor: 0x09141f,
      fogDensity: 0.015,
      ambientColor: 0x142b3d,
      sunColor: 0xd6f4ff,
      sunIntensity: 2.4,
      rimColor: 0x0077b6,
      elevatedSectors: [
        { x1: 0.20, x2: 0.50, z1: 0.20, z2: 0.50, maxRamps: 3 },
        { x1: 0.60, x2: 0.85, z1: 0.60, z2: 0.85, maxRamps: 2 }
      ]
    }
  },
  {
    id: 7,
    name: 'MAGMA CRUCIBLE',
    subtitle: 'Volcanic Core — Deep Slag Smelter',
    difficulty: 'EXPERT',
    size: 25,
    description: 'Extreme heat core lined with blazing red furnace lights and razor-sharp chokepoints along high catwalks.',
    theme: {
      accentColor: '#ff3c00',
      beaconColor: 0xff3c00,
      fogColor: 0x1a0804,
      fogDensity: 0.015,
      ambientColor: 0x3d140a,
      sunColor: 0xffbe98,
      sunIntensity: 2.5,
      rimColor: 0xd00000,
      elevatedSectors: [
        { x1: 0.45, x2: 0.80, z1: 0.20, z2: 0.55, maxRamps: 3 },
        { x1: 0.15, x2: 0.45, z1: 0.60, z2: 0.85, maxRamps: 2 }
      ]
    }
  },
  {
    id: 8,
    name: 'QUANTUM GRID',
    subtitle: 'Particle Accelerator — High Velocity Ring',
    difficulty: 'EXPERT',
    size: 27,
    description: 'Vast magnetic confinement matrix with high speed straightaways connected by multi-directional overpasses.',
    theme: {
      accentColor: '#9d4edd',
      beaconColor: 0x9d4edd,
      fogColor: 0x11081a,
      fogDensity: 0.013,
      ambientColor: 0x241138,
      sunColor: 0xecd2fc,
      sunIntensity: 2.3,
      rimColor: 0x7b2cbf,
      elevatedSectors: [
        { x1: 0.25, x2: 0.75, z1: 0.25, z2: 0.75, maxRamps: 4 }
      ]
    }
  },
  {
    id: 9,
    name: 'APEX MONOLITH',
    subtitle: 'Skyscraper Citadel — Cloudtop Catwalks',
    difficulty: 'MASTER',
    size: 29,
    description: 'Towering industrial skyscraper superstructure suspended in golden storm skies with triple-tiered walkways.',
    theme: {
      accentColor: '#ffd166',
      beaconColor: 0xffd166,
      fogColor: 0x18160f,
      fogDensity: 0.012,
      ambientColor: 0x38301b,
      sunColor: 0xfff0c2,
      sunIntensity: 2.6,
      rimColor: 0xf4a261,
      elevatedSectors: [
        { x1: 0.15, x2: 0.45, z1: 0.15, z2: 0.45, maxRamps: 3 },
        { x1: 0.55, x2: 0.85, z1: 0.15, z2: 0.45, maxRamps: 3 },
        { x1: 0.35, x2: 0.65, z1: 0.55, z2: 0.85, maxRamps: 3 }
      ]
    }
  },
  {
    id: 10,
    name: 'OMEGA NEXUS',
    subtitle: 'The Core Finality — Infinite Abyss',
    difficulty: 'MASTER',
    size: 31,
    description: 'The monumental ultimate gauntlet: a colossal 31x31 labyrinth combining all hazards and maximal verticality.',
    theme: {
      accentColor: '#06d6a0',
      beaconColor: 0x06d6a0,
      fogColor: 0x051314,
      fogDensity: 0.012,
      ambientColor: 0x0e2e2a,
      sunColor: 0xc9f9ed,
      sunIntensity: 2.5,
      rimColor: 0x118ab2,
      elevatedSectors: [
        { x1: 0.15, x2: 0.45, z1: 0.15, z2: 0.45, maxRamps: 4 },
        { x1: 0.55, x2: 0.85, z1: 0.55, z2: 0.85, maxRamps: 4 },
        { x1: 0.35, x2: 0.65, z1: 0.35, z2: 0.65, maxRamps: 3 }
      ]
    }
  }
];
