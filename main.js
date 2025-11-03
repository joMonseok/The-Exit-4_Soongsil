// main.js — p5 lifecycle and engine instance bootstrap
// This file should be loaded after p5.js and engine.js in index.html

// We expect window.ENGINE_ASSETS and window.ENGINE_CONFIG (optional) to be set before engine.js loads.

let engineInstance = null;

let basicMap1 = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,-2,0,0,0,0,2,1,1,1,1,1,1,1],
                [1,0,0,0,0,-2,0,0,0,0,2,1,1,1,1,1,1,1],
                [1,0,0,0,0,-2,0,0,0,0,2,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,2,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,2,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ];
let basicMap2 = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,-3,0,0,0,0,3,1,1,1,1,1,1,1],
                [1,0,0,0,0,-3,0,0,0,0,3,1,1,1,1,1,1,1],
                [1,0,0,0,0,-3,0,0,0,0,3,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,3,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,3,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ];
let basicMap3 = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,-1,0,0,0,0,4,1,1,1,1,1,1,1],
                [1,0,0,0,0,-1,0,0,0,0,4,1,1,1,1,1,1,1],
                [1,0,0,0,0,-1,0,0,0,0,4,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,4,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,4,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ];

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
        'assets/blue_wall.png','assets/blue_cell.png','assets/rocks.png','assets/wood.png'
    ];
    config.assets = config.assets || assets.slice();
    // mirror to global for compatibility
    try { window.ENGINE_ASSETS = config.assets.slice(); } catch(e) {}

    // If user didn't provide player config, create default here
    config.player = config.player || { x: 13, y: 13, rot: 65, moveSpeed: 0.1, rotSpeed: 3 * Math.PI / 180 };
    //config.player = config.player || { x: 2, y: 2, rot: 300, moveSpeed: 0.1, rotSpeed: 3 * Math.PI / 180 };
    engineInstance = new FullEngine(config);
    window.engine = engineInstance;
    // call engine preload to load assets via p5.loadImage
    if (typeof engineInstance.preload === 'function') engineInstance.preload();
}

function setup() {
    if (!engineInstance) return;
    // call engine setup to create canvas and initialize
    if (typeof engineInstance.setup === 'function') engineInstance.setup();

    // 기본적으로 키보드 입력을 활성화하여 화살표 키로 조작할 수 있게 함
    if (typeof engineInstance.enableKeyboard === 'function') engineInstance.enableKeyboard();

}

let data = null;

function draw() {
    if (!engineInstance) return;
    // delegate to engine's frame renderer
    data = engineInstance.Go();
    console.log(data);

    let blockData= engineInstance.getPlayerBlock()
    if(blockData!=0)
    {
        let x=engineInstance.getPlayerLocX()+6;
        let y=engineInstance.getPlayerLocY()+6;
        console.log(x,"  ",y)
        if(blockData == -1){
            engineInstance.setPlayerLoc(x,y);
            engineInstance.setWorldMap(basicMap1);
        }
        else if(blockData == -2){
            engineInstance.setPlayerLoc(x,y);
            engineInstance.setWorldMap(basicMap2);
        }
        else if(blockData == -3){
            engineInstance.setPlayerLoc(x,y);
            engineInstance.setWorldMap(basicMap3);
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
