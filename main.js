let engineInstance = null;

let startX = 25.5;
let startY = 36.5;

let currentScene = 'title';

let doorOpenSound;
let chkAnomalyNum=0;
let anomalyState=true;

const myWorker = new Worker('worker.js');


//플레이어 및 맵 기본 정보와 벽 데이터 불러오기
function preload() {
    // Create FullEngine instance early so its preload() can call loadImage in the p5 preload phase.
    if (!window.FullEngine) {
        console.error('FullEngine class not found (engine.js must be loaded before main.js)');
        return;
    }
    // Build config (map, player, assets) here in main and pass to engine
    const config = window.ENGINE_CONFIG ? Object.assign({}, window.ENGINE_CONFIG) : {};
    // create or copy a world map here (prefer user-provided, otherwise copy any existing global map)
    if (!config.worldMap) {
        if (window.worldMap && Array.isArray(window.worldMap)) {
            config.worldMap = window.worldMap.map(r => r.slice());
        } else {
            // fallback small sample map
            config.worldMap = basicMap.map(r => r.slice());
        }
    }
    // assets to load (textures)
    const assets = window.ENGINE_ASSETS && Array.isArray(window.ENGINE_ASSETS) && window.ENGINE_ASSETS.length ? window.ENGINE_ASSETS : [
        'assets/tile_basic.png',    // 1
        'assets/0_Exits.png',       // 2
        'assets/1_Exits.png',       // 3
        'assets/2_Exits.png',       // 4
        'assets/3_Exits.png',       // 5
        'assets/4_Exits.png',       // 6
        'assets/close_door.png',    // 7
        'assets/open_door.png',     // 8
        'assets/poster1.png',       // 9
        'assets/poster1_trans.png', // 10
        'assets/poster2.png',       // 11
        'assets/poster2_trans.png', // 12
        'assets/poster3.png',       // 13
        'assets/poster3_trans.png', // 14
        'assets/poster4.png',       // 15
        'assets/poster4_trans.png', // 16
        'assets/poster5.png',       // 17
        'assets/poster5_trans.png', // 18
        'assets/left_stairs.png',       // 19
        'assets/center_stairs.png',       // 20
        'assets/right_stairs.png'       // 21
    ];

    config.assets = config.assets || assets.slice();
    // mirror to global for compatibility
    try { window.ENGINE_ASSETS = config.assets.slice(); } catch(e) {}

    // If user didn't provide player config, create default here
    config.player = config.player || { x: startX, y: startY, rot: radians(180), moveSpeed: 0.1, rotSpeed: 3 * Math.PI / 180 };
    //config.player = config.player || { x: 2, y: 2, rot: 300, moveSpeed: 0.1, rotSpeed: 3 * Math.PI / 180 };
    engineInstance = new FullEngine(config);
    window.engine = engineInstance;
    // call engine preload to load assets via p5.loadImage
    if (typeof engineInstance.preload === 'function') engineInstance.preload();

    doorOpenSound = loadSound('assets/door_open_sound.mp3');
}

//엔진이 가져와졌는지 체크
function setup() {
    if (!engineInstance) return;
    if (typeof engineInstance.setup === 'function') engineInstance.setup();

    if (typeof engineInstance.enableKeyboard === 'function') engineInstance.enableKeyboard();

}

let data = null;

function draw() {
    if (!engineInstance) return;
    if (currentScene === 'title') {
        startScreen()
        return;
    }
    // Game scene
    data = engineInstance.Go();
    let blockData= engineInstance.getPlayerBlock();
    blockEvents(blockData);
}


