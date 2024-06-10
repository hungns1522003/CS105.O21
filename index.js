import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Type of shadowMap.
const controls = new OrbitControls(camera, renderer.domElement);
const transformControls = new TransformControls(camera, renderer.domElement);
const array_mesh = [];
let rotateAnimation = false;
let upDownAnimation = false;
let scaleAnimation = false;
let orbitAnimation = false;



var hasLight = false;
var transformActive = false; // Biến trạng thái để theo dõi trạng thái của TransformControls
let currentObject = null;
let objectTransformActive = false;
let current_mesh = null;

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
 
   //AmbientLight
   const ambientLight = new THREE.AmbientLight(0xffffff, 1); // default color and intensity
   scene.add(ambientLight);
 
   var gui = new GUI();
 
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
 
   // GUI for point light
   var lightGUI = gui.addFolder("Light Control");
   lightGUI.add(pointLight, "intensity", 0, 200, 1).name("Intensity");
   lightGUI.add(pointLight, "distance", 0, 200, 1).name("Distance");
   addColorGUI(pointLight, "Light Color", { color: 0xffffff }, lightGUI);
   lightGUI.open();
 
   // GUI for ambient light
   var ambientLightGUI = gui.addFolder("Ambient Light");
   ambientLightGUI
     .addColor(new ColorGUIHelper(ambientLight, "color"), "value")
     .name("Color");
   ambientLightGUI.add(ambientLight, "intensity", 0, 100, 1).name("Intensity");
   ambientLightGUI.open();
 
   //GUI for HemisphereLight
   var hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
   var hemisphereLightGUI = gui.addFolder("Hemisphere Light");
   scene.add(hemisphereLight);
   hemisphereLightGUI
     .addColor(new ColorGUIHelper(hemisphereLight, "color"), "value")
     .name("skyColor");
   hemisphereLightGUI
     .addColor(new ColorGUIHelper(hemisphereLight, "groundColor"), "value")
     .name("groundColor");
   hemisphereLightGUI.add(hemisphereLight, "intensity", 0, 5, 0.01);
 
   // Position GUI
   gui.domElement.style.position = "absolute";
   gui.domElement.style.top = "150px";
   gui.domElement.style.right = "-10px";



  
  // Light
  var pointLight = getPointLight(0xffffff, 100, 100);

  // Khởi tạo một đối tượng hình cầu đại diện cho PointLight
  var sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var pointLightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  pointLightSphere.position.copy(pointLight.position);

  // Cập nhật vị trí của pointLight khi pointLightSphere di chuyển
  transformControls.addEventListener("objectChange", function () {
    pointLight.position.copy(pointLightSphere.position);
  });

  var gui = new GUI();
  gui.domElement.id = "GUI";

  var planeColorGUI;
  var colorGUI = gui.addFolder("Color");
  addColorGUI(material, "Geometry Color", { color: 0xffffff }, colorGUI);
  colorGUI.open();

  camera.position.x = 1;
  camera.position.y = 2;
  camera.position.z = 5;

  const translateBtn = document.getElementById("translateMeshBtn");
  const scaleBtn = document.getElementById("scaleMeshBtn");
  const rotateBtn = document.getElementById("rotateMeshBtn");

  // Make interface
  translateBtn.addEventListener('click', function (){
    transformControls.mode = 'translate';
  });

  scaleBtn.addEventListener('click', function(){
    transformControls.mode = 'scale';
  });

  rotateBtn.addEventListener('click', function(){
    transformControls.mode = 'rotate';
  });

  // Button event for Translate Light
  document.getElementById("translateLightBtn").addEventListener("click", () => {
    if (!transformActive) {
      transformControls.attach(pointLightSphere);
      scene.add(transformControls);
    } else {
      transformControls.detach();
      scene.remove(transformControls);
    }
    transformActive = !transformActive; // Đảo ngược trạng thái
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onDocumentMouseDown = (event) => {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(array_mesh);
    if (intersects.length > 0) {
      currentObject = intersects[0].object;
      current_mesh = currentObject;
      console.log('Selected mesh:', current_mesh);
      if (objectTransformActive) {
        transformControls.attach(currentObject);
      }
    }
  };

  function onMouseClick(event) {
    // Normalize mouse position to -1 to 1 range
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(array_mesh);

    if (intersects.length > 0) {
      let selectedObject = intersects[0].object;
      transformControls.attach(selectedObject);
      scene.add(transformControls);
    }
  }

  window.addEventListener("click", onMouseClick, false);

  document.addEventListener("mousedown", onDocumentMouseDown, false);

  let angle = 0;
  const radius = 5;

  function animate() {
    requestAnimationFrame(animate);

    angle += 0.01;
    pointLight.position.x = radius * Math.cos(angle);
    pointLight.position.z = radius * Math.sin(angle);
    pointLightSphere.position.copy(pointLight.position);

    if ( rotateAnimation || upDownAnimation || scaleAnimation || orbitAnimation ) {
      scene.children.forEach((mesh) => {
        if (mesh instanceof THREE.Mesh && mesh !== pointLightSphere) {
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
            const orbitRadius = 5; // use a different variable to avoid shadowing `radius`
            mesh.position.x += 0.01 * Math.cos(time);
            mesh.position.z += 0.01 * Math.sin(time);
          }
        }
      });

      // if (rotateAnimation) {
      //   current_mesh.rotation.x += 0.01;
      //   current_mesh.rotation.y += 0.01;
      // }
      // if (upDownAnimation) {
      //   current_mesh.position.y = 10 * Math.abs(Math.sin(Date.now() * 0.001));
      // }
      // if (scaleAnimation) {
      //   const scale = 1 + 0.5 * Math.sin(Date.now() * 0.001);
      //   current_mesh.scale.set(scale, scale, scale);
      // }
      // if (orbitAnimation) {
      //   const time = Date.now() * 0.001;
      //   const orbitRadius = 5; // use a different variable to avoid shadowing `radius`
      //   current_mesh.position.x = orbitRadius * Math.cos(time);
      //   current_mesh.position.z = orbitRadius * Math.sin(time);
      // }
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

  // Light control
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

      planeColorGUI = addColorGUI(
        plane.material,
        "Plane Color",
        { color: 0x15151e },
        colorGUI
      );
    } else {
      hasLight = false;

      scene.remove(pointLight);
      scene.remove(pointLightSphere);
      transformControls.detach(pointLightSphere);
      scene.remove(scene.getObjectByName("PointLightHelper"));
      gridHelper.remove(scene.getObjectByName("Plane"));

      colorGUI.remove(planeColorGUI);
    }
  });

  var lightGUI = gui.addFolder("Light Control");
  lightGUI.add(pointLight, "intensity", 1, 20, 1).name("Intensity");
  lightGUI.add(pointLight, "distance", 1, 200, 1).name("Distance");
  addColorGUI(pointLight, "Light Color", { color: 0xffffff }, lightGUI);
  lightGUI.open();

  gui.domElement.style.position = "absolute";
  gui.domElement.style.top = "150px";
  gui.domElement.style.right = "-10px";

  

} 

