require([
	'goo/entities/World',
	'goo/renderer/Material',
	'goo/entities/GooRunner',
	'goo/entities/components/ScriptComponent',
	'goo/entities/EntityUtils',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/PointLight',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/math/Vector3',
	'goo/renderer/shaders/ShaderLib',
	'goo/scripts/WASDControlScript',
	'goo/scripts/MouseLookControlScript',
	'goo/renderer/MeshData',
	'goo/renderer/Shader',
	'goo/renderer/Util',
	'goo/renderer/TextureCreator',
	'goo/renderer/pass/RenderTarget',
	'goo/math/Plane',
	'goo/addons/water/ProjectedGridWaterRenderer',
	'goo/shapes/ProjectedGrid',
	'goo/shapes/ShapeCreator'
], function (
	World,
	Material,
	GooRunner,
	ScriptComponent,
	EntityUtils,
	LightComponent,
	PointLight,
	Camera,
	CameraComponent,
	OrbitCamControlScript,
	Vector3,
	ShaderLib,
	WASDControlScript,
	MouseLookControlScript,
	MeshData,
	Shader,
	Util,
	TextureCreator,
	RenderTarget,
	Plane,
	ProjectedGridWaterRenderer,
	ProjectedGrid,
	ShapeCreator
) {
	"use strict";

	var cameraEntity = null;
	var skybox = null;
	var gui = null;
	var goo;

	function init () {
		goo = new GooRunner({
			//showStats: true,
			//antialias: true
		});
		goo.renderer.setClearColor(0.55, 0.55, 0.5, 1.0);
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		gui = new window.dat.GUI();

		var camera = new Camera(45, 1, 1, 2000);
		cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.setd(0, 300, 900);
		// cameraEntity.transformComponent.transform.translation.setd(20,150,250);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 100, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();

		var scripts = new ScriptComponent();
		scripts.scripts.push(new WASDControlScript({
			domElement: goo.renderer.domElement,
			walkSpeed: 145.0,
			crawlSpeed: 10.0
		}));
		scripts.scripts.push(new MouseLookControlScript({
			domElement: goo.renderer.domElement
		}));
		cameraEntity.setComponent(scripts);

		// Setup light
		var light = new PointLight();
		//var entity = createBox(ShaderLib.simple, 1, 1, 1);
		//var entity = EntityUtils.createTypicalEntity(goo.world, box);
		var entity = goo.world.createEntity('light');
		entity.transformComponent.transform.translation.x = -300;
		entity.transformComponent.transform.translation.y = 300;
		entity.transformComponent.transform.translation.z = -300;
		entity.setComponent(new LightComponent(light));
		entity.addToWorld();

		// Examples of model loading
		loadSkybox(goo);

		createBoxes();
		/*
		var entity = createBox(ShaderLib.simpleLit, 10, 10, 10);
		entity.addToWorld();
		var script = {
			run: function (entity) {
				var t = entity._world.time;
				var transformComponent = entity.transformComponent;
				entity.transformComponent.transform.setRotationXYZ(
					World.time * 1.2,
					World.time * 2.0,
					0
				);
				transformComponent.transform.translation.y = Math.sin(t) * 5 + 25;
				transformComponent.setUpdated();
			}
		};
		entity.setComponent(new ScriptComponent(script));*/

		var projectedGrid = new ProjectedGrid(100, 100);
		var waterEntity = EntityUtils.createTypicalEntity(goo.world, projectedGrid);
		var material = Material.createMaterial(ShaderLib.simple, 'mat');
		waterEntity.meshRendererComponent.materials.push(material);
		waterEntity.addToWorld();

		var waterRenderer = new ProjectedGridWaterRenderer();
		goo.renderSystem.preRenderers.push(waterRenderer);

		waterRenderer.setWaterEntity(waterEntity);
		waterRenderer.setSkyBox(skybox);

		gui.add(projectedGrid, 'freezeProjector');
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'grid');
		//gui.add(waterRenderer.waterMaterial.shader.uniforms, 'time');
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'fogStart', 0.0, 1.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'heightMultiplier', 0.0, 200.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'coarseStrength', 0.0, 2.0);
		gui.add(waterRenderer.waterMaterial.shader.uniforms, 'detailStrength', 0.0, 2.0);
		//gui.addColor(waterRenderer.waterMaterial.shader.uniforms, 'waterColor');

		waterRenderer.waterMaterial.shader.uniforms.heightMultiplier = 30;
		waterRenderer.waterMaterial.shader.uniforms.waterColor[0] = 10;
		waterRenderer.waterMaterial.shader.uniforms.waterColor[1] = 10;
		waterRenderer.waterMaterial.shader.uniforms.waterColor[2] = 0;
		waterRenderer.waterMaterial.shader.rebuild();
		// entity = createBox(goo, ShaderLib.textured, 70, 2, 50);
		// entity.transformComponent.transform.translation.x = 100;
		// entity.transformComponent.transform.translation.y = 25;
		// entity.meshRendererComponent.materials[0].textures[0] = waterRenderer.heightTarget;
		// entity.addToWorld();

		// entity = createBox(goo, ShaderLib.textured, 70, 2, 50);
		// entity.transformComponent.transform.translation.x = -100;
		// entity.transformComponent.transform.translation.y = 25;
		// entity.meshRendererComponent.materials[0].textures[0] = waterRenderer.normalTarget;
		// entity.addToWorld();
	}

	function loadSkybox (goo) {
		var environmentPath = '../resources/skybox/';
		var textureCube = new TextureCreator().loadTextureCube([
			environmentPath + '1.jpg',
			environmentPath + '3.jpg',
			environmentPath + '5.jpg',
			environmentPath + '6.jpg',
			environmentPath + '4.jpg',
			environmentPath + '2.jpg'
		]);
		skybox = createBox(skyboxShader, 10, 10, 10);
		skybox.meshRendererComponent.materials[0].setTexture(Shader.DIFFUSE_MAP, textureCube);
		skybox.meshRendererComponent.materials[0].cullState.cullFace = 'Front';
		skybox.meshRendererComponent.materials[0].depthState.enabled = false;
		skybox.meshRendererComponent.materials[0].renderQueue = 0;
		skybox.meshRendererComponent.cullMode = 'Never';
		skybox.addToWorld();

		goo.callbacksPreRender.push(function () {
			var source = cameraEntity.transformComponent.worldTransform;
			var target = skybox.transformComponent.worldTransform;
			target.translation.setv(source.translation);
			target.update();
		});
	}

	function createBox (shader, w, h, d) {
		var box = ShapeCreator.createBox(w, h, d);
		var entity = EntityUtils.createTypicalEntity(goo.world, box);
		var material = Material.createMaterial(shader, 'mat');
		entity.meshRendererComponent.materials.push(material);
		return entity;
	}

	var numberOfRows = 5;
	var numberOfColumns = 8;
	var boxes = [];
	function createBoxes() {
		debugger
		for(var row = 0; row < numberOfRows; ++row) {
			for(var col = 0; col < numberOfColumns; ++col) {
				var entity = createBox(ShaderLib.simpleLit, 80, 100, 80);
				entity.transformComponent.transform.translation.x = (col - numberOfColumns * .5 + .5) * 100;
				entity.transformComponent.transform.translation.y = 0;
				entity.transformComponent.transform.translation.z = (row - numberOfRows * .5 + .5) * 100;
				entity.addToWorld();
			}
		}
	}

	var skyboxShader = {
		attributes: {
			vertexPosition: MeshData.POSITION
		},
		uniforms: {
			viewMatrix: Shader.VIEW_MATRIX,
			projectionMatrix: Shader.PROJECTION_MATRIX,
			worldMatrix: Shader.WORLD_MATRIX,
			cameraPosition: Shader.CAMERA,
			diffuseMap: Shader.DIFFUSE_MAP
		},
		vshader: [ //
			'attribute vec3 vertexPosition;', //

			'uniform mat4 viewMatrix;', //
			'uniform mat4 projectionMatrix;',//
			'uniform mat4 worldMatrix;',//
			'uniform vec3 cameraPosition;', //

			'varying vec3 eyeVec;',//

			'void main(void) {', //
			'	vec4 worldPos = worldMatrix * vec4(vertexPosition, 1.0);', //
			'	gl_Position = projectionMatrix * viewMatrix * worldPos;', //
			'	eyeVec = cameraPosition - worldPos.xyz;', //
			'}'//
		].join('\n'),
		fshader: [//
			'precision mediump float;',//

			'uniform samplerCube diffuseMap;',//

			'varying vec3 eyeVec;',//

			'void main(void)',//
			'{',//
			'	vec4 cube = textureCube(diffuseMap, eyeVec);',//
			'	gl_FragColor = cube;',//
			// ' gl_FragColor = vec4(1.0,0.0,0.0,1.0);',//
			'}'//
		].join('\n')
	};

	init();
});