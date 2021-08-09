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

// read ? read(0xfffc) | (read(0xfffd) << 8) : 0

const Cpu = (read, write, initialPC = 0) => {
  // registers
  const r = new Uint8Array([0, 0, 0, 0xfd]);
  const br = new Uint16Array([initialPC]);

  // flags
  let n = false;
  let v = false;
  let d = false;
  let i = true;
  let z = false;
  let c = false;

  // interrupt wanted
  let irqWanted = false;
  let nmiWanted = false;

  // cycles left
  let cyclesLeft = 7;

  const cycle = () => {
    if (cyclesLeft === 0) {
      // read the instruction byte and get the info
      let instr = read(br[PC]++);
      let mode = addressingModes[instr];
      cyclesLeft = cycles[instr];
      // test for wanting an interrupt
      if (nmiWanted || (irqWanted && !i)) {
        // we want a interrupt, so push a special instuction type in instr
        br[PC]--;
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
  const getP = (bFlag) => {
    let value = 0;

    value |= n ? 0x80 : 0;
    value |= v ? 0x40 : 0;
    value |= d ? 0x08 : 0;
    value |= i ? 0x04 : 0;
    value |= z ? 0x02 : 0;
    value |= c ? 0x01 : 0;
    value |= 0x20; // bit 5 is always set
    value |= bFlag ? 0x10 : 0;

    return value;
  }

  // set the flags according to a P value
  const setP = (value) => {
    n = (value & 0x80) > 0;
    v = (value & 0x40) > 0;
    d = (value & 0x08) > 0;
    i = (value & 0x04) > 0;
    z = (value & 0x02) > 0;
    c = (value & 0x01) > 0;
  }

  // set Z (zero flag) and N (overflow flag) according to the value
  const setZandN = (value) => {
    value &= 0xff;
    z = value === 0;
    n = value > 0x7f;
  }

  // get a singed value (-128 - 127) out of a unsigned one (0 - 255)
  const getSigned = (value) => {
    if (value > 127) {
      return -(256 - value);
    }
    return value;
  }

  const doBranch = (test, rel) => {
    if (test) {
      // taken branch: 1 extra cycle
      cyclesLeft++;
      if ((br[PC] >> 8) !== ((br[PC] + rel) >> 8)) {
        // taken branch across page: another extra cycle
        cyclesLeft++;
      }
      br[PC] += rel;
    }
  }

  // after fetching the instruction byte, this gets the address to affect
  // pc is pointing to byte after instruction byte
  const getAdr = (mode) => {
    switch (mode) {
      case IMP: {
        // implied, wont use an address
        return 0;
      }
      case IMM: {
        // immediate
        return br[PC]++;
      }
      case ZP: {
        // zero page
        return read(br[PC]++);
      }
      case ZPX: {
        // zero page, indexed by x
        let adr = read(br[PC]++);
        return (adr + r[X]) & 0xff;
      }
      case ZPY: {
        // zero page, indexed by y
        let adr = read(br[PC]++);
        return (adr + r[Y]) & 0xff;
      }
      case IZX: {
        // zero page, indexed indirect by x
        let adr = (read(br[PC]++) + r[X]) & 0xff;
        return read(adr) | (read((adr + 1) & 0xff) << 8);
      }
      case IZY: {
        // zero page, indirect indexed by y (for RMW and writes)
        let adr = read(br[PC]++);
        let radr = read(adr) | (read((adr + 1) & 0xff) << 8);
        return (radr + r[Y]) & 0xffff;
      }
      case IZYr: {
        // zero page, indirect indexed by y (for reads)
        let adr = read(br[PC]++);
        let radr = read(adr) | (read((adr + 1) & 0xff) << 8);
        if ((radr >> 8) < ((radr + r[Y]) >> 8)) {
          cyclesLeft++;
        }
        return (radr + r[Y]) & 0xffff;
      }
      case ABS: {
        // absolute
        let adr = read(br[PC]++);
        adr |= (read(br[PC]++) << 8);
        return adr;
      }
      case ABX: {
        // absolute, indexed by x (for RMW and writes)
        let adr = read(br[PC]++);
        adr |= (read(br[PC]++) << 8);
        return (adr + r[X]) & 0xffff;
      }
      case ABXr: {
        // absolute, indexed by x (for reads)
        let adr = read(br[PC]++);
        adr |= (read(br[PC]++) << 8);
        if ((adr >> 8) < ((adr + r[X]) >> 8)) {
          cyclesLeft++;
        }
        return (adr + r[X]) & 0xffff;
      }
      case ABY: {
        // absolute, indexed by y (for RMW and writes)
        let adr = read(br[PC]++);
        adr |= (read(br[PC]++) << 8);
        return (adr + r[Y]) & 0xffff;
      }
      case ABYr: {
        // absolute, indexed by y (for reads)
        let adr = read(br[PC]++);
        adr |= (read(br[PC]++) << 8);
        if ((adr >> 8) < ((adr + r[Y]) >> 8)) {
          cyclesLeft++;
        }
        return (adr + r[Y]) & 0xffff;
      }
      case IND: {
        // indirect, doesn't loop pages properly
        let adrl = read(br[PC]++);
        let adrh = read(br[PC]++);
        let radr = read(adrl | (adrh << 8));
        radr |= (read(((adrl + 1) & 0xff) | (adrh << 8))) << 8;
        return radr;
      }
      case REL: {
        // relative to PC, for branches
        let rel = read(br[PC]++);
        return getSigned(rel);
      }
    }
  }

  // instruction functions

  const uni = (adr, num) => {
    // unimplemented instruction
    log("unimplemented instruction " + mem.getByteRep(num));
  }

  const ora = (adr) => {
    // ORs A with the value, set Z and N
    r[A] |= read(adr);
    setZandN(r[A]);
  }

  const and = (adr) => {
    // ANDs A with the value, set Z and N
    r[A] &= read(adr);
    setZandN(r[A]);
  }

  const eor = (adr) => {
    // XORs A with the value, set Z and N
    r[A] ^= read(adr);
    setZandN(r[A]);
  }

  const adc = (adr) => {
    // adds the value + C to A, set C, V, Z and N
    let value = read(adr);
    let result = r[A] + value + (c ? 1 : 0);
    c = result > 0xff;
    v = (
      (r[A] & 0x80) === (value & 0x80) &&
      (value & 0x80) !== (result & 0x80)
    );
    r[A] = result;
    setZandN(r[A]);
  }

  const sbc = (adr) => {
    // subtracts the value + !C from A, set C, V, Z and N
    let value = read(adr) ^ 0xff;
    let result = r[A] + value + (c ? 1 : 0);
    c = result > 0xff;
    v = (
      (r[A] & 0x80) === (value & 0x80) &&
      (value & 0x80) !== (result & 0x80)
    );
    r[A] = result;
    setZandN(r[A]);
  }

  const cmp = (adr) => {
    // sets C, Z and N according to what A - value would do
    let value = read(adr) ^ 0xff;
    let result = r[A] + value + 1;
    c = result > 0xff;
    setZandN(result & 0xff);
  }

  const cpx = (adr) => {
    // sets C, Z and N according to what X - value would do
    let value = read(adr) ^ 0xff;
    let result = r[X] + value + 1;
    c = result > 0xff;
    setZandN(result & 0xff);
  }

  const cpy = (adr) => {
    // sets C, Z and N according to what Y - value would do
    let value = read(adr) ^ 0xff;
    let result = r[Y] + value + 1;
    c = result > 0xff;
    setZandN(result & 0xff);
  }

  const dec = (adr) => {
    // decrements a memory location, set Z and N
    let result = (read(adr) - 1) & 0xff;
    setZandN(result);
    write(adr, result);
  }

  const dex = (adr) => {
    // decrements X, set Z and N
    r[X]--;
    setZandN(r[X]);
  }

  const dey = (adr) => {
    // decrements Y, set Z and N
    r[Y]--;
    setZandN(r[Y]);
  }

  const inc = (adr) => {
    // increments a memory location, set Z and N
    let result = (read(adr) + 1) & 0xff;
    setZandN(result);
    write(adr, result);
  }

  const inx = (adr) => {
    // increments X, set Z and N
    r[X]++;
    setZandN(r[X]);
  }

  const iny = (adr) => {
    // increments Y, set Z and N
    r[Y]++;
    setZandN(r[Y]);
  }

  const asla = (adr) => {
    // shifts A left 1, set C, Z and N
    let result = r[A] << 1;
    c = result > 0xff;
    setZandN(result);
    r[A] = result;
  }

  const asl = (adr) => {
    // shifts a memory location left 1, set C, Z and N
    let result = read(adr) << 1;
    c = result > 0xff;
    setZandN(result);
    write(adr, result);
  }

  const rola = (adr) => {
    // rolls A left 1, rolls C in, set C, Z and N
    let result = (r[A] << 1) | (c ? 1 : 0);
    c = result > 0xff;
    setZandN(result);
    r[A] = result;
  }

  const rol = (adr) => {
    // rolls a memory location left 1, rolls C in, set C, Z and N
    let result = (read(adr) << 1) | (c ? 1 : 0);
    c = result > 0xff;
    setZandN(result);
    write(adr, result);
  }

  const lsra = (adr) => {
    // shifts A right 1, set C, Z and N
    let carry = r[A] & 0x1;
    let result = r[A] >> 1;
    c = carry > 0;
    setZandN(result);
    r[A] = result;
  }

  const lsr = (adr) => {
    // shifts a memory location right 1, set C, Z and N
    let value = read(adr);
    let carry = value & 0x1;
    let result = value >> 1;
    c = carry > 0;
    setZandN(result);
    write(adr, result);
  }

  const rora = (adr) => {
    // rolls A right 1, rolls C in, set C, Z and N
    let carry = r[A] & 0x1;
    let result = (r[A] >> 1) | ((c ? 1 : 0) << 7);
    c = carry > 0;
    setZandN(result);
    r[A] = result;
  }

  const ror = (adr) => {
    // rolls a memory location right 1, rolls C in, set C, Z and N
    let value = read(adr);
    let carry = value & 0x1;
    let result = (value >> 1) | ((c ? 1 : 0) << 7);
    c = carry > 0;
    setZandN(result);
    write(adr, result);
  }

  const lda = (adr) => {
    // loads a value in a, sets Z and N
    r[A] = read(adr);
    setZandN(r[A]);
  }

  const sta = (adr) => {
    // stores a to a memory location
    write(adr, r[A]);
  }

  const ldx = (adr) => {
    // loads x value in a, sets Z and N
    r[X] = read(adr);
    setZandN(r[X]);
  }

  const stx = (adr) => {
    // stores x to a memory location
    write(adr, r[X]);
  }

  const ldy = (adr) => {
    // loads a value in y, sets Z and N
    r[Y] = read(adr);
    setZandN(r[Y]);
  }

  const sty = (adr) => {
    // stores y to a memory location
    write(adr, r[Y]);
  }

  const tax = (adr) => {
    // transfers a to x, sets Z and N
    r[X] = r[A];
    setZandN(r[X]);
  }

  const txa = (adr) => {
    // transfers x to a, sets Z and N
    r[A] = r[X];
    setZandN(r[A]);
  }

  const tay = (adr) => {
    // transfers a to y, sets Z and N
    r[Y] = r[A];
    setZandN(r[Y]);
  }

  const tya = (adr) => {
    // transfers y to a, sets Z and N
    r[A] = r[Y];
    setZandN(r[A]);
  }

  const tsx = (adr) => {
    // transfers the stack pointer to x, sets Z and N
    r[X] = r[SP];
    setZandN(r[X]);
  }

  const txs = (adr) => {
    // transfers x to the stack pointer
    r[SP] = r[X];
  }

  const pla = (adr) => {
    // pulls a from the stack, sets Z and N
    r[A] = read(0x100 + ((++r[SP]) & 0xff));
    setZandN(r[A]);
  }

  const pha = (adr) => {
    // pushes a to the stack
    write(0x100 + r[SP]--, r[A]);
  }

  const plp = (adr) => {
    // pulls the flags from the stack
    setP(read(0x100 + ((++r[SP]) & 0xff)));
  }

  const php = (adr) => {
    // pushes the flags to the stack
    write(0x100 + r[SP]--, getP(true));
  }

  const bpl = (adr) => {
    // branches if N is 0
    doBranch(!n, adr);
  }

  const bmi = (adr) => {
    // branches if N is 1
    doBranch(n, adr);
  }

  const bvc = (adr) => {
    // branches if V is 0
    doBranch(!v, adr);
  }

  const bvs = (adr) => {
    // branches if V is 1
    doBranch(v, adr);
  }

  const bcc = (adr) => {
    // branches if C is 0
    doBranch(!c, adr);
  }

  const bcs = (adr) => {
    // branches if C is 1
    doBranch(c, adr);
  }

  const bne = (adr) => {
    // branches if Z is 0
    doBranch(!z, adr);
  }

  const beq = (adr) => {
    // branches if Z is 1
    doBranch(z, adr);
  }

  const brk = (adr) => {
    // break to irq handler
    let pushPc = (br[PC] + 1) & 0xffff;
    write(0x100 + r[SP]--, pushPc >> 8);
    write(0x100 + r[SP]--, pushPc & 0xff);
    write(0x100 + r[SP]--, getP(true));
    i = true;
    br[PC] = read(0xfffe) | (read(0xffff) << 8);
  }

  const rti = (adr) => {
    // return from interrupt
    setP(read(0x100 + ((++r[SP]) & 0xff)));
    let pullPc = read(0x100 + ((++r[SP]) & 0xff));
    pullPc |= (read(0x100 + ((++r[SP]) & 0xff)) << 8);
    br[PC] = pullPc;
  }

  const jsr = (adr) => {
    // jump to subroutine
    let pushPc = (br[PC] - 1) & 0xffff;
    write(0x100 + r[SP]--, pushPc >> 8);
    write(0x100 + r[SP]--, pushPc & 0xff);
    br[PC] = adr;
  }

  const rts = (adr) => {
    // return from subroutine
    let pullPc = read(0x100 + ((++r[SP]) & 0xff));
    pullPc |= (read(0x100 + ((++r[SP]) & 0xff)) << 8);
    br[PC] = pullPc + 1;
  }

  const jmp = (adr) => {
    // jump to address
    br[PC] = adr;
  }

  const bit = (adr) => {
    // bit test A with value, set N to b7, V to b6 and Z to result
    let value = read(adr);
    n = (value & 0x80) > 0;
    v = (value & 0x40) > 0;
    let res = r[A] & value;
    z = res === 0;
  }

  const clc = (adr) => {
    // clear carry flag
    c = false;
  }

  const sec = (adr) => {
    // set carry flag
    c = true;
  }

  const cld = (adr) => {
    // clear decimal flag
    d = false;
  }

  const sed = (adr) => {
    // set decimal flag
    d = true;
  }

  const cli = (adr) => {
    // clear interrupt flag
    i = false;
  }

  const sei = (adr) => {
    // set interrupt flag
    i = true;
  }

  const clv = (adr) => {
    // clear overflow flag
    v = false;
  }

  const nop = (adr) => {
    // no operation
  }

  const irq = (adr) => {
    // handle irq interrupt
    let pushPc = br[PC];
    write(0x100 + r[SP]--, pushPc >> 8);
    write(0x100 + r[SP]--, pushPc & 0xff);
    write(0x100 + r[SP]--, getP(false));
    i = true;
    br[PC] = read(0xfffe) | (read(0xffff) << 8);
  }

  const nmi = (adr) => {
    // handle nmi interrupt
    let pushPc = br[PC];
    write(0x100 + r[SP]--, pushPc >> 8);
    write(0x100 + r[SP]--, pushPc & 0xff);
    write(0x100 + r[SP]--, getP(false));
    i = true;
    br[PC] = read(0xfffa) | (read(0xfffb) << 8);
  }

  // undocumented opcodes

  const kil = (adr) => {
    // stopts the cpu
    br[PC]--;
  }

  const slo = (adr) => {
    // shifts a memory location left 1, ORs a with the result, sets N, Z and C
    let result = read(adr) << 1;
    c = result > 0xff;
    write(adr, result);
    r[A] |= result;
    setZandN(r[A]);
  }

  const rla = (adr) => {
    // rolls a memory location left 1, ANDs a with the result, sets N, Z and C
    let result = (read(adr) << 1) | (c ? 1 : 0);
    c = result > 0xff;
    write(adr, result);
    r[A] &= result;
    setZandN(r[A]);
  }

  const sre = (adr) => {
    // shifts a memory location right 1, XORs A with the result, sets N, Z and C
    let value = read(adr);
    let carry = value & 0x1;
    let result = value >> 1;
    c = carry > 0;
    write(adr, result);
    r[A] ^= result;
    setZandN(r[A]);
  }

  const rra = (adr) => {
    // rolls a memory location right 1, adds the result to A, sets N, Z, C and V
    let value = read(adr);
    let carry = value & 0x1;
    let result = (value >> 1) | ((c ? 1 : 0) << 7);
    write(adr, result);
    let addResult = r[A] + result + carry;
    c = addResult > 0xff;
    v = (
      (r[A] & 0x80) === (result & 0x80) &&
      (result & 0x80) !== (addResult & 0x80)
    );
    r[A] = addResult;
    setZandN(r[A]);
  }

  const sax = (adr) => {
    // stores A ANDed with X to a memory location
    write(adr, r[A] & r[X]);
  }

  const lax = (adr) => {
    // loads A and X with a value
    r[A] = read(adr);
    r[X] = r[A];
    setZandN(r[X]);
  }

  const dcp = (adr) => {
    // decrement a memory location, and sets C, Z and N to what A - result does
    let value = (read(adr) - 1) & 0xff;
    write(adr, value);
    value ^= 0xff;
    let result = r[A] + value + 1;
    c = result > 0xff;
    setZandN(result & 0xff);
  }

  const isc = (adr) => {
    // increments a memory location, and subtract it+!C from A, sets Z, N, V, C
    let value = (read(adr) + 1) & 0xff;
    write(adr, value);
    value ^= 0xff;
    let result = r[A] + value + (c ? 1 : 0);
    c = result > 0xff;
    v = (
      (r[A] & 0x80) === (value & 0x80) &&
      (value & 0x80) !== (result & 0x80)
    );
    r[A] = result;
    setZandN(r[A]);
  }

  const anc = (adr) => {
    // ANDs a with the value, sets Z and N, then sets C to N
    r[A] &= read(adr);
    setZandN(r[A]);
    c = n;
  }

  const alr = (adr) => {
    // ANDs a with the value, then shifts A right 1, sets C, Z and N
    r[A] &= read(adr);
    let carry = r[A] & 0x1;
    let result = r[A] >> 1;
    c = carry > 0;
    setZandN(result);
    r[A] = result;
  }

  const arr = (adr) => {
    // ANDs a with the value, then rolls A right 1, sets Z, N, C and V oddly
    r[A] &= read(adr);
    let result = (r[A] >> 1) | ((c ? 1 : 0) << 7);
    setZandN(result);
    c = (result & 0x40) > 0;
    v = ((result & 0x40) ^ ((result & 0x20) << 1)) > 0;
    r[A] = result;
  }

  const axs = (adr) => {
    // sets X to A ANDed with X minus the value, sets N, Z and C
    let value = read(adr) ^ 0xff;
    let andedA = r[A] & r[X];
    let result = andedA + value + 1;
    c = result > 0xff;
    r[X] = result;
    setZandN(r[X]);
  }

  // const table
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

  const requestNmi = (wanted = true) => {
    nmiWanted = wanted;
  }

  const requestIrq = (wanted = true) => {
    irqWanted = wanted;
  }

  const getPC = () => {
    return br[PC];
  }

  return {
    requestNmi,
    requestIrq,
    cycle,
    getPC,
  };
}
