import { superHyperboloid, superToroid } from './drawer.js';
import { scale4, isPowerOf2, transpose, invert } from './toolkit.js';

let canvas;
let gl;
let program;

let viewMatrix;
let projectionMatrix;

// Camera
let radius = 160;
let xRot = 110;
let yRot = 180;
let zRot = 0;

let rotState = 0;
let rotAngle = 0;

let exponent1 = 1;
let exponent2 = 1;

let shape = 1;
let wireMode = 1;
let shading = 0;

let ka = 0.0;
let kd = 0.7;
let ks = 0.8;
let shin = 0.35;

// Hyperboloid of One sheet
let hyperboloid;
let h_trans = vec3(0, 0, 0);
let h_rot = vec3(0, 0, 0);
let h_scale = 0.7;
let h_triangleStrip = null;
let h_wireFrame = null;

// Toroid
let toroid;
let t_trans = vec3(0, 0, 0);
let t_rot = vec3(0, 0, 0);
let t_scale = 0.4;
let t_triangleStrip = null;
let t_wireFrame = null;

window.onload = function() {
	canvas = document.getElementById('render-surface');
	gl = canvas.getContext('webgl');

	if (!gl) gl = canvas.getContext('experimental-webgl');
	if (!gl) return alert("Your browser doesn't support WEBGL");

	program = initShaders(gl, 'vertexShader', 'fragmentShader');
	gl.useProgram(program);

	gl.bindTexture(gl.TEXTURE_2D, getTexture('donut'));
	gl.activeTexture(gl.TEXTURE0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1.0);

	bindEvents();

	render();
};

function bindEvents() {
    $(document).keypress(e => {
        if (e.charCode === 119) { // W
            xRot += 1;
        }
        else if (e.charCode === 115) { // S
            xRot -= 1;
        }
        else if (e.charCode === 97) { // A
            zRot += 1;
        }
        else if (e.charCode === 100) { // D
            zRot -= 1;
        }
		else if (e.charCode === 113) { // Q
			radius -= 1;
        }
		else if (e.charCode === 101) { // E
			radius += 1;
		}
	});
	
	$('#toggleRotation').click(() => {
		rotState = (rotState + 1) % 4;
	});

	$('#defcam').click(() => {
		radius = 160;
		xRot = 110;
		yRot = 180;
		zRot = 0;
	});

	$('#exponent1').slider({
		min: 1,
		max: 3,
		value: 1,
		step: 0.01,
		slide: function(e, ui) {
			exponent1 = ui.value;
		}
	});
	
	$('#exponent2').slider({
		min: 0.3,
		max: 3,
		value: 1,
		step: 0.01,
		slide: function(e, ui) {
			exponent2 = ui.value;
		}
	});

	$('#size').slider({
		min: 0.1,
		max: 3,
		value: 1,
		step: 0.01,
		slide: function(e, ui) {
			h_scale = ui.value;
			t_scale = ui.value;
		}
	});

	$('#ka').slider({
		min: 0,
		max: 1,
		value: 0,
		step: 0.01,
		slide: function(e, ui) {
			ka = ui.value;
		}
	});

	$('#kd').slider({
		min: 0,
		max: 1,
		value: 0.7,
		step: 0.01,
		slide: function(e, ui) {
			kd = ui.value;
		}
	});

	$('#ks').slider({
		min: 0,
		max: 1,
		value: 0.8,
		step: 0.01,
		slide: function(e, ui) {
			ks = ui.value;
		}
	});

	$('#shin').slider({
		min: 0.1,
		max: 3,
		value: 0.35,
		step: 0.01,
		slide: function(e, ui) {
			shin = ui.value;
		}
	});

	$('.selectable').selectable();

	$('#shape').on('selectableselected', (event, ui) => {
		if (ui.selected.value === 0) { // Hyperboloid
			shape = 0;
		}
		else if (ui.selected.value === 1) { // Toroid
			shape = 1;
		}
	});

	$('#shading').on('selectableselected', (event, ui) => {
		if (ui.selected.value === 0) { // Gouraud Shaded (per vertex)
			shading = 0;
		}
		else if (ui.selected.value === 1) { // Phong Shaded (per fragment)
			shading = 1;
		}
	});

	$('#texture').on('selectableselected', (event, ui) => {
		if (ui.selected.value === 0) { // Donut
			gl.bindTexture(gl.TEXTURE_2D, getTexture('donut'));
			gl.activeTexture(gl.TEXTURE0);
		}
		else if (ui.selected.value === 1) { // Iron Man
			gl.bindTexture(gl.TEXTURE_2D, getTexture('ironman'));
			gl.activeTexture(gl.TEXTURE0);
		}
		else if (ui.selected.value === 2) { // Spider Man
			gl.bindTexture(gl.TEXTURE_2D, getTexture('spiderman'));
			gl.activeTexture(gl.TEXTURE0);
		}
		else if (ui.selected.value === 3) { // Batman
			gl.bindTexture(gl.TEXTURE_2D, getTexture('batman'));
			gl.activeTexture(gl.TEXTURE0);
		}
	});

	$('#form').click(e => {
		if (e.target.innerText === "Go Wireframe") {
			e.target.innerText = "Go Shaded";
			wireMode = 0;
		}
		else {
			e.target.innerText = "Go Wireframe";
			wireMode = 1;
		}
			
	});
}

