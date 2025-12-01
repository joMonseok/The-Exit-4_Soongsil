let engineInstance = null;

//시작 좌표
let startX = 25.5;
let startY = 36.5;

let currentScene = 'title';

let doorOpenSound;
let bgm;
let walkSound;

//걸음 소리 관련 변수
let lastStepTime = 0;
let stepInterval = 400;
let walkState = 0;

let chkAnomalyNum = 0;
let anomalyState = false;

//아저씨 관련
let misterLeftImage = [];
let misterRightImage = [];
let misterFrontImage = [];
let misterBackImage = [];
let misterWalk = 0;
let lastStepMisterTime = 0;
let toUser = false;

//이상현상 관련
let misterState = false;

//최대 출구까지 수
const MaxAnomalyNum = 4;

const myWorker = new Worker("worker.js");

//좌표 정보
const ENDING_BLOCK_X = 11;
const ENDING_BLOCK_Y = 15;

const POSTER_X = 10;
const POSTER_1_Y = 12;
const POSTER_2_Y = 14;
const POSTER_3_Y = 16;
const POSTER_4_Y = 18;
const POSTER_5_Y = 20;

const DOOR_X = 14;
const DOOR_Y = 20;
const OPEN_DOOR_EVENT_X = 11;
const OPEN_DOOR_EVENT_Y = 14;

const HELP_BTN = {
  r: 6,   // 반지름
  marginX: 24,
  marginY: 20
};

//플레이어 및 맵 기본 정보와 벽 데이터 불러오기
function preload() {
  // Create FullEngine instance early so its preload() can call loadImage in the p5 preload phase.
  if (!window.FullEngine) {
    console.error(
      "FullEngine class not found (engine.js must be loaded before main.js)"
    );
    return;
  }
  // Build config (map, player, assets) here in main and pass to engine
  const config = window.ENGINE_CONFIG
    ? Object.assign({}, window.ENGINE_CONFIG)
    : {};
  // create or copy a world map here (prefer user-provided, otherwise copy any existing global map)

  if (!config.worldMap) {
    if (window.worldMap && Array.isArray(window.worldMap)) {
      config.worldMap = window.worldMap.map((r) => r.slice());
    } else {
      // fallback small sample map
      config.worldMap = basicMap.map((r) => r.slice());
    }
  }

  config.assets = config.assets || assets.slice();
  // mirror to global for compatibility
  try {
    window.ENGINE_ASSETS = config.assets.slice();
  } catch (e) {}

  // If user didn't provide player config, create default here
  config.player = config.player || {
    x: startX,
    y: startY,
    rot: radians(180),
    moveSpeed: 0.1,
    rotSpeed: (3 * Math.PI) / 180,
  };
  //config.player = config.player || { x: 2, y: 2, rot: 300, moveSpeed: 0.1, rotSpeed: 3 * Math.PI / 180 };
  engineInstance = new FullEngine(config);
  window.engine = engineInstance;
  // call engine preload to load assets via p5.loadImage
  if (typeof engineInstance.preload === "function") engineInstance.preload();

  doorOpenSound = loadSound("assets/door_open_sound.mp3");
  bgm = loadSound("assets/bgm.wav");
  walkSound = loadSound("assets/walk.wav");

  misterLeftImage[0] = loadImage("assets/misterLeftOne.png");
  misterRightImage[0] = loadImage("assets/misterRightOne.png");
  misterBackImage[0] = loadImage("assets/misterFrontOne.png");
  misterFrontImage[0] = loadImage("assets/misterBackOne.png");
  misterLeftImage[1] = loadImage("assets/misterLeftTwo.png");
  misterRightImage[1] = loadImage("assets/misterRightTwo.png");
  misterBackImage[1] = loadImage("assets/misterFrontTwo.png");
  misterFrontImage[1] = loadImage("assets/misterBackTwo.png");
}

