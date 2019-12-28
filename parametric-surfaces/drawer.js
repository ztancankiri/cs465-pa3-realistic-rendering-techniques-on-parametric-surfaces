import { cosp, sinp, tanp, secp, index, distance } from './toolkit.js';

export function superHyperboloid(N, M, n, m) {
    const obj = {};
    obj.vertices = new Float32Array(3 * (N + 1) * (M + 1));
    obj.normals = new Float32Array(3 * (N + 1) * (M + 1));
    obj.textures = new Float32Array(2 * (N + 1) * (M + 1));

	const h = new Float32Array(N + 1);
	const w = new Float32Array(M + 1);

	function pos_x(u, v) {
		return secp(v, n) * cosp(u, m);
	}

	function pos_y(u, v) {
		return secp(v, n) * sinp(u, m);
	}

	function pos_z(u, v) {
		return tanp(v, n);
	}

	function normal_x(u, v) {
		return cosp(v, 2 - n) * cosp(u, 2 - m);
	}

	function normal_y(u, v) {
		return cosp(v, 2 - n) * sinp(u, 2 - m);
	}

	function normal_z(u, v) {
		return sinp(v, 2 - n);
	}

	for (let i = 0; i <= N; i++) {
		for (let j = 0; j <= M; j++) {
			let u = ((2 * Math.PI) / M) * j - Math.PI;
			let v = ((Math.PI / 2) / N) * i - Math.PI / 4;
		
			if (i == 0) {
				obj.vertices[index(3, M + 1, i, j, 0)] = undefined;
				obj.vertices[index(3, M + 1, i, j, 1)] = undefined;
				obj.vertices[index(3, M + 1, i, j, 2)] = undefined;
				obj.normals[index(3, M + 1, i, j, 0)] = undefined;
				obj.normals[index(3, M + 1, i, j, 1)] = undefined;
				obj.normals[index(3, M + 1, i, j, 2)] = undefined;
			}
			else {
				obj.vertices[index(3, M + 1, i, j, 0)] = pos_x(u, v);
				obj.vertices[index(3, M + 1, i, j, 1)] = pos_y(u, v);
				obj.vertices[index(3, M + 1, i, j, 2)] = pos_z(u, v);
				obj.normals[index(3, M + 1, i, j, 0)] = normal_x(u, v);
				obj.normals[index(3, M + 1, i, j, 1)] = normal_y(u, v);
				obj.normals[index(3, M + 1, i, j, 2)] = normal_z(u, v);
			}

			if (i > 1) {
				w[j] += distance(
					vec3(obj.vertices[index(3, M + 1, i - 1, j, 0)], obj.vertices[index(3, M + 1, i - 1, j, 1)], obj.vertices[index(3, M + 1, i - 1, j, 2)]),
					vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
				);
			}

			if (j > 0) {
			    h[i] += distance(
					vec3(obj.vertices[index(3, M + 1, i, j - 1, 0)], obj.vertices[index(3, M + 1, i, j - 1, 1)], obj.vertices[index(3, M + 1, i, j - 1, 2)]),
					vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
				);
			}
		}
	}

	for (let i = 1; i <= N; i++) {
		let d = 0;
		for (let j = 0; j <= M; j++) {
			d += distance(
				vec3(obj.vertices[index(3, M + 1, i, j - 1, 0)], obj.vertices[index(3, M + 1, i, j - 1, 1)], obj.vertices[index(3, M + 1, i, j - 1, 2)]),
				vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
			);
			obj.textures[index(2, M + 1, i, j, 0)] = d / h[i];
		}
	}

	for (let j = 0; j < M + 1; j++) {
		let d = 0;
		for (let i = 2; i < N + 1; i++) {
			d += distance(
				vec3(obj.vertices[index(3, M + 1, i - 1, j, 0)], obj.vertices[index(3, M + 1, i - 1, j, 1)], obj.vertices[index(3, M + 1, i - 1, j, 2)]),
				vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
			);
			obj.textures[index(2, M + 1, i, j, 1)] = d / w[j];
		}
	}

	for (let j = 0; j <= M; j++) {
		obj.textures[index(2, M + 1, 0, j, 0)] = obj.textures[index(2, M + 1, 1, j, 0)];
		obj.textures[index(2, M + 1, N, j, 1)] = obj.textures[index(2, M + 1, N - 1, j, 1)];
	}

	return obj;
}

