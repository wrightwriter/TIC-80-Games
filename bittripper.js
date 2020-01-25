// title:  PotatoMan
// author: Jeyko
// desc:   Shoot guys game
// script: js
// input:  gamepad
// saveid: asdg.asdg

var message = "PRESS START TO PLAY!"
function dbgprint(thing, offs){
	print(thing,00 + (offs) ? offs : 0,64)	
}
var mapSpeed = 1.1
var mapSzx=30
var mapSzy=17
var tileSz=8
var playerW=4
var t=0
var x=124
var y=24

var meOffsx = 3*tileSz
var g={
	level: 0,
	mapOffs: 0,
	dead: false,
	score: 0,
	me:{
		health: 4,
		x: 0,
		y: 10*tileSz,
		mapId: 0,
		vely: 0,
		ducked: false, 
		ammo: 0,
		jumped: false,
		jumpTimeout: 0,
		facing: {
			x: 0,
			y: 0
		},
		dMove: false
	},
	enemies: []
}
var tiles = { // [idx, collidable]
	wall: 24,
	bg: 25,
}



function init(){
	music(0); g.level = 1;
	g.me.x = meOffsx
	g.me.y = 10
	g.dead = false
	g.mapOffs = 0
}




function generateLevels(){
	if (Math.floor ((g.mapOffs*mapSpeed) % (240*2)) < 3){
		var id = Math.floor(g.mapOffs*mapSpeed/240)
		trace(id)
		
		var idxes = [0,1,2]
		if(id%3 == 1){idxes[0]=0;idxes[1]=2
		}else if(id%3 == 2){idxes[0]=0;idxes[1]=1
		}else {idxes[0]=1;idxes[1]=2} 
		var segments = 3
		var iters = 2
		if (g.mapOffs < 2){
			iters = 3
			idxes = [0,1,2]
		}
		// clear screen
		for(var i = 0; i < iters; i++){
			var l = idxes[i]
			for(var y = 0; y < mapSzy; y++){				
				memcpy(0x08000+l*mapSzx+y*mapSzx*8,0x08000+mapSzx*8*2*mapSzy+y*mapSzx*8, mapSzx)
			}
			for(var s=0;s<segments;s++){
				var h = 4
				var offS = mapSzx*s/segments
				if (!(g.mapOffs<14&&l==0&&s<2) ){				
					//trace(l)
					var r = Math.random()
					var rB = Math.random()
					var rS = Math.floor(r*2.99)
					if (rS==0){
						for (var i = 0; i < rB*1; i++){
							memset(0x08000 + 
									l*mapSzx 
									+ mapSzy*mapSzx*8
									- 8*mapSzx*h
									+ offS + i*2
									, 24, 1)		
						}
					
					}else if(rS==1){
						for (var i=0;i<7;i++){
							memset(0x08000 + 
							  l*mapSzx 
									+ mapSzy*mapSzx*8
									- (8 - i)*mapSzx*h
									+ offS
									, 24, 2)
							}		
						memset(0x08000 + 
						  l*mapSzx 
								+ mapSzy*mapSzx*8
								- 8*mapSzx*h
								+ offS
								, 24, 2)		
					
					}else if(rS==2){
						memset(0x08000 + 
						  l*mapSzx 
								+ mapSzy*mapSzx*8
								- 8*mapSzx*h
								+ offS
								, 24, 2)		
					
					}
				}			
				}
		}
		
		
		
	} 
}



function inRange(ax, ay, bx, by){
	if ( (ax > bx) && (ax < bx + tileSz) &&
		(ay > by) && (ay < by + tileSz)
 	) return true
	return false
}
function getm(x,y) { return mget(x/tileSz, y/tileSz); }
function collide(me){
	var c = {
			wall: false,
			wallx: 0, wally: 0,
			grounded: false,
	 	enemy:false, enemyIdx: 0}
 
	var delta = tileSz/2
	
	var cme = {x:me.x%(mapSzx*tileSz*3),y:me.y}
	if (	getm(cme.x + delta , cme.y + tileSz) == tiles.wall ){
		c.wally -= 1
		c.wall = true
		//me.y -= 1
	}
	if (	getm(cme.x + delta , cme.y) == tiles.wall ){
		c.wally += 1
		c.wall = true
	}
	
	if (	getm(cme.x + tileSz , cme.y + delta) == tiles.wall ){
		c.wallx -= 1
		c.wall = true
	}
	if (	getm(cme.x  , cme.y + delta) == tiles.wall ){
		c.wallx += 1
		c.wall = true
	}	
	
	
	if (	getm(cme.x + delta , cme.y + tileSz + 1) == tiles.wall ){
		c.grounded = true
	}
	
	dbgprint(c.wall)
	
	return c
}

