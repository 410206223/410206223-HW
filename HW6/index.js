/// <reference types="three"/>
/// <reference types="jquery" />
// @ts-check

var camera, scene, renderer, controls;
var floor;

var logs = [];
var ti = [];
var xyi = [];
var savelogs = [];
var firstPick = true;
var isMoving = false;
var move;
var moveStart;
var t,dt,cspeed = 1,view = 0;

var startTime = new Date().getTime();
var pos = {
  '1': [9, 40],
  '2': [30, 31],
  '3': [30, 14],
  '4': [36, 57],
  '5': [41, 76],
  '6': [70, 79],
  '7': [65, 42]
}
var pickables = [];
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var pick;
var nowtime;

$('#save').click(function() {
  console.log(JSON.stringify(logs));
  var date = new Date();
  var y = date.getFullYear();
  var m = date.getMonth();
  var d = date.getDate();
  var h = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  var rrr = '';
  var len = savelogs.length;
  savelogs[len] = [];
  savelogs[len][0] = y *10000000000  + m * 100000000 + d * 1000000 + h * 10000 + min * 100 + sec;
  savelogs[len][1] = logs;
  for(var i = 0 ; i < savelogs.length ; i ++){
    rrr += savelogs[i][0];
    rrr += JSON.stringify(savelogs[i][1]);
    if(i != savelogs.length - 1)
      rrr += '\n';
  }
  //localStorage.setItem('activity', JSON.stringify(logs));

  $.get('http://localhost:10086/', {data: rrr,dataname: $('#login').val()});

});

var files = ['alan', 'blbn', 'clcn'];

$('#login').append ( "<option></option>" );
for (var i = 0; i < files.length; i++)
	$('#login').append ( "<option value=" + files[i] + ">" + files[i] + "</option>" );


$('#login').change( function() {
	console.log ($(this).val());
  $.get('http://localhost:10086/?name=' + $(this).val(), function (data) {
    console.log(JSON.stringify(data));
    $('#record').empty();
    var xs = data.split('\n');
    $('#record').append ( "<option></option>" );
    for (var i = 0; i < xs.length; i++){
    	$('#record').append ( "<option value=" + xs[i].substr(0, 14) + ">" + xs[i].substr(0, 14) + "</option>" );
      savelogs[i] = [];
      savelogs[i][0] = xs[i].substr(0, 14); 
      savelogs[i][1] = JSON.parse (xs[i].substr(14));

    }
  })
});

$('#play').click(function() {
  startPlayback();
});

$('#clear').click (function() {
  ti = [];
  xyi = [];
  logs = [];
  firstPick = true;
  //move.material.visible = false;
});

$('#record').change( function() {
  for (var i = 0; i < savelogs.length; i++){
    if($(this).val() === savelogs[i][0])
      logs = savelogs[i][1];
  }
});

$('#speed').append ( "<option value=" + 1 + ">" + '1' + "</option>" );
$('#speed').append ( "<option value=" + 0.5 + ">" + '0.5' + "</option>" );
$('#speed').append ( "<option value=" + 2 + ">" + '2' + "</option>" );

$('#speed').change( function() {
  cspeed = +$(this).val();
});

$('#view').append ( "<option value=" + 1 + ">" + '主視角' + "</option>" );
$('#view').append ( "<option value=" + 2 + ">" + '第三人稱' + "</option>" );

$('#view').change( function() {
  if($(this).val() == 1){
    camera.position.set(45,0,100);
    camera.lookAt(new THREE.Vector3(45, 45, 0));
    view = 0;
  }
  else if($(this).val() == 2){
    view = 1;
    camera.position.copy(move.localToWorld(new THREE.Vector3(0, -20, 20)));
    camera.lookAt(move.localToWorld(new THREE.Vector3(0, 0, 0)));
  }
});

$('#stop').click (function() {
  if(isMoving === true){
    nowtime = Date.now();
	  isMoving = false;
  }
  else{
    var lasttime = Date.now();
    lasttime = lasttime - nowtime;
    moveStart = moveStart + lasttime;
    isMoving = true;
  }
});