// Surface handling
function handleSurfaceClick(event){
  var loader = new THREE.TextureLoader();
  var surfaceType = event.target.textContent;
  switch (surfaceType){
    case "Wireframe":
      current_mesh.material.wireframe = !current_mesh.material.wireframe;
      current_mesh.material.needsUpdate = true;
      break;
    case "Rock":
      current_mesh.material.map = loader.load('./img/rock.png');
      current_mesh.material.needsUpdate = true;
      console.log("loaded rock texture");
      break;
    case "Soil":
      current_mesh.material.map = loader.load('./img/soil.png');
      current_mesh.material.needsUpdate = true;
      console.log("loaded soil texture");
      break;
    case "Water":
      current_mesh.material.map = loader.load('./img/water.jpg');
      current_mesh.material.needsUpdate = true;
      console.log("loaded water texture");
      break;
    case "Wood":
      current_mesh.material.map = loader.load('./img/wood.jpg');
      current_mesh.material.needsUpdate = true;
      console.log("loaded wood texture");
      break;
    default:
      console.warn(`Surface type "${surfaceType}" not recognized.`);
  }
}

function setupEventSurfaceListaner(){
  var surfaceOptions = document.querySelectorAll(".texture");
  surfaceOptions.forEach((option) => {
    option.addEventListener("click", handleSurfaceClick);
  });
}

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

function setupEventGeometryListeners() {
  const geometryOptions = document.querySelectorAll(".geometry");
  geometryOptions.forEach((option) => {
    option.addEventListener("click", handleGeometryClick);
  });
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
    case "Import":
      alert("Import functionality not implemented yet.");
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

    currentObject = mesh; // Set the current object to the newly created mesh
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
  mesh.receiveShadow = true; // Receive shadow (Nhận đỗ bóng).
  mesh.rotation.x = Math.PI / 2;
  mesh.name = "Plane";

  return mesh;
}

function getPointLight(color, intensity, distance) {
  var pointLight = new THREE.PointLight(color, intensity, distance);
  pointLight.position.set(10, 10, 10);
  pointLight.castShadow = true; // Đổ bóng
  pointLight.name = "PointLight";

  return pointLight;
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

init();
setupEventGeometryListeners();
setupEventSurfaceListaner();