let chkI=0;
async function blockEvents(blockData){
    if (!engineInstance) return;
    if(blockData!=0)
    {
        blockData*=-1;
        if( blockData<10 )
        {
            let x=engineInstance.getPlayerLocX();
            let y=engineInstance.getPlayerLocY();
            let rot = engineInstance.getPlayerRot();
            switch(blockData){
                case 1:
                    if(anomalyState===true)
                        chkAnomalyNum++;
                    else if(anomalyState===false)
                        chkAnomalyNum=0;
                    x+=17;
                    y+=27;
                break;
                case 2:
                    if(anomalyState===true)
                        chkAnomalyNum=0;
                    else if(anomalyState===false)
                        chkAnomalyNum++;
                    x-=3;
                    y=(startY-y)+startY;
                    rot-=radians(180);
                break;
            }
            if(chkAnomalyNum==4)
            {
                basicMap[15][11] = 19;
                basicMap[15][12] = 20;
                basicMap[15][13] = 21;
                basicMap[16][11] = -50;
                basicMap[16][12] = -50;
                basicMap[16][13] = -50;
                setPosterBlock(1,false,true);
                setPosterBlock(2,false,true);
                setPosterBlock(3,false,true);
                setPosterBlock(4,false,true);
                setPosterBlock(5,false,true);
                setDoorBlock(false, false);
            }
            else
            {
                anomalyState=random([true,false]);
                if(anomalyState===true)
                {
                    //basicMap = await myWorker.postMessage(basicMap);
                    console.log("anomaly true ",chkI++);
                    setPosterBlock(1,random([true,false]),random([true,false]));
                    setPosterBlock(2,random([true,false]),random([true,false]));
                    setPosterBlock(3,random([true,false]),random([true,false]));
                    setPosterBlock(4,random([true,false]),random([true,false]));
                    setPosterBlock(5,random([true,false]),random([true,false]));
                    setDoorBlock(random([true,false]), random([true,false]));
                }
            }
            setExitBlock();
            engineInstance.setWorldMap(basicMap);
            engineInstance.setPlayerLoc(x,y);
            engineInstance.setPlayerRot(rot);
        }
        else if( blockData<20 )
        {
            let x=engineInstance.getPlayerLocX()-3;
            let y=(startY-engineInstance.getPlayerLocY())+startY;
            let rot = engineInstance.getPlayerRot()-radians(180);
            switch(blockData){
                case 11:
                    engineInstance.setWorldMap(basicMap1);
                    engineInstance.setPlayerLoc(x,y);
                    engineInstance.setPlayerRot(rot);
                break;
                case 12:
                    engineInstance.setWorldMap(basicMap2);
                    engineInstance.setPlayerLoc(x,y);
                    engineInstance.setPlayerRot(rot);
                break;
                case 13:
                    engineInstance.setWorldMap(basicMap3);
                    engineInstance.setPlayerLoc(x,y);
                    engineInstance.setPlayerRot(rot);
                break;
            }
        }
        else if( blockData<30 )
        {
            switch(blockData){
                case 21:
                    engineInstance.setBlock(14, 20, 8); 
                    engineInstance.setBlock(13, 14, 0); 
                    engineInstance.setBlock(12, 14, 0); 
                    engineInstance.setBlock(11, 14, 0); 
                    basicMap[14][13] = 0; 
                    basicMap[14][12] = 0; 
                    basicMap[14][11] = 0; 
                    doorOpenSound.play();
                break;
            }
        }
        else if(blockData==50)
        {
            //ending
        }
    }
}


function setExitBlock(){
    basicMap[29][17] = chkAnomalyNum+2;
}

    function setPosterBlock(num, trans, empty=false)
    {
        if(empty===true)
        {
            basicMap[12+num*2][10] = 1;
            return;
        }

        switch(num){
            case 1:
                if(trans===true)
                    basicMap[12][10] = 10;
                else
                    basicMap[12][10] = 9;
                break;
            case 2:
                if(trans===true)
                    basicMap[14][10] = 12;
                else
                    basicMap[14][10] = 11;
                break;
            case 3:
                if(trans===true)
                    basicMap[16][10] = 14;
                else
                    basicMap[16][10] = 13;
                break;
            case 4:
                if(trans===true)
                    basicMap[18][10] = 16;
                else
                    basicMap[18][10] = 15;
                break;
            case 5:
                if(trans===true)
                    basicMap[20][10] = 18;
                else
                    basicMap[20][10] = 17;
                break;
        }
    }

    function setDoorBlock(use, open=false)
    {
        if(use===false)
        {
            basicMap[20][14] = 1;
            return;
        }
        basicMap[20][14] = 7;
        if(open===true)
        {
            basicMap[14][13] = -21; 
            basicMap[14][12] = -21; 
            basicMap[14][11] = -21; 
        }
    }

