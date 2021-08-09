
const Nes = (rom, battery, log) => {
  // ram
  let ram = new Uint8Array(0x800);

  let cpu;
  let ppu;
  let apu;

  // cycle timer, to sync cpu/ppu
  let cycles = 0;

  // oam dma
  let inDma = false;
  let dmaTimer = 0;
  let dmaBase = 0;
  let dmaValue = 0;

  // controllers
  let latchedControl1State = 0;
  let latchedControl2State = 0;
  let controllerLatched = false;

  // irq sources
  let mapperIrqWanted = false;
  let frameIrqWanted = false;
  let dmcIrqWanted = false;

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

  const parseHeader = (rom) => {
    let o = {
      banks: rom[4],
      chrBanks: rom[5],
      mapper: (rom[6] >> 4) | (rom[7] & 0xf0),
      verticalMirroring: (rom[6] & 0x01) > 0,
      battery: (rom[6] & 0x02) > 0,
      trainer: (rom[6] & 0x04) > 0,
      fourScreen: (rom[6] & 0x08) > 0,
    };
    o["base"] = 16 + (o.trainer ? 512 : 0);
    o["chrBase"] = o.base + 0x4000 * o.banks;
    o["prgAnd"] = (o.banks * 0x4000) - 1;
    o["chrAnd"] = o.chrBanks === 0 ? 0x1fff : (o.chrBanks * 0x2000) - 1;
    o["saveVars"] = [
      "banks", "chrBanks", "mapper", "verticalMirroring", "battery", "trainer",
      "fourScreen"
    ];
    return o;
  }

  const getPixels = (data) => {
    ppu.setFrame(data);
  }

  const getSamples = (data, count) => {
    // apu returns 29780 or 29781 samples (0 - 1) for a frame
    // we need count values (0 - 1)
    let samples = apu.getOutput();
    let runAdd = (29780 / count);
    let total = 0;
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

  const cycle = (currentControl1State, currentControl2State) => {
    if (cycles === 0) {
      cycles = 3;
      // do a cpu and apu cycle every 3 ppu cycles

      // handle controller latch
      if (controllerLatched) {
        latchedControl1State = currentControl1State;
        latchedControl2State = currentControl2State;
      }

      // handle irq
      if (mapperIrqWanted || frameIrqWanted || dmcIrqWanted) {
        cpu.requestIrq();
      } else {
        cpu.requestIrq(false);
      }

      if (!inDma) {
        cpu.cycle();
      } else {
        // handle dma
        if (dmaTimer > 0) {
          if ((dmaTimer & 1) === 0) {
            // even cycles are write to ppu
            ppu.write(4, dmaValue);
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

      apu.cycle();
    }
    ppu.cycle();
    cycles--;
  }

  const runFrame = (currentControl1State, currentControl2State) => {
    do {
      cycle(currentControl1State, currentControl2State)
    } while (!ppu.endOfFrame());
  }

  // cpu read
  const read = (adr) => {
    adr &= 0xffff;

    if (adr < 0x2000) {
      // ram
      return ram[adr & 0x7ff];
    } else if (adr < 0x4000) {
      // ppu ports
      return ppu.read(adr & 0x7);
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
        const flags = apu.getFlags();
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
  const write = (adr, value) => {
    adr &= 0xffff;

    if (adr < 0x2000) {
      // ram
      ram[adr & 0x7ff] = value;
      return;
    }
    if (adr < 0x4000) {
      // ppu ports
      ppu.write(adr & 0x7, value);
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
      apu.write(adr, value);
      return;
    }
    mapper.write(adr, value);
  }

  // save states, battery saves
  const getBattery = () => {
    if (mapper.h.battery) {
      return { data: mapper.getBattery() };
    }
    return undefined;
  }
  
  let header = parseHeader(rom);

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
    } catch (e) {
      log("Rom load error: " + e);
      return false;
    }
  }

  console.log(mapper);

  log(
    "Loaded " + mapper.name + " rom: " + mapper.h.banks +
    " PRG bank(s), " + mapper.h.chrBanks + " CHR bank(s)"
  );

  if (mapper.h.battery && battery) {
    return mapper.setBattery(battery);
  }

  function requestDmcIrq(requested = true) {
    dmcIrqWanted = requested;
  }

  function requestFrameIrq(requested = true) {
    frameIrqWanted = requested;
  }

  cpu = Cpu(read, write, read(0xfffc) | (read(0xfffd) << 8));
  ppu = Ppu(cpu.requestNmi, (adr, val) => mapper.ppuWrite(adr, val), adr => mapper.ppuRead(adr));
  apu = Apu(read, requestDmcIrq, requestFrameIrq);

  return {
    runFrame,
    getSamples,
    getPixels,
    getBattery,
  };
}
