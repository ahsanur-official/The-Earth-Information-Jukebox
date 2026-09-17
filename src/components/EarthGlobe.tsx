import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { VariableId, DatasetMetadata } from "../types";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Layers,
  Sun,
  Moon,
  Flame,
  Mountain,
} from "lucide-react";

interface EarthGlobeProps {
  currentVariable: VariableId;
  variableMetadata: DatasetMetadata;
  currentYear: number;
  normalizedValue: number;
}

export type GlobeMapMode = "blue_marble" | "night_lights" | "thermal" | "topology";

interface Hotspot {
  lat: number;
  lon: number;
  label: string;
  intensity: number;
  description: string;
}

const REGIONAL_HOTSPOTS: Record<VariableId, Hotspot[]> = {
  temperature: [
    { lat: 71.0, lon: -42.0, label: "Greenland Ice Sheet", intensity: 0.95, description: "Accelerated surface ice melt due to Arctic amplification." },
    { lat: 24.5, lon: 54.4, label: "Persian Gulf Thermal Zone", intensity: 0.88, description: "Extreme wet-bulb temperature threshold proximity." },
    { lat: -3.4, lon: -62.2, label: "Amazon Basin", intensity: 0.82, description: "Extended drought stress and elevated canopy temperatures." },
  ],
  ocean: [
    { lat: 28.0, lon: -65.0, label: "Sargasso Sea / Gulf Stream", intensity: 0.92, description: "Record upper ocean heat content and thermal expansion." },
    { lat: -0.5, lon: -120.0, label: "Equatorial Pacific (ENSO)", intensity: 0.9, description: "El Niño thermal accumulation zone driving global weather." },
    { lat: 35.0, lon: 145.0, label: "Kuroshio Extension", intensity: 0.85, description: "Western boundary current marine heatwave region." },
  ],
  sealevel: [
    { lat: 22.3, lon: 89.8, label: "Ganges-Brahmaputra Delta", intensity: 0.95, description: "Critical low-lying coastal exposure to rising sea levels." },
    { lat: -8.5, lon: 179.2, label: "Tuvalu Atolls", intensity: 0.9, description: "Island territory facing existential sea level rise." },
    { lat: 25.8, lon: -80.2, label: "South Florida Coastal Shelf", intensity: 0.85, description: "Porous limestone aquifer saltwater intrusion." },
  ],
  co2: [
    { lat: 19.5, lon: -155.6, label: "Mauna Loa Observatory", intensity: 0.92, description: "Keeling Curve baseline: atmospheric CO2 concentration benchmark." },
    { lat: 31.2, lon: 121.5, label: "East Asia Industrial Belt", intensity: 0.96, description: "Highest global density of anthropogenic fossil emissions." },
    { lat: 51.5, lon: 10.0, label: "Central European Basin", intensity: 0.78, description: "Integrated industrial and energy transformation corridor." },
  ],
  wind: [
    { lat: -55.0, lon: -65.0, label: "Drake Passage / Roaring Forties", intensity: 0.98, description: "Highest continuous circum-Antarctic wind kinetic energy." },
    { lat: 14.0, lon: -40.0, label: "Tropical Atlantic Trade Winds", intensity: 0.75, description: "Saharan dust transport and hurricane steering currents." },
  ],
  precipitation: [
    { lat: 25.3, lon: 91.7, label: "Cherrapunji / Meghalaya", intensity: 0.96, description: "Extreme monsoon orographic rainfall accumulation." },
    { lat: -23.8, lon: -69.2, label: "Atacama Desert Basin", intensity: 0.1, description: "Hyper-arid baseline: lowest annual precipitation on Earth." },
  ],
  vegetation: [
    { lat: -2.0, lon: -60.0, label: "Amazon Dense Rainforest", intensity: 0.94, description: "Planetary biosphere carbon sink and transpiration engine." },
    { lat: 0.5, lon: 25.0, label: "Congo River Basin", intensity: 0.9, description: "Second largest contiguous tropical rainforest expanse." },
    { lat: 60.0, lon: 95.0, label: "Siberian Boreal Taiga", intensity: 0.75, description: "Expansive coniferous forest undergoing permafrost shifts." },
  ],
  wildfire: [
    { lat: -25.0, lon: 135.0, label: "Southeast & Interior Australia", intensity: 0.92, description: "Intense pyrocumulonimbus fire regimes and dry seasons." },
    { lat: 54.0, lon: -115.0, label: "Western Canadian Boreal Zone", intensity: 0.89, description: "Continental smoke plumes from record acreage burns." },
    { lat: -9.0, lon: -55.0, label: "Southern Amazon Deforestation Arc", intensity: 0.86, description: "Agricultural clearing fires and dry-season biomass combustion." },
  ],
  ice: [
    { lat: 78.0, lon: 15.0, label: "Svalbard Arctic Archipelago", intensity: 0.95, description: "Rapid polar ice reduction and winter sea ice retreat." },
    { lat: -75.0, lon: -106.0, label: "Thwaites Glacier / West Antarctica", intensity: 0.96, description: "'Doomsday Glacier' grounding line retreat and ice shelf thinning." },
  ],
  clouds: [
    { lat: 5.0, lon: -160.0, label: "ITCZ Cloud Band", intensity: 0.9, description: "Intertropical Convergence Zone planetary convective storm belt." },
  ],
  pressure: [
    { lat: 65.0, lon: -20.0, label: "Icelandic Low Pressure Cell", intensity: 0.85, description: "Semi-permanent atmospheric circulation driver in the North Atlantic." },
    { lat: 32.0, lon: -35.0, label: "Azores High Pressure Ridge", intensity: 0.88, description: "Subtropical high steering storm tracks across Europe and America." },
  ],
};

