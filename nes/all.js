// duty cycles
const dutyCycles = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1]
];

// legth counter load values
const lengthLoadValues = [
  10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14,
  12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30
];

// tiangle steps
const triangleSteps = [
  15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
];

// noise timer values
const noiseLoadValues = [
  4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
];

// dmc timer value
const dmcLoadValues = [
  428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54
];

//adressing modes
const IMP = 0; // also accumulator-mode
const IMM = 1;
const ZP = 2;
const ZPX = 3;
const ZPY = 4;
const IZX = 5;
const IZY = 6;
const ABS = 7;
const ABX = 8;
const ABY = 9;
const IND = 11;
const REL = 12;
const IZYr = 13; // for read instructions, with optional extra cycle
const ABXr = 14; // RMW and writes always have the extra cycle
const ABYr = 15;

// register indexes in arrays
const A = 0;
const X = 1;
const Y = 2;
const SP = 3;
const PC = 0;

// instruction maps
const addressingModes = [
  //x0 x1   x2   x3   x4   x5   x6   x7   x8   x9   xa   xb   xc   xd   xe   xf
  IMP, IZX, IMP, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //0x
  REL, IZYr, IMP, IZY, ZPX, ZPX, ZPX, ZPX, IMP, ABYr, IMP, ABY, ABXr, ABXr, ABX, ABX, //1x
  ABS, IZX, IMP, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //2x
  REL, IZYr, IMP, IZY, ZPX, ZPX, ZPX, ZPX, IMP, ABYr, IMP, ABY, ABXr, ABXr, ABX, ABX, //3x
  IMP, IZX, IMP, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //4x
  REL, IZYr, IMP, IZY, ZPX, ZPX, ZPX, ZPX, IMP, ABYr, IMP, ABY, ABXr, ABXr, ABX, ABX, //5x
  IMP, IZX, IMP, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, IND, ABS, ABS, ABS, //6x
  REL, IZYr, IMP, IZY, ZPX, ZPX, ZPX, ZPX, IMP, ABYr, IMP, ABY, ABXr, ABXr, ABX, ABX, //7x
  IMM, IZX, IMM, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //8x
  REL, IZY, IMP, IZY, ZPX, ZPX, ZPY, ZPY, IMP, ABY, IMP, ABY, ABX, ABX, ABY, ABY, //9x
  IMM, IZX, IMM, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //ax
  REL, IZYr, IMP, IZYr, ZPX, ZPX, ZPY, ZPY, IMP, ABYr, IMP, ABYr, ABXr, ABXr, ABYr, ABYr,//bx
  IMM, IZX, IMM, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //cx
  REL, IZYr, IMP, IZY, ZPX, ZPX, ZPX, ZPX, IMP, ABYr, IMP, ABY, ABXr, ABXr, ABX, ABX, //dx
  IMM, IZX, IMM, IZX, ZP, ZP, ZP, ZP, IMP, IMM, IMP, IMM, ABS, ABS, ABS, ABS, //ex
  REL, IZYr, IMP, IZY, ZPX, ZPX, ZPX, ZPX, IMP, ABYr, IMP, ABY, ABXr, ABXr, ABX, ABX, //fx
];

const cycles = [
  //0x1 x2 x3 x4 x5 x6 x7 x8 x9 xa xb xc xd xe xf
  7, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 4, 4, 6, 6, //0x
  2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //1x
  6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 4, 4, 6, 6, //2x
  2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //3x
  6, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 3, 4, 6, 6, //4x
  2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //5x
  6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 5, 4, 6, 6, //6x
  2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //7x
  2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, //8x
  2, 6, 2, 6, 4, 4, 4, 4, 2, 5, 2, 5, 5, 5, 5, 5, //9x
  2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, //ax
  2, 5, 2, 5, 4, 4, 4, 4, 2, 4, 2, 4, 4, 4, 4, 4, //bx
  2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, //cx
  2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //dx
  2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, //ex
  2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //fx
];

// from https://wiki.nesdev.com/w/index.php/PPU_palettes (savtool palette)
const nesPal = [
  [101, 101, 101], [0, 45, 105], [19, 31, 127], [60, 19, 124], [96, 11, 98], [115, 10, 55], [113, 15, 7], [90, 26, 0], [52, 40, 0], [11, 52, 0], [0, 60, 0], [0, 61, 16], [0, 56, 64], [0, 0, 0], [0, 0, 0], [0, 0, 0],
  [174, 174, 174], [15, 99, 179], [64, 81, 208], [120, 65, 204], [167, 54, 169], [192, 52, 112], [189, 60, 48], [159, 74, 0], [109, 92, 0], [54, 109, 0], [7, 119, 4], [0, 121, 61], [0, 114, 125], [0, 0, 0], [0, 0, 0], [0, 0, 0],
  [254, 254, 255], [93, 179, 255], [143, 161, 255], [200, 144, 255], [247, 133, 250], [255, 131, 192], [255, 139, 127], [239, 154, 73], [189, 172, 44], [133, 188, 47], [85, 199, 83], [60, 201, 140], [62, 194, 205], [78, 78, 78], [0, 0, 0], [0, 0, 0],
  [254, 254, 255], [188, 223, 255], [209, 216, 255], [232, 209, 255], [251, 205, 253], [255, 204, 229], [255, 207, 202], [248, 213, 180], [228, 220, 168], [204, 227, 169], [185, 232, 184], [174, 232, 208], [175, 229, 234], [182, 182, 182], [0, 0, 0], [0, 0, 0]
];

function parseHeader(rom, log) {
  let mapper;

  if (rom.length < 0x10) {
    log("Invalid rom loaded");
    return false;
  }

  if (
    rom[0] !== 0x4e || rom[1] !== 0x45 ||
    rom[2] !== 0x53 || rom[3] !== 0x1a
  ) {
    log("Invalid rom loaded");
    return false;
  }

  let header = {
    banks: rom[4],
    chrBanks: rom[5],
    mapper: (rom[6] >> 4) | (rom[7] & 0xf0),
    verticalMirroring: (rom[6] & 0x01) > 0,
    battery: (rom[6] & 0x02) > 0,
    trainer: (rom[6] & 0x04) > 0,
    fourScreen: (rom[6] & 0x08) > 0,
  };

  header.base = 16 + (header.trainer ? 512 : 0);
  header.chrBase = header.base + 0x4000 * header.banks;
  header.prgAnd = (header.banks * 0x4000) - 1;
  header.chrAnd = header.chrBanks === 0 ? 0x1fff : (header.chrBanks * 0x2000) - 1;

  if (rom.length < header.chrBase + 0x2000 * header.chrBanks) {
    log("Rom file is missing data");
    return false;
  }

  if (mappers[header.mapper] === undefined) {
    log("Unsupported mapper: " + header.mapper);
    return false;
  } else {
    try {
      mapper = new mappers[header.mapper](rom, header);
      return mapper;
    } catch (e) {
      log("Rom load error: " + e);
      return false;
    }
  }
}

