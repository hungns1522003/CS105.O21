import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";
import { color } from "three/examples/jsm/nodes/Nodes.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const controls = new OrbitControls(camera, renderer.domElement);
const transformControls = new TransformControls(camera, renderer.domElement);
const array_mesh = [];
const rotate_animated_mesh = [];
const upDown_aniated_mesh = [];
const scale_animated_mesh = [];
const orbit_animated_mesh = [];


let rotateAnimation = false;
let upDownAnimation = false;
let scaleAnimation = false
let orbitAnimation = false;

var hasLight = false;
var transformActive = false;
let currentObject = null;
let objectTransformActive = false;
let choosedObject = null;

let angle = 0;
let radius = 5;

function init() {
  controls.update();
  transformControls.size = 0.5;
  transformControls.addEventListener("change", () =>
    renderer.render(scene, camera)
  );
  transformControls.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  var material = new THREE.MeshBasicMaterial({ color: "#ffffff" });

  var backgroundAllPoints = getBackgroundAllPoints();
  scene.add(backgroundAllPoints);

  var gridHelper = new THREE.GridHelper(50, 50, 0xff0000, "teal");
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  // Light
  var pointLight = getPointLight(0xffffff, 100, 100);

  // Create a sphere to help visualize the position of the point light
  var sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var pointLightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  pointLightSphere.position.copy(pointLight.position);

  // Update the position of the point light when the transformControls is changed
  transformControls.addEventListener("objectChange", function () {
    pointLight.position.copy(pointLightSphere.position);
  });

  camera.position.x = 1;
  camera.position.y = 2;
  camera.position.z = 5;

  const translateBtn = document.getElementById("translateBtn");
  const scaleBtn = document.getElementById("scaleBtn");
  const rotateBtn = document.getElementById("rotateBtn");
  const delBtn = document.getElementById("delBtn");

  // Create function for buttons translate, scale, rotate
  // translateBtn
  translateBtn.addEventListener("click", function () {
    if (!objectTransformActive) {
      for (const object of array_mesh) {
        transformControls.setMode("translate");
        transformControls.attach(object);
        scene.add(transformControls);
      }
    } else {
      scene.remove(transformControls);
    }
    objectTransformActive = !objectTransformActive;
  });

  // scaleBtn
  scaleBtn.addEventListener("click", function () {
    if (!objectTransformActive) {
      for (const object of array_mesh) {
        transformControls.setMode("scale");
        transformControls.attach(object);
        scene.add(transformControls);
      }
    } else {
      scene.remove(transformControls);
    }
    objectTransformActive = !objectTransformActive;
  });

  // rotateBtn
  rotateBtn.addEventListener("click", function () {
    if (!objectTransformActive) {
      for (const object of array_mesh) {
        transformControls.setMode("rotate");
        transformControls.attach(object);
        scene.add(transformControls);
      }
    } else {
      scene.remove(transformControls);
    }
    objectTransformActive = !objectTransformActive;
  });

  // delBtn

  delBtn.addEventListener("click", function() {
    transformControls.detach();
    scene.remove(choosedObject);
    var index = array_mesh.indexOf(choosedObject);
    if(index !== -1){
      array_mesh.splice(index, 1);
    }
    choosedObject.geometry.dispose();
    choosedObject.material.dispose();
  });

  // Translate Light
  document.getElementById("translateLightBtn").addEventListener("click", () => {
    if (!transformActive) {
      transformControls.attach(pointLightSphere);
      scene.add(transformControls);
    } else {
      transformControls.detach();
      scene.remove(transformControls);
    }
    transformActive = !transformActive;
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Function to handle when clicking object
  const onDocumentMouseDown = (event) => {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(array_mesh);
    if (intersects.length > 0) {
      choosedObject = intersects[0].object;
      if (objectTransformActive) {
        transformControls.attach(choosedObject);
      }
    }
  };

  function onMouseClick(event) {
    // Get canvas from renderer
    const canvas = renderer.domElement;

    // Normalize
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(array_mesh);

    if (intersects.length > 0) {
      let selectedObject = intersects[0].object;
      while (selectedObject.parent && !(selectedObject.parent instanceof THREE.Scene)) {
        selectedObject = selectedObject.parent;
      }
      choosedObject = selectedObject;
      transformControls.attach(selectedObject);
      scene.add(transformControls);
    }
  }

  window.addEventListener("click", onMouseClick, false);
  document.addEventListener("mousedown", onDocumentMouseDown, false);


  // Handle even when clicking geometry, surface, light, animation
  // Geometry
  const geometryOptions = document.querySelectorAll(".option_geometry");
  geometryOptions.forEach((option) => {
    option.addEventListener("click", handleGeometryClick);
  });

  // Surface
  const surfaceOptions = document.querySelectorAll(".texture");
  surfaceOptions.forEach((option) => {
    option.addEventListener("click", handleSurfaceClick);
  });

  // Light
  $(".light").click(function () {
    if ($(this).text() == "Point Light" && hasLight === false) {
      hasLight = true;
      scene.add(pointLight);
      scene.add(pointLightSphere);
      transformControls.attach(pointLightSphere);

      var plane = getPlane(150);
      gridHelper.add(plane);

      var pointLightHelper = getPointLightHelper(pointLight);
      scene.add(pointLightHelper);
    } else {
      hasLight = false;

      scene.remove(pointLight);
      scene.remove(pointLightSphere);
      transformControls.detach(pointLightSphere);
      scene.remove(scene.getObjectByName("PointLightHelper"));
      gridHelper.remove(scene.getObjectByName("Plane"));
    }
  });

  function animate() {
    requestAnimationFrame(animate);

    if (rotateAnimation || upDownAnimation || scaleAnimation || orbitAnimation) {
      if (choosedObject instanceof THREE.Mesh || choosedObject instanceof THREE.Group) {
        if (rotateAnimation) {
          choosedObject.rotation.x += 0.01;
          choosedObject.rotation.y += 0.01;
        }
        if (upDownAnimation) {
          choosedObject.position.y = 5 * Math.abs(Math.sin(Date.now() * 0.001));
        }
        if (scaleAnimation) {
          const scale = 1 + 0.5 * Math.sin(Date.now() * 0.001);
          choosedObject.scale.set(scale, scale, scale);
        }
        if (orbitAnimation) {
          if (!choosedObject.orbitCenter) {
            choosedObject.orbitCenter = choosedObject.position.clone();
          }
          const time = Date.now() * 0.001;
          const orbitRadius = 3;
          choosedObject.position.x = choosedObject.orbitCenter.x + orbitRadius * Math.cos(time);
          choosedObject.position.z = choosedObject.orbitCenter.z + orbitRadius * Math.sin(time);
        }
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }

  document.getElementById("rotate").addEventListener("change", function () {
    rotateAnimation = this.checked;
  });

  document.getElementById("updown").addEventListener("change", function () {
    upDownAnimation = this.checked;
  });

  document.getElementById("scale").addEventListener("change", function () {
    scaleAnimation = this.checked;
  });

  document.getElementById("orbit").addEventListener("change", function () {
    orbitAnimation = this.checked;
  });

  animate();


  // GUI
  var gui = new GUI({ autoPlace: false });
  document.getElementById('gui-container').appendChild(gui.domElement);

  class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }

  // Geometry color
  var colorGUI = gui.addFolder("Geometry Color");
  addColorGUI(material, "Color", { color: 0xffffff }, colorGUI).onChange(function (colorValue) {
    updateGeometryColor(choosedObject, colorValue);
  });
  console.log(material.color);
  colorGUI.open();

  // Camera
  const cameraGUI = gui.addFolder("Camera");
  cameraGUI.add(camera, "fov", 1, 180).name("FOV").onChange(updateCamera);
  cameraGUI.add(camera, "near", 0.1, 50).name("Near").onChange(updateCamera);
  cameraGUI.add(camera, "far", 50, 2000).name("Far").onChange(updateCamera);
  cameraGUI.open();

  // Point Light
  var lightGUI = gui.addFolder("Point Light");
  lightGUI.add(pointLight, "intensity", 0, 200, 1).name("Intensity");
  lightGUI.add(pointLight, "distance", 0, 200, 1).name("Distance");
  addColorGUI(pointLight, "Light Color", { color: 0xffffff }, lightGUI);
  lightGUI.open();

  // Directional Light
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 0);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  var directionalLightGUI = gui.addFolder("Directional Light");
  directionalLightGUI.add(directionalLight, "intensity", 0, 5, 0.01);
  directionalLightGUI.add(directionalLight.position, "x", -10, 10, 0.01);
  directionalLightGUI.add(directionalLight.position, "y", -10, 10, 0.01);
  directionalLightGUI.add(directionalLight.position, "z", -10, 10, 0.01);
  directionalLightGUI.open();

  //SpotLight
  var spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.1, 1);
  spotLight.position.set(0, 10, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);
  var spotLightGUI = gui.addFolder("Spot Light");
  spotLightGUI.add(spotLight, "intensity", 0, 200, 0.01);
  spotLightGUI.add(spotLight.position, "x", -10, 10, 0.01);
  spotLightGUI.add(spotLight.position, "y", -10, 10, 0.01);
  spotLightGUI.add(spotLight.position, "z", -10, 10, 0.01);
  spotLightGUI.add(spotLight, "distance", 0, 100, 1);
  spotLightGUI.add(spotLight, "angle", 0, Math.PI / 2, 0.01);
  spotLightGUI.add(spotLight, "penumbra", 0, 1, 0.01);
  spotLightGUI.add(spotLight, "decay", 1, 2, 0.01);
  spotLightGUI.open();

  // Set position
  const guiContainer = document.getElementById('gui-container');
  gui.domElement.style.position = "relative";
  gui.domElement.style.width = "100%";
  gui.domElement.style.height = "100%";
}

init();


// Other functions
function addGeometry(geometry) {
  const material = new THREE.MeshBasicMaterial({
    color: Math.random() * 0xffffff,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  array_mesh.push(mesh);
}

function addColorGUI(obj, name, params, folder) {
  var objColorGUI = folder
    .addColor(params, "color")
    .name(name)
    .onChange(function () {
      obj.color.set(params.color);
    });

  return objColorGUI;
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
  geometry1.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material1 = new THREE.PointsMaterial({ color: 0x888888 });

  const points = new THREE.Points(geometry1, material1);

  return points;
}

function getPointLightHelper(pointLight) {
  const sphereSize = 1;
  const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
  pointLightHelper.name = "PointLightHelper";

  return pointLightHelper;
}

function getPlane(size) {
  var geometry = new THREE.PlaneGeometry(size, size);
  var material = new THREE.MeshStandardMaterial({
    color: "#15151e",
    side: THREE.DoubleSide,
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.rotation.x = Math.PI / 2;
  mesh.name = "Plane";

  return mesh;
}

function getPointLight(color, intensity, distance) {
  var pointLight = new THREE.PointLight(color, intensity, distance);
  pointLight.position.set(0, 5, 0);
  pointLight.castShadow = true;
  pointLight.name = "PointLight";

  return pointLight;
}

function updateCamera() {
  camera.updateProjectionMatrix();
}

function updateGeometryColor(geometry, color) {
  geometry.material.color.set(color);
}

function handleGeometryClick(event) {
  const geometryType = event.target.textContent;

  let geometry;
  switch (geometryType) {
    case "Plane":
      addGeometry(new THREE.PlaneGeometry(1, 1));
      break;
    case "Box":
      addGeometry(new THREE.BoxGeometry(1, 1, 1));
      break;
    case "Circle":
      addGeometry(new THREE.CircleGeometry(0.5, 32));
      break;
    case "Cone":
      addGeometry(new THREE.ConeGeometry(0.5, 1, 32));
      break;
    case "Cylinder":
      addGeometry(new THREE.CylinderGeometry(0.5, 0.5, 1, 32));
      break;
    case "Dodecahedron":
      addGeometry(new THREE.DodecahedronGeometry(0.5));
      break;
    case "Edges":
      addGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)));
      break;
    case "Extrude":
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0, 1);
      shape.lineTo(1, 1);
      shape.lineTo(1, 0);
      shape.lineTo(0, 0);
      const extrudeSettings = {
        steps: 2,
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 1,
      };
      addGeometry(new THREE.ExtrudeGeometry(shape, extrudeSettings));
      break;
    case "Icosahedron":
      addGeometry(new THREE.IcosahedronGeometry(0.5));
      break;
    case "Lathe":
      const points = [];
      for (let i = 0; i < 10; i++) {
        points.push(
          new THREE.Vector2(Math.sin(i * 0.2) * 0.5 + 0.5, (i - 5) * 0.2)
        );
      }
      addGeometry(new THREE.LatheGeometry(points));
      break;
    case "Octahedron":
      addGeometry(new THREE.OctahedronGeometry(0.5));
      break;
    case "Parametric":
      const parametricGeometry = new THREE.ParametricGeometry(
        (u, v, target) => {
          const x = u * Math.sin(v);
          const y = u * Math.cos(v);
          const z = u;
          target.set(x, y, z);
        },
        10,
        10
      );
      addGeometry(parametricGeometry);
      break;
    case "Polyhedron":
      const verticesOfCube = [
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1,
        1, -1, 1, 1,
      ];
      const indicesOfFaces = [
        2, 1, 0, 0, 3, 2, 0, 4, 7, 7, 3, 0, 0, 1, 5, 5, 4, 0, 1, 2, 6, 6, 5, 1,
        2, 3, 7, 7, 6, 2, 4, 5, 6, 6, 7, 4,
      ];
      addGeometry(
        new THREE.PolyhedronGeometry(verticesOfCube, indicesOfFaces, 1, 2)
      );
      break;
    case "Ring":
      addGeometry(new THREE.RingGeometry(0.5, 1, 32));
      break;
    case "Shape":
      const shape2 = new THREE.Shape();
      shape2.moveTo(0, 0);
      shape2.lineTo(0, 1);
      shape2.lineTo(1, 1);
      shape2.lineTo(1, 0);
      shape2.lineTo(0, 0);
      addGeometry(new THREE.ShapeGeometry(shape2));
      break;
    case "Sphere":
      addGeometry(new THREE.SphereGeometry(0.5, 32, 32));
      break;
    case "Tetrahedron":
      addGeometry(new THREE.TetrahedronGeometry(0.5));
      break;
    case "Torus":
      addGeometry(new THREE.TorusGeometry(0.5, 0.2, 16, 100));
      break;
    case "Tube":
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1, -1, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, -1, 0),
      ]);
      addGeometry(new THREE.TubeGeometry(path, 20, 0.2, 8, true));
      break;
    case "Shiba":
      let loadedModel;
      const gltfLoader = new GLTFLoader();
      gltfLoader.load('./model/shiba/scene.gltf', (gltfScene) => {
        const group = new THREE.Group();
        gltfScene.scene.children.forEach((child) => {
          child.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          group.add(child);
        });

        group.rotation.y = Math.PI / 8;
        group.position.y = 1;
        group.scale.set(1, 1, 1);

        scene.add(group);

        array_mesh.push(group);
      });
      break;
    default:
      console.warn(`Geometry type "${geometryType}" not recognized.`);
  }

  if (geometry) {
    const material = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xffffff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    array_mesh.push(mesh);

    currentObject = mesh;
  }
}

function handleSurfaceClick(event) {
  var loader = new THREE.TextureLoader();
  var surfaceType = event.target.textContent;
  switch (surfaceType) {
    case "Wireframe":
      choosedObject.material.wireframe = !choosedObject.material.wireframe;
      choosedObject.material.needsUpdate = true;
      break;
    case "Rock":
      choosedObject.material.map = loader.load('./img/rock.png');
      choosedObject.material.needsUpdate = true;
      console.log("loaded soil texture");
      break;
    case "Soil":
      choosedObject.material.map = loader.load('./img/soil.png');
      choosedObject.material.needsUpdate = true;
      console.log("loaded soil texture");
      break;
    case "Water":
      choosedObject.material.map = loader.load('./img/water.jpg');
      choosedObject.material.needsUpdate = true;
      console.log("loaded water texture");
      break;
    case "Wood":
      choosedObject.material.map = loader.load('./img/wood.jpg');
      choosedObject.material.needsUpdate = true;
      console.log("loaded wood texture");
      break;
    default:
      console.warn(`Surface type "${surfaceType}" not recognized.`);
  }
}