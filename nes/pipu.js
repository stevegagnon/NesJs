// from https://wiki.nesdev.com/w/index.php/PPU_palettes (savtool palette)
const nesPal = [
  [101, 101, 101], [0, 45, 105], [19, 31, 127], [60, 19, 124], [96, 11, 98], [115, 10, 55], [113, 15, 7], [90, 26, 0], [52, 40, 0], [11, 52, 0], [0, 60, 0], [0, 61, 16], [0, 56, 64], [0, 0, 0], [0, 0, 0], [0, 0, 0],
  [174, 174, 174], [15, 99, 179], [64, 81, 208], [120, 65, 204], [167, 54, 169], [192, 52, 112], [189, 60, 48], [159, 74, 0], [109, 92, 0], [54, 109, 0], [7, 119, 4], [0, 121, 61], [0, 114, 125], [0, 0, 0], [0, 0, 0], [0, 0, 0],
  [254, 254, 255], [93, 179, 255], [143, 161, 255], [200, 144, 255], [247, 133, 250], [255, 131, 192], [255, 139, 127], [239, 154, 73], [189, 172, 44], [133, 188, 47], [85, 199, 83], [60, 201, 140], [62, 194, 205], [78, 78, 78], [0, 0, 0], [0, 0, 0],
  [254, 254, 255], [188, 223, 255], [209, 216, 255], [232, 209, 255], [251, 205, 253], [255, 204, 229], [255, 207, 202], [248, 213, 180], [228, 220, 168], [204, 227, 169], [185, 232, 184], [174, 232, 208], [175, 229, 234], [182, 182, 182], [0, 0, 0], [0, 0, 0]
]

