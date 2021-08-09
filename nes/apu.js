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
]

function Apu(read, requestDmcIrq, requestFrameIrq) {
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

  function cycle() {
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
        requestDmcIrq();
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
        requestFrameIrq();
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
      ret |= (p1Counter > 0) ? 0x1 : 0;
      ret |= (p2Counter > 0) ? 0x2 : 0;
      ret |= (triCounter > 0) ? 0x4 : 0;
      ret |= (noiseCounter > 0) ? 0x8 : 0;
      ret |= (dmcBytesLeft > 0) ? 0x10 : 0;
      return ret;
  }

  function write(adr, value) {
    switch (adr) {
      case 0x4000: {
        p1Duty = (value & 0xc0) >> 6;
        p1Volume = value & 0xf;
        p1CounterHalt = (value & 0x20) > 0;
        p1ConstantVolume = (value & 0x10) > 0;
        break;
      }
      case 0x4001: {
        p1SweepEnabled = (value & 0x80) > 0;
        p1SweepPeriod = (value & 0x70) >> 4;
        p1SweepNegate = (value & 0x08) > 0;
        p1SweepShift = value & 0x7;
        p1SweepReload = true;
        updateSweepP1();
        break;
      }
      case 0x4002: {
        p1Timer &= 0x700;
        p1Timer |= value;
        updateSweepP1();
        break;
      }
      case 0x4003: {
        p1Timer &= 0xff;
        p1Timer |= (value & 0x7) << 8;
        p1DutyIndex = 0;
        if (enablePulse1) {
          p1Counter = lengthLoadValues[(value & 0xf8) >> 3];
        }
        p1EnvelopeStart = true;
        updateSweepP1();
        break;
      }
      case 0x4004: {
        p2Duty = (value & 0xc0) >> 6;
        p2Volume = value & 0xf;
        p2CounterHalt = (value & 0x20) > 0;
        p2ConstantVolume = (value & 0x10) > 0;
        break;
      }
      case 0x4005: {
        p2SweepEnabled = (value & 0x80) > 0;
        p2SweepPeriod = (value & 0x70) >> 4;
        p2SweepNegate = (value & 0x08) > 0;
        p2SweepShift = value & 0x7;
        p2SweepReload = true;
        updateSweepP2();
        break;
      }
      case 0x4006: {
        p2Timer &= 0x700;
        p2Timer |= value;
        updateSweepP2();
        break;
      }
      case 0x4007: {
        p2Timer &= 0xff;
        p2Timer |= (value & 0x7) << 8;
        p2DutyIndex = 0;
        if (enablePulse2) {
          p2Counter = lengthLoadValues[(value & 0xf8) >> 3];
        }
        p2EnvelopeStart = true;
        updateSweepP2();
        break;
      }
      case 0x4008: {
        triCounterHalt = (value & 0x80) > 0;
        triLinearReload = value & 0x7f;

        // looks like this is a mistake in the nesdev wiki?
        // http://forums.nesdev.com/viewtopic.php?f=3&t=13767#p163155
        // doesn't do this, neither does Mesen,
        // and doing it breaks Super Mario Bros. 2's triangle between notes

        // triReloadLinear = true;
        break;
      }
      case 0x400a: {
        triTimer &= 0x700;
        triTimer |= value;
        break;
      }
      case 0x400b: {
        triTimer &= 0xff;
        triTimer |= (value & 0x7) << 8;
        if (enableTriangle) {
          triCounter = lengthLoadValues[(value & 0xf8) >> 3];
        }
        triReloadLinear = true;
        break;
      }
      case 0x400c: {
        noiseCounterHalt = (value & 0x20) > 0;
        noiseConstantVolume = (value & 0x10) > 0;
        noiseVolume = value & 0xf;
        break;
      }
      case 0x400e: {
        noiseTonal = (value & 0x80) > 0;
        noiseTimer = noiseLoadValues[value & 0xf] - 1;
        break;
      }
      case 0x400f: {
        if (enableNoise) {
          noiseCounter = lengthLoadValues[(value & 0xf8) >> 3];
        }
        noiseEnvelopeStart = true;
        break;
      }
      case 0x4010: {
        dmcInterrupt = (value & 0x80) > 0;
        dmcLoop = (value & 0x40) > 0;
        dmcTimer = dmcLoadValues[value & 0xf] - 1;
        if (!dmcInterrupt) {
          requestDmcIrq(false);
        }
        break;
      }
      case 0x4011: {
        dmcOutput = value & 0x7f;
        break;
      }
      case 0x4012: {
        dmcSampleAddress = 0xc000 | (value << 6);
        break;
      }
      case 0x4013: {
        dmcSampleLength = (value << 4) + 1;
        break;
      }
      case 0x4015: {
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
        requestDmcIrq(false);
        break;
      }
      case 0x4017: {
        step5Mode = (value & 0x80) > 0;
        interruptInhibit = (value & 0x40) > 0;
        if (interruptInhibit) {
          requestFrameIrq(false);
        }
        frameCounter = 0;
        if (step5Mode) {
          clockQuarter();
          clockHalf();
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  return {
    write,
    cycle,
    getOutput,
    getFlags,
  };
}