//엔진이 가져와졌는지 체크
function setup() {
  if (!engineInstance) return;
  if (typeof engineInstance.setup === "function") engineInstance.setup();

  if (typeof engineInstance.enableKeyboard === "function")
    engineInstance.enableKeyboard();
  bgm.setLoop(true);
  bgm.play();
  makeBasicMap();
  engineInstance.setWorldMap(basicMap);
}

let data = null;
let now = 0;

function draw() {
    if (!engineInstance) return;

    if (currentScene === 'guide') {
        guideScreen()
        return;
    }

    if (currentScene === 'title') {
        startScreen()
        return;
    }

    if(currentScene === 'end') {
        endScreen(
            () => { currentScene = 'title' }
        );
        return;
    }
    now = millis();

    if (misterState === true) {
      updateMister();
    }
    if (walkState > 0) {
      if (now - lastStepTime > stepInterval) {
        walkSound.play();
        lastStepTime = now;
      }
    }

    data = engineInstance.Go();

    let blockData = engineInstance.getPlayerBlock();
    blockEvents(blockData);
}

function setEventBlock(x, y, eventNum) {
  basicMap[y][x] = -1 * eventNum;
}

let chkI = 0;
let chkOldBlock = 0;
async function blockEvents(blockData) {
  if (!engineInstance) return;
  if (chkOldBlock == blockData) return;
  chkOldBlock = blockData;
  if (blockData != 0) {
    blockData *= -1;

    if (blockData < 10) {
      setMister(false, false);
      //이동 이벤트
      let x = engineInstance.getPlayerLocX();
      let y = engineInstance.getPlayerLocY();
      let rot = engineInstance.getPlayerRot();

      switch (blockData) {
        case GO_STRAIGHT_EVENT:
          if (anomalyState === true) chkAnomalyNum = 0;
          else if (anomalyState === false) chkAnomalyNum++;
          x += 17;
          y += 27;
          break;
        case GO_BACK_EVENT:
          if (anomalyState === true) chkAnomalyNum++;
          else if (anomalyState === false) chkAnomalyNum = 0;
          x -= 3;
          y = startY - y + startY;
          rot -= radians(180);
          break;
      }


      if (chkEndingInit(chkAnomalyNum)) {
        makeEndingMap();
        setMister(false);
      } else {
        makeRandomAnomalyMap();
      }

      setExitSignBlock();

      engineInstance.setWorldMap(basicMap);
      engineInstance.setPlayerLoc(x, y);
      engineInstance.setPlayerRot(rot);
    } else if (blockData < 30) {
      //이상현상 이벤트

      switch (blockData) {
        case OPEN_DOOR_EVENT:
          openDoor();
          break;
      }
    } else if (blockData == ENDING_EVENT) {
      currentScene = 'end';
    }
  }
}

function chkEndingInit(anomalyNum) {
  if (anomalyNum != MaxAnomalyNum) {
    return false;
  }
  return true;
}

function makeEndingMap() {
  basicMap[ENDING_BLOCK_Y][ENDING_BLOCK_X + 0] = LEFT_STAIRS;
  basicMap[ENDING_BLOCK_Y][ENDING_BLOCK_X + 1] = CENTER_STAIRS;
  basicMap[ENDING_BLOCK_Y][ENDING_BLOCK_X + 2] = RIGHT_STAIRS;

  setEventBlock(ENDING_BLOCK_X + 0, ENDING_BLOCK_Y + 1, ENDING_EVENT);
  setEventBlock(ENDING_BLOCK_X + 1, ENDING_BLOCK_Y + 1, ENDING_EVENT);
  setEventBlock(ENDING_BLOCK_X + 2, ENDING_BLOCK_Y + 1, ENDING_EVENT);

  setPosterBlock(1, false, true);
  setPosterBlock(2, false, true);
  setPosterBlock(3, false, true);
  setPosterBlock(4, false, true);
  setPosterBlock(5, false, true);
  setDoorBlock(false, false);
  setMister(false);
}