export function superToroid(N, M, n, m, R) {
    const obj = {};
    obj.vertices = new Float32Array(3 * (N + 1) * (M + 1));
    obj.normals = new Float32Array(3 * (N + 1) * (M + 1));
    obj.textures = new Float32Array(2 * (N + 1) * (M + 1));

	const h = new Float32Array(N + 1);
	const w = new Float32Array(M + 1);

    const pos_x = (u, v) => {
        return (R + cosp(v, n)) * cosp(u, m);
    };

    const pos_y = (u, v) => {
        return (R + cosp(v, n)) * sinp(u, m);
    };

    const pos_z = (u, v) => {
        return sinp(v, n);
    };

    const normal_x = (u, v) => {
        return (R + cosp(v, 2 - n)) * cosp(u, 2 - m);
    };
    
    const normal_y = (u, v) => {
        return (R + cosp(v, 2 - n)) * sinp(u, 2 - m);
    };

    const normal_z = (u, v) => {
        return sinp(v, 2 - n);
    };

	for (let i = 0; i <= N; i++) {
		for (let j = 0; j <= M; j++) {
			let u = ((2 * Math.PI) / M) * j - Math.PI;
            let v = ((2 * Math.PI) / N) * i - Math.PI;

			obj.vertices[index(3, M + 1, i, j, 0)] = pos_x(u, v);
			obj.vertices[index(3, M + 1, i, j, 1)] = pos_y(u, v);
			obj.vertices[index(3, M + 1, i, j, 2)] = pos_z(u, v);
			obj.normals[index(3, M + 1, i, j, 0)] = normal_x(u, v);
			obj.normals[index(3, M + 1, i, j, 1)] = normal_y(u, v);
			obj.normals[index(3, M + 1, i, j, 2)] = normal_z(u, v);

			if (i > 0) {
				w[j] += distance(
					vec3(obj.vertices[index(3, M + 1, i - 1, j, 0)], obj.vertices[index(3, M + 1, i - 1, j, 1)], obj.vertices[index(3, M + 1, i - 1, j, 2)]),
					vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
				);
			}

			if (j > 0) {
				h[i] += distance(
					vec3(obj.vertices[index(3, M + 1, i, j - 1, 0)], obj.vertices[index(3, M + 1, i, j - 1, 1)], obj.vertices[index(3, M + 1, i, j - 1, 2)]),
					vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
				);
			}
		}
	}

	for (let i = 0; i <= N; i++) {
		let d = 0;
		for (let j = 0; j <= M; j++) {
			d += distance(
				vec3(obj.vertices[index(3, M + 1, i, j - 1, 0)], obj.vertices[index(3, M + 1, i, j - 1, 1)], obj.vertices[index(3, M + 1, i, j - 1, 2)]),
				vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
			);
			obj.textures[index(2, M + 1, i, j, 0)] = d / h[i];
		}
    }

	for (let j = 0; j <= M; j++) {
		let d = 0;
		for (let i = 0; i <= N; i++) {
			if (i == 0) {
				obj.textures[index(2, M + 1, 0, j, 1)] = obj.textures[index(2, M + 1, 1, j, 1)];
			} else if (j == M) {
				obj.textures[index(2, M + 1, i, M, 1)] = obj.textures[index(2, M + 1, i, 0, 1)];
			} else {
				d += distance(
                    vec3(obj.vertices[index(3, M + 1, i - 1, j, 0)], obj.vertices[index(3, M + 1, i - 1, j, 1)], obj.vertices[index(3, M + 1, i - 1, j, 2)]),
                    vec3(obj.vertices[index(3, M + 1, i, j, 0)], obj.vertices[index(3, M + 1, i, j, 1)], obj.vertices[index(3, M + 1, i, j, 2)])
                );
                obj.textures[index(2, M + 1, i, j, 1)] = d / w[j];
			}
		}
	}

	for (let j = 0; j <= M; j++) {
		obj.textures[index(2, M + 1, 0, j, 0)] = obj.textures[index(2, M + 1, 1, j, 0)];
		obj.textures[index(2, M + 1, N, j, 1)] = obj.textures[index(2, M + 1, N - 1, j, 1)];
	}

	return obj;
}