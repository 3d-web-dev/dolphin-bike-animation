//A
var canvas = document.getElementById("canvas");
var load_info = document.getElementById("loaderInfo");
var load_icon = document.getElementById("loader");


// decalaration of animation variables
var mixer_bike, mixer_dolphin,
    clips_dolphin, clips_bike,
    anim_state = "dolphin",
    loaded = 0,
    clock = new THREE.Clock(),
    dolphin = new THREE.Object3D(),
    bike = new THREE.Object3D(),
    gridHelper, water, sky, gridHelper;


//window size
var screenDimensions = {
    width: canvas.width,
    height: canvas.height,
};

var path = new THREE.Object3D(), mixer_path, clips_path;
//create scene variable
var scene = buildScene();

//create renderer variable
var renderer = buildRender(screenDimensions);

//declaration of camera variable
var camera = buildCamera(screenDimensions);

// var controls = buildControls();
function buildControls() {
    const orbitControl = new THREE.OrbitControls(camera, renderer.domElement);
    return orbitControl;
}

createSceneObjects(scene);

//wait until all models are loaded
loadModelController();

bindEventListeners();

//create three.js scene variable
function buildScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("rgb(255,255,255)");
    scene.fog = new THREE.Fog(0xffffff, 40, 100);
    return scene;
}



// load gltf
function loadModel(url, name) {

    const loader = new THREE.GLTFLoader();
    loader.load(
        url,
        function (gltf) {
            var model = gltf.scene;
            switch (name) {
                case "path":
                    model.traverse(function (child) {
                        if (child.isMesh) {
                            if (child.name == "Sphere") {
                                path = child;
                            }
                        }
                    });
                    clips_path = gltf.animations;
                    mixer_path = new THREE.AnimationMixer(model);
                    break;
                case "bike":
                    model.scale.set(48, 48, 48);
                    model.position.z = 2;
                    model.position.x = 2;
                    model.position.y = 1.5;
                    bike = model;
                    bike.visible = false;
                    clips_bike = gltf.animations;
                    mixer_bike = new THREE.AnimationMixer(model);
                    break;
                case "dolphin":
                    model.scale.set(18, 18, 18);
                    model.position.set(-16, -3, 0);
                    dolphin = model;
                    model.rotation.y = Math.PI / 2;
                    clips_dolphin = gltf.animations;
                    mixer_dolphin = new THREE.AnimationMixer(model);
                    break;
            }
            scene.add(model);
            ++loaded;
        },
        undefined,
        function (e) {
            console.error(e);
            // location.reload();
        }
    );
}


function loadModelController() {
    var _time = setInterval(() => {
        loaderInfo.innerHTML = "Loading..."
        if (loaded == 2) {
            animate();
            anim_dolphin();
            clearInterval(_time);
            loadIconHide(load_icon);
        }
    }, 50)
}

function buildRender({ width, height }) {
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
    });
    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1;
    renderer.setPixelRatio(DPR);

    renderer.outputEncoding = THREE.GammaEncoding;
    renderer.gammaFactor = 2.2;
    // renderer.gammaOutput = true;
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    return renderer;
}


function buildCamera({ width, height }) {
    const aspectRatio = width / height;
    const fieldOfView = 45;
    const nearPlane = 0.1;
    const farPlane = 100;
    const camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // position and point the camera to the center of the scene
    camera.position.set(-3.51, 4.11, -25.27);
    camera.rotation.set(2.99, 0.037, 3.13);
    scene.add(camera);
    return camera;
}

function resizeCanvas() {
    canvas.style.width = "100%";

    canvas.width = canvas.offsetWidth;
    canvas.height = window.innerHeight * 1; // customize

    onWindowResize();
}