function Ppu(requestNmi, ppuWrite, ppuRead) {
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
  let t = 0; // temporary vram address
  let v = 0; // vram address
  let w = 0; // write flag
  let x = 0; // fine x scroll

  // dot position
  let line = 0;
  let dot = 0;
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

  function cycle() {
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
          v &= 0x7be0;
          v |= (t & 0x41f);
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
          requestNmi();
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
          v &= 0x7be0;
          v |= (t & 0x41f);
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
          v &= 0x41f;
          v |= (t & 0x7be0);
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
    let tileNum = readInternal(0x2000 + (v & 0xfff));

    atl = atr;
    let attAdr = 0x23c0;
    attAdr |= (v & 0x1c) >> 2;
    attAdr |= (v & 0x380) >> 4;
    attAdr |= (v & 0xc00);
    atr = readInternal(attAdr);
    if ((v & 0x40) > 0) {
      // bottom half
      atr >>= 4;
    }
    atr &= 0xf;
    if ((v & 0x02) > 0) {
      // right half
      atr >>= 2;
    }
    atr &= 0x3;

    let fineY = (v & 0x7000) >> 12;
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
      let shiftAmount = 15 - i - x;
      bgPixel = (tl >> shiftAmount) & 1;
      bgPixel |= ((th >> shiftAmount) & 1) << 1;
      let atrOff;
      if (x + i > 7) {
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
      if ((v & 0x3fff) >= 0x3f00) {
        finalColor = readPalette(v & 0x1f);
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

  function setFrame(finalArray) {
    for (let i = 0; i < pixelOutput.length; i++) {
      let color = pixelOutput[i];
      let r = nesPal[color & 0x3f][0];
      let g = nesPal[color & 0x3f][1];
      let b = nesPal[color & 0x3f][2];
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
      finalArray[i * 4] = r;
      finalArray[i * 4 + 1] = g;
      finalArray[i * 4 + 2] = b;
      finalArray[i * 4 + 3] = 255;
    }
  }

  // from https://wiki.nesdev.com/w/index.php/PPU_scrolling
  function incrementVx() {
    if ((v & 0x1f) === 0x1f) {
      v &= 0x7fe0;
      v ^= 0x400;
    } else {
      v++;
    }
  }
  function incrementVy() {
    if ((v & 0x7000) !== 0x7000) {
      v += 0x1000;
    } else {
      v &= 0xfff;
      let coarseY = (v & 0x3e0) >> 5;
      if (coarseY === 29) {
        coarseY = 0;
        v ^= 0x800;
      } else if (coarseY === 31) {
        coarseY = 0;
      } else {
        coarseY++;
      }
      v &= 0x7c1f;
      v |= (coarseY << 5);
    }
  }

  function readInternal(adr) {
    adr &= 0x3fff;
    return ppuRead(adr);
  }

  function writeInternal(adr, value) {
    adr &= 0x3fff;
    ppuWrite(adr, value);
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

  function read(adr) {
    switch (adr) {
      case 0: {
        // PPUCTRL
        return 0; // not readable
      }
      case 1: {
        // PPUMASK
        return 0; // not readable
      }
      case 2: {
        // PPUSTATUS
        w = 0;
        let ret = 0;
        if (inVblank) {
          ret |= 0x80;
          inVblank = false;
        }
        ret |= spriteZero ? 0x40 : 0;
        ret |= spriteOverflow ? 0x20 : 0;
        return ret;
      }
      case 3: {
        // OAMADDR
        return 0; // not readable
      }
      case 4: {
        // OAMDATA
        return oamRam[oamAddress];
      }
      case 5: {
        // PPUSCROLL
        return 0; // not readable
      }
      case 6: {
        // PPUADDR
        return 0; // not readable
      }
      case 7: {
        // PPUDATA
        let adr = v & 0x3fff;
        if (
          (bgRendering || sprRendering) &&
          (line < 240 || line === 261)
        ) {
          // while rendering, vram is incremented strangely
          incrementVy();
          incrementVx();
        } else {
          v += vramIncrement;
          v &= 0x7fff;
        }
        let temp = readBuffer;
        if (adr >= 0x3f00) {
          // read palette in temp
          temp = readPalette(adr);
        }
        readBuffer = readInternal(adr);
        return temp;
      }
    }
  }

  function write(adr, value) {
    switch (adr) {
      case 0: {
        // PPUCTRL
        t &= 0x73ff;
        t |= (value & 0x3) << 10;

        vramIncrement = (value & 0x04) > 0 ? 32 : 1;
        spritePatternBase = (value & 0x08) > 0 ? 0x1000 : 0;
        bgPatternBase = (value & 0x10) > 0 ? 0x1000 : 0;
        spriteHeight = (value & 0x20) > 0 ? 16 : 8;
        let oldNmi = generateNmi;
        // slave = (value & 0x40) > 0;
        generateNmi = (value & 0x80) > 0;

        if (generateNmi && !oldNmi && inVblank) {
          // immediate nmi if enabled during vblank
          requestNmi();
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
        if (w === 0) {
          t &= 0x7fe0;
          t |= (value & 0xf8) >> 3;
          x = value & 0x7;
          w = 1;
        } else {
          t &= 0x0c1f;
          t |= (value & 0x7) << 12;
          t |= (value & 0xf8) << 2;
          w = 0;
        }
        return;
      }
      case 6: {
        // PPUADDR
        if (w === 0) {
          t &= 0xff;
          t |= (value & 0x3f) << 8;
          w = 1;
        } else {
          t &= 0x7f00;
          t |= value;
          v = t;
          w = 0;
        }
        return;
      }
      case 7: {
        // PPUDATA
        let adr = v & 0x3fff;
        if (
          (bgRendering || sprRendering) &&
          (line < 240 || line === 261)
        ) {
          // while rendering, vram is incremented strangely
          incrementVy();
          incrementVx();
        } else {
          v += vramIncrement;
          v &= 0x7fff;
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

  function endOfFrame() {
    return line === 240 && dot === 0;
  }

  return {
    setFrame,
    write,
    cycle,
    endOfFrame,
    read,
  };
}