function startPlayback () {
	if (logs.length === 0)
  	return;
    
	for (var i = 0; i < logs.length; i++) {
  	ti.push (logs[i].dt);
    xyi.push (pos[ logs[i].code]);
  }
  isMoving = true;
  //move.material.visible = true;
  moveStart = new Date().getTime();
  
}
init();
animate();

function loadFloorPlan() {
  // instantiate a loader
  var loader = new THREE.TextureLoader();
	loader.setCrossOrigin(''); // important !

  // load a resource
  loader.load(
    // resource URL
    'http://i.imgur.com/5xTXmNy.png',
    // Function when resource is loaded
    function(texture) {
      // do something with the texture
      // Plane with default texture coordinates [0,1]x[0,1]
      var texMat = new THREE.MeshBasicMaterial({
        map: texture
      });
      floor = new THREE.Mesh(new THREE.PlaneGeometry(88, 94), texMat);
      floor.position.set (44, 47, 0);
      scene.add(floor);
    },
    // Function called when download progresses
    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // Function called when download errors
    function(xhr) {
      console.log('An error happened');
    }
  );
}

function init() {

  var ww = $("#container").innerWidth();
  var hh = $("#container").innerHeight();
  renderer = new THREE.WebGLRenderer();
  //renderer = new THREE.Vector2();
  renderer.setSize(ww, hh);
  //renderer.setClearColor('white');//0x888888
  $("#container").append(renderer.domElement);

  ////////////////////////////////////////////////
  scene = new THREE.Scene();
  //camera = new THREE.OrthographicCamera(0, 90, 100, 0, -1, 100);
  camera = new THREE.PerspectiveCamera();
  camera.position.set(45,0,100);
  camera.lookAt(new THREE.Vector3(45, 45, 0));
  scene.add(camera);



loadFloorPlan();

  var geometry = new THREE.CircleGeometry(2, 32);
  var material = new THREE.MeshBasicMaterial();
  var circle = new THREE.Mesh(geometry, material);

  addLoc(0x0000ff, pos['1'][0], pos['1'][1], '1');
  addLoc(0x00ff00, pos['2'][0], pos['2'][1], '2');
  addLoc(0x00ffff, pos['3'][0], pos['3'][1], '3');
  addLoc(0xff0000, pos['4'][0], pos['4'][1], '4');
  addLoc(0xff00ff, pos['5'][0], pos['5'][1], '5');
  addLoc(0xffff00, pos['6'][0], pos['6'][1], '6');
  addLoc(0x888888, pos['7'][0], pos['7'][1], '7');

  function addLoc(hexColor, x, y, name) {
    var cc = circle.clone();
    cc.material = new THREE.MeshBasicMaterial({
      color: hexColor
    });
    cc.position.set(x, y, 1);
    scene.add(cc);
    cc.name = name;
    pickables.push(cc);
  }

  var moveb = new THREE.Mesh (new THREE.BoxGeometry (2,2,2), new THREE.MeshBasicMaterial({color:'red'}));
  var moveh = new THREE.Mesh (new THREE.TorusKnotGeometry(1, 1, 20, 20), new THREE.MeshBasicMaterial({color:'black'}));
  move = new THREE.Object3D();
  moveb.position.set(0,0,2);
  moveh.position.set(0,0,3);
  move.add(moveb);
  move.add(moveh);
  move.position.set(9,40,0);
  scene.add (move);
  //move.visible = false;
  
  pick = new THREE.Mesh (new THREE.RingGeometry (2, 3, 32), new THREE.MeshBasicMaterial({color:0xefc9ed}));
  scene.add (pick);
  pick.material.visible = false;
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(45,45,0);

  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

  console.log(startTime);

  var wall1 = makebox(31);
  wall1.position.set(3,47, 5);
  wall1.rotation.z = Math.PI / 2;
  scene.add(wall1);
  var wall2 = makebox(18);
  wall2.position.set(11, 32, 5);
  scene.add(wall2);
  var wall3 = makebox(30);
  wall3.position.set(20, 17, 5);
  wall3.rotation.z = Math.PI / 2;
  scene.add(wall3);
  var wall4 = makebox(18);
  wall4.position.set(11, 63, 5);
  scene.add(wall4);
  var wall5 = makebox(52);
  wall5.position.set(45, 2, 5);
  scene.add(wall5);
  var wall6 = makebox(26);
  wall6.position.set(71, 15, 5);
  wall6.rotation.z = Math.PI / 2;
  scene.add(wall6);
  var wall7 = makebox(42);
  wall7.position.set(65, 29, 5);
  scene.add(wall7);
  var wall8 = makebox(64);
  wall8.position.set(85, 60, 5);
  wall8.rotation.z = Math.PI / 2;
  scene.add(wall8);
  var wall9 = makebox(31);
  wall9.position.set(70, 92, 5);
  scene.add(wall9);
  var wall10 = makebox(50);
  wall10.position.set(19, 67, 5);
  wall10.rotation.z = Math.PI / 2;
  scene.add(wall10);
  var wall11 = makebox(28);
  wall11.position.set(33, 92, 5);
  scene.add(wall11);
  var wall12 = makebox(10);
  wall12.position.set(46, 87, 5);
  wall12.rotation.z = Math.PI / 2;
  scene.add(wall12);
  var wall13 = makebox(12);
  wall13.position.set(46, 68, 5);
  wall13.rotation.z = Math.PI / 2;
  scene.add(wall13);
  var wall14 = makebox(12);
  wall14.position.set(45, 48, 5);
  wall14.rotation.z = Math.PI / 2;
  scene.add(wall14);
  var wall15 = makebox(27);
  wall15.position.set(32, 42, 5);
  scene.add(wall15);
  var wall16 = makebox(8);
  wall16.position.set(23, 73, 5);
  scene.add(wall16);
  var wall17 = makebox(11);
  wall17.position.set(41, 73, 5);
  scene.add(wall17);
  
  
}