function render() {
	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

	viewMatrix = lookAt(vec3(0, 0, radius), vec3(0, 0, 0), vec3(0, 1, 0));
	viewMatrix = mult(viewMatrix, rotate(xRot, vec3(1, 0, 0)));
	viewMatrix = mult(viewMatrix, rotate(yRot, vec3(0, 1, 0)));
	viewMatrix = mult(viewMatrix, rotate(zRot, vec3(0, 0, 1)));

	projectionMatrix = perspective(radians(110), canvas.width / canvas.height, 0.1, 1000000.0);

	hyperboloid = superHyperboloid(50, 50, exponent1, exponent2);
	toroid = superToroid(51, 51, exponent1, exponent2, 1.7);

	h_trans = vec3(0, 0, 0);
	h_rot = vec3(0, 180, rotAngle);

	t_trans = vec3(0, 0, 0);
	t_rot = vec3(0, 180, rotAngle);
	
	if (shape === 0)
		renderHyperboloid();
	else
		renderToroid();

	if (rotState === 0)
		rotAngle += 0.4;
	else if (rotState === 2)
		rotAngle -= 0.4;

	requestAnimationFrame(render);
}

function getTexture(id) {
	let ext = gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
	if (!ext) ext = gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
	if (!ext) alert('Anisopropic filtering not supported!');

	const image = document.getElementById(id);
	const t = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, t);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);

	return t;
}

function renderHyperboloid() {
	let positionAttribLocation = gl.getAttribLocation(program, 'vPosition');
	let texCoordAttribLocation = gl.getAttribLocation(program, 'vTexCoord');
	let normalAttribLocation = gl.getAttribLocation(program, 'vNormal');

	const vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hyperboloid.vertices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(positionAttribLocation);

	const tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hyperboloid.textures), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	const nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hyperboloid.normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, gl.TRUE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(normalAttribLocation);

	let matrix = translate(h_trans[0], h_trans[1], h_trans[2]);
	matrix = mult(matrix, rotate(h_rot[0], vec3(1, 0, 0)));
	matrix = mult(matrix, rotate(h_rot[1], vec3(0, 1, 0)));
	matrix = mult(matrix, rotate(h_rot[2], vec3(0, 0, 1)));
	matrix = mult(matrix, scale4(h_scale, h_scale, h_scale));
	matrix = mult(viewMatrix, matrix);
	matrix = flatten(matrix);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), gl.FALSE, matrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), gl.FALSE, flatten(projectionMatrix));

	let modelviewInv = new Float32Array(16);
	let normalmatrix = new Float32Array(16);
	invert(matrix, modelviewInv);
	transpose(modelviewInv, normalmatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, 'normalMat'), gl.FALSE, normalmatrix);
	
	gl.uniform1f(gl.getUniformLocation(program, 'mode'), shading);
	gl.uniform1f(gl.getUniformLocation(program, 'wireMode'), wireMode);

	gl.uniform1f(gl.getUniformLocation(program, 'Ka'), ka);
	gl.uniform1f(gl.getUniformLocation(program, 'Kd'), kd);
	gl.uniform1f(gl.getUniformLocation(program, 'Ks'), ks);
	gl.uniform1f(gl.getUniformLocation(program, 'shininessVal'), shin);

	// TRIANGLE STRIP
	let M = 50;
	let N = 50;

	h_triangleStrip = new Uint16Array(N * (2 * (M + 1) + 2) - 2);

	let n = 0;
	for (let i = 0; i < N; i++) {
		for (let j = 0; j <= M; j++) {
			h_triangleStrip[n++] = (i + 1) * (M + 1) + j;
			h_triangleStrip[n++] = i * (M + 1) + j;
		}
	}

	// WIRE FRAME
	let lines = [];
	lines.push(h_triangleStrip[0], h_triangleStrip[1]);
	let numStripIndices = h_triangleStrip.length;
	
	for (let i = 2; i < numStripIndices; i++) {
		let a = h_triangleStrip[i - 2];
		let b = h_triangleStrip[i - 1];
		let c = h_triangleStrip[i];

		if (a != b && b != c && c != a) lines.push(a, c, b, c);
	}

	h_wireFrame = new Uint16Array(lines);

	const triangleStripBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleStripBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, h_triangleStrip, gl.STATIC_DRAW);

	const wireFrameBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireFrameBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, h_wireFrame, gl.STATIC_DRAW);

	if (wireMode == 0) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireFrameBuffer);
		gl.drawElements(gl.LINES, h_wireFrame.length, gl.UNSIGNED_SHORT, 0);
	} else {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleStripBuffer);
		gl.drawElements(gl.TRIANGLE_STRIP, h_triangleStrip.length, gl.UNSIGNED_SHORT, 0);
	}
}

