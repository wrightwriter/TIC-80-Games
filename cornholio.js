// title:  The redemption of potato dude
// author: Jeyko
// desc:   Shoot guys game
// script: js
// input:  gamepad

// btnmp, spr, map

var weaponTravelDistMax = 40
var t = 0
var tileSz = 8
var movementSpeed = 1.
var mapSzx=30
var mapSzy=17
var g = {
  weapons:[],
  enemies:[],
  controller: {movx: 0, movy:0, shootx:0, shooty:0},
  level: 0,
  score: 0,
  health: 0,
  dead: false,
  shootTimeout: 0,
  me: {
    x: 100,
    y: 100,
    health:0,
    sprint:100,
    facingx: 0,
    facingy: 0,
  },
  projectiles:[]
}

var projectile = {
  directionx: 0,
  directiony: 0,
  x: 0,
  y: 0,
  movementSpeed:2,
  sprite:0,
  pickedUp:true,
  travelDistance:0,
}
var enemy = {
  x: 0,
  y: 0,
  facingx: 0,
  facingy: 0,
  movementSpeed:0.5,
  sprite:193,
  health: 0
}

var camShake = {x: 0, y:0} 
var timeSinceCamShake = 0

function init(){
  music(0)
  g.shootTimeout = 0
  g.controller.shootx = 0
  g.controller.shooty = 0
  g.level = 1
  g.score = 0
  g.me.health = 3
  g.dead = false
  g.me.x = tileSz*mapSzx/2
  g.me.y = tileSz*mapSzy/2
  g.weapons = []
  g.enemies = []
  g.weapons.push(Object.assign({}, projectile))
  g.weapons.push(Object.assign({}, projectile))
}
function input() {
  g.controller.movx = 0
  g.controller.movy = 0
  g.controller.shootx = 0
  g.controller.shooty = 0
  g.controller.sprint = 0
  key(4) ? g.controller.movx = 1 : key(1) ? g.controller.movx = -1 : 0
  key(19) ? g.controller.movy = 1 : key(23) ? g.controller.movy = -1 : 0
  btnp(3) ? g.controller.shootx = 1 : btnp(2) ? g.controller.shootx = -1 : 0
  btnp(1) ? g.controller.shooty = 1 : btnp(0) ? g.controller.shooty = -1 : 0
  if (key(64))
    g.controller.sprint = true
  if (g.controller.movy){
    g.me.facingy=g.controller.movy
    g.me.facingx=0
  }
  if (g.controller.movx){
    g.me.facingy=0
    g.me.facingx=g.controller.movx
  }
}
var tiles = { // [idx, collidable]
	wall: 24,
	bg: 25,
}

function dbgprint(thing, offs){
	print(thing,00 + (offs) ? offs : 0,64)	
}
function wrap(thing, dist) {return (thing + dist*tileSz) % (dist*tileSz)}
function getm(x,y) { return mget(x/tileSz, y/tileSz); }
function distance(a, b) {
  var d = Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2))
  return d
}
function direction(a, b) {
  var dx = a.x - b.x
  var dy = a.y - b.y
  var d = Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2))
  var x = dx/d
  var y = dy/d
  return {x: x, y: y,distance:d}
}