function onWindowResize() {
    const { width, height } = canvas;

    screenDimensions.width = width;
    screenDimensions.height = height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

function bindEventListeners() {
    window.onresize = resizeCanvas;
    resizeCanvas();
}

function animate() {

    var mixerUpdateDelta = clock.getDelta();

    switch (anim_state) {
        case "dolphin":
            mixer_dolphin.update(mixerUpdateDelta);
            break;
        case "bike":
            mixer_bike.update(mixerUpdateDelta);
            mixer_path.update(mixerUpdateDelta);
            break;
    }

    renderer.render(scene, camera);

    TWEEN.update();

    requestAnimationFrame(animate);
}

function createSceneObjects() {
    var axesHelper = new THREE.AxesHelper(15);
    // scene.add(axesHelper);

    loadIconShow(load_icon);

    var waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
    water = new THREE.Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load(
            "assets/waternormals.jpg",
            function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        ),
        alpha: 1.0,
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.z += 5;
    scene.add(water);


    //showing infinitive grid plane
    gridHelper = new THREE.GridHelper(150, 150, 0xaaaaaa, 0xaaaaaa);
    gridHelper.receiveShadow = true;

    gridHelper.position.y = 3;
    scene.add(gridHelper);

    buildLight();


    //loading GLTF models
    loadModel("assets/dolphin.glb", "dolphin");
    loadModel("assets/bike.glb", "bike");
    loadModel("assets/path.glb", "path");
}

function buildLight() {
    var hemiLight = new THREE.HemisphereLight();
    scene.add(hemiLight);

    pointLight = new THREE.PointLight();
    pointLight.color = new THREE.Color(0xffffff).convertSRGBToLinear();
    camera.add(pointLight);
}

//Dolphin model animation
function anim_dolphin() {
    path.visible = false;
    renderer.outputEncoding = THREE.LinearEncoding;

    anim_state = "dolphin";

    showModels(anim_state);

    camera.position.set(-3.5, 8, -80);

    camera.rotation.set(Math.PI, 0, Math.PI);

    for (var i = 0; i < clips_dolphin.length; ++i) {

        mixer_dolphin.clipAction(clips_dolphin[i]).play();

    }

    var _move = new TWEEN.Tween(camera.position)
        .to({ y: -0.01, z: -8 }, 8400) //4200
        .start()
        .onComplete(() => {
            for (var i = 0; i < clips_dolphin.length; ++i) {
                mixer_dolphin.clipAction(clips_dolphin[i]).stop();
            }
            anim_bike();
        });
}

function anim_bike() {

    anim_state = "bike";

    renderer.outputEncoding = THREE.GammaEncoding;

    showModels(anim_state);

    for (var i = 0; i < clips_bike.length; ++i) {
        console.log(clips_bike[i])
        mixer_bike.clipAction(clips_bike[i]).play();
    }

    seekAnimationTime(mixer_bike, 3.5);

    path.visible = true;

    camera.rotation.set(2.99, 0.037, 3.13);

    camera.position.copy(path.position);
    path.attach(camera);
    mixer_path.clipAction(clips_path[0]).play();

    setTimeout(() => {
        scene.add(camera);
        anim_dolphin();
        for (var i = 0; i < clips_bike.length; ++i) {
            mixer_bike.clipAction(clips_bike[i]).stop();
        }

        mixer_path.clipAction(clips_path[0]).stop();

        path.visible = false;

    }, Math.floor(clips_path[0].duration) * 1000);

}



//Display only active models whose animations are played
function showModels(anim_state) {

    switch (anim_state) {
        case 'dolphin':
            dolphin.visible = true;
            bike.visible = false;
            gridHelper.visible = false;
            water.visible = true;
            break;

        case 'bike':
            dolphin.visible = false;
            bike.visible = true;
            water.visible = false;
            gridHelper.visible = true;
            break;
    }
}


function loadIconShow(ele) {
    ele.style.display = 'block';
}

function loadIconHide(ele) {
    ele.style.display = 'none';
}

function seekAnimationTime(animMixer, timeInSeconds) {
    animMixer.time = 0;
    for (var i = 0; i < animMixer._actions.length; i++) {
        animMixer._actions[i].time = timeInSeconds;
    }
}