function renderToroid() {
	let positionAttribLocation = gl.getAttribLocation(program, 'vPosition');
	let texCoordAttribLocation = gl.getAttribLocation(program, 'vTexCoord');
	let normalAttribLocation = gl.getAttribLocation(program, 'vNormal');

	const vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(toroid.vertices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(positionAttribLocation);

	const tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(toroid.textures), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	const nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(toroid.normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, gl.TRUE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(normalAttribLocation);

	let matrix = translate(t_trans[0], t_trans[1], t_trans[2]);
	matrix = mult(matrix, rotate(t_rot[0], vec3(1, 0, 0)));
	matrix = mult(matrix, rotate(t_rot[1], vec3(0, 1, 0)));
	matrix = mult(matrix, rotate(t_rot[2], vec3(0, 0, 1)));
	matrix = mult(matrix, scale4(t_scale, t_scale, t_scale));
	matrix = mult(viewMatrix, matrix);
	matrix = flatten(matrix);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), gl.FALSE, matrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), gl.FALSE, flatten(projectionMatrix));

	let modelviewInv = new Float32Array(16);
	let normalmatrix = new Float32Array(16);
	invert(matrix, modelviewInv);
	transpose(modelviewInv, normalmatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, 'normalMat'), gl.FALSE, normalmatrix);
	
	gl.uniform1f(gl.getUniformLocation(program, 'mode'), shading);
	gl.uniform1f(gl.getUniformLocation(program, 'wireMode'), wireMode);

	gl.uniform1f(gl.getUniformLocation(program, 'Ka'), ka);
	gl.uniform1f(gl.getUniformLocation(program, 'Kd'), kd);
	gl.uniform1f(gl.getUniformLocation(program, 'Ks'), ks);
	gl.uniform1f(gl.getUniformLocation(program, 'shininessVal'), shin);

	// TRIANGLE STRIP
	let M = 50;
	let N = 50;

	t_triangleStrip = new Uint16Array(N * (2 * (M + 1) + 2) - 2);

	let n = 0;
	for (let i = 0; i < N; i++) {
		for (let j = 0; j <= M; j++) {
			t_triangleStrip[n++] = (i + 1) * (M + 1) + j;
			t_triangleStrip[n++] = i * (M + 1) + j;
		}
	}

	// WIRE FRAME
	let lines = [];
	lines.push(t_triangleStrip[0], t_triangleStrip[1]);
	let numStripIndices = t_triangleStrip.length;
	
	for (let i = 2; i < numStripIndices; i++) {
		let a = t_triangleStrip[i - 2];
		let b = t_triangleStrip[i - 1];
		let c = t_triangleStrip[i];

		if (a != b && b != c && c != a) lines.push(a, c, b, c);
	}

	t_wireFrame = new Uint16Array(lines);

	const triangleStripBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleStripBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, t_triangleStrip, gl.STATIC_DRAW);

	const wireFrameBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireFrameBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, t_wireFrame, gl.STATIC_DRAW);

	if (wireMode == 0) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireFrameBuffer);
		gl.drawElements(gl.LINES, t_wireFrame.length, gl.UNSIGNED_SHORT, 0);
	} else {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleStripBuffer);
		gl.drawElements(gl.TRIANGLE_STRIP, t_triangleStrip.length, gl.UNSIGNED_SHORT, 0);
	}
}