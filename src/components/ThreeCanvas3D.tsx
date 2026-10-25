import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeCanvas3DProps {
  className?: string;
  intensity?: number;
  interactive?: boolean;
}

export default function ThreeCanvas3D({
  className = 'fixed inset-0 pointer-events-none -z-10 overflow-hidden',
  intensity = 1,
  interactive = true
}: ThreeCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8f5fc, 0.038);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 4.5, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    renderer.setClearColor(0xf8f5fc, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2 * intensity);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xa855f7, 2 * intensity, 18);
    pointLight.position.set(0, 2, 5);
    scene.add(pointLight);

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(168, 85, 247, 0.85)');
      grad.addColorStop(0.65, 'rgba(124, 58, 237, 0.35)');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    // Wave mesh grid
    const cols = 42;
    const rows = 32;
    const totalPoints = cols * rows;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const spacingX = 0.65;
    const spacingY = 0.65;
    const halfWidth = (cols * spacingX) / 2;
    const halfHeight = (rows * spacingY) / 2;

    const color1 = new THREE.Color(0x7c3aed);
    const color2 = new THREE.Color(0xa855f7);
    const color3 = new THREE.Color(0x60a5fa);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = c * spacingX - halfWidth;
        const z = r * spacingY - halfHeight;
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = z;

        const dist = Math.sqrt((x * x) / (halfWidth * halfWidth) + (z * z) / (halfHeight * halfHeight));
        const col = dist < 0.5 ? color1 : dist < 0.85 ? color2 : color3;
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.position.set(0, -2.8, -1.5);
    points.rotation.x = 0.22;
    scene.add(points);

    // Floating stars
    const starCount = 50;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 22;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.12,
      map: texture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      let cx = 0;
      let cy = 0;
      if ('touches' in e && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if ('clientX' in e) {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }
      mouseX = (cx / window.innerWidth - 0.5) * 2;
      mouseY = (cy / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      camera.position.x = targetX * 1.2;
      camera.position.y = 4.5 - targetY * 0.8;
      camera.lookAt(0, -0.5, 0);

      pointLight.position.x = targetX * 7;
      pointLight.position.y = 2 - targetY * 4;

      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c * spacingX - halfWidth;
          const z = r * spacingY - halfHeight;

          const w1 = Math.sin(x * 0.35 + time * 0.75) * 0.45;
          const w2 = Math.cos(z * 0.38 + time * 0.65) * 0.35;
          const w3 = Math.sin((x + z) * 0.25 + time * 0.5) * 0.2;
          const d = Math.sqrt((x - targetX * 6) ** 2 + z ** 2);
          const ripple = Math.max(0, 1 - d / 6) * 0.35;

          arr[i * 3 + 1] = w1 + w2 + w3 + ripple;
        }
      }
      posAttr.needsUpdate = true;

      stars.rotation.y = time * 0.015;
      stars.rotation.x = Math.sin(time * 0.02) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      starGeom.dispose();
      material.dispose();
      starMat.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [intensity, interactive]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