function collide(me, radx, rady){

  if (!radx || !rady) {
    var collRadx = tileSz*0.3
    var collRady = tileSz*0.3
  } else {
    var collRadx = radx
    var collRady = rady
  }
  var c = {wall: false, enemy: false, wallx: 0, wally: 0, weapon: false, weaponIdx: 0}
  var meCentered = {x: me.x + tileSz*0.5, y: me.y + tileSz*0.5}

	if (	
    getm(meCentered.x + collRadx , meCentered.y + tileSz/2) == tiles.wall ||
    getm(meCentered.x - collRadx , meCentered.y + tileSz/2) == tiles.wall
    ){
		c.wally = 1
		c.wall = true
	}
	if (	
    getm(meCentered.x + collRadx , meCentered.y - tileSz/2) == tiles.wall ||
    getm(meCentered.x - collRadx , meCentered.y - tileSz/2) == tiles.wall
    ){
		c.wally = -1
		c.wall = true
	}
	
	if (	
    getm(meCentered.x + tileSz/2 , meCentered.y + collRady) == tiles.wall ||
    getm(meCentered.x + tileSz/2 , meCentered.y - collRady) == tiles.wall
    ){
		c.wallx = 1
		c.wall = true
	}
	if (	
    getm(meCentered.x - tileSz/2  , meCentered.y + collRady) == tiles.wall || 
    getm(meCentered.x - tileSz/2  , meCentered.y - collRady) == tiles.wall 
    ){
		c.wallx = -1
		c.wall = true
  }	

  for (var i = 0; i < g.weapons.length; i++){
    var d = distance(me, g.weapons[i])
    if (d < tileSz && !g.weapons[i].pickedUp && g.weapons[i].travelDistance == weaponTravelDistMax ) {
      c.weapon = true
      c.weaponIdx = i
    }
  }
	
  return c
}
function shooting() {
  // shoot weapon
  for(var i = 0; i < g.weapons.length; i++) {
    if (g.weapons[i].pickedUp) {
      if ( g.shootTimeout > 0 && (g.controller.shootx != 0 || g.controller.shooty != 0)) {
        sfx(07)
        g.shootTimeout = -10
        g.weapons[i].pickedUp = false
        g.weapons[i].travelDistance = 0
        g.weapons[i].directionx = g.controller.shootx
        g.weapons[i].directiony = g.controller.shooty
      }
    }
  }

  // kill enemies
  for (var j = 0; j < g.weapons.length; j++){
    for (var i = 0; i < g.enemies.length; i++){ // TODO: move this up for better performance
      var d = distance(g.enemies[i], g.weapons[j])
      if (d < tileSz && !g.weapons[j].pickedUp && !(g.weapons[j].travelDistance == weaponTravelDistMax) ) {
        sfx(8)
        g.score++
        g.enemies.splice(i, 1)
        g.weapons[j].travelDistance = weaponTravelDistMax
      }
    }
  }

}

function movement() {
  var mep = Object.assign({},g.me)
  var me = g.me
  

  // move player
  var sprintMult = 1
  if (g.controller.sprint && g.me.sprint > 10 ) {
    sprintMult*= 1.77
    g.me.sprint -= 5
  }
  
  me.x += g.controller.movx*movementSpeed*sprintMult
  me.y += g.controller.movy*movementSpeed*sprintMult
  
  var c = collide(me)
  
  if (c.wally>0 && me.y > mep.y) 
    me.y = mep.y
  if (c.wally<0 && me.y < mep.y) 
    me.y = mep.y
  if (c.wallx>0 && me.x > mep.x) 
    me.x = mep.x
  if (c.wallx<0 && me.x < mep.x) 
    me.x = mep.x

  me.y = wrap(me.y, mapSzy)
  me.x = wrap(me.x, mapSzx)

  // move weapons
  if (c.weapon){
      g.weapons[c.weaponIdx].pickedUp = true
  }
  for(var i = 0; i < g.weapons.length; i++) {
    if (g.weapons[i].pickedUp) {
      g.weapons[i].x = me.x
      g.weapons[i].y = me.y
    }
    if (!g.weapons[i].pickedUp) {
      var cW = collide(g.weapons[i])

      if (g.weapons[i].travelDistance < weaponTravelDistMax) {
        if (cW.wall){
          g.weapons.travelDistance = weaponTravelDistMax
        }
        g.weapons[i].travelDistance++
        g.weapons[i].x += g.weapons[i].directionx*g.weapons[i].movementSpeed 
        g.weapons[i].y += g.weapons[i].directiony*g.weapons[i].movementSpeed 
      }

      if (cW.wall){
        g.weapons[i].travelDistance = weaponTravelDistMax
      }
    }
    g.weapons[i].y = wrap(g.weapons[i].y, mapSzy)
    g.weapons[i].x = wrap(g.weapons[i].x, mapSzx)
  }

}