function Nes(rom, battery, log) {
  const mapper = parseHeader(rom, log);

  if (!mapper) return false;

  // ================ GLOBAL ================
  // irq sources
  let frameIrqWanted = false;
  let dmcIrqWanted = false;
  let nmiWanted = false;

  // dot position
  let line = 0;
  let dot = 0;

  // ================= NES ==================
  // {
  let ram = new Uint8Array(0x800);

  // cycle timer, to sync cpu/ppu
  let cycleTimer = 0;

  // oam dma
  let inDma = false;
  let dmaTimer = 0;
  let dmaBase = 0;
  let dmaValue = 0;

  // controllers
  let latchedControl1State = 0;
  let latchedControl2State = 0;
  let controllerLatched = false;

  function getPixels(pixelsOut) {
    for (let i = 0; i < pixelOutput.length; i++) {
      const color = pixelOutput[i];
      let [r, g, b] = nesPal[color & 0x3f];
      // from https://forums.nesdev.com/viewtopic.php?f=3&t=18416#p233708
      if ((color & 0x40) > 0) {
        // emphasize red
        r = r * 1.1;
        g = g * 0.9;
        b = b * 0.9;
      }
      if ((color & 0x80) > 0) {
        // emphasize green
        r = r * 0.9;
        g = g * 1.1;
        b = b * 0.9;
      }
      if ((color & 0x100) > 0) {
        // emphasize blue
        r = r * 0.9;
        g = g * 0.9;
        b = b * 1.1;
      }
      r = (r > 255 ? 255 : r) & 0xff;
      g = (g > 255 ? 255 : g) & 0xff;
      b = (b > 255 ? 255 : b) & 0xff;

      pixelsOut[i * 4] = r;
      pixelsOut[i * 4 + 1] = g;
      pixelsOut[i * 4 + 2] = b;
      pixelsOut[i * 4 + 3] = 255;
    }
  }

  function getSamples(data, count) {
    // apu returns 29780 or 29781 samples (0 - 1) for a frame
    // we need count values (0 - 1)
    let samples = getOutput();
    let runAdd = (29780 / count);
    let inputPos = 0;
    let running = 0;
    for (let i = 0; i < count; i++) {
      running += runAdd;
      let total = 0;
      let avgCount = running & 0xffff;
      for (let j = inputPos; j < inputPos + avgCount; j++) {
        total += samples[1][j];
      }
      data[i] = total / avgCount;
      inputPos += avgCount;
      running -= avgCount;
    }
  }

  function cycle(currentControl1State, currentControl2State) {
    if (cycleTimer === 0) {
      cycleTimer = 3;
      // do a cpu and apu cycle every 3 ppu cycles

      // handle controller latch
      if (controllerLatched) {
        latchedControl1State = currentControl1State;
        latchedControl2State = currentControl2State;
      }

      if (!inDma) {
        cycleCpu();
      } else {
        // handle dma
        if (dmaTimer > 0) {
          if ((dmaTimer & 1) === 0) {
            // even cycles are write to ppu
            writePpu(4, dmaValue);
          } else {
            // odd cycles are read for value
            dmaValue = read(
              dmaBase + ((dmaTimer / 2) & 0xff)
            );
          }
        }
        dmaTimer++;
        if (dmaTimer === 513) {
          dmaTimer = 0;
          inDma = false;
        }
      }

      cycleApu();
    }
    cyclePpu();
    cycleTimer--;
  }

  function runFrame(currentControl1State, currentControl2State) {
    do {
      cycle(currentControl1State, currentControl2State);
    } while (!(line === 240 && dot === 0));
  }

  // cpu read
  function read(adr) {
    adr &= 0xffff;

    if (adr < 0x2000) {
      // ram
      return ram[adr & 0x7ff];
    } else if (adr < 0x4000) {
      // ppu ports
      return readPpu(adr & 0x7);
    } else if (adr < 0x4020) {
      if (adr === 0x4016) {
        let ret = latchedControl1State & 1;
        latchedControl1State >>= 1;
        latchedControl1State |= 0x80; // set bit 7
        // supposed to be open bus, but is usually the high byte of the address
        // which is 0x4016, so open bus would be 0x40
        return ret | 0x40;
      } else if (adr === 0x4017) {
        let ret = latchedControl2State & 1;
        latchedControl2State >>= 1;
        latchedControl2State |= 0x80; // set bit 7
        // same as 0x4016
        return ret | 0x40;
      } else if (adr === 0x4015) {
        let flags = getFlags();
        flags |= frameIrqWanted ? 0x40 : 0;
        flags |= dmcIrqWanted ? 0x80 : 0;
        frameIrqWanted = false;
        return flags;
      }
      return 0;
    }
    return mapper.read(adr);
  }

  // cpu write
  function write(adr, value) {
    adr &= 0xffff;

    if (adr < 0x2000) {
      // ram
      ram[adr & 0x7ff] = value;
      return;
    }
    if (adr < 0x4000) {
      // ppu ports
      writePpu(adr & 0x7, value);
      return;
    }
    if (adr < 0x4020) {
      // apu/misc ports
      if (adr === 0x4014) {
        inDma = true;
        dmaBase = value << 8;
        return;
      }
      if (adr === 0x4016) {
        if ((value & 0x01) > 0) {
          controllerLatched = true;
        } else {
          controllerLatched = false;
        }
        return;
      }
      writeApu(adr, value);
      return;
    }
    mapper.write(adr, value);
  }

  // save states, battery saves
  function getBattery() {
    if (mapper.h.battery) {
      return { data: mapper.getBattery() };
    }
    return undefined;
  }
  // }

  // ================= CPU ==================
  // {
  // registers
  let regA = 0;
  let regX = 0;
  let regY = 0;
  let regSP = 0xfd;
  let regPC = read(0xfffc) | (read(0xfffd) << 8);

  // flags
  let cN = false;
  let cV = false;
  let cD = false;
  let cI = true;
  let cZ = false;
  let cC = false;

  // cycles left
  let cyclesLeft = 7;

  function cycleCpu() {
    if (cyclesLeft === 0) {
      // read the instruction byte and get the info
      let instr = read(regPC++);
      let mode = addressingModes[instr];
      let irqWanted = frameIrqWanted || dmcIrqWanted;

      cyclesLeft = cycles[instr];
      // test for wanting an interrupt
      if (nmiWanted || (irqWanted && !cI)) {
        // we want a interrupt, so push a special instuction type in instr
        regPC--;
        if (nmiWanted) {
          nmiWanted = false;
          instr = 0x100; // NMI
        } else {
          instr = 0x101; // IRQ
        }
        mode = IMP;
        cyclesLeft = 7;
      }
      // get the effective address, and execute the instruction
      let eff = getAdr(mode);
      functions[instr].call(this, eff, instr);
    }
    return --cyclesLeft;
  }

  // create a P value from the flags
  function getP(bFlag) {
    let value = 0;

    value |= cN ? 0x80 : 0;
    value |= cV ? 0x40 : 0;
    value |= cD ? 0x08 : 0;
    value |= cI ? 0x04 : 0;
    value |= cZ ? 0x02 : 0;
    value |= cC ? 0x01 : 0;
    value |= 0x20; // bit 5 is always set
    value |= bFlag ? 0x10 : 0;

    return value;
  }

  // set the flags according to a P value
  function setP(value) {
    cN = (value & 0x80) > 0;
    cV = (value & 0x40) > 0;
    cD = (value & 0x08) > 0;
    cI = (value & 0x04) > 0;
    cZ = (value & 0x02) > 0;
    cC = (value & 0x01) > 0;
  }

  // set Z (zero flag) and N (overflow flag) according to the value
  function setZandN(value) {
    value &= 0xff;
    cZ = value === 0;
    cN = value > 0x7f;
  }

  // get a singed value (-128 - 127) out of a unsigned one (0 - 255)
  function getSigned(value) {
    if (value > 127) {
      return -(256 - value);
    }
    return value;
  }

  function doBranch(test, rel) {
    if (test) {
      // taken branch: 1 extra cycle
      cyclesLeft++;
      if ((regPC >> 8) !== ((regPC + rel) >> 8)) {
        // taken branch across page: another extra cycle
        cyclesLeft++;
      }
      regPC += rel;
    }
  }

  // after fetching the instruction byte, this gets the address to affect
  // pc is pointing to byte after instruction byte
  function getAdr(mode) {
    switch (mode) {
      case IMP: {
        // implied, wont use an address
        return 0;
      }
      case IMM: {
        // immediate
        return regPC++;
      }
      case ZP: {
        // zero page
        return read(regPC++);
      }
      case ZPX: {
        // zero page, indexed by x
        let adr = read(regPC++);
        return (adr + regX) & 0xff;
      }
      case ZPY: {
        // zero page, indexed by y
        let adr = read(regPC++);
        return (adr + regY) & 0xff;
      }
      case IZX: {
        // zero page, indexed indirect by x
        let adr = (read(regPC++) + regX) & 0xff;
        return read(adr) | (read((adr + 1) & 0xff) << 8);
      }
      case IZY: {
        // zero page, indirect indexed by y (for RMW and writes)
        let adr = read(regPC++);
        let radr = read(adr) | (read((adr + 1) & 0xff) << 8);
        return (radr + regY) & 0xffff;
      }
      case IZYr: {
        // zero page, indirect indexed by y (for reads)
        let adr = read(regPC++);
        let radr = read(adr) | (read((adr + 1) & 0xff) << 8);
        if ((radr >> 8) < ((radr + regY) >> 8)) {
          cyclesLeft++;
        }
        return (radr + regY) & 0xffff;
      }
      case ABS: {
        // absolute
        let adr = read(regPC++);
        adr |= (read(regPC++) << 8);
        return adr;
      }
      case ABX: {
        // absolute, indexed by x (for RMW and writes)
        let adr = read(regPC++);
        adr |= (read(regPC++) << 8);
        return (adr + regX) & 0xffff;
      }
      case ABXr: {
        // absolute, indexed by x (for reads)
        let adr = read(regPC++);
        adr |= (read(regPC++) << 8);
        if ((adr >> 8) < ((adr + regX) >> 8)) {
          cyclesLeft++;
        }
        return (adr + regX) & 0xffff;
      }
      case ABY: {
        // absolute, indexed by y (for RMW and writes)
        let adr = read(regPC++);
        adr |= (read(regPC++) << 8);
        return (adr + regY) & 0xffff;
      }
      case ABYr: {
        // absolute, indexed by y (for reads)
        let adr = read(regPC++);
        adr |= (read(regPC++) << 8);
        if ((adr >> 8) < ((adr + regY) >> 8)) {
          cyclesLeft++;
        }
        return (adr + regY) & 0xffff;
      }
      case IND: {
        // indirect, doesn't loop pages properly
        let adrl = read(regPC++);
        let adrh = read(regPC++);
        let radr = read(adrl | (adrh << 8));
        radr |= (read(((adrl + 1) & 0xff) | (adrh << 8))) << 8;
        return radr;
      }
      case REL: {
        // relative to PC, for branches
        let rel = read(regPC++);
        return getSigned(rel);
      }
    }
  }

  // instruction functions

  function uni(adr, num) {
    // unimplemented instruction
    log("unimplemented instruction");
  }

  function ora(adr) {
    // ORs A with the value, set Z and N
    regA |= read(adr);
    setZandN(regA);
  }

  function and(adr) {
    // ANDs A with the value, set Z and N
    regA &= read(adr);
    setZandN(regA);
  }

  function eor(adr) {
    // XORs A with the value, set Z and N
    regA ^= read(adr);
    setZandN(regA);
  }

  function adc(adr) {
    // adds the value + C to A, set C, V, Z and N
    let value = read(adr);
    let result = regA + value + (cC ? 1 : 0);
    cC = result > 0xff;
    cV = (
      (regA & 0x80) === (value & 0x80) &&
      (value & 0x80) !== (result & 0x80)
    );
    regA = result & 0xff;
    setZandN(regA);
  }

  function sbc(adr) {
    // subtracts the value + !C from A, set C, V, Z and N
    let value = read(adr) ^ 0xff;
    let result = regA + value + (cC ? 1 : 0);
    cC = result > 0xff;
    cV = (
      (regA & 0x80) === (value & 0x80) &&
      (value & 0x80) !== (result & 0x80)
    );
    regA = result & 0xff;
    setZandN(regA);
  }

  function cmp(adr) {
    // sets C, Z and N according to what A - value would do
    let value = read(adr) ^ 0xff;
    let result = regA + value + 1;
    cC = result > 0xff;
    setZandN(result & 0xff);
  }

  function cpx(adr) {
    // sets C, Z and N according to what X - value would do
    let value = read(adr) ^ 0xff;
    let result = regX + value + 1;
    cC = result > 0xff;
    setZandN(result & 0xff);
  }

  function cpy(adr) {
    // sets C, Z and N according to what Y - value would do
    let value = read(adr) ^ 0xff;
    let result = regY + value + 1;
    cC = result > 0xff;
    setZandN(result & 0xff);
  }

  function dec(adr) {
    // decrements a memory location, set Z and N
    let result = (read(adr) - 1) & 0xff;
    setZandN(result);
    write(adr, result);
  }

  function dex(adr) {
    // decrements X, set Z and N
    regX = (regX - 1) & 0xff;
    setZandN(regX);
  }

  function dey(adr) {
    // decrements Y, set Z and N
    regY = (regY - 1) & 0xff;
    setZandN(regY);
  }

  function inc(adr) {
    // increments a memory location, set Z and N
    let result = (read(adr) + 1) & 0xff;
    setZandN(result);
    write(adr, result);
  }

  function inx(adr) {
    // increments X, set Z and N
    regX = (regX + 1) & 0xff;
    setZandN(regX);
  }

  function iny(adr) {
    // increments Y, set Z and N
    regY = (regY + 1) & 0xff;
    setZandN(regY);
  }

  function asla(adr) {
    // shifts A left 1, set C, Z and N
    let result = regA << 1;
    cC = result > 0xff;
    setZandN(result);
    regA = result & 0xff;
  }

  function asl(adr) {
    // shifts a memory location left 1, set C, Z and N
    let result = read(adr) << 1;
    cC = result > 0xff;
    setZandN(result);
    write(adr, result);
  }

  function rola(adr) {
    // rolls A left 1, rolls C in, set C, Z and N
    let result = (regA << 1) | (cC ? 1 : 0);
    cC = result > 0xff;
    setZandN(result);
    regA = result & 0xff;
  }

  function rol(adr) {
    // rolls a memory location left 1, rolls C in, set C, Z and N
    let result = (read(adr) << 1) | (cC ? 1 : 0);
    cC = result > 0xff;
    setZandN(result);
    write(adr, result);
  }

  function lsra(adr) {
    // shifts A right 1, set C, Z and N
    let carry = regA & 0x1;
    let result = regA >> 1;
    cC = carry > 0;
    setZandN(result);
    regA = result;
  }

  function lsr(adr) {
    // shifts a memory location right 1, set C, Z and N
    let value = read(adr);
    let carry = value & 0x1;
    let result = value >> 1;
    cC = carry > 0;
    setZandN(result);
    write(adr, result);
  }

  function rora(adr) {
    // rolls A right 1, rolls C in, set C, Z and N
    let carry = regA & 0x1;
    let result = (regA >> 1) | ((cC ? 1 : 0) << 7);
    cC = carry > 0;
    setZandN(result);
    regA = result;
  }

  function ror(adr) {
    // rolls a memory location right 1, rolls C in, set C, Z and N
    let value = read(adr);
    let carry = value & 0x1;
    let result = (value >> 1) | ((cC ? 1 : 0) << 7);
    cC = carry > 0;
    setZandN(result);
    write(adr, result);
  }

  function lda(adr) {
    // loads a value in a, sets Z and N
    regA = read(adr);
    setZandN(regA);
  }

  function sta(adr) {
    // stores a to a memory location
    write(adr, regA);
  }

  function ldx(adr) {
    // loads x value in a, sets Z and N
    regX = read(adr);
    setZandN(regX);
  }

  function stx(adr) {
    // stores x to a memory location
    write(adr, regX);
  }

  function ldy(adr) {
    // loads a value in y, sets Z and N
    regY = read(adr);
    setZandN(regY);
  }

  function sty(adr) {
    // stores y to a memory location
    write(adr, regY);
  }

  function tax(adr) {
    // transfers a to x, sets Z and N
    regX = regA;
    setZandN(regX);
  }

  function txa(adr) {
    // transfers x to a, sets Z and N
    regA = regX;
    setZandN(regA);
  }

  function tay(adr) {
    // transfers a to y, sets Z and N
    regY = regA;
    setZandN(regY);
  }

  function tya(adr) {
    // transfers y to a, sets Z and N
    regA = regY;
    setZandN(regA);
  }

  function tsx(adr) {
    // transfers the stack pointer to x, sets Z and N
    regX = regSP;
    setZandN(regX);
  }

  function txs(adr) {
    // transfers x to the stack pointer
    regSP = regX;
  }

  function pla(adr) {
    // pulls a from the stack, sets Z and N
    regA = read(0x100 + ((++regSP) & 0xff));
    setZandN(regA);
  }

  function pha(adr) {
    // pushes a to the stack
    write(0x100 + regSP--, regA);
  }

  function plp(adr) {
    // pulls the flags from the stack
    setP(read(0x100 + ((++regSP) & 0xff)));
  }

  function php(adr) {
    // pushes the flags to the stack
    write(0x100 + regSP--, getP(true));
  }

  function bpl(adr) {
    // branches if N is 0
    doBranch(!cN, adr);
  }

  function bmi(adr) {
    // branches if N is 1
    doBranch(cN, adr);
  }

  function bvc(adr) {
    // branches if V is 0
    doBranch(!cV, adr);
  }

  function bvs(adr) {
    // branches if V is 1
    doBranch(cV, adr);
  }

  function bcc(adr) {
    // branches if C is 0
    doBranch(!cC, adr);
  }

  function bcs(adr) {
    // branches if C is 1
    doBranch(cC, adr);
  }

  function bne(adr) {
    // branches if Z is 0
    doBranch(!cZ, adr);
  }

  function beq(adr) {
    // branches if Z is 1
    doBranch(cZ, adr);
  }

  function brk(adr) {
    // break to irq handler
    let pushPc = (regPC + 1) & 0xffff;
    write(0x100 + regSP--, pushPc >> 8);
    write(0x100 + regSP--, pushPc & 0xff);
    write(0x100 + regSP--, getP(true));
    cI = true;
    regPC = read(0xfffe) | (read(0xffff) << 8);
  }

  function rti(adr) {
    // return from interrupt
    setP(read(0x100 + ((++regSP) & 0xff)));
    let pullPc = read(0x100 + ((++regSP) & 0xff));
    pullPc |= (read(0x100 + ((++regSP) & 0xff)) << 8);
    regPC = pullPc;
  }

  function jsr(adr) {
    // jump to subroutine
    let pushPc = (regPC - 1) & 0xffff;
    write(0x100 + regSP--, pushPc >> 8);
    write(0x100 + regSP--, pushPc & 0xff);
    regPC = adr;
  }

  function rts(adr) {
    // return from subroutine
    let pullPc = read(0x100 + ((++regSP) & 0xff));
    pullPc |= (read(0x100 + ((++regSP) & 0xff)) << 8);
    regPC = pullPc + 1;
  }

  function jmp(adr) {
    // jump to address
    regPC = adr;
  }

  function bit(adr) {
    // bit test A with value, set N to b7, V to b6 and Z to result
    let value = read(adr);
    cN = (value & 0x80) > 0;
    cV = (value & 0x40) > 0;
    let res = regA & value;
    cZ = res === 0;
  }

  function clc(adr) {
    // clear carry flag
    cC = false;
  }

  function sec(adr) {
    // set carry flag
    cC = true;
  }

  function cld(adr) {
    // clear decimal flag
    cD = false;
  }

  function sed(adr) {
    // set decimal flag
    cD = true;
  }

  function cli(adr) {
    // clear interrupt flag
    cI = false;
  }

  function sei(adr) {
    // set interrupt flag
    cI = true;
  }

  function clv(adr) {
    // clear overflow flag
    cV = false;
  }

  function nop(adr) {
    // no operation
  }

  function irq(adr) {
    // handle irq interrupt
    let pushPc = regPC;
    write(0x100 + regSP--, pushPc >> 8);
    write(0x100 + regSP--, pushPc & 0xff);
    write(0x100 + regSP--, getP(false));
    cI = true;
    regPC = read(0xfffe) | (read(0xffff) << 8);
  }

  function nmi(adr) {
    // handle nmi interrupt
    let pushPc = regPC;
    write(0x100 + regSP--, pushPc >> 8);
    write(0x100 + regSP--, pushPc & 0xff);
    write(0x100 + regSP--, getP(false));
    cI = true;
    regPC = read(0xfffa) | (read(0xfffb) << 8);
  }

  // undocumented opcodes

  function kil(adr) {
    // stopts the cpu
    regPC--;
  }

  function slo(adr) {
    // shifts a memory location left 1, ORs a with the result, sets N, Z and C
    let result = read(adr) << 1;
    cC = result > 0xff;
    write(adr, result);
    regA |= result;
    setZandN(regA);
  }

  function rla(adr) {
    // rolls a memory location left 1, ANDs a with the result, sets N, Z and C
    let result = (read(adr) << 1) | (cC ? 1 : 0);
    cC = result > 0xff;
    write(adr, result);
    regA &= result;
    setZandN(regA);
  }

  function sre(adr) {
    // shifts a memory location right 1, XORs A with the result, sets N, Z and C
    let value = read(adr);
    let carry = value & 0x1;
    let result = value >> 1;
    cC = carry > 0;
    write(adr, result);
    regA ^= result;
    setZandN(regA);
  }

  function rra(adr) {
    // rolls a memory location right 1, adds the result to A, sets N, Z, C and V
    let value = read(adr);
    let carry = value & 0x1;
    let result = (value >> 1) | ((cC ? 1 : 0) << 7);
    write(adr, result);
    let addResult = regA + result + carry;
    cC = addResult > 0xff;
    cV = (
      (regA & 0x80) === (result & 0x80) &&
      (result & 0x80) !== (addResult & 0x80)
    );
    regA = addResult & 0xff;
    setZandN(regA);
  }

  function sax(adr) {
    // stores A ANDed with X to a memory location
    write(adr, regA & regX);
  }

  function lax(adr) {
    // loads A and X with a value
    regA = read(adr);
    regX = regA;
    setZandN(regX);
  }

  function dcp(adr) {
    // decrement a memory location, and sets C, Z and N to what A - result does
    let value = (read(adr) - 1) & 0xff;
    write(adr, value);
    value ^= 0xff;
    let result = regA + value + 1;
    cC = result > 0xff;
    setZandN(result & 0xff);
  }

  function isc(adr) {
    // increments a memory location, and subtract it+!C from A, sets Z, N, V, C
    let value = (read(adr) + 1) & 0xff;
    write(adr, value);
    value ^= 0xff;
    let result = regA + value + (cC ? 1 : 0);
    cC = result > 0xff;
    cV = (
      (regA & 0x80) === (value & 0x80) &&
      (value & 0x80) !== (result & 0x80)
    );
    regA = result;
    setZandN(regA);
  }

  function anc(adr) {
    // ANDs a with the value, sets Z and N, then sets C to N
    regA &= read(adr);
    setZandN(regA);
    cC = cN;
  }

  function alr(adr) {
    // ANDs a with the value, then shifts A right 1, sets C, Z and N
    regA &= read(adr);
    let carry = regA & 0x1;
    let result = regA >> 1;
    cC = carry > 0;
    setZandN(result);
    regA = result;
  }

  function arr(adr) {
    // ANDs a with the value, then rolls A right 1, sets Z, N, C and V oddly
    regA &= read(adr);
    let result = (regA >> 1) | ((cC ? 1 : 0) << 7);
    setZandN(result);
    cC = (result & 0x40) > 0;
    cV = ((result & 0x40) ^ ((result & 0x20) << 1)) > 0;
    regA = result;
  }

  function axs(adr) {
    // sets X to A ANDed with X minus the value, sets N, Z and C
    let value = read(adr) ^ 0xff;
    let andedA = regA & regX;
    let result = andedA + value + 1;
    cC = result > 0xff;
    regX = result & 0xff;
    setZandN(regX);
  }

  // function table
  const functions = [
    //x0  x1   x2   x3   x4   x5   x6   x7   x8   x9   xa   xb   xc   xd   xe   xf
    brk, ora, kil, slo, nop, ora, asl, slo, php, ora, asla, anc, nop, ora, asl, slo, //0x
    bpl, ora, kil, slo, nop, ora, asl, slo, clc, ora, nop, slo, nop, ora, asl, slo, //1x
    jsr, and, kil, rla, bit, and, rol, rla, plp, and, rola, anc, bit, and, rol, rla, //2x
    bmi, and, kil, rla, nop, and, rol, rla, sec, and, nop, rla, nop, and, rol, rla, //3x
    rti, eor, kil, sre, nop, eor, lsr, sre, pha, eor, lsra, alr, jmp, eor, lsr, sre, //4x
    bvc, eor, kil, sre, nop, eor, lsr, sre, cli, eor, nop, sre, nop, eor, lsr, sre, //5x
    rts, adc, kil, rra, nop, adc, ror, rra, pla, adc, rora, arr, jmp, adc, ror, rra, //6x
    bvs, adc, kil, rra, nop, adc, ror, rra, sei, adc, nop, rra, nop, adc, ror, rra, //7x
    nop, sta, nop, sax, sty, sta, stx, sax, dey, nop, txa, uni, sty, sta, stx, sax, //8x
    bcc, sta, kil, uni, sty, sta, stx, sax, tya, sta, txs, uni, uni, sta, uni, uni, //9x
    ldy, lda, ldx, lax, ldy, lda, ldx, lax, tay, lda, tax, uni, ldy, lda, ldx, lax, //ax
    bcs, lda, kil, lax, ldy, lda, ldx, lax, clv, lda, tsx, uni, ldy, lda, ldx, lax, //bx
    cpy, cmp, nop, dcp, cpy, cmp, dec, dcp, iny, cmp, dex, axs, cpy, cmp, dec, dcp, //cx
    bne, cmp, kil, dcp, nop, cmp, dec, dcp, cld, cmp, nop, dcp, nop, cmp, dec, dcp, //dx
    cpx, sbc, nop, isc, cpx, sbc, inc, isc, inx, sbc, nop, sbc, cpx, sbc, inc, isc, //ex
    beq, sbc, kil, isc, nop, sbc, inc, isc, sed, sbc, nop, isc, nop, sbc, inc, isc, //fx
    nmi, irq // 0x100: NMI, 0x101: IRQ
  ];
  // }

  // ================= PPU ==================
  // {
  // nametable memory stored in mapper to simplify code

  // palette memory
  const paletteRam = new Uint8Array(0x20);

  // oam memory
  const oamRam = new Uint8Array(0x100);

  // sprite buffers
  const secondaryOam = new Uint8Array(0x20);
  const spriteTiles = new Uint8Array(0x10);

  // final pixel output
  const pixelOutput = new Uint16Array(256 * 240);

  // scrolling / vram address
  let pT = 0; // temporary vram address
  let pV = 0; // vram address
  let pW = 0; // write flag
  let pX = 0; // fine x scroll

  // dot position
  let evenFrame = true;

  // rest
  let oamAddress = 0; // oam address
  let readBuffer = 0; // 2007 buffer;

  // for PPUSTAUS
  let spriteZero = false;
  let spriteOverflow = false;
  let inVblank = false;

  // for PPUCTRL
  let vramIncrement = 1;
  let spritePatternBase = 0;
  let bgPatternBase = 0;
  let spriteHeight = 8;
  let generateNmi = false;

  // for PPUMASK
  let greyScale = false;
  let bgInLeft = false;
  let sprInLeft = false;
  let bgRendering = false;
  let sprRendering = false;
  let emphasis = 0;

  // internal operation
  let atl = 0;
  let atr = 0;
  let tl = 0;
  let th = 0;
  let spriteZeroIn = false;
  let spriteCount = 0;

  function cyclePpu() {
    if (line < 240) {
      // visible frame
      if (dot < 256) {
        generateDot();
        if (((dot + 1) & 0x7) === 0) {
          // dot 7, 15, 23, 31 etc
          if (bgRendering || sprRendering) {
            readTileBuffers();
            incrementVx();
          }
        }
      } else if (dot === 256) {
        if (bgRendering || sprRendering) {
          incrementVy();
        }
      } else if (dot === 257) {
        if (bgRendering || sprRendering) {
          // copy x parts from t to v
          pV &= 0x7be0;
          pV |= (pT & 0x41f);
        }
      } else if (dot === 270) {
        // clear sprite buffers
        spriteZeroIn = false;
        spriteCount = 0;
        if (bgRendering || sprRendering) {
          // do sprite evaluation and sprite tile fetching
          evaluateSprites();
        }
      } else if (dot === 321 || dot === 329) {
        if (bgRendering || sprRendering) {
          readTileBuffers();
          incrementVx();
        }
      }
    } else if (line === 241) {
      if (dot === 1) {
        inVblank = true;
        if (generateNmi) {
          nmiWanted = true;
        }
        if (bgRendering || sprRendering) {
          evenFrame = !evenFrame; // flip frame state
        } else {
          evenFrame = true; // not in rendering, all frames are even
        }
      }
    } else if (line === 261) {
      // pre render line
      if (dot === 1) {
        inVblank = false;
        spriteZero = false;
        spriteOverflow = false;
      } else if (dot === 257) {
        if (bgRendering || sprRendering) {
          // copy x parts from t to v
          pV &= 0x7be0;
          pV |= (pT & 0x41f);
        }
      } else if (dot === 270) {
        // clear sprite buffers from sprites evaluated on line 239
        spriteZeroIn = false;
        spriteCount = 0;
        if (bgRendering || sprRendering) {
          // garbage sprite fetch
          let base = spriteHeight === 16 ? 0x1000 : spritePatternBase;
          readInternal(base + 0xfff);
        }
      } else if (dot === 280) {
        if (bgRendering || sprRendering) {
          // copy y parts from t to v
          pV &= 0x41f;
          pV |= (pT & 0x7be0);
        }
      } else if (dot === 321 || dot === 329) {
        if (bgRendering || sprRendering) {
          readTileBuffers();
          incrementVx();
        }
      }
    }

    dot++;
    if (dot === 341 || (
      dot === 340 && line === 261 && !evenFrame
    )) {
      // if we loop (1 early on odd frames on line 261)
      dot = 0;
      line++;
      if (line === 262) {
        line = 0;
      }
    }
  }

  function evaluateSprites() {
    for (let i = 0; i < 256; i += 4) {
      let sprY = oamRam[i];
      let sprRow = line - sprY;
      if (sprRow >= 0 && sprRow < spriteHeight) {
        // sprite is on this scanline
        if (spriteCount === 8) {
          // secondary oam is full
          spriteOverflow = true;
          break;
        } else {
          // place in secondary oam
          if (i === 0) {
            // sprite zero
            spriteZeroIn = true;
          }
          secondaryOam[spriteCount * 4] = oamRam[i];
          secondaryOam[spriteCount * 4 + 1] = oamRam[i + 1];
          secondaryOam[spriteCount * 4 + 2] = oamRam[i + 2];
          secondaryOam[spriteCount * 4 + 3] = oamRam[i + 3];
          // fetch the tiles
          if ((oamRam[i + 2] & 0x80) > 0) {
            sprRow = spriteHeight - 1 - sprRow;
          }
          let base = spritePatternBase;
          let tileNum = oamRam[i + 1];
          if (spriteHeight === 16) {
            base = (tileNum & 0x1) * 0x1000;
            tileNum = (tileNum & 0xfe);
            tileNum += (sprRow & 0x8) >> 3;
            sprRow &= 0x7;
          }
          spriteTiles[spriteCount] = readInternal(
            base + tileNum * 16 + sprRow
          );
          spriteTiles[spriteCount + 8] = readInternal(
            base + tileNum * 16 + sprRow + 8
          );
          spriteCount++;
        }
      }
    }
    if (spriteCount < 8) {
      // garbage fetch if not all slots were filled
      let base = spriteHeight === 16 ? 0x1000 : spritePatternBase;
      readInternal(base + 0xfff);
    }
  }

  function readTileBuffers() {
    let tileNum = readInternal(0x2000 + (pV & 0xfff));

    atl = atr;
    let attAdr = 0x23c0;
    attAdr |= (pV & 0x1c) >> 2;
    attAdr |= (pV & 0x380) >> 4;
    attAdr |= (pV & 0xc00);
    atr = readInternal(attAdr);
    if ((pV & 0x40) > 0) {
      // bottom half
      atr >>= 4;
    }
    atr &= 0xf;
    if ((pV & 0x02) > 0) {
      // right half
      atr >>= 2;
    }
    atr &= 0x3;

    let fineY = (pV & 0x7000) >> 12;
    tl &= 0xff;
    tl <<= 8;
    tl |= readInternal(bgPatternBase + tileNum * 16 + fineY);
    th &= 0xff;
    th <<= 8;
    th |= readInternal(
      bgPatternBase + tileNum * 16 + fineY + 8
    );
  }

  function generateDot() {
    let i = dot & 0x7;
    let bgPixel = 0;
    let sprPixel = 0;
    let sprNum = -1;
    let sprPriority = 0;
    let finalColor;

    if (sprRendering && (dot > 7 || sprInLeft)) {
      // if sprite rendering is on, and either not the left 8 pixels
      // or sprite rendering in left 8 pixels is on
      // search through all sprites in secondary oam to find ones
      // on this dot, and pick the first non-0 pixel
      for (let j = 0; j < spriteCount; j++) {
        let xPos = secondaryOam[j * 4 + 3];
        let xCol = dot - xPos;
        if (xCol >= 0 && xCol < 8) {
          // sprite is in range
          if ((secondaryOam[j * 4 + 2] & 0x40) > 0) {
            xCol = 7 - xCol;
          }
          let shift = 7 - xCol;
          let pixel = (spriteTiles[j] >> shift) & 1;
          pixel |= ((spriteTiles[j + 8] >> shift) & 1) << 1;
          if (pixel > 0) {
            // set the pixel, priority, and number
            sprPixel = pixel | ((secondaryOam[j * 4 + 2] & 0x3) << 2);
            sprPriority = (secondaryOam[j * 4 + 2] & 0x20) >> 5;
            sprNum = j;
            break;
          }
        }
      }
    }

    if (bgRendering && (dot > 7 || bgInLeft)) {
      // if bg rendering is on, and either not the left 8 pixels
      // or bg rendering in left 8 columns is on
      let shiftAmount = 15 - i - pX;
      bgPixel = (tl >> shiftAmount) & 1;
      bgPixel |= ((th >> shiftAmount) & 1) << 1;
      let atrOff;
      if (pX + i > 7) {
        // right tile
        atrOff = atr * 4;
      } else {
        atrOff = atl * 4;
      }
      if (bgPixel > 0) {
        bgPixel += atrOff;
      }
    }

    if (!bgRendering && !sprRendering) {
      // display color 0, or color at vram address if pointing to palette
      if ((pV & 0x3fff) >= 0x3f00) {
        finalColor = readPalette(pV & 0x1f);
      } else {
        finalColor = readPalette(0);
      }
    } else {
      // if bg pixel is 0, render sprite pixel
      if (bgPixel === 0) {
        if (sprPixel > 0) {
          finalColor = readPalette(sprPixel + 0x10);
        } else {
          finalColor = readPalette(0);
        }
      } else {
        // render sprite pixel if not 0 and it has priority
        if (sprPixel > 0) {
          // check for sprite zero
          if (sprNum === 0 && spriteZeroIn && dot !== 255) {
            spriteZero = true;
          }
        }
        if (sprPixel > 0 && sprPriority === 0) {
          finalColor = readPalette(sprPixel + 0x10);
        } else {
          finalColor = readPalette(bgPixel);
        }
      }
    }

    pixelOutput[
      line * 256 + dot
    ] = (emphasis << 6) | (finalColor & 0x3f);
  }

  // from https://wiki.nesdev.com/w/index.php/PPU_scrolling
  function incrementVx() {
    if ((pV & 0x1f) === 0x1f) {
      pV &= 0x7fe0;
      pV ^= 0x400;
    } else {
      pV++;
    }
  }

  function incrementVy() {
    if ((pV & 0x7000) !== 0x7000) {
      pV += 0x1000;
    } else {
      pV &= 0xfff;
      let coarseY = (pV & 0x3e0) >> 5;
      if (coarseY === 29) {
        coarseY = 0;
        pV ^= 0x800;
      } else if (coarseY === 31) {
        coarseY = 0;
      } else {
        coarseY++;
      }
      pV &= 0x7c1f;
      pV |= (coarseY << 5);
    }
  }

  function readInternal(adr) {
    return mapper.ppuRead(adr & 0x3fff);
  }

  function writeInternal(adr, value) {
    mapper.ppuWrite(adr & 0x3fff, value);
  }

  function readPalette(adr) {
    let palAdr = adr & 0x1f;
    if (palAdr >= 0x10 && (palAdr & 0x3) === 0) {
      // 0x10, 0x14, 0x18 and 0x1c are mirrored to 0, 4, 8 and 0xc
      palAdr -= 0x10;
    }
    let ret = paletteRam[palAdr];
    if (greyScale) {
      ret &= 0x30;
    }
    return ret;
  }

  function writePalette(adr, value) {
    let palAdr = adr & 0x1f;
    if (palAdr >= 0x10 && (palAdr & 0x3) === 0) {
      // 0x10, 0x14, 0x18 and 0x1c are mirrored to 0, 4, 8 and 0xc
      palAdr -= 0x10;
    }
    paletteRam[palAdr] = value;
  }

  function readPpu(adr) {
    if (adr === 2) {
      // PPUSTATUS
      pW = 0;
      let ret = 0;
      if (inVblank) {
        ret |= 0x80;
        inVblank = false;
      }
      ret |= spriteZero ? 0x40 : 0;
      ret |= spriteOverflow ? 0x20 : 0;
      return ret;
    } else if (adr === 4) {
      // OAMDATA
      return oamRam[oamAddress];
    } else if (adr === 7) {
      // PPUDATA
      let adr = pV & 0x3fff;
      if (
        (bgRendering || sprRendering) &&
        (line < 240 || line === 261)
      ) {
        // while rendering, vram is incremented strangely
        incrementVy();
        incrementVx();
      } else {
        pV += vramIncrement;
        pV &= 0x7fff;
      }
      let temp = readBuffer;
      if (adr >= 0x3f00) {
        // read palette in temp
        temp = readPalette(adr);
      }
      readBuffer = readInternal(adr);
      return temp;
    }
    return 0;
  }

  function writePpu(adr, value) {
    switch (adr) {
      case 0: {
        // PPUCTRL
        pT &= 0x73ff;
        pT |= (value & 0x3) << 10;

        vramIncrement = (value & 0x04) > 0 ? 32 : 1;
        spritePatternBase = (value & 0x08) > 0 ? 0x1000 : 0;
        bgPatternBase = (value & 0x10) > 0 ? 0x1000 : 0;
        spriteHeight = (value & 0x20) > 0 ? 16 : 8;
        let oldNmi = generateNmi;
        // slave = (value & 0x40) > 0;
        generateNmi = (value & 0x80) > 0;

        if (generateNmi && !oldNmi && inVblank) {
          // immediate nmi if enabled during vblank
          nmiWanted = true;
        }
        return;
      }
      case 1: {
        // PPUMASK
        greyScale = (value & 0x01) > 0;
        bgInLeft = (value & 0x02) > 0;
        sprInLeft = (value & 0x04) > 0;
        bgRendering = (value & 0x08) > 0;
        sprRendering = (value & 0x10) > 0;
        emphasis = (value & 0xe0) >> 5;
        return;
      }
      case 2: {
        // PPUSTATUS
        return; // not writable
      }
      case 3: {
        // OAMADDR
        oamAddress = value;
        return;
      }
      case 4: {
        // OAMDATA
        oamRam[oamAddress++] = value;
        oamAddress &= 0xff;
        return;
      }
      case 5: {
        // PPUSCROLL
        if (pW === 0) {
          pT &= 0x7fe0;
          pT |= (value & 0xf8) >> 3;
          pX = value & 0x7;
          pW = 1;
        } else {
          pT &= 0x0c1f;
          pT |= (value & 0x7) << 12;
          pT |= (value & 0xf8) << 2;
          pW = 0;
        }
        return;
      }
      case 6: {
        // PPUADDR
        if (pW === 0) {
          pT &= 0xff;
          pT |= (value & 0x3f) << 8;
          pW = 1;
        } else {
          pT &= 0x7f00;
          pT |= value;
          pV = pT;
          pW = 0;
        }
        return;
      }
      case 7: {
        // PPUDATA
        let adr = pV & 0x3fff;
        if (
          (bgRendering || sprRendering) &&
          (line < 240 || line === 261)
        ) {
          // while rendering, vram is incremented strangely
          incrementVy();
          incrementVx();
        } else {
          pV += vramIncrement;
          pV &= 0x7fff;
        }
        if (adr >= 0x3f00) {
          // write palette
          writePalette(adr, value);
          return;
        }
        writeInternal(adr, value);
        return;
      }
    }
  }
  // }

  // ================= APU ==================
  // {
  // channel outputs
  const output = new Float64Array(29781);

  let outputOffset = 0;

  let frameCounter = 0;

  let interruptInhibit = false;
  let step5Mode = false;

  let enableNoise = false;
  let enableTriangle = false;
  let enablePulse2 = false;
  let enablePulse1 = false;

  // pulse 1
  let p1Timer = 0;
  let p1TimerValue = 0;
  let p1Duty = 0;
  let p1DutyIndex = 0;
  let p1Output = 0;
  let p1CounterHalt = false;
  let p1Counter = 0;
  let p1Volume = 0;
  let p1ConstantVolume = false;
  let p1Decay = 0;
  let p1EnvelopeCounter = 0;
  let p1EnvelopeStart = false;
  let p1SweepEnabled = false;
  let p1SweepPeriod = 0;
  let p1SweepNegate = false;
  let p1SweepShift = 0;
  let p1SweepTimer = 0;
  let p1SweepTarget = 0;
  let p1SweepMuting = true;
  let p1SweepReload = false;

  // pulse 2
  let p2Timer = 0;
  let p2TimerValue = 0;
  let p2Duty = 0;
  let p2DutyIndex = 0;
  let p2Output = 0;
  let p2CounterHalt = false;
  let p2Counter = 0;
  let p2Volume = 0;
  let p2ConstantVolume = false;
  let p2Decay = 0;
  let p2EnvelopeCounter = 0;
  let p2EnvelopeStart = false;
  let p2SweepEnabled = false;
  let p2SweepPeriod = 0;
  let p2SweepNegate = false;
  let p2SweepShift = 0;
  let p2SweepTimer = 0;
  let p2SweepTarget = 0;
  let p2SweepMuting = true;
  let p2SweepReload = false;

  // triangle
  let triTimer = 0;
  let triTimerValue = 0;
  let triStepIndex = 0;
  let triOutput = 0;
  let triCounterHalt = false;
  let triCounter = 0;
  let triLinearCounter = 0;
  let triReloadLinear = false;
  let triLinearReload = 0;

  // noise
  let noiseTimer = 0;
  let noiseTimerValue = 0;
  let noiseShift = 1;
  let noiseTonal = false;
  let noiseOutput = 0;
  let noiseCounterHalt = false;
  let noiseCounter = 0;
  let noiseVolume = 0;
  let noiseConstantVolume = false;
  let noiseDecay = 0;
  let noiseEnvelopeCounter = 0;
  let noiseEnvelopeStart = false;

  // dmc
  let dmcInterrupt = false;
  let dmcLoop = false;
  let dmcTimer = 0;
  let dmcTimerValue = 0;
  let dmcOutput = 0;
  let dmcSampleAddress = 0xc000;
  let dmcAddress = 0xc000;
  let dmcSample = 0;
  let dmcSampleLength = 0;
  let dmcSampleEmpty = true;
  let dmcBytesLeft = 0;
  let dmcShifter = 0;
  let dmcBitsLeft = 8;
  let dmcSilent = true;

  function cycleApu() {
    if (
      (frameCounter === 29830 && !step5Mode) ||
      frameCounter === 37282
    ) {
      frameCounter = 0;
    }
    frameCounter++;

    handleFrameCounter();

    cycleTriangle();
    cyclePulse1();
    cyclePulse2();
    cycleNoise();
    cycleDmc();

    output[outputOffset++] = mix();
    if (outputOffset === 29781) {
      // if we are going past the buffer (too many apu cycles per frame)
      outputOffset = 29780;
    }
  }

  function cyclePulse1() {
    if (p1TimerValue !== 0) {
      p1TimerValue--;
    } else {
      p1TimerValue = (p1Timer * 2) + 1;
      p1DutyIndex++;
      p1DutyIndex &= 0x7;
    }
    let output = dutyCycles[p1Duty][p1DutyIndex];
    if (output === 0 || p1SweepMuting || p1Counter === 0) {
      p1Output = 0;
    } else {
      p1Output = p1ConstantVolume ? p1Volume : p1Decay;
    }
  }

  function cyclePulse2() {
    if (p2TimerValue !== 0) {
      p2TimerValue--;
    } else {
      p2TimerValue = (p2Timer * 2) + 1;
      p2DutyIndex++;
      p2DutyIndex &= 0x7;
    }
    let output = dutyCycles[p2Duty][p2DutyIndex];
    if (output === 0 || p2SweepMuting || p2Counter === 0) {
      p2Output = 0;
    } else {
      p2Output = p2ConstantVolume ? p2Volume : p2Decay;
    }
  }

  function cycleTriangle() {
    if (triTimerValue !== 0) {
      triTimerValue--;
    } else {
      triTimerValue = triTimer;
      if (triCounter !== 0 && triLinearCounter !== 0) {
        triOutput = triangleSteps[triStepIndex++];
        if (triTimer < 2) {
          // ultrasonic
          triOutput = 7.5;
        }
        triStepIndex &= 0x1f;
      }
    }
  }

  function cycleNoise() {
    if (noiseTimerValue !== 0) {
      noiseTimerValue--;
    } else {
      noiseTimerValue = noiseTimer;
      let feedback = noiseShift & 0x1;
      if (noiseTonal) {
        feedback ^= (noiseShift & 0x40) >> 6;
      } else {
        feedback ^= (noiseShift & 0x2) >> 1;
      }
      noiseShift >>= 1;
      noiseShift |= feedback << 14;
    }
    if (noiseCounter === 0 || (noiseShift & 0x1) === 1) {
      noiseOutput = 0;
    } else {
      noiseOutput = (
        noiseConstantVolume ? noiseVolume : noiseDecay
      );
    }
  }

  function cycleDmc() {
    if (dmcTimerValue !== 0) {
      dmcTimerValue--;
    } else {
      dmcTimerValue = dmcTimer;
      if (!dmcSilent) {
        if ((dmcShifter & 0x1) === 0) {
          if (dmcOutput >= 2) {
            dmcOutput -= 2;
          }
        } else {
          if (dmcOutput <= 125) {
            dmcOutput += 2;
          }
        }
      }
      dmcShifter >>= 1;
      dmcBitsLeft--;
      if (dmcBitsLeft === 0) {
        dmcBitsLeft = 8;
        if (dmcSampleEmpty) {
          dmcSilent = true;
        } else {
          dmcSilent = false;
          dmcShifter = dmcSample;
          dmcSampleEmpty = true;
        }
      }
    }
    if (dmcBytesLeft > 0 && dmcSampleEmpty) {
      dmcSampleEmpty = false;
      dmcSample = read(dmcAddress);
      dmcAddress++;
      if (dmcAddress === 0x10000) {
        dmcAddress = 0x8000;
      }
      dmcBytesLeft--;
      if (dmcBytesLeft === 0 && dmcLoop) {
        dmcBytesLeft = dmcSampleLength;
        dmcAddress = dmcSampleAddress;
      } else if (dmcBytesLeft === 0 && dmcInterrupt) {
        dmcIrqWanted = true;
      }
    }
  }

  function updateSweepP1() {
    let change = p1Timer >> p1SweepShift;
    if (p1SweepNegate) {
      change = (-change) - 1;
    }
    p1SweepTarget = p1Timer + change;
    if (p1SweepTarget > 0x7ff || p1Timer < 8) {
      p1SweepMuting = true;
    } else {
      p1SweepMuting = false;
    }
  }

  function updateSweepP2() {
    let change = p2Timer >> p2SweepShift;
    if (p2SweepNegate) {
      change = (-change);
    }
    p2SweepTarget = p2Timer + change;
    if (p2SweepTarget > 0x7ff || p2Timer < 8) {
      p2SweepMuting = true;
    } else {
      p2SweepMuting = false;
    }
  }

  function clockQuarter() {
    // handle triangle linear counter
    if (triReloadLinear) {
      triLinearCounter = triLinearReload;
    } else if (triLinearCounter !== 0) {
      triLinearCounter--;
    }

    if (!triCounterHalt) {
      triReloadLinear = false;
    }

    // handle envelopes
    if (!p1EnvelopeStart) {
      if (p1EnvelopeCounter !== 0) {
        p1EnvelopeCounter--;
      } else {
        p1EnvelopeCounter = p1Volume;
        if (p1Decay !== 0) {
          p1Decay--;
        } else {
          if (p1CounterHalt) {
            p1Decay = 15;
          }
        }
      }
    } else {
      p1EnvelopeStart = false;
      p1Decay = 15;
      p1EnvelopeCounter = p1Volume;
    }

    if (!p2EnvelopeStart) {
      if (p2EnvelopeCounter !== 0) {
        p2EnvelopeCounter--;
      } else {
        p2EnvelopeCounter = p2Volume;
        if (p2Decay !== 0) {
          p2Decay--;
        } else {
          if (p2CounterHalt) {
            p2Decay = 15;
          }
        }
      }
    } else {
      p2EnvelopeStart = false;
      p2Decay = 15;
      p2EnvelopeCounter = p2Volume;
    }

    if (!noiseEnvelopeStart) {
      if (noiseEnvelopeCounter !== 0) {
        noiseEnvelopeCounter--;
      } else {
        noiseEnvelopeCounter = noiseVolume;
        if (noiseDecay !== 0) {
          noiseDecay--;
        } else {
          if (noiseCounterHalt) {
            noiseDecay = 15;
          }
        }
      }
    } else {
      noiseEnvelopeStart = false;
      noiseDecay = 15;
      noiseEnvelopeCounter = noiseVolume;
    }
  }

  function clockHalf() {
    // decrement length counters
    if (!p1CounterHalt && p1Counter !== 0) {
      p1Counter--;
    }

    if (!p2CounterHalt && p2Counter !== 0) {
      p2Counter--;
    }

    if (!triCounterHalt && triCounter !== 0) {
      triCounter--;
    }

    if (!noiseCounterHalt && noiseCounter !== 0) {
      noiseCounter--;
    }

    // handle sweeps
    if (
      p1SweepTimer === 0 && p1SweepEnabled &&
      !p1SweepMuting && p1SweepShift > 0
    ) {
      p1Timer = p1SweepTarget;
      updateSweepP1();
    }

    if (p1SweepTimer === 0 || p1SweepReload) {
      p1SweepTimer = p1SweepPeriod;
      p1SweepReload = false;
    } else {
      p1SweepTimer--;
    }

    if (
      p2SweepTimer === 0 && p2SweepEnabled &&
      !p2SweepMuting && p2SweepShift > 0
    ) {
      p2Timer = p2SweepTarget;
      updateSweepP2();
    }

    if (p2SweepTimer === 0 || p2SweepReload) {
      p2SweepTimer = p2SweepPeriod;
      p2SweepReload = false;
    } else {
      p2SweepTimer--;
    }
  }

  function mix() {
    // from https://wiki.nesdev.com/w/index.php/APU_Mixer
    let tnd = (
      0.00851 * triOutput +
      0.00494 * noiseOutput +
      0.00335 * dmcOutput
    );
    let pulse = 0.00752 * (p1Output + p2Output);
    return tnd + pulse;
  }

  function handleFrameCounter() {
    if (frameCounter === 7457) {
      clockQuarter();
    } else if (frameCounter === 14913) {
      clockQuarter();
      clockHalf();
    } else if (frameCounter === 22371) {
      clockQuarter();
    } else if (frameCounter === 29829 && !step5Mode) {
      clockQuarter();
      clockHalf();
      if (!interruptInhibit) {
        frameIrqWanted = true;
      }
    } else if (frameCounter === 37281) {
      clockQuarter();
      clockHalf();
    }
  }

  function getOutput() {
    let ret = [outputOffset, output];
    outputOffset = 0;
    return ret;
  }

  function getFlags() {
    let ret = 0;
    ret |= (p1Counter > 0) ? 0x1 : 0
    ret |= (p2Counter > 0) ? 0x2 : 0
    ret |= (triCounter > 0) ? 0x4 : 0
    ret |= (noiseCounter > 0) ? 0x8 : 0
    ret |= (dmcBytesLeft > 0) ? 0x10 : 0
    return ret;
  }

  function writeApu(adr, value) {
    if (adr === 0x4000) {
      p1Duty = (value & 0xc0) >> 6;
      p1Volume = value & 0xf;
      p1CounterHalt = (value & 0x20) > 0;
      p1ConstantVolume = (value & 0x10) > 0;
    } else if (adr === 0x4001) {
      p1SweepEnabled = (value & 0x80) > 0;
      p1SweepPeriod = (value & 0x70) >> 4;
      p1SweepNegate = (value & 0x08) > 0;
      p1SweepShift = value & 0x7;
      p1SweepReload = true;
      updateSweepP1();
    } else if (adr === 0x4002) {
      p1Timer &= 0x700;
      p1Timer |= value;
      updateSweepP1();
    } else if (adr === 0x4003) {
      p1Timer &= 0xff;
      p1Timer |= (value & 0x7) << 8;
      p1DutyIndex = 0;
      if (enablePulse1) {
        p1Counter = lengthLoadValues[(value & 0xf8) >> 3];
      }
      p1EnvelopeStart = true;
      updateSweepP1();
    } else if (adr === 0x4004) {
      p2Duty = (value & 0xc0) >> 6;
      p2Volume = value & 0xf;
      p2CounterHalt = (value & 0x20) > 0;
      p2ConstantVolume = (value & 0x10) > 0;
    } else if (adr === 0x4005) {
      p2SweepEnabled = (value & 0x80) > 0;
      p2SweepPeriod = (value & 0x70) >> 4;
      p2SweepNegate = (value & 0x08) > 0;
      p2SweepShift = value & 0x7;
      p2SweepReload = true;
      updateSweepP2();
    } else if (adr === 0x4006) {
      p2Timer &= 0x700;
      p2Timer |= value;
      updateSweepP2();
    } else if (adr === 0x4007) {
      p2Timer &= 0xff;
      p2Timer |= (value & 0x7) << 8;
      p2DutyIndex = 0;
      if (enablePulse2) {
        p2Counter = lengthLoadValues[(value & 0xf8) >> 3];
      }
      p2EnvelopeStart = true;
      updateSweepP2();
    } else if (adr === 0x4008) {
      triCounterHalt = (value & 0x80) > 0;
      triLinearReload = value & 0x7f;

      // looks like this is a mistake in the nesdev wiki?
      // http://forums.nesdev.com/viewtopic.php?f=3&t=13767#p163155
      // doesn't do this, neither does Mesen,
      // and doing it breaks Super Mario Bros. 2's triangle between notes

      // triReloadLinear = true;
    } else if (adr === 0x400a) {
      triTimer &= 0x700;
      triTimer |= value;
    } else if (adr === 0x400b) {
      triTimer &= 0xff;
      triTimer |= (value & 0x7) << 8;
      if (enableTriangle) {
        triCounter = lengthLoadValues[(value & 0xf8) >> 3];
      }
      triReloadLinear = true;
    } else if (adr === 0x400c) {
      noiseCounterHalt = (value & 0x20) > 0;
      noiseConstantVolume = (value & 0x10) > 0;
      noiseVolume = value & 0xf;
    } else if (adr === 0x400e) {
      noiseTonal = (value & 0x80) > 0;
      noiseTimer = noiseLoadValues[value & 0xf] - 1;
    } else if (adr === 0x400f) {
      if (enableNoise) {
        noiseCounter = lengthLoadValues[(value & 0xf8) >> 3];
      }
      noiseEnvelopeStart = true;
    } else if (adr === 0x4010) {
      dmcInterrupt = (value & 0x80) > 0;
      dmcLoop = (value & 0x40) > 0;
      dmcTimer = dmcLoadValues[value & 0xf] - 1;
      if (!dmcInterrupt) {
        dmcIrqWanted = false;
      }
    } else if (adr === 0x4011) {
      dmcOutput = value & 0x7f;
    } else if (adr === 0x4012) {
      dmcSampleAddress = 0xc000 | (value << 6);
    } else if (adr === 0x4013) {
      dmcSampleLength = (value << 4) + 1;
    } else if (adr === 0x4015) {
      enableNoise = (value & 0x08) > 0;
      enableTriangle = (value & 0x04) > 0;
      enablePulse2 = (value & 0x02) > 0;
      enablePulse1 = (value & 0x01) > 0;
      if (!enablePulse1) {
        p1Counter = 0;
      }
      if (!enablePulse2) {
        p2Counter = 0;
      }
      if (!enableTriangle) {
        triCounter = 0;
      }
      if (!enableNoise) {
        noiseCounter = 0;
      }
      if ((value & 0x10) > 0) {
        if (dmcBytesLeft === 0) {
          dmcBytesLeft = dmcSampleLength;
          dmcAddress = dmcSampleAddress;
        }
      } else {
        dmcBytesLeft = 0;
      }
      dmcIrqWanted = false;
    } else if (adr === 0x4017) {
      step5Mode = (value & 0x80) > 0;
      interruptInhibit = (value & 0x40) > 0;
      if (interruptInhibit) {
        frameIrqWanted = false;
      }
      frameCounter = 0;
      if (step5Mode) {
        clockQuarter();
        clockHalf();
      }
    }
  }
  // }

  return {
    runFrame,
    getSamples,
    getPixels,
    getBattery,
  };
}