function makeRandomAnomalyMap() {
  anomalyState = random([true, false, true]);
  if (anomalyState === true) {
    console.log("anomaly true ", chkI++);
    maxChangeAnomalyNum = random([1, 2]);
    randomAnomaly = [];
    for (let i = 0; i < 7; i++) randomAnomaly.push(false);
    for (let i = 0; i < maxChangeAnomalyNum; i++) randomAnomaly[i] = true;
    randomAnomaly = shuffle(randomAnomaly);
    setPosterBlock(1, randomAnomaly[0], false);
    setPosterBlock(2, randomAnomaly[1], false);
    setPosterBlock(3, randomAnomaly[2], false);
    setPosterBlock(4, randomAnomaly[3], false);
    setPosterBlock(5, randomAnomaly[4], false);
    setDoorBlock(true, randomAnomaly[5]);
    if( randomAnomaly[6] === true)
    {
      misterAnomaly = random([true, false]);
      if(misterAnomaly === true)
        setMister(false, false);
      else
        setMister(true, true);
    }else{
      setMister(true, false);
    }
  } else {
    makeBasicMap();
  }
}

function makeBasicMap() {
  setPosterBlock(1, false, false);
  setPosterBlock(2, false, false);
  setPosterBlock(3, false, false);
  setPosterBlock(4, false, false);
  setPosterBlock(5, false, false);
  setDoorBlock(true, false);
  setMister(true, false);
}


function setExitSignBlock() {
  basicMap[29][17] = chkAnomalyNum + 2;
}

function setPosterBlock(num, trans, empty = false) {
  if (empty === true) {
    basicMap[12 + num * 2][POSTER_X] = 1;
    return;
  }
  switch (num) {
    case 1:
      if (trans === true) basicMap[POSTER_1_Y][POSTER_X] = POSTER_1_TRANS;
      else basicMap[POSTER_1_Y][POSTER_X] = POSTER_1;
      break;
    case 2:
      if (trans === true) basicMap[POSTER_2_Y][POSTER_X] = POSTER_2_TRANS;
      else basicMap[POSTER_2_Y][POSTER_X] = POSTER_2;
      break;
    case 3:
      if (trans === true) basicMap[POSTER_3_Y][POSTER_X] = POSTER_3_TRANS;
      else basicMap[POSTER_3_Y][POSTER_X] = POSTER_3;
      break;
    case 4:
      if (trans === true) basicMap[POSTER_4_Y][POSTER_X] = POSTER_4_TRANS;
      else basicMap[POSTER_4_Y][POSTER_X] = POSTER_4;
      break;
    case 5:
      if (trans === true) basicMap[POSTER_5_Y][POSTER_X] = POSTER_5_TRANS;
      else basicMap[POSTER_5_Y][POSTER_X] = POSTER_5;
      break;
  }
}

function setDoorBlock(use, open = false) {
  if (use === false) {
    basicMap[DOOR_Y][DOOR_X] = BASIC_TILE;
    return;
  }
  basicMap[DOOR_Y][DOOR_X] = DOOR_CLOSED;
  if (open === true) {
    setEventBlock(OPEN_DOOR_EVENT_X + 0, OPEN_DOOR_EVENT_Y, OPEN_DOOR_EVENT);
    setEventBlock(OPEN_DOOR_EVENT_X + 1, OPEN_DOOR_EVENT_Y, OPEN_DOOR_EVENT);
    setEventBlock(OPEN_DOOR_EVENT_X + 2, OPEN_DOOR_EVENT_Y, OPEN_DOOR_EVENT);
  }
}

function openDoor() {
  engineInstance.setBlock(DOOR_X, DOOR_Y, DOOR_OPEN);
  engineInstance.setBlock(OPEN_DOOR_EVENT_X + 0, OPEN_DOOR_EVENT_Y, 0);
  engineInstance.setBlock(OPEN_DOOR_EVENT_X + 1, OPEN_DOOR_EVENT_Y, 0);
  engineInstance.setBlock(OPEN_DOOR_EVENT_X + 2, OPEN_DOOR_EVENT_Y, 0);
  basicMap[OPEN_DOOR_EVENT_Y][OPEN_DOOR_EVENT_X + 0] = 0;
  basicMap[OPEN_DOOR_EVENT_Y][OPEN_DOOR_EVENT_X + 1] = 0;
  basicMap[OPEN_DOOR_EVENT_Y][OPEN_DOOR_EVENT_X + 2] = 0;
  doorOpenSound.play();
}