function enemies(){
  // spawn
  if (t%30 == 0 || t == 1 || g.enemies.length ==0 ) { 
    var ra = Math.random()
    ra *= 3
    if (ra < g.level || g.enemies.length ==0) {
      for (var i = 0; i < 50; i++){
        var x = Math.random()*mapSzx*tileSz
        var y = Math.random()*mapSzy*tileSz
        var e = Object.assign({},enemy)
        e.x = x; e.y = y;
        if (distance(g.me, e) > tileSz*5 && !collide(e).wall){
          g.enemies.push(e)
          break
        }
      }
    }
  }

  // move enemies
  for (var i = 0; i < g.enemies.length; i++){
    var mep = Object.assign({},g.enemies[i])
    var e = g.enemies[i]
    
    var d = direction(e, g.me)



    for (var j = 0; j < g.enemies.length; j++){
      if (j !=i){
        var di = direction(e, g.enemies[j])
        if (di.distance < tileSz*2){
          e.y += di.y*Math.exp(-di.distance*0.03)*0.1
          e.x += di.x*Math.exp(-di.distance*0.03)*0.1
        }
      }
    }
    e.x -= d.x*e.movementSpeed
    e.y -= d.y*e.movementSpeed
    
    // e.x = Math.min(e.x,e.movementSpeed)
    // e.y = Math.min(e.y,e.movementSpeed)
    var c = collide(e)
    
    if (Math.abs(d.x) > Math.abs(d.y)){
      e.facingx = Math.sign(d.x)
      e.facingy = 0
      } else {
      e.facingx = 0
      e.facingy = Math.sign(d.y)
    }

    if (c.wally>0 && e.y > mep.y) 
      e.y = mep.y
    if (c.wally<0 && e.y < mep.y) 
      e.y = mep.y
    if (c.wallx>0 && e.x > mep.x) 
      e.x = mep.x
    if (c.wallx<0 && e.x < mep.x) 
      e.x = mep.x

    e.y = wrap(e.y, mapSzy)
    e.x = wrap(e.x, mapSzx)

    // kill u 
    if (d.distance < tileSz*0.5){
      sfx(43)
      g.me.health -= 1
      g.enemies.splice(i,1)
    } else {
      g.enemies[i] = e
    }
  }
}
function drawMap(){
  map(0,0,mapSzx,mapSzy,0 + camShake.x,0 + camShake.y,0)
}

function draw() {

  var rot = g.me.facingy ? g.me.facingy : g.me.facingx ? -g.me.facingy*2 : 0
  if (g.me.facingx)
  rot = g.me.facingx*4
  spr(18-(t%30<15?0:1),g.me.x,g.me.y,0,1,0,rot)

  for(var i = 0; i < g.weapons.length; i++) {
    if (g.weapons[i].pickedUp == false) {
      var rot = 0
      rot += g.weapons[i].directionx*2
      rot += g.weapons[i].directiony
      spr(165,g.weapons[i].x,g.weapons[i].y,0,1,0,rot)
    }
  }
  for(var i = 0; i < g.enemies.length; i++) {
    var rot = 0
    rot += g.enemies[i].facingx*2
    rot -= g.enemies[i].facingy
    spr(48+(t%30<15?0:1),g.enemies[i].x,g.enemies[i].y,0,1,0,rot)
  }

}
function GUI(){
	var offs = 20
	for (var i = 0; i < g.me.health; i++){
		spr(192,offs + i*tileSz + i*3 ,offs,0,1);
	}
	for (var i = 0; i < g.weapons.length; i++){
    if (g.weapons[i].pickedUp) 
      spr(193,offs + i*tileSz,offs*5,0,1);
  }
  var sprintBarPosx =  tileSz*mapSzx/2 - 3.*tileSz
  var sprintBarPosy = offs
  spr(251,sprintBarPosx,sprintBarPosy);
  spr(252,sprintBarPosx + tileSz*1,sprintBarPosy);
  spr(252,sprintBarPosx + tileSz*2,sprintBarPosy);
  spr(252,sprintBarPosx + tileSz*3,sprintBarPosy);
  spr(252,sprintBarPosx + tileSz*4,sprintBarPosy);
  spr(255,sprintBarPosx + tileSz*5,sprintBarPosy);
	for (var i = 0; i < 6*g.me.sprint/100; i++){
    spr(191,sprintBarPosx + i*tileSz,sprintBarPosy,0,1);
	}
	print(g.score,0+mapSzx*tileSz-offs*3,offs)	
	
}

function TIC(){
	cls(0);
  
  if (t > 60*10){
    g.level = 2
  }
  if (g.me.health == 0) {
    g.dead = true
  }
	if (g.level == 0 || g.dead){
    print("--------- Z to start -----------",44,54)
    print("WASD and UP,DOWN,LEFT,RIGHT",44,64 + 10)	
    print("and SHIFT",44 + 45,64 + 20)	
    print(g.score,44 + 25,34)
    if (btn(4)) {init()}
	} else {
    drawMap()
    input()
    enemies()
    movement()
    shooting()
		draw()		
	}
	GUI()
  t+=1
  g.me.sprint += 2
  g.me.sprint = Math.min(g.me.sprint, 100)
  g.shootTimeout+=1
}