function makebox(length) {
  var geometry = new THREE.BoxGeometry(length, 1, 10);
  var material = new THREE.MeshBasicMaterial({
    color: 'blue',
    transparent : true,
    opacity: 0.5
  });
  return new THREE.Mesh(geometry, material);
}

function onDocumentMouseUp () {
	pick.material.visible = false;
}

function onDocumentMouseDown(event) {

  event.preventDefault();
  var viewportPos = $('#container').get(0).getBoundingClientRect();
  mouse.x = ((event.clientX - viewportPos.left) / $('#container').innerWidth()) * 2 - 1;
  mouse.y = -((event.clientY - viewportPos.top) / $('#container').innerHeight()) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(pickables);
  if (intersects.length > 0) {
  
  console.log (intersects[0].object.name);
  
  	pick.material.visible = true;
    var xy = pos[intersects[0].object.name];
    pick.position.x = xy[0];
    pick.position.y = xy[1];
    pick.position.z = 1;  // important: set above the floor plan
    
  	if (firstPick) {
    	firstPick = false;
      startTime = new Date().getTime();
      dt = 0;
    } else {
    	dt = new Date().getTime() - startTime;
    }
    var record = {
      dt: dt,
      code: intersects[0].object.name
    };
    logs.push(record);
  }

}

function onWindowResize() {

  var ww = $("#container").innerWidth();
  var hh = $("#container").innerHeight();

  camera.aspect = ww / hh;
  camera.updateProjectionMatrix();
  renderer.setSize(ww, hh);

}

function animate() {
  requestAnimationFrame(animate);
  render();
  
  if (isMoving) {
  	t = new Date().getTime() - moveStart;
    t = t * cspeed;
    if (t > logs[logs.length-1].dt) {
    	isMoving = false;
      return;
    }

    if(view == 1){
      camera.position.copy(move.localToWorld(new THREE.Vector3(0, -20, 20)));
      camera.lookAt(move.localToWorld(new THREE.Vector3(0, 0, 0)));
    }
    var mov = interpolate (t);//移動人偶位子
    move.position.x = mov[0];
    move.position.y = mov[1];
    move.position.z = 2;
  }
  
  function interpolate(t) {
  	for (var i = 0; i < ti.length; i++) {
    	if (t < ti[i]) break;
    }
    var s = (t - ti[i-1])/(ti[i] - ti[i-1]);
    var x = (1-s)*xyi[i-1][0] + s*xyi[i][0];
    var y = (1-s)*xyi[i-1][1] + s*xyi[i][1];
    return [x,y];
  }
  
}

function render() {
  renderer.render(scene, camera);
}