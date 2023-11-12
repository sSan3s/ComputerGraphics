var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { camera, renderer, 
// createSph,
createColorSph, guideLine, guideSphere,guideHeight, renewGuideSphere, fps, config, } from './script.js';
import { sphs, side, height, setPhysicalParameters } from './physics.js';
import { MathUtils, Vector3, Color } from 'three';
let mouseX = 0, mouseY = 0, clickX = 0, clickY = 0; // Client mouse positions
export let container = document.getElementById('container'); // container DOM
export let w_width = container.clientWidth;
export let w_height = container.clientHeight;
export let w_ratio = w_height / w_width;
let windowHalfX = container.clientWidth / 2 + container.offsetLeft;
let windowHalfY = container.clientHeight / 2 + container.offsetTop;
let containerWidth = container.clientWidth / 2;
let containerHeight = container.clientHeight / 2;
let upNextPanel = document.getElementById('upNext'); // Other UI panels DOM
let slotPanel = document.getElementById('slotText');
export let highscore = document.getElementById('highScore');
let scoreBoard = document.getElementById('scoreBoard');
// Camera orientations and movement
export let currentPhi = 0.5 * Math.PI + 0.001, targetPhi = 0.5 * Math.PI + 0.001;
export let currentTheta = 0.5 * Math.PI , targetTheta = 0.5 * Math.PI;
export let currentRadi = 900 * 1.5, targetRadi = 900 * 1.5;
let transitionTime = 300;
let noKeyInput = false;
let isButtonDown = false;
// Fruit rank (is it OK to be here...?) and game score.
export let currentRank = MathUtils.randInt(0, 5);
let nextRank = MathUtils.randInt(0, 5);
let dropMargin = 48;
export let gameScore = 0;
// Vectors used to map from client -> 3D world.
let vec = new Vector3(); // recycle. normalized mouse position in camera view.
let pos = new Vector3(); // recycle. world position under the mouse.

export let slot=MathUtils.randInt(0,1);
let temp;