function setMister(state, _toUser = false) {
  if (state === false) {
    misterState = false;
    toUser = false;
    engineInstance.removeSprite("mister");
    return;
  }
  if( misterState === true)
  {
    engineInstance.removeSprite("mister");
  }

  engineInstance.addSprite({
    x: 13.5,
    y: 9,
    images: {
      front: misterFrontImage[misterWalk],
      back: misterBackImage[misterWalk],
      left: misterLeftImage[misterWalk],
      right: misterRightImage[misterWalk],
    },
    rot: radians(0),
    id: "mister",
  });
  toUser = _toUser;
  misterState = true;
}

function updateMister() {
  if(toUser === false){
    engineInstance.moveSpriteTowards("mister", 13.5, 26.5, 0.01);
    if (now - lastStepMisterTime > stepInterval) {
      lastStepMisterTime = now;
      engineInstance.updateSpriteImages("mister", {
        front: misterBackImage[misterWalk],
        back: misterFrontImage[misterWalk],
        left: misterLeftImage[misterWalk],
        right: misterRightImage[misterWalk],
      });
      misterWalk = (misterWalk + 1) % 2;
    }
  }
  else{
    let misterInfo = engineInstance.getSprite("mister");
    let xDistance = engineInstance.getPlayerLocX() - misterInfo.x;
    let yDistance = engineInstance.getPlayerLocY() - misterInfo.y;
    let distance = sqrt(xDistance * xDistance + yDistance * yDistance);
    if (distance < 0.7) {
      return;
    }
    engineInstance.moveSpriteTowards("mister", engineInstance.getPlayerLocX(), engineInstance.getPlayerLocY(), 0.02);
    if (now - lastStepMisterTime > stepInterval) {
      lastStepMisterTime = now;
      engineInstance.updateSpriteImages("mister", {
        front: misterBackImage[misterWalk],
        back: misterBackImage[misterWalk],
        left: misterBackImage[misterWalk],
        right: misterBackImage[misterWalk],
      });
      misterWalk = (misterWalk + 1) % 2;
    }
  }
}

function keyPressed() {
  if (!engineInstance) return;
  if (keyCode == UP_ARROW || keyCode == DOWN_ARROW) {
    walkState++;
  }
    if (currentScene === 'title') {
        if (keyCode === ENTER) {
            currentScene = 'game';
            // Ensure keyboard controls are enabled on start
            if (typeof engineInstance.enableKeyboard === 'function') engineInstance.enableKeyboard();
        }
        return;
    }
}

function keyReleased() {
  if (!engineInstance) return;
  if (keyCode == UP_ARROW || keyCode == DOWN_ARROW) {
    walkState--;
  }
}

function mousePressed() {
    if (!engineInstance) return;

    if (currentScene === 'title') {
      if(isHelpButtonClicked(mouseX, mouseY)) {
        currentScene = 'guide';
      } else {
        currentScene = 'game';
        if (typeof engineInstance.enableKeyboard === 'function') engineInstance.enableKeyboard();
      }
    }

    if (currentScene === 'guide') {
      if(isGuideCloseButtonClicked(mouseX, mouseY)) {
        currentScene = 'title';
      }
    }

    if (currentScene === 'end') {
      if(isEndRetryButtonClicked(mouseX, mouseY)) {
        location.reload();
      }
    }

}

// Optional: expose a small API to start/stop automatic rendering
window.EngineHost = {
  startAuto: function () {
    loop();
  },
  stopAuto: function () {
    noLoop();
  },
  instance: () => engineInstance,
};
