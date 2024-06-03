import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GUI } from 'dat.gui';
import { randFloat } from 'three/src/math/MathUtils.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
const transforms = new TransformControls(camera, renderer.domElement);
const array_mesh = [];
let rotateAnimation = false;
let upDownAnimation = false;
let scaleAnimation = false;
let orbitAnimation = false;
function init() {
    var animationRunning = false;
    controls.update();

    transforms.size = 0.5;
    transforms.addEventListener('change', () => renderer.render(scene, camera));
    transforms.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value;
    });
    transforms.mode = 'translate';
    scene.add(transforms);

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const pointLight = new THREE.PointLight(0xffffff, 100, 0);
    pointLight.castShadow = true;
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    camera.position.x = 1;
    camera.position.y = 2;
    camera.position.z = 5;

    const translateBtn = document.getElementById('translateBtn');
    // const scaleBtn = document.getElementById('scalseBtn');
    // const rotateBtn = document.getElementById('rotateBtn');

    // make interface
    translateBtn.addEventListener('click', function () {
        transforms.mode = 'translate';
        setButtonActive(translateBtn);
    });
    // scaleBtn.addEventListener('click', function () {
    //     transforms.mode = 'scale';
    //     setButtonActive(scaleBtn);
    // });
    // rotateBtn.addEventListener('click', function () {
    //     transforms.mode = 'rotate';
    //     setButtonActive(rotateBtn);
    // });
    //-----------



    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onDocumentMouseDown = (event) => {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(array_mesh);
        console.log(intersects);
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            transforms.attach(selectedObject);
            console.log("selected")
        }
    };

    document.addEventListener('mousedown', onDocumentMouseDown, false);


    // ----------
    let angle = 0;
    const radius = 5;

    function animate() {
        requestAnimationFrame(animate);

        angle += 0.01;
        pointLight.position.x = radius * Math.cos(angle);
        pointLight.position.z = radius * Math.sin(angle);
        pointLight.position.y = 2;

        if (rotateAnimation || upDownAnimation || scaleAnimation || orbitAnimation) {
            scene.children.forEach(mesh => {
                if (mesh instanceof THREE.Mesh) {
                    if (rotateAnimation) {
                        mesh.rotation.x += 0.01;
                        mesh.rotation.y += 0.01;
                    }
                    if (upDownAnimation) {
                        mesh.position.y = 10 * Math.abs(Math.sin(Date.now() * 0.001));
                    }
                    if (scaleAnimation) {
                        const scale = 1 + 0.5 * Math.sin(Date.now() * 0.001);
                        mesh.scale.set(scale, scale, scale);
                    }
                    if (orbitAnimation) {
                        const time = Date.now() * 0.001;
                        const radius = 5; // bán kính quỹ đạo
                        mesh.position.x = radius * Math.cos(time);
                        mesh.position.z = radius * Math.sin(time);
                    }
                }
            });
        }

        controls.update();
        renderer.render(scene, camera);
    }

    var backgroundAllPoints = getBackgroundAllPoints();
    scene.add(backgroundAllPoints);

    //------------------------
    animate();

    document.getElementById('rotate').addEventListener('change', function () {
        rotateAnimation = this.checked;
    });

    document.getElementById('updown').addEventListener('change', function () {
        upDownAnimation = this.checked;
    });

    document.getElementById('scale').addEventListener('change', function () {
        scaleAnimation = this.checked;
    });
    document.getElementById('orbit').addEventListener('change', function () {
        orbitAnimation = this.checked;
    });
}



function addGeometry(geometry) {
    const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    array_mesh.push(mesh);
    return mesh
}


function setupEventListeners() {
    const geometryOptions = document.querySelectorAll('.geometry');
    geometryOptions.forEach(option => {
        option.addEventListener('click', handleGeometryClick);
    });
}