function movement(){
	var mep = Object.assign({},g.me)
 var me = g.me
	me.x = meOffsx + g.mapOffs
	me.mapId = Math.floor((me.x/tileSz)/mapSzx)
	//dbgprint(me.mapId, 200);
	
	var c = collide(me)
	if (c.wallx < 0	){
	 g.dead = true
	}
	if (!c.wall ){
		me.vely -= 0.2
		me.vely = Math.max(me.vely, -2)
		if (btn(1)){
			me.vely -= 0.9;
			me.vely = Math.max(me.vely,-3)
			//me.vely = Math.max(me.vely*4., -3)
		}
		if (!c.grounded){
			me.y -= g.me.vely*1.	
		}
 }
	if (c.grounded){
		me.vely = 0
		if (btnp(0) && me.jumpTimeout >= 0){
			dbgprint("jumped", 100);
			sfx(62)
			me.jumpTimeout = -20
			me.vely += 4.1
			me.y -= 3.1;
		}
	}
	
	me.ducked = false
	if (c.grounded){
		if (btn(1)){
			me.ducked = true
		} 
	}
	
	c = collide(me)
	
 //me.x += c.wallx
	if (c.grounded && c.wally <1){
	 //me.y -= 10.
	}
	//if (c.enemy){
	 //me.health--
		//g.enemies.splice(c.enemyIdx,1)
	//}	
}

function movementEnemies(){
	for (var i = 0; i < enemies.length; i++){
		enemies[i].x
	}
}

var bgPosx=[0,0,0,0]

var bgPosy=[0,0,0,0]

var bgPhase = 0


function drawBackground(){

	var fallSpeed = 1
	var tM = (t*fallSpeed)%(mapSzy*tileSz)
	for(var i=0;i<4;i++){
		for(var j=0;j<4;j++){			
			map(0+mapSzx*2,0+mapSzy*2	,mapSzx,mapSzy,0-mapSzx*tileSz+mapSzx*tileSz*j,0+tM,1,1)	
		}
		for(var h=0;h<4;h++){						
			map(0+mapSzx*2,0+mapSzy*2	,mapSzx,mapSzy,0-mapSzx*tileSz+mapSzx*tileSz*h,0+fallSpeed*tM-mapSzy*tileSz,1,1)	
		}
	}
}

function draw(){
	// me
	

	if(!g.me.ducked){
		spr(18-(t%30<15?0:1),meOffsx,g.me.y,0,1,0,0);
	 spr(1-(t%60<30?0:1),meOffsx,g.me.y - tileSz,0,1,1,1);
	} else {
		spr(35,meOffsx,g.me.y,0,1,0,0);
	}

	for(var i = 0; i < g.enemies.length; i++){
		spr(2,g.enemies[i].x,g.enemies[i].y,-6,1);
	}

}
	

function GUI(){
	var offs = 20
	for (var i = 0; i < g.me.health; i++){
		spr(192,offs + i*tileSz,offs,0,1);
	}
	print(Math.floor(g.mapOffs/10),0+mapSzx*tileSz-offs*3,offs)	
	
}

function drawMap(){

		if(g.me.mapId % 3 == 0){
		
		}
		
		var scrollOffsA = tileSz*mapSzx*3*Math.floor( (g.me.mapId)/3) 
		var scrollOffsB = tileSz*mapSzx*3*Math.floor( (g.me.mapId)/3)
		var scrollOffsC = tileSz*mapSzx*3*Math.floor( (g.me.mapId)/3)
		map(0,0,mapSzx,mapSzy,0-g.mapOffs + scrollOffsA,0,0)
		
		map(0 + mapSzx,0,mapSzx,mapSzy,0-g.mapOffs + mapSzx*tileSz + scrollOffsB,0,0)
		map(0 + mapSzx*2,0,mapSzx,mapSzy,0-g.mapOffs + mapSzx*tileSz*2 + scrollOffsC,0,0)
		//map(0,0,mapSzx,mapSzy,0-g.mapOffs + scrollOffsA,0,0)
		map(0,0,mapSzx,mapSzy,0-g.mapOffs + mapSzx*tileSz*3 + scrollOffsC,0,0)

}

function TIC(){
//	if (!btn()==0) {music(0)};
	cls(0);
	
	if (g.level == 0 || g.dead){
		//init()
		if (g.dead){
			print("You are diiiiiiiiiie!",44,54)
			print(g.mapOffs,44,74)
		} else {
			print(message,44,64)	
		}
		if (btn(4)) {init()}
	} else {
		g.mapOffs += 1*mapSpeed
		
		drawBackground()
		drawMap()
		movement()
		draw()		
		
		generateLevels()
		
	}
	GUI()
	t+=1;
	g.me.jumpTimeout+=1;
}