export function onWindowResize() {
    windowHalfX = container.clientWidth / 2 + container.offsetLeft;
    windowHalfY = container.clientHeight / 2 + container.offsetTop;
    containerWidth = container.clientWidth / 2;
    containerHeight = container.clientHeight / 2;
    // // Update cam
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    dropMargin = config[4].radius + 1;
}
// PC mouse UIs
let mouseMoveX;
let mouseMoveY;
export function onDocumentMouseMove(event) {
    mouseMoveX = (event.clientX - windowHalfX + window.scrollX);
    mouseMoveY = -(event.clientY - windowHalfY + window.scrollY);
    vec.set(mouseMoveX / containerWidth, mouseMoveY / containerHeight, 1);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    pos.copy(camera.position).add(vec.multiplyScalar((0.5 * height + dropMargin - camera.position.z) / vec.z));
    if (isInRange(pos, side + 50)) {
        let margin = config[currentRank].radius * 1.03;
        if (pos.x <= -side + margin)
            pos.x = -side + margin;
        else if (pos.x >= side - margin)
            pos.x = side - margin;
        if (pos.y <= -side + margin)
            pos.y = -side + margin;
        else if (pos.y >= side - margin)
            pos.y = side - margin;
        //@ts-ignore
        guideLine.material.opacity = 0.5;
        guideLine.position.set(pos.x, pos.y, 0);
        guideSphere.position.set(pos.x, pos.y, 0.5 * height + dropMargin);
        //@ts-ignore
        guideSphere.material.opacity = 0.5;
    }
    else {
        //@ts-ignore
        guideLine.material.opacity = 0;
        //@ts-ignore
        guideSphere.material.opacity = 0;
        // // CameraSetting
        // if (isButtonDown) {
        //     targetPhi = currentPhi + (mouseX - mouseMoveX) * 0.001 * Math.PI;
        //     targetTheta = currentTheta + (mouseMoveY - mouseY) * 0.001 * Math.PI;
        //     if (targetTheta > 0.5 * Math.PI)
        //         targetTheta = 0.5 * Math.PI;
        //     else if (targetTheta < 0)
        //         targetTheta = 0;
        //     setCameraStatus(targetPhi, targetTheta, targetRadi);
        //     mouseX = mouseMoveX;
        //     mouseY = mouseMoveY;
        //     currentPhi = targetPhi;
        //     currentTheta = targetTheta;
        // }
    }
}
export function onDocumentClick(event) {
    isButtonDown = true;
    // mouseX = (event.clientX - windowHalfX + window.scrollX);
    // mouseY = -(event.clientY - windowHalfY + window.scrollY);
    // vec.set(mouseX / containerWidth, mouseY / containerHeight, 1);
    // vec.unproject(camera);
    // vec.sub(camera.position).normalize();
    // pos.copy(camera.position).add(vec.multiplyScalar((0.5 * height + dropMargin - camera.position.z) / vec.z));
    if (sphs.length > 0 &&
        sphs[sphs.length - 1].mesh.position.z > (0.5 * height) - (sphs[sphs.length - 1].radius + config[currentRank].radius) &&
        !sphs[sphs.length - 1].isEverCollide) {
        return;
    }
    clickX = pos.x + (Math.random() - 0.5);
    clickY = pos.y + (Math.random() - 0.5);
    if (Math.abs(clickX) > (side + 50))
        return;
    if (Math.abs(clickY) > (side + 50))
        return;
    let margin = config[currentRank].radius * 1.03;
    if (clickX <= -side + margin)
        clickX = -side + margin;
    else if (clickX >= side - margin)
        clickX = side - margin;
    if (clickY <= -side + margin)
        clickY = -side + margin;
    else if (clickY >= side - margin)
        clickY = side - margin;
    createColorSph(currentRank, [clickX, clickY, 0.5 * height + dropMargin], [Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, 0]); // This might not be random.
    currentRank = nextRank;
    nextRank = MathUtils.randInt(0, 5);
    // // renew guide sphere.
    renewGuideSphere();
    var date = new Date();
    date.setMinutes(date.getMinutes()+60);
    document.cookie = `score=${gameScore}; expires=${date.toUTCString()}`;            
}
export function onDocumentMouseUp(event) {
    console.log("up");
    isButtonDown = false;
}
export function onKeydown(event) {
    let inputKey = event.key;
    if (currentPhi >= 7)
        currentPhi = 0;
    if (noKeyInput)
        return;
    switch (inputKey.toUpperCase()) {
        case 'W':
            targetTheta = currentTheta - 0.1 * Math.PI;
            break;
        case 'A':
            targetPhi = currentPhi - 0.25 * Math.PI;
            break;
        case 'S':
            targetTheta = currentTheta + 0.1 * Math.PI;
            break;    
        case 'D':
            targetPhi = currentPhi + 0.25 * Math.PI;
            break;
        case 'Q':
            targetRadi = currentRadi - 90;
            break;
        case 'E':
            targetRadi = currentRadi + 90;
            break;
        case 'T': // Top View
            targetTheta = 0;
            break;
        case 'B': // Bottom View
            targetTheta = 0.5 * Math.PI;
            break;
        case 'R': // Bottom View
            targetPhi = 0.25 * Math.PI + 0.001
            targetTheta = 0.25 * Math.PI
            targetRadi = 900 * 1.5;
            break;
        case 'Z':
            if(slot==-1){
                slot = currentRank;
                currentRank = nextRank;
                nextRank = MathUtils.randInt(0, 5);
                renewGuideSphere();

            }
            else {
                temp = currentRank;
                currentRank = slot;
                slot = temp;
                renewGuideSphere();c

            }
            break;
        default:
            break;
    }
    noKeyInput = true;
    if (targetTheta < 0)
        targetTheta = 0;
    if (targetTheta > 0.5 * Math.PI)
        targetTheta = 0.5 * Math.PI;
    if (targetRadi < 100)
        targetRadi = 100;
    setTimeout(() => { noKeyInput = false; }, transitionTime);
    smoothCameraSet(targetPhi, targetTheta, targetRadi);
}

function isInRange(pos, side) {
    return (pos.x < side) && (pos.x > -side) && (pos.y < side) && (pos.y > -side);
}
// Set camera orientaion
function setCameraStatus(Phi, Theta, Radi) {
    let xyProjection = Radi * Math.sin(Theta);
    let zAxis = new Vector3(0, 0, 1);
    let yAxis = new Vector3(0, 1, 0);
    camera.rotation.set(0, Theta, 0.5 * Math.PI); 
    camera.rotateOnWorldAxis(zAxis, Phi);
    camera.position.set(xyProjection * Math.cos(Phi), xyProjection * Math.sin(Phi), Radi * Math.cos(Theta));
}
export function smoothCameraSet(Phi, Theta, Radi) {
    return __awaiter(this, void 0, void 0, function* () {
        let initTime = Date.now();
        let progressing = 0;
        let transit = setInterval(() => {
            progressing = (Date.now() - initTime) / transitionTime;
            if (progressing >= 1) {
                setCameraStatus(Phi, Theta, Radi);
                clearInterval(transit);
                currentPhi = targetPhi;
                currentRadi = targetRadi;
                currentTheta = targetTheta;
            }
            setCameraStatus(MathUtils.lerp(currentPhi, Phi, progressing), MathUtils.lerp(currentTheta, Theta, progressing), MathUtils.lerp(currentRadi, Radi, progressing));
        }, 20);
    });
}
// Scoring.
export function addGameScore(num) {
    gameScore += num;
}

const iconContainer = document.querySelector('.upNextIcon');
var icon = document.createElement("img");
icon.width = 140;
icon.height = 140;
iconContainer.appendChild(icon);

const slotIconContainer = document.querySelector('.slotIcon');
var slotIcon = document.createElement("img");
slotIcon.width = 80;
slotIcon.height = 80;
slotIconContainer.appendChild(slotIcon);

export function upNextIconDisplayer(fruitName, icon) {

    console.log("fruitname:", fruitName);
    switch(fruitName) {
        case 'cherry':
            icon.src = './assets/cherry.png';
            console.log("nextFruit: cherry");
            break;
        case 'strawberry':
            icon.src = './assets/strawberry.png';
            console.log("nextFruit: strawberry");
            break;
        case 'grape':
            icon.src = './assets/grapes.png';
            console.log("nextFruit: grape");
            break;
        case 'orange':
            icon.src = './assets/clementine.png';
            console.log("nextFruit: orange");
            break;
        case 'persimmon':
            icon.src = './assets/persimmon.png';
            console.log("nextFruit: persimmon");
            break;
        case 'apple':
            icon.src = './assets/red-apple.png';
            console.log("nextFruit: apple");
            break;
    }
    
}


// Display socre, next fruit.
export function display() {
    upNextPanel.innerText = config[nextRank].name; //nextRank.toString();
    slotPanel.innerText = config[slot].name;
    upNextPanel.style.color = "#" + new Color(config[nextRank].color).getHexString();
    // upNextPanel.style.fontSize = config[nextRank].radius.toString()+"px";
    scoreBoard.innerText = gameScore.toString();
    upNextIconDisplayer(config[nextRank].name.toString(), icon);
    upNextIconDisplayer(config[slot].name.toString(), slotIcon);
}
/**
 *
 * Debugging, parameter adjust only
 */
export function debugging(debTab) {
    var _a;
    try {
        debTab.item(0).innerHTML = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
        debTab.item(1).innerHTML = "(" + windowHalfX + ", " + windowHalfY + ")";
        debTab.item(2).innerHTML = "(" + camera.position.x.toFixed() + ", " + camera.position.y.toFixed() + ")";
        // @ts-ignore
        debTab.item(3).innerHTML = "(" + sphs.length + ")";
        if (sphs.length > 0) {
            let position = sphs[0].getPosFromMesh();
            // @ts-ignore
            debTab.item(4).innerHTML = "(" + Math.round(position[0]) + "," +
                Math.round(position[1]) + "," +
                Math.round(position[2]) + ")";
            let vel = sphs[0].getVelFromMesh();
            // @ts-ignore
            debTab.item(5).innerHTML = "(" + Math.round(vel[0]) + "," +
                Math.round(vel[1]) + "," +
                Math.round(vel[2]) + ")";
            debTab.item(6).innerHTML = "(" + fps.toPrecision(3) + ")";
        }
        let sphereDisplay = "";
        for (let i = 0; i < sphs.length; i++) {
            sphereDisplay += "<tr><td>" +
                i + "</td><td>" +
                sphs[i].rank.toFixed() + "</td><td>" +
                sphs[i].radius.toFixed() + "</td><td>" +
                sphs[i].mass.toFixed() +
                "</td><tr>";
        }
        // @ts-ignore
        (_a = debTab.namedItem("spheres")) === null || _a === void 0 ? void 0 : _a.innerHTML = sphereDisplay;
        // @ts-ignore
        setPhysicalParameters(
        // @ts-ignore
        Number(debTab.namedItem("floorE").value), 
        // @ts-ignore
        Number(debTab.namedItem("wallE").value), 
        // @ts-ignore
        Number(debTab.namedItem("spheE").value), 
        // @ts-ignore
        Number(debTab.namedItem("spheF").value), 
        // @ts-ignore
        Number(debTab.namedItem("still").value), 
        // @ts-ignore
        Number(debTab.namedItem("wallRep").value), 
        // @ts-ignore
        Number(debTab.namedItem("spheRep").value));
        console.log();
    }
    catch (error) {
        console.log(error);
    }
}
export let getAngle = 0;
export function onCamDebugChanged(event) {
    // @ts-ignore
    let camDistance = event.currentTarget.camR.value;
    // @ts-ignore
    getAngle = Number(event.currentTarget.camTh.value);
    // setCameraStatus((getAngle) * Math.PI, 0.25* Math.PI, 900 * 1.4);
    setCameraStatus((getAngle) * Math.PI, 0.25 * Math.PI, camDistance);
}
//# sourceMappingURL=UI.js.map