function handleGeometryClick(event) {
    const geometryType = event.target.textContent;

    switch (geometryType) {
        case 'Plane':
            addGeometry(new THREE.PlaneGeometry(1, 1));
            break;
        case 'Box':
            addGeometry(new THREE.BoxGeometry(1, 1, 1));
            break;
        case 'Circle':
            addGeometry(new THREE.CircleGeometry(0.5, 32));
            break;
        case 'Cone':
            addGeometry(new THREE.ConeGeometry(0.5, 1, 32));
            break;
        case 'Cylinder':
            addGeometry(new THREE.CylinderGeometry(0.5, 0.5, 1, 32));
            break;
        case 'Dodecahedron':
            addGeometry(new THREE.DodecahedronGeometry(0.5));
            break;
        case 'Edges':
            addGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)));
            break;
        case 'Extrude':
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(0, 1);
            shape.lineTo(1, 1);
            shape.lineTo(1, 0);
            shape.lineTo(0, 0);
            const extrudeSettings = { steps: 2, depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 };
            addGeometry(new THREE.ExtrudeGeometry(shape, extrudeSettings));
            break;
        case 'Icosahedron':
            addGeometry(new THREE.IcosahedronGeometry(0.5));
            break;
        case 'Lathe':
            const points = [];
            for (let i = 0; i < 10; i++) {
                points.push(new THREE.Vector2(Math.sin(i * 0.2) * 0.5 + 0.5, (i - 5) * 0.2));
            }
            addGeometry(new THREE.LatheGeometry(points));
            break;
        case 'Octahedron':
            addGeometry(new THREE.OctahedronGeometry(0.5));
            break;
        case 'Parametric':
            const parametricGeometry = new THREE.ParametricGeometry((u, v, target) => {
                const x = u * Math.sin(v);
                const y = u * Math.cos(v);
                const z = u;
                target.set(x, y, z);
            }, 10, 10);
            addGeometry(parametricGeometry);
            break;
        case 'Polyhedron':
            const verticesOfCube = [
                -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
                -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
            ];
            const indicesOfFaces = [
                2, 1, 0, 0, 3, 2,
                0, 4, 7, 7, 3, 0,
                0, 1, 5, 5, 4, 0,
                1, 2, 6, 6, 5, 1,
                2, 3, 7, 7, 6, 2,
                4, 5, 6, 6, 7, 4
            ];
            addGeometry(new THREE.PolyhedronGeometry(verticesOfCube, indicesOfFaces, 1, 2));
            break;
        case 'Ring':
            addGeometry(new THREE.RingGeometry(0.5, 1, 32));
            break;
        case 'Shape':
            const shape2 = new THREE.Shape();
            shape2.moveTo(0, 0);
            shape2.lineTo(0, 1);
            shape2.lineTo(1, 1);
            shape2.lineTo(1, 0);
            shape2.lineTo(0, 0);
            addGeometry(new THREE.ShapeGeometry(shape2));
            break;
        case 'Sphere':
            addGeometry(new THREE.SphereGeometry(0.5, 32, 32));
            break;
        case 'Tetrahedron':
            addGeometry(new THREE.TetrahedronGeometry(0.5));
            break;
        case 'Torus':
            addGeometry(new THREE.TorusGeometry(0.5, 0.2, 16, 100));
            break;
        case 'Tube':
            const path = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-1, -1, 0),
                new THREE.Vector3(-1, 1, 0),
                new THREE.Vector3(1, 1, 0),
                new THREE.Vector3(1, -1, 0)
            ]);
            addGeometry(new THREE.TubeGeometry(path, 20, 0.2, 8, true));
            break;
        case 'Import':
            alert('Import functionality not implemented yet.');
            break;
        default:
            console.warn(`Geometry type "${geometryType}" not recognized.`);
    }

}



function getBackgroundAllPoints() {
    const vertices = [];

    for (let i = 0; i < 30000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);

        vertices.push(x, y, z);
    }

    const geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    const material1 = new THREE.PointsMaterial({ color: 0x888888 });

    const points = new THREE.Points(geometry1, material1);

    return points;
}

function RotateObjectAnimation(object, scene, camera, renderer) {

    function animate() {

        object.forEach(mesh => {

            if (mesh) {
                step = 0;
                mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.01;
                if (document.getElementById("updown").checked == true) {
                    step += 0.005;
                    mesh.position.y = 10 * Math.abs(Math.sin(step));
                }
            }

        });
        renderer.render(scene, camera);
    }
    function startAnimation() {
        renderer.setAnimationLoop(animate);
    }
    function stopAnimation() {
        renderer.setAnimationLoop(null);
    }
    return {
        start: startAnimation,
        stop: stopAnimation
    };
}




init();
setupEventListeners();