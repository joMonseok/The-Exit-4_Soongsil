let engineInstance = null;

let startX = 25.5;
let startY = 36.5;

let doorOpenSound;

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
            config.worldMap = basicMap1.map(r => r.slice());
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
        'assets/poster5_trans.png'  // 18
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

    console.log("Hello World!");
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
    // delegate to engine's frame renderer
    data = engineInstance.Go();
    console.log(data);

    let blockData= engineInstance.getPlayerBlock()
    blockEvents(blockData)
}

function blockEvents(blockData){
    if (!engineInstance) return;
    if(blockData!=0)
    {
        blockData*=-1;
        if( blockData<10 )
        {
            let x=engineInstance.getPlayerLocX()+17;
            let y=engineInstance.getPlayerLocY()+27;
            switch(blockData){
                case 1:
                    engineInstance.setWorldMap(basicMap1);
                    engineInstance.setPlayerLoc(x,y);
                break;
                case 2:
                    engineInstance.setWorldMap(basicMap2);
                    engineInstance.setPlayerLoc(x,y);
                break;
                case 3:
                    engineInstance.setWorldMap(basicMap3);
                    engineInstance.setPlayerLoc(x,y);
                break;
            }
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
                    engineInstance.setBlock(14, 18, 8); 
                    engineInstance.setBlock(13, 14, 0); 
                    engineInstance.setBlock(12, 14, 0); 
                    engineInstance.setBlock(11, 14, 0); 
                    doorOpenSound.play();
                break;
            }
        }
    }
}

function keyPressed() {
    if (!engineInstance) return;
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

// Optional: expose a small API to start/stop automatic rendering
window.EngineHost = {
    startAuto: function() { loop(); },
    stopAuto: function() { noLoop(); },
    instance: () => engineInstance
};
