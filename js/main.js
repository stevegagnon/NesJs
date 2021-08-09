
let nes;
let audioHandler = new AudioHandler();
let paused = false;
let loaded = false;
let pausedInBg = false;
let loopId = 0;
let loadedName = "";
let currentControl1State = 0;
let currentControl2State = 0;

let c = el("output");
c.width = 256;
c.height = 240;
let ctx = c.getContext("2d");
let imgData = ctx.createImageData(256, 240);

const INPUT = {
  A: 0,
  B: 1,
  SELECT: 2,
  START: 3,
  UP: 4,
  DOWN: 5,
  LEFT: 6,
  RIGHT: 7
}


let controlsP1 = {
  arrowright: INPUT.RIGHT,
  arrowleft: INPUT.LEFT,
  arrowdown: INPUT.DOWN,
  arrowup: INPUT.UP,
  enter: INPUT.START,
  shift: INPUT.SELECT,
  a: INPUT.B,
  z: INPUT.A
}
let controlsP2 = {
  l: INPUT.RIGHT,
  j: INPUT.LEFT,
  k: INPUT.DOWN,
  i: INPUT.UP,
  p: INPUT.START,
  o: INPUT.SELECT,
  t: INPUT.B,
  g: INPUT.A
}

zip.workerScriptsPath = "lib/";
zip.useWebWorkers = false;

el("rom").onchange = function (e) {
  audioHandler.resume();
  let freader = new FileReader();
  freader.onload = function () {
    let buf = freader.result;
    if (e.target.files[0].name.slice(-4) === ".zip") {
      // use zip.js to read the zip
      let blob = new Blob([buf]);
      zip.createReader(new zip.BlobReader(blob), function (reader) {
        reader.getEntries(function (entries) {
          if (entries.length) {
            let found = false;
            for (let i = 0; i < entries.length; i++) {
              let name = entries[i].filename;
              if (name.slice(-4) !== ".nes" && name.slice(-4) !== ".NES") {
                continue;
              }
              found = true;
              log("Loaded \"" + name + "\" from zip");
              entries[i].getData(new zip.BlobWriter(), function (blob) {
                let breader = new FileReader();
                breader.onload = function () {
                  let rbuf = breader.result;
                  let arr = new Uint8Array(rbuf);
                  loadRom(arr, name);
                  reader.close(function () { });
                }
                breader.readAsArrayBuffer(blob);
              }, function (curr, total) { });
              break;
            }
            if (!found) {
              log("No .nes file found in zip");
            }
          } else {
            log("Zip file was empty");
          }
        });
      }, function (err) {
        log("Failed to read zip: " + err);
      });
    } else {
      // load rom normally
      let parts = e.target.value.split("\\");
      let name = parts[parts.length - 1];
      let arr = new Uint8Array(buf);
      loadRom(arr, name);
    }
  }
  freader.readAsArrayBuffer(e.target.files[0]);
}

el("pause").onclick = function (e) {
  if (paused && loaded) {
    loopId = requestAnimationFrame(update);
    audioHandler.start();
    paused = false;
    el("pause").innerText = "Pause";
  } else {
    cancelAnimationFrame(loopId);
    audioHandler.stop();
    paused = true;
    el("pause").innerText = "Unpause";
  }
}

el("runframe").onclick = function (e) {
  if (loaded) {
    runFrame();
  }
}

document.onvisibilitychange = function (e) {
  if (document.hidden) {
    pausedInBg = false;
    if (!paused && loaded) {
      el("pause").click();
      pausedInBg = true;
    }
  } else {
    if (pausedInBg && loaded) {
      el("pause").click();
      pausedInBg = false;
    }
  }
}

window.onpagehide = function (e) {
  saveBatteryForRom();
}

function loadRom(rom, name) {
  saveBatteryForRom();
  let data = localStorage.getItem(name + "_battery");
  const battery = data ? JSON.parse(data) : null;
  nes = Nes(rom, battery, log);
  if (nes) {
    if (!loaded && !paused) {
      loopId = requestAnimationFrame(update);
      audioHandler.start();
    }
    loaded = true;
    loadedName = name;
  }
}

function saveBatteryForRom() {
  // save the loadedName's battery data
  if (loaded) {
    let data = nes.getBattery();
    if (data) {
      try {
        localStorage.setItem(loadedName + "_battery", JSON.stringify(data));
        log("Saved battery");
      } catch (e) {
        log("Failed to save battery: " + e);
      }
    }
  }
}

function update() {
  runFrame();
  loopId = requestAnimationFrame(update);
}

function runFrame() {
  nes.runFrame(currentControl1State, currentControl2State);
  nes.getSamples(audioHandler.sampleBuffer, audioHandler.samplesPerFrame);
  audioHandler.nextBuffer();
  nes.getPixels(imgData.data);
  ctx.putImageData(imgData, 0, 0);
}

function log(text) {
  el("log").innerHTML += text + "<br>";
  el("log").scrollTop = el("log").scrollHeight;
}

function el(id) {
  return document.getElementById(id);
}

window.onkeydown = function (e) {
  if (controlsP1[e.key.toLowerCase()] !== undefined) {
    setButtonPressed(1, controlsP1[e.key.toLowerCase()]);
    e.preventDefault();
  }
  if (controlsP2[e.key.toLowerCase()] !== undefined) {
    setButtonPressed(2, controlsP2[e.key.toLowerCase()]);
    e.preventDefault();
  }
}

window.onkeyup = function (e) {
  if (controlsP1[e.key.toLowerCase()] !== undefined) {
    setButtonReleased(1, controlsP1[e.key.toLowerCase()]);
    e.preventDefault();
  }
  if (controlsP2[e.key.toLowerCase()] !== undefined) {
    setButtonReleased(2, controlsP2[e.key.toLowerCase()]);
    e.preventDefault();
  }
}



// get controls in
const setButtonPressed = (player, button) => {
  if (player === 1) {
    currentControl1State |= (1 << button);
  } else if (player === 2) {
    currentControl2State |= (1 << button);
  }
}

const setButtonReleased = (player, button) => {
  if (player === 1) {
    currentControl1State &= (~(1 << button)) & 0xff;
  } else if (player === 2) {
    currentControl2State &= (~(1 << button)) & 0xff;
  }
}