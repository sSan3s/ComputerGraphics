import * as THREE from "three";
import { gameOver, rankUpSph, killSph, guideHeight } from "./script.js";
import { addGameScore } from "./UI.js";



let gravity = 0.98; // 게임이 진행되는 공간(box), 중력이 적용되는 범위 및 중력계수 초기화
const zAxis = new THREE.Vector3(0, 0, 1);
const yAxis = new THREE.Vector3(0, 1, 0);
const xAxis = new THREE.Vector3(1, 0, 0);
export let G = new THREE.Vector3(0, 0, -gravity); //중력
export let sphs = []; // 생성한 과일 저장
export let side = 100;
export let height = 300;
export let topZ;
let halfHeight = height * 0.5;
// 벽, 바닥, 과일끼리의 충돌과 탄성, 반발력, 마찰계수
let floorElasticity = 0.5;
let sideWallElasticity = 0.7;
let interSphereElasticity = 0.5;
let sphereFriction = 0.6;
let stillness = 4 * gravity; // 미세한 튕김 구현으로 인한 리소스 낭비 방지
let wallOverwrapCoeff = 0.1; // 벽과의 반발력 계수
let overwrapRepulsion = 100; // 과일 끼리의 반발력
let wallSpinFriction = 1.5;
let tmp = new THREE.Vector3();
export class Physical { 
    constructor(mesh, vel, rank, radius) { //중력이 적용될 객체 생성
        this.mesh = mesh;
        this.vel = new THREE.Vector3(vel[0], vel[1], vel[2]);
        this.spin = new THREE.Vector3(0.0, 0.0, 0.0);
        this.rank = rank;
        this.radius = radius;
        this.isCollide = false;
        this.mass = 1;
        this.isReservedToDestroyed = false;
        this.isEverCollide = false;
    }
    getPosFromMesh() { //좌표
        return [this.mesh.position.x, this.mesh.position.y, this.mesh.position.z];
    }
    getVelFromMesh() { //속도
        return [this.vel.x, this.vel.y, this.vel.z];
    }
    nextPosition() { //속도와 충돌 여부로 다음 위치 설정
        if (this.isCollide) {
            this.isCollide = false;
        }
        else { //충돌하지 않았으면 중력 가속도에 따라 가속
            this.mesh.position.add(this.vel);
            this.accelerate(G);
            tmp = this.spin.clone();
            this.mesh.rotateOnWorldAxis(tmp.normalize(), this.spin.length());
        }
    }
    accelerate(acc) { //가속함수
        this.vel.add(acc);
    }
    checkWallCollision() {
        // 바닥과의 충돌 먼저 구현, 여기서 바닥은 -height
        let overwrap = this.radius - (this.mesh.position.z + this.vel.z) - halfHeight; 
        if (overwrap > 0) { //벽면 mesh와 과일 mesh가 겹치는 부분이 생기면 충돌한다고 간주
            this.isCollide = true;
            this.isEverCollide = true;
            this.mesh.position.x += this.vel.x;
            this.mesh.position.y += this.vel.y;
            this.vel.x *= 0.99;
            this.vel.y *= 0.99; 
            this.spin.z *= 0.99; // 마찰력으로 속도와 회전 속도를 줄여줌
            this.spin.x = -this.vel.y / this.radius;
            this.spin.y = this.vel.x / this.radius; 
            this.vel.x = this.spin.y * this.radius;
            this.vel.y = -this.spin.x * this.radius; // 속도와 회전력이 서로에게 영향을 미치게
            if (this.vel.length() < stillness) { // 바닥과의 미세한 튕김으로 인한 속도는 0으로 초기화
                this.vel.z = 0;
                this.mesh.position.z = this.radius - halfHeight;
            }
            else { //바닥과의 반발력으로 인한 튕김 구현, 떨어지는 과일의 다음 y좌표값이 벽면과 겹치면, floorElasticity의 값에 따라 속도를 변화시킴
                this.mesh.position.z = this.radius - halfHeight;
                this.vel.z = Math.floor(Math.abs(this.vel.z) * 2) * 0.5 * floorElasticity;
                this.mesh.position.z += this.vel.z;
            }
        }

        let edgeDist = new THREE.Vector3();
        let edgeCollisionVector = new THREE.Vector3();
        if (this.mesh.position.z > halfHeight) { //박스의 모서리와의 충돌 구현, 삭제 가능
            edgeDist.set(this.mesh.position.x + this.vel.x - side, 0, this.mesh.position.z + this.vel.z - halfHeight);
            if (edgeDist.length() < this.radius) {
                this.isCollide = true;
                edgeCollisionVector = this.vel.projectOnVector(edgeDist.normalize());
                this.vel.add(edgeCollisionVector.negate());
                this.spin.add(yAxis).multiplyScalar(-1.0 / this.radius);
            }
            edgeDist.set(this.mesh.position.x + this.vel.x + side, 0, this.mesh.position.z + this.vel.z - halfHeight);
            if (edgeDist.length() < this.radius) {
                this.isCollide = true;
                edgeCollisionVector = this.vel.projectOnVector(edgeDist.normalize());
                this.vel.add(edgeCollisionVector.negate());
                this.spin.add(yAxis).multiplyScalar(1.0 / this.radius); 
            }
            edgeDist.set(0, this.mesh.position.y + this.vel.y - side, this.mesh.position.z + this.vel.z - halfHeight);
            if (edgeDist.length() < this.radius) {
                this.isCollide = true;
                edgeCollisionVector = this.vel.projectOnVector(edgeDist.normalize());
                this.vel.add(edgeCollisionVector.negate());
                this.spin.add(xAxis).multiplyScalar(1.0 / this.radius);
            }
            edgeDist.set(0, this.mesh.position.y + this.vel.y + side, this.mesh.position.z + this.vel.z - halfHeight);
            if (edgeDist.length() < this.radius) {
                this.isCollide = true;
                edgeCollisionVector = this.vel.projectOnVector(edgeDist.normalize());
                this.vel.add(edgeCollisionVector.negate());
                this.spin.add(xAxis).multiplyScalar(-1.0 / this.radius); 
            }
        }
        else {
            // 박스의 벽면과의 충돌 
            let nextXpos = this.mesh.position.x + this.vel.x; // 속도로 인한 과일의 다음 위치
            overwrap = nextXpos + this.radius - side; // 벽면 mesh와 과일 mesh가 겹치는 정도
            if (overwrap > 0) { // 다음 위치가 벽면과 겹힌다면
                this.isCollide = true; // 충돌했다고 간주
                this.vel.x = -Math.abs(this.vel.x) * sideWallElasticity; //속도를 반대방향으로 바꾸고 벽면의 탄성도 반영
                this.mesh.position.x += this.vel.x; //바꾼 속도를 적용

                this.vel.z += this.spin.y / this.radius * wallSpinFriction; //또한 벽면의 마찰력이 과일을 회전시킴
                overwrap = this.mesh.position.x + this.radius - side; //그럼에도 과일의 현재 위치와 벽면이 겹친다면
                while (overwrap > 0) { 
                    this.vel.x += -overwrap * wallOverwrapCoeff;
                    this.mesh.position.x += this.vel.x;
                    overwrap = this.mesh.position.x + this.radius - side; //겹치는 부분이 없을 때까지 속도 적용
                }
            } //여기서 Elasticity(탄성)와 OverwrapCoeff(반발력)의 차이는 순간의 반발력과 지속적인 반발력의 차이
            overwrap = this.radius - nextXpos - side; //반대 x좌표에서도 적용
            if (overwrap > 0) {
                this.isCollide = true;
                this.vel.x = Math.abs(this.vel.x) * sideWallElasticity;
                this.mesh.position.x += this.vel.x;

                this.vel.z -= this.spin.y / this.radius * wallSpinFriction;
                overwrap = -this.mesh.position.x + this.radius - side;
                while (overwrap > 0) {
                    this.vel.x += overwrap * wallOverwrapCoeff;
                    this.mesh.position.x += this.vel.x;
                    overwrap = -this.mesh.position.x + this.radius - side;
                }
            } // 결론적으로 떨어지는 과일의 다음 x좌표값이 벽면과 겹치면, sideWallElasticity의 값에 따라 회전력과 속도를 변화시킴
            let nextYpos = this.mesh.position.y + this.vel.y; // y축도 똑같이 적용
            overwrap = nextYpos + this.radius - side;
            if (overwrap > 0) {
                this.isCollide = true;
                this.vel.y = -Math.abs(this.vel.y) * sideWallElasticity;
                this.mesh.position.y += this.vel.y;

                this.vel.z += this.spin.x / this.radius * wallSpinFriction;
                overwrap = this.mesh.position.y + this.radius - side;
                while (overwrap > 0) {
                    this.vel.y += -overwrap * wallOverwrapCoeff;
                    this.mesh.position.y += this.vel.y;
                    overwrap = this.mesh.position.y + this.radius - side;
                }
            }
            overwrap = this.radius - nextYpos - side;
            if (overwrap > 0) {
                this.isCollide = true;
                this.vel.y = Math.abs(this.vel.y) * sideWallElasticity;
                this.mesh.position.y += this.vel.y;

                this.vel.z -= this.spin.x / this.radius * wallSpinFriction;
                overwrap = -this.mesh.position.y + this.radius - side;
                while (overwrap > 0) {
                    this.vel.y += overwrap * wallOverwrapCoeff;
                    this.mesh.position.y += this.vel.y;
                    overwrap = -this.mesh.position.y + this.radius - side;
                }
            } //떨어지는 과일의 다음 y좌표값이 벽면과 겹치면, sideWallElasticity의 값에 따라 회전력과 속도를 변화시킴
        }
    }