function keyPressed() {
    if (!engineInstance) return;
    // Handle title scene start
    if (currentScene === 'title') {
        if (keyCode === ENTER) {
            currentScene = 'game';
            // Ensure keyboard controls are enabled on start
            if (typeof engineInstance.enableKeyboard === 'function') engineInstance.enableKeyboard();
        }
        return;
    }
    if(key=="a" || key=="A"){
        if(data.frontBlock == 0)
        {
            engineInstance.setBlock(data.frontBlockX, data.frontBlockY, 3); 
        }
        else if(data.frontBlock > 1)
        {
            engineInstance.setBlock(data.frontBlockX, data.frontBlockY, 0);
        }
    }
}

function mousePressed() {
    if (!engineInstance) return;
    if (currentScene === 'title') {
        currentScene = 'game';
        if (typeof engineInstance.enableKeyboard === 'function') engineInstance.enableKeyboard();
    }
}

// Optional: expose a small API to start/stop automatic rendering
window.EngineHost = {
    startAuto: function() { loop(); },
    stopAuto: function() { noLoop(); },
    instance: () => engineInstance
};

function startScreen() {
  const t = millis() / 1000;

  // 팔레트
  const BG   = color(8, 8, 10);
  const LINE = color(67, 72, 42);
  const GLOW = color(180, 190, 170, 220);

  // === 배경 ===
  push();
  background(BG);
  pop();

  // === 표지판 본체 (비율 스케일) ===
  const cx = width / 2;
  const cy = height * 0.5;
  const barW = width;
  const barH = min(110, height * 0.3);
  const flicker = constrain(noise(t * 4.0) * 1.2 - 0.1, 0, 1);

  // 메인 바
  push();
  rectMode(CENTER);
  noStroke();
  fill(red(LINE), green(LINE), blue(LINE), 220 + 25 * flicker);
  rect(cx, cy, barW, barH);
  pop();

  // 예: 좌측 가장자리에서 1.2배 크기로 흰색 표시
// 남성: 왼쪽 가장자리 근처
drawLeftStationCue(0, height * 0.5, 0.6, color(255));

// 상도: 오른쪽 가장자리 근처
drawRightStationCue(width, height * 0.5, 0.6, color(255));



  // === 텍스트 (외곽 강조: 다중 드로우) ===
  const baseK = barH / 100;
  const titleSize = 50 * baseK;
  const jitterAmt = (1.2 + flicker * 0.6) * baseK;
  const jx = random(-jitterAmt, jitterAmt);
  const jy = random(-jitterAmt, jitterAmt);

  // 공통 텍스트 상태
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

//   // 2) 초록 잔상
  fill(170, 200, 150, 90);
  textSize(titleSize);
  text("숭실대입구", cx + jx + 2, cy - barH * 0.08 + jy);

  // 3) 본문 흰색 (가장 위)
  fill(255);
  textSize(titleSize);
  text("숭실대입구", cx + jx, cy - barH * 0.10 + jy);


  // === 스캔라인 ===
  push();
  noStroke();
  for (let y = 0; y < height; y += 3) {
    fill(0, 15);
    rect(0, y, width, 1);
  }
  pop();

  // === 시작 안내 (숨쉬기 + 글리치) ===
  const breath = (sin(t * 2.2) + 1) * 0.5;
  const alpha  = 110 + breath * 100;
  const glitch = (noise(t * 1.7) - 0.5) * 6;

  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill(200, alpha);
  textSize(24 * baseK);
  text("Press ENTER to start", width / 2 + glitch, height * 0.82);
  pop();
}

// 좌측 역 안내 묶음 (화살표 + 3줄 텍스트)
// x, y : 화살표 '끝(뾰족한 끝)'의 중심 위치
// s    : 크기 배율(1이 기본)
// col  : 화살표/텍스트 색상
// labelKo/En/Han : 표기 커스텀 가능
// 남성: ← 화살표가 텍스트의 왼쪽(글은 오른쪽에 정렬 X, 왼쪽 정렬 O)
function drawLeftStationCue(
  x, y, s = 1, col = color(255),
  { labelKo = "남 성", labelEn = "Namseong", labelHan = "南城" } = {}
) {
  push();
  noStroke();
  fill(col);

  // 좌향 화살표 치수
  const headW  = 28 * s;   // 화살촉 길이
  const shaftW = 44 * s;   // 몸통 길이
  const arrowH = 32 * s;   // 전체 높이
  const shaftH = arrowH * 0.44;

  // *** 좌향(←)으로 수정: tip이 x,y 이고 몸통은 x보다 오른쪽에 위치 ***
  beginShape();
  vertex(x + (headW + shaftW), y - shaftH / 2); // 몸통 오른
  vertex(x + headW,            y - shaftH / 2); // 몸통 왼(촉 시작)
  vertex(x + headW,            y - arrowH / 2); // 윗선
  vertex(x,                    y);              // 뾰족 끝(왼쪽)
  vertex(x + headW,            y + arrowH / 2); // 아랫선
  vertex(x + headW,            y + shaftH / 2); // 몸통 하단
  vertex(x + (headW + shaftW), y + shaftH / 2); // 몸통 오른
  endShape(CLOSE);

  // 텍스트: 화살표 오른쪽에 배치 (LEFT 정렬)
  const tx = x + (headW + shaftW) + 12 * s;
  textAlign(LEFT, CENTER);

  textStyle(BOLD);
  textSize(16 * s);
  text(labelKo, tx, y - 10 * s);

  textStyle(NORMAL);
  textSize(11 * s);
  text(labelEn, tx, y + 2 * s);

  textSize(10 * s);
  text(labelHan, tx, y + 14 * s);

  pop();
}

// 상도: 텍스트가 왼쪽, → 화살표가 텍스트 오른쪽 (기존 로직 유지, 한자 공백 제거)
function drawRightStationCue(
  x, y, s = 1, col = color(255),
  { labelKo = "상 도", labelEn = "Sangdo", labelHan = "上道" } = {}
) {
  push();
  noStroke();
  fill(col);

  const headW  = 28 * s;
  const shaftW = 44 * s;
  const arrowH = 32 * s;
  const shaftH = arrowH * 0.44;

  // 우향(→) 화살표: tip이 x,y, 몸통은 x보다 왼쪽
  beginShape();
  vertex(x - (headW + shaftW), y - shaftH / 2);
  vertex(x - headW,            y - shaftH / 2);
  vertex(x - headW,            y - arrowH / 2);
  vertex(x,                    y);              // 뾰족 끝(오른쪽)
  vertex(x - headW,            y + arrowH / 2);
  vertex(x - headW,            y + shaftH / 2);
  vertex(x - (headW + shaftW), y + shaftH / 2);
  endShape(CLOSE);

  // 텍스트: 화살표 왼쪽에 배치 (RIGHT 정렬)
  const tx = x - (headW + shaftW) - 12 * s;
  textAlign(RIGHT, CENTER);

  textStyle(BOLD);
  textSize(16 * s);
  text(labelKo, tx, y - 10 * s);

  textStyle(NORMAL);
  textSize(11 * s);
  text(labelEn, tx, y + 2 * s);

  textSize(10 * s);
  text(labelHan, tx, y + 14 * s);

  pop();
}