// Real NASA Blue Marble and satellite imagery CDN URLs
const TEXTURE_URLS = {
  blue_marble: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  topology: "https://unpkg.com/three-globe/example/img/earth-topology.png",
  night_lights: "https://unpkg.com/three-globe/example/img/earth-night.jpg",
  clouds: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png",
};

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  currentVariable,
  variableMetadata,
  currentYear,
  normalizedValue,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<GlobeMapMode>("blue_marble");
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [textureLoaded, setTextureLoaded] = useState<boolean>(false);

  const threeRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    earthMesh: THREE.Mesh;
    atmosphereMesh: THREE.Mesh;
    cloudsMesh: THREE.Mesh;
    hotspotGroup: THREE.Group;
    graticuleMesh: THREE.LineSegments;
    textureLoader: THREE.TextureLoader;
    cachedTextures: Partial<Record<GlobeMapMode, THREE.Texture>>;
  } | null>(null);

  // Helper: Create a high-detail procedural realistic fallback texture
  const createFallbackEarthTexture = (mode: GlobeMapMode): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    if (mode === "night_lights") {
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, 2048, 1024);
      // City lights clusters
      ctx.fillStyle = "rgba(255, 230, 150, 0.85)";
      const cities = [
        [500, 350], [480, 380], [520, 390], [1200, 320], [1250, 300],
        [1220, 340], [1650, 360], [1680, 420], [1580, 450], [600, 680],
      ];
      cities.forEach(([cx, cy]) => {
        for (let i = 0; i < 40; i++) {
          const rx = cx + (Math.random() - 0.5) * 80;
          const ry = cy + (Math.random() - 0.5) * 50;
          ctx.beginPath();
          ctx.arc(rx, ry, Math.random() * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else if (mode === "thermal") {
      // Thermal infrared false-color gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, "#0c4a6e"); // Polar cold
      grad.addColorStop(0.2, "#0284c7");
      grad.addColorStop(0.5, "#ea580c"); // Equatorial heat
      grad.addColorStop(0.8, "#0284c7");
      grad.addColorStop(1, "#0c4a6e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);
    } else {
      // Realistic ocean and continents
      ctx.fillStyle = "#0a1f44"; // Deep ocean blue
      ctx.fillRect(0, 0, 2048, 1024);

      // Realistic continental silhouettes
      ctx.fillStyle = "#1e392a"; // Land greenery
      // North America
      ctx.beginPath();
      ctx.moveTo(350, 200);
      ctx.lineTo(600, 220);
      ctx.lineTo(580, 480);
      ctx.lineTo(480, 520);
      ctx.lineTo(380, 380);
      ctx.closePath();
      ctx.fill();

      // South America
      ctx.beginPath();
      ctx.moveTo(520, 530);
      ctx.lineTo(680, 600);
      ctx.lineTo(620, 820);
      ctx.lineTo(540, 750);
      ctx.closePath();
      ctx.fill();

      // Eurasia
      ctx.beginPath();
      ctx.moveTo(1000, 200);
      ctx.lineTo(1700, 220);
      ctx.lineTo(1650, 500);
      ctx.lineTo(1350, 450);
      ctx.lineTo(1050, 420);
      ctx.closePath();
      ctx.fill();

      // Africa
      ctx.beginPath();
      ctx.moveTo(1050, 430);
      ctx.lineTo(1300, 450);
      ctx.lineTo(1250, 750);
      ctx.lineTo(1120, 700);
      ctx.closePath();
      ctx.fill();

      // Australia
      ctx.beginPath();
      ctx.arc(1650, 720, 80, 0, Math.PI * 2);
      ctx.fill();

      // Polar ice caps
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(0, 0, 2048, 80);
      ctx.fillRect(0, 940, 2048, 84);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.75;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);

    // 4. Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    const backRimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    backRimLight.position.set(-5, -2, -3);
    scene.add(backRimLight);

    // 5. Texture Loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    const cachedTextures: Partial<Record<GlobeMapMode, THREE.Texture>> = {};

    // Initial fallback texture
    const initialTexture = createFallbackEarthTexture("blue_marble");

    // Earth Sphere Geometry & Mesh
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: initialTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Attempt to load the real NASA Blue Marble satellite photograph
    textureLoader.load(
      TEXTURE_URLS.blue_marble,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        cachedTextures.blue_marble = tex;
        if (earthMesh) {
          earthMat.map = tex;
          earthMat.needsUpdate = true;
          setTextureLoaded(true);
        }
      },
      undefined,
      (err) => {
        console.log("Using procedural high-resolution Earth map (offline mode)", err);
      }
    );

    // Real Topology Bump Map
    textureLoader.load(TEXTURE_URLS.topology, (bumpTex) => {
      bumpTex.wrapS = THREE.RepeatWrapping;
      cachedTextures.topology = bumpTex;
      earthMat.bumpMap = bumpTex;
      earthMat.bumpScale = 0.025;
      earthMat.needsUpdate = true;
    });

    // 6. Realistic Atmosphere Outer Glow
    const atmosGeo = new THREE.SphereGeometry(1.038, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x38bdf8),
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosphereMesh);

    // 7. Realistic Cloud Sphere
    const cloudsGeo = new THREE.SphereGeometry(1.018, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // Load real cloud texture
    textureLoader.load(TEXTURE_URLS.clouds, (cloudTex) => {
      cloudTex.wrapS = THREE.RepeatWrapping;
      cloudsMat.map = cloudTex;
      cloudsMat.needsUpdate = true;
    });

    // 8. Graticule Lines (Subtle latitude/longitude grid)
    const graticuleGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.006, 24, 12));
    const graticuleMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.12,
    });
    const graticuleMesh = new THREE.LineSegments(graticuleGeo, graticuleMat);
    scene.add(graticuleMesh);

    // 9. Hotspots Group
    const hotspotGroup = new THREE.Group();
    scene.add(hotspotGroup);

    // 10. Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 60;
      starPositions[i + 1] = (Math.random() - 0.5) * 60;
      starPositions[i + 2] = (Math.random() - 0.5) * 60;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.07,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    threeRefs.current = {
      scene,
      camera,
      renderer,
      earthMesh,
      atmosphereMesh,
      cloudsMesh,
      hotspotGroup,
      graticuleMesh,
      textureLoader,
      cachedTextures,
    };

    // 11. Mouse & Touch Interaction (Drag to rotate, pinch/wheel to zoom)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      earthMesh.rotation.y += deltaX * 0.005;
      earthMesh.rotation.x += deltaY * 0.005;
      cloudsMesh.rotation.y += deltaX * 0.005;
      cloudsMesh.rotation.x += deltaY * 0.005;
      graticuleMesh.rotation.y += deltaX * 0.005;
      graticuleMesh.rotation.x += deltaY * 0.005;
      hotspotGroup.rotation.y += deltaX * 0.005;
      hotspotGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(1.7, Math.min(4.5, camera.position.z + e.deltaY * 0.002));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    // Touch support
    let touchStart = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      earthMesh.rotation.y += deltaX * 0.006;
      earthMesh.rotation.x += deltaY * 0.006;
      cloudsMesh.rotation.y += deltaX * 0.006;
      cloudsMesh.rotation.x += deltaY * 0.006;
      graticuleMesh.rotation.y += deltaX * 0.006;
      graticuleMesh.rotation.x += deltaY * 0.006;
      hotspotGroup.rotation.y += deltaX * 0.006;
      hotspotGroup.rotation.x += deltaY * 0.006;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDragging = false;
    };
    domEl.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (isRotating && !isDragging) {
        earthMesh.rotation.y += 0.0014;
        cloudsMesh.rotation.y += 0.0021; // Clouds drift faster
        graticuleMesh.rotation.y += 0.0014;
        hotspotGroup.rotation.y += 0.0014;
      }

      // Hotspot beacon pulse
      const time = Date.now() * 0.0035;
      hotspotGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const s = 1 + Math.sin(time + child.position.x * 3) * 0.25;
          child.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel);
      domEl.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      renderer.dispose();
    };
  }, []);

  // Map Mode Texture Switcher
  useEffect(() => {
    if (!threeRefs.current) return;
    const { earthMesh, textureLoader, cachedTextures } = threeRefs.current;
    const earthMat = earthMesh.material as THREE.MeshStandardMaterial;

    if (mapMode === "blue_marble") {
      if (cachedTextures.blue_marble) {
        earthMat.map = cachedTextures.blue_marble;
        earthMat.needsUpdate = true;
      } else {
        textureLoader.load(TEXTURE_URLS.blue_marble, (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          cachedTextures.blue_marble = tex;
          earthMat.map = tex;
          earthMat.needsUpdate = true;
        });
      }
    } else if (mapMode === "night_lights") {
      if (cachedTextures.night_lights) {
        earthMat.map = cachedTextures.night_lights;
        earthMat.needsUpdate = true;
      } else {
        textureLoader.load(
          TEXTURE_URLS.night_lights,
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            cachedTextures.night_lights = tex;
            earthMat.map = tex;
            earthMat.needsUpdate = true;
          },
          undefined,
          () => {
            // Fallback
            earthMat.map = createFallbackEarthTexture("night_lights");
            earthMat.needsUpdate = true;
          }
        );
      }
    } else if (mapMode === "thermal") {
      earthMat.map = createFallbackEarthTexture("thermal");
      earthMat.needsUpdate = true;
    } else if (mapMode === "topology") {
      if (cachedTextures.topology) {
        earthMat.map = cachedTextures.topology;
        earthMat.needsUpdate = true;
      } else {
        textureLoader.load(
          TEXTURE_URLS.topology,
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            cachedTextures.topology = tex;
            earthMat.map = tex;
            earthMat.needsUpdate = true;
          },
          undefined,
          () => {
            earthMat.map = createFallbackEarthTexture("blue_marble");
            earthMat.needsUpdate = true;
          }
        );
      }
    }
  }, [mapMode]);

  // Update Atmosphere and Hotspots when variable or normalizedValue changes
  useEffect(() => {
    if (!threeRefs.current) return;
    const { atmosphereMesh, hotspotGroup } = threeRefs.current;

    const colorMap: Record<VariableId, number> = {
      temperature: 0xf97316,
      ocean: 0x0284c7,
      sealevel: 0x06b6d4,
      co2: 0xa855f7,
      wind: 0x38bdf8,
      precipitation: 0x3b82f6,
      vegetation: 0x10b981,
      wildfire: 0xef4444,
      ice: 0x38bdf8,
      clouds: 0x94a3b8,
      pressure: 0x6366f1,
    };

    const targetColor = new THREE.Color(colorMap[currentVariable] || 0x38bdf8);
    (atmosphereMesh.material as THREE.MeshBasicMaterial).color.set(targetColor);
    (atmosphereMesh.material as THREE.MeshBasicMaterial).opacity = 0.16 + normalizedValue * 0.24;

    // Rebuild Hotspots
    while (hotspotGroup.children.length > 0) {
      hotspotGroup.remove(hotspotGroup.children[0]);
    }

    const hotspots = REGIONAL_HOTSPOTS[currentVariable] || [];
    hotspots.forEach((spot) => {
      const phi = (90 - spot.lat) * (Math.PI / 180);
      const theta = (spot.lon + 180) * (Math.PI / 180);
      const r = 1.025;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      const pinGeo = new THREE.SphereGeometry(0.024 * (0.85 + spot.intensity * 0.4), 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: targetColor,
        transparent: true,
        opacity: 0.95,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(x, y, z);
      (pinMesh as any).userData = spot;

      hotspotGroup.add(pinMesh);
    });

    if (hotspots.length > 0) {
      setActiveHotspot(hotspots[0]);
    } else {
      setActiveHotspot(null);
    }
  }, [currentVariable, normalizedValue]);

  const handleZoom = (delta: number) => {
    if (!threeRefs.current) return;
    const camera = threeRefs.current.camera;
    camera.position.z = Math.max(1.7, Math.min(4.5, camera.position.z + delta));
  };

  const handleResetOrientation = () => {
    if (!threeRefs.current) return;
    const { earthMesh, cloudsMesh, graticuleMesh, hotspotGroup, camera } = threeRefs.current;
    earthMesh.rotation.set(0, 0, 0);
    cloudsMesh.rotation.set(0, 0, 0);
    graticuleMesh.rotation.set(0, 0, 0);
    hotspotGroup.rotation.set(0, 0, 0);
    camera.position.set(0, 0, 2.75);
  };

  return (
    <div className="relative w-full h-[360px] xs:h-[420px] sm:h-[500px] lg:h-[580px] xl:h-[640px] 2xl:h-[720px] rounded-2xl overflow-hidden glass-panel border border-cyan-500/25 shadow-2xl flex items-center justify-center bg-radial-gradient">
      {/* 3D Canvas Mounting Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Top HUD Badges */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-cyan-500/30 text-[10px] sm:text-xs font-mono text-cyan-200 pointer-events-auto shadow-md">
          <span
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: variableMetadata.color }}
          />
          <span className="font-semibold uppercase tracking-wider">
            {variableMetadata.shortName}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">YEAR {currentYear}</span>
        </div>

        {/* Realistic Texture Map Mode Switcher */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 backdrop-blur-md p-0.5 sm:p-1 rounded-xl border border-slate-700/80 text-[10px] sm:text-[11px] font-mono pointer-events-auto shadow-md">
          <button
            onClick={() => setMapMode("blue_marble")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center gap-1 sm:gap-1.5 ${
              mapMode === "blue_marble"
                ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="NASA Blue Marble (Real Satellite Map)"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Blue Marble</span>
            <span className="sm:hidden">Marble</span>
          </button>

          <button
            onClick={() => setMapMode("night_lights")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center gap-1 sm:gap-1.5 ${
              mapMode === "night_lights"
                ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="NASA Black Marble (Night Lights)"
          >
            <Moon className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Night</span>
            <span className="sm:hidden">Night</span>
          </button>

          <button
            onClick={() => setMapMode("thermal")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center gap-1 sm:gap-1.5 ${
              mapMode === "thermal"
                ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Thermal Infrared Heatmap"
          >
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="hidden sm:inline">Thermal</span>
            <span className="sm:hidden">Heat</span>
          </button>

          <button
            onClick={() => setMapMode("topology")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center gap-1 sm:gap-1.5 ${
              mapMode === "topology"
                ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Topography Elevation Relief"
          >
            <Mountain className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Relief</span>
            <span className="sm:hidden">Relief</span>
          </button>
        </div>
      </div>

      {/* Orbit Toggle Pill */}
      <div className="absolute top-12 sm:top-14 left-2 sm:left-3 pointer-events-auto">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-[11px] font-mono transition flex items-center gap-1.5 shadow-md ${
            isRotating
              ? "bg-cyan-950/70 border-cyan-500/40 text-cyan-300"
              : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
          title="Toggle Planetary Orbit Rotation"
        >
          <RotateCw className={`w-3 h-3 ${isRotating ? "animate-spin" : ""}`} />
          <span>{isRotating ? "Orbiting" : "Paused"}</span>
        </button>
      </div>

      {/* Floating Hotspot Regional Callout Card */}
      {activeHotspot && (
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 max-w-[calc(100%-4.5rem)] sm:max-w-xs bg-slate-950/90 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-cyan-500/30 shadow-2xl text-xs font-sans pointer-events-auto">
          <div className="flex items-center justify-between text-cyan-400 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3" />
              OBSERVATION
            </span>
            <span className="text-slate-400">
              {activeHotspot.lat}°N, {activeHotspot.lon}°E
            </span>
          </div>
          <div className="font-bold text-white text-xs sm:text-sm">
            {activeHotspot.label}
          </div>
          <div className="text-slate-300 text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 leading-snug line-clamp-3 sm:line-clamp-none">
            {activeHotspot.description}
          </div>
        </div>
      )}

      {/* Right Control Toolbar */}
      <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex flex-col gap-1 sm:gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-700/70 shadow-xl pointer-events-auto">
        <button
          onClick={() => handleZoom(-0.35)}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.35)}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={handleResetOrientation}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
          title="Reset Camera Orientation"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Subtle Hint */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-mono text-slate-500/80 pointer-events-none hidden md:block bg-slate-950/60 px-2.5 py-0.5 rounded-full border border-slate-800/60">
        DRAG TO ROTATE SATELLITE GLOBE • SCROLL TO ZOOM
      </div>
    </div>
  );
};