    checkCollisionWith(x) { //다른 과일 x와의 충돌 구현 함수
        let objA = this.mesh.position.clone();
        let objB = x.mesh.position.clone();
        if (this.radius + x.radius > (objA.add(this.vel)).distanceTo(objB.add(x.vel)) &&
            !this.isReservedToDestroyed && !x.isReservedToDestroyed) {
            if (this.radius === x.radius) { // 충돌한 두 과일이 같은 크기라면 합침
                this.sphereFusion(x);
                return;
            }
            this.isCollide = true;
            this.isEverCollide = true;

            let lineV = objA.sub(objB).normalize();
            let normalVelA = this.vel.clone().projectOnVector(lineV);
            let normalVelB = x.vel.clone().projectOnVector(lineV);
            this.vel.sub(normalVelA).multiplyScalar(sphereFriction);
            x.vel.sub(normalVelB).multiplyScalar(sphereFriction);
            // 두 과일의 속도의 스칼라 곱으로 속도 재설정

            this.spin.add(tmp.crossVectors(lineV, this.vel).multiplyScalar(1 / this.radius));
            x.spin.add(tmp.crossVectors(x.vel, lineV).multiplyScalar(1 / x.radius));
            this.spin.multiplyScalar(0.9);
            x.spin.multiplyScalar(0.9);
            //두 과일의 속도의 스칼라 곱으로 회전력 재설정


            let amplA = normalVelA.dot(lineV);
            let amplB = normalVelB.dot(lineV);
            let massSum = this.mass + x.mass;
            normalVelA = lineV.clone().multiplyScalar((amplA * (this.mass - x.mass) + amplB * (2 * x.mass)) / massSum);
            normalVelB = lineV.clone().multiplyScalar((amplA * (2 * this.mass) + amplB * (x.mass - this.mass)) / massSum);
            this.vel.add(normalVelA.multiplyScalar(interSphereElasticity));
            x.vel.add(normalVelB.multiplyScalar(interSphereElasticity));
            this.mesh.position.add(this.vel);
            x.mesh.position.add(x.vel);
            let overwrap = (this.radius + x.radius) - tmp.subVectors(this.mesh.position, x.mesh.position).length();
            if (overwrap > 0) { // 두과일이 겹치는 부분이 있으면 
                lineV.multiplyScalar(overwrap * 0.5);
                this.mesh.position.add(lineV);
                x.mesh.position.sub(lineV);
                lineV.multiplyScalar(overwrapRepulsion);
                x.vel.add(lineV);
                this.vel.add(lineV); //과일의 반발력 overwrapRepulsion값에 따라 스칼라 곱만큼 속도 재설정
            }
        }
    }
    sphereFusion(sph) { //두 과일의 rank가 같으면 하나는 없애고 하나는 rankUp
        this.mesh.position.add(sph.mesh.position).multiplyScalar(0.5);
        this.vel.multiplyScalar(0); // 새로 나타날 과일의 속도를 없앰
        this.spin.addVectors(this.spin, sph.spin).multiplyScalar(0.5);
        this.isCollide = true;
        rankUpSph(this);
        this.isEverCollide = true;
        addGameScore(this.rank ** 2);
        killSph(sph);
    }
    checkGameOver() { //충돌했을 때의 최대 높이가 일정치를 넘으면 게임오버
        if (this.isEverCollide && this.mesh.position.z > 0.5 * height) {
            gameOver();
        }
    }
}
;
export function setPhysicalParameters(floorE, wallE, spheE, spheF, still, wallRepulse, spheRepulse) { //물리 계수 초기화 함수
    floorElasticity = floorE;
    sideWallElasticity = wallE;
    interSphereElasticity = spheE;
    sphereFriction = spheF;
    stillness = still * gravity;
    wallOverwrapCoeff = wallRepulse;
    overwrapRepulsion = spheRepulse;
}
// loop thru physcial objects.
export function physics(elements) { 
    //충돌 적용 및 게임오버 조건 확인 함수
    for (let i = 0; i < elements.length; i++) {
        elements[i].checkWallCollision();
        // 벽과의 충돌 여부 체크, spheres 사라지는 경우 주의...
        for (let j = 0; j < elements.length; j++) {
            if (i === j)
                continue;
            elements[i].checkCollisionWith(elements[j]);
            //다른 과일과의 충돌 여부 체크 함수
        }
        // After all are done move to next position.
        
        elements[i].nextPosition(); // and also accelerate.
    }
    // Remove sphes & game over check
    for (let i = 0; i < elements.length; i++) {
        try {
            elements[i].checkGameOver();
            //게임오버 조건 확인 함수
            if (elements[i].isReservedToDestroyed) {
                elements = elements.splice(i, 1);
            }
            
           
        }
        catch (e) {
            break;
        }
    }
    topZ=-height/2;
    for (let h = 0;h<elements.length;h++){
        if(elements[h].mesh.position.z+elements[h].radius>topZ){
            topZ=elements[h].mesh.position.z+elements[h].radius;
        }
    }
    if(topZ!=-height/2){
        guideHeight.material.opacity = 0.2;
    }
    else{
        guideHeight.material.opacity = 0.0;
    }
    guideHeight.position.set(0,0,topZ);

}
//# sourceMappingURL=physics.js.map