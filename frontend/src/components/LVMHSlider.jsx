import React, { useEffect, useRef } from 'react';

export default function LVMHSlider() {
    const containerRef = useRef(null);

    useEffect(() => {
        const loadScripts = async () => {
            const loadScript = (src, globalName) =>
                new Promise((res, rej) => {
                    if (window[globalName]) {
                        res();
                        return;
                    }
                    if (document.querySelector(`script[src="${src}"]`)) {
                        const check = setInterval(() => {
                            if (window[globalName]) {
                                clearInterval(check);
                                res();
                            }
                        }, 50);
                        setTimeout(() => {
                            clearInterval(check);
                            rej(new Error(`Timeout waiting for ${globalName}`));
                        }, 10000);
                        return;
                    }
                    const s = document.createElement('script');
                    s.src = src;
                    s.onload = () => setTimeout(() => res(), 100);
                    s.onerror = () => rej(new Error(`Failed to load ${src}`));
                    document.head.appendChild(s);
                });

            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', 'gsap');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE');
            } catch (e) {
                console.error('Failed to load base scripts:', e);
            }

            initApplication();
        };

        const initApplication = async () => {
            const SLIDER_CONFIG = {
                settings: {
                    transitionDuration: 2.5,
                    autoSlideSpeed: 3000,
                    currentEffect: 'glass',
                    currentEffectPreset: 'Default',
                    globalIntensity: 1.0,
                    speedMultiplier: 1.0,
                    distortionStrength: 1.0,
                    colorEnhancement: 1.0,
                    glassRefractionStrength: 1.0,
                    glassChromaticAberration: 1.0,
                    glassBubbleClarity: 1.0,
                    glassEdgeGlow: 1.0,
                    glassLiquidFlow: 1.0,
                },
            };

            let currentSlideIndex = 0;
            let isTransitioning = false;
            let shaderMaterial, renderer, scene, camera;
            let slideTextures = [];
            let texturesLoaded = false;
            let autoSlideTimer = null;
            let progressAnimation = null;
            let sliderEnabled = false;

            const SLIDE_DURATION = () => SLIDER_CONFIG.settings.autoSlideSpeed;
            const PROGRESS_UPDATE_INTERVAL = 50;
            const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;

            const base = import.meta.env.BASE_URL || '/';
            const slides = [
                { title: 'Leather Excellence', media: `${base}assets/slide1.png` },
                { title: 'Prestige Bubbles', media: `${base}assets/slide2.png` },
                { title: 'Horological Art', media: `${base}assets/slide3.png` },
                { title: 'Scented Dreams', media: `${base}assets/slide4.png` },
                { title: 'Radiant Light', media: `${base}assets/slide5.png` },
            ];

            const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
            const fragmentShader = `
            uniform sampler2D uTexture1, uTexture2;
            uniform float uProgress;
            uniform vec2 uResolution, uTexture1Size, uTexture2Size;
            uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
            varying vec2 vUv;

            vec2 getCoverUV(vec2 uv, vec2 textureSize) {
                vec2 s = uResolution / textureSize;
                float scale = max(s.x, s.y);
                vec2 scaledSize = textureSize * scale;
                vec2 offset = (uResolution - scaledSize) * 0.5;
                return (uv * uResolution - offset) / scaledSize;
            }
            
            vec4 glassEffect(vec2 uv, float progress) {
                float time = progress * 5.0;
                vec2 uv1 = getCoverUV(uv, uTexture1Size); vec2 uv2 = getCoverUV(uv, uTexture2Size);
                float maxR = length(uResolution) * 0.85; float br = progress * maxR;
                vec2 p = uv * uResolution; vec2 c = uResolution * 0.5;
                float d = length(p - c); float nd = d / max(br, 0.001);
                float param = smoothstep(br + 3.0, br - 3.0, d);
                vec4 img;
                if (param > 0.0) {
                     float ro = 0.08 * uGlassRefractionStrength * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.5, nd), 1.5);
                     vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
                     vec2 distUV = uv2 - dir * ro;
                     distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * nd * param;
                     float ca = 0.02 * uGlassChromaticAberration * pow(smoothstep(0.3, 1.0, nd), 1.2);
                     img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
                     if (uGlassEdgeGlow > 0.0) {
                        float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
                        img.rgb += rim * 0.08 * uGlassEdgeGlow;
                     }
                } else { img = texture2D(uTexture2, uv2); }
                vec4 oldImg = texture2D(uTexture1, uv1);
                if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
                return mix(oldImg, img, param);
            }

            void main() {
                gl_FragColor = glassEffect(vUv, uProgress);
            }
        `;

            const splitText = (text) => {
                return text
                    .split('')
                    .map((char) => `<span style="display: inline-block; opacity: 0;">${char === ' ' ? '&nbsp;' : char}</span>`)
                    .join('');
            };

            const updateContent = (idx) => {
                const titleEl = document.getElementById('mainTitle');
                if (titleEl) {
                    window.gsap.to(titleEl.children, { y: -20, opacity: 0, duration: 0.5, stagger: 0.02, ease: 'power2.in' });
                    setTimeout(() => {
                        titleEl.innerHTML = splitText(slides[idx].title);
                        window.gsap.set(titleEl.children, { opacity: 0 });
                        const children = titleEl.children;
                        switch (idx % 5) {
                            case 0:
                                window.gsap.set(children, { y: 20 });
                                window.gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'power3.out' });
                                break;
                            case 1:
                                window.gsap.set(children, { y: -20 });
                                window.gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'back.out(1.7)' });
                                break;
                            case 2:
                                window.gsap.set(children, { filter: 'blur(10px)', scale: 1.5, y: 0 });
                                window.gsap.to(children, { filter: 'blur(0px)', scale: 1, opacity: 1, duration: 1, stagger: { amount: 0.5, from: 'random' }, ease: 'power2.out' });
                                break;
                            case 3:
                                window.gsap.set(children, { scale: 0, y: 0 });
                                window.gsap.to(children, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'back.out(1.5)' });
                                break;
                            case 4:
                                window.gsap.set(children, { rotationX: 90, y: 0, transformOrigin: '50% 50%' });
                                window.gsap.to(children, { rotationX: 0, opacity: 1, duration: 0.8, stagger: 0.04, ease: 'power2.out' });
                                break;
                            default:
                                break;
                        }
                    }, 500);
                }
            };

            const navigateToSlide = (targetIndex) => {
                if (isTransitioning || targetIndex === currentSlideIndex) return;
                stopAutoSlideTimer();
                quickResetProgress(currentSlideIndex);

                const currentTexture = slideTextures[currentSlideIndex];
                const targetTexture = slideTextures[targetIndex];
                if (!currentTexture || !targetTexture) return;

                isTransitioning = true;
                shaderMaterial.uniforms.uTexture1.value = currentTexture;
                shaderMaterial.uniforms.uTexture2.value = targetTexture;
                shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
                shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;

                updateContent(targetIndex);
                currentSlideIndex = targetIndex;
                updateCounter(currentSlideIndex);
                updateNavigationState(currentSlideIndex);

                window.gsap.fromTo(
                    shaderMaterial.uniforms.uProgress,
                    { value: 0 },
                    {
                        value: 1,
                        duration: TRANSITION_DURATION(),
                        ease: 'power2.inOut',
                        onComplete: () => {
                            shaderMaterial.uniforms.uProgress.value = 0;
                            shaderMaterial.uniforms.uTexture1.value = targetTexture;
                            shaderMaterial.uniforms.uTexture1Size.value = targetTexture.userData.size;
                            isTransitioning = false;
                            safeStartTimer(100);
                        },
                    }
                );
            };

            const handleSlideChange = () => {
                if (isTransitioning || !texturesLoaded || !sliderEnabled) return;
                navigateToSlide((currentSlideIndex + 1) % slides.length);
            };

            const createSlidesNavigation = () => {
                const nav = document.getElementById('slidesNav');
                if (!nav) return;
                nav.innerHTML = '';
                slides.forEach((slide, i) => {
                    const item = document.createElement('div');
                    item.className = `slide-nav-item${i === 0 ? ' active' : ''}`;
                    item.innerHTML = `<div class="slide-progress-line"><div class="slide-progress-fill"></div></div><div class="slide-nav-title">${slide.title}</div>`;
                    item.addEventListener('click', () => {
                        if (!isTransitioning && i !== currentSlideIndex) navigateToSlide(i);
                    });
                    nav.appendChild(item);
                });
            };

            const updateNavigationState = (idx) =>
                document.querySelectorAll('.slide-nav-item').forEach((el, i) => el.classList.toggle('active', i === idx));
            const updateSlideProgress = (idx, prog) => {
                const el = document.querySelectorAll('.slide-nav-item')[idx]?.querySelector('.slide-progress-fill');
                if (el) {
                    el.style.width = `${prog}%`;
                    el.style.opacity = '1';
                }
            };
            const fadeSlideProgress = (idx) => {
                const el = document.querySelectorAll('.slide-nav-item')[idx]?.querySelector('.slide-progress-fill');
                if (el) {
                    el.style.opacity = '0';
                    setTimeout(() => (el.style.width = '0%'), 300);
                }
            };
            const quickResetProgress = (idx) => {
                const el = document.querySelectorAll('.slide-nav-item')[idx]?.querySelector('.slide-progress-fill');
                if (el) {
                    el.style.transition = 'width 0.2s ease-out';
                    el.style.width = '0%';
                    setTimeout(() => (el.style.transition = 'width 0.1s ease, opacity 0.3s ease'), 200);
                }
            };
            const updateCounter = (idx) => {
                const sn = document.getElementById('slideNumber');
                if (sn) sn.textContent = String(idx + 1).padStart(2, '0');
                const st = document.getElementById('slideTotal');
                if (st) st.textContent = String(slides.length).padStart(2, '0');
            };

            const startAutoSlideTimer = () => {
                if (!texturesLoaded || !sliderEnabled) return;
                stopAutoSlideTimer();
                autoSlideTimer = setInterval(handleSlideChange, SLIDE_DURATION());
            };

            const stopAutoSlideTimer = () => {
                if (autoSlideTimer) clearInterval(autoSlideTimer);
                autoSlideTimer = null;
            };

            const safeStartTimer = (delay = 0) => {
                if (autoSlideTimer) clearInterval(autoSlideTimer);
                autoSlideTimer = setTimeout(startAutoSlideTimer, delay);
            };

            const startProgressAnimation = () => {
                if (progressAnimation) clearInterval(progressAnimation);
                let progress = 0;
                progressAnimation = setInterval(() => {
                    progress += PROGRESS_UPDATE_INTERVAL / SLIDE_DURATION() * 100;
                    updateSlideProgress(currentSlideIndex, Math.min(progress, 100));
                    if (progress >= 100) {
                        fadeSlideProgress(currentSlideIndex);
                        progress = 0;
                    }
                }, PROGRESS_UPDATE_INTERVAL);
            };

            const stopProgressAnimation = () => {
                if (progressAnimation) clearInterval(progressAnimation);
                progressAnimation = null;
            };

            const setupRenderer = () => {
                const container = containerRef.current;
                if (!container || !window.THREE) return;
                const width = container.offsetWidth;
                const height = container.offsetHeight;

                renderer = new window.THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(width, height);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.domElement.className = 'webgl-canvas';
                container.appendChild(renderer.domElement);

                scene = new window.THREE.Scene();
                camera = new window.THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
                camera.position.z = 1;

                const geometry = new window.THREE.PlaneGeometry(width, height);
                shaderMaterial = new window.THREE.ShaderMaterial({
                    uniforms: {
                        uTexture1: { value: null },
                        uTexture2: { value: null },
                        uProgress: { value: 0 },
                        uResolution: { value: new window.THREE.Vector2(width, height) },
                        uTexture1Size: { value: new window.THREE.Vector2(1, 1) },
                        uTexture2Size: { value: new window.THREE.Vector2(1, 1) },
                        uGlassRefractionStrength: { value: SLIDER_CONFIG.settings.glassRefractionStrength },
                        uGlassChromaticAberration: { value: SLIDER_CONFIG.settings.glassChromaticAberration },
                        uGlassBubbleClarity: { value: SLIDER_CONFIG.settings.glassBubbleClarity },
                        uGlassEdgeGlow: { value: SLIDER_CONFIG.settings.glassEdgeGlow },
                        uGlassLiquidFlow: { value: SLIDER_CONFIG.settings.glassLiquidFlow },
                    },
                    vertexShader,
                    fragmentShader,
                });

                const mesh = new window.THREE.Mesh(geometry, shaderMaterial);
                scene.add(mesh);
            };

            const loadTextures = () => {
                const loader = new window.THREE.TextureLoader();
                const promises = slides.map((slide) => {
                    return new Promise((resolve) => {
                        loader.load(
                            slide.media,
                            (tex) => {
                                tex.userData = { size: { x: tex.image.width, y: tex.image.height } };
                                resolve(tex);
                            },
                            undefined,
                            () => resolve(null)
                        );
                    });
                });
                return Promise.all(promises);
            };

            const animate = () => {
                requestAnimationFrame(animate);
                if (renderer && scene && camera) renderer.render(scene, camera);
            };

            const onResize = () => {
                const container = containerRef.current;
                if (!container || !renderer || !camera) return;
                const width = container.offsetWidth;
                const height = container.offsetHeight;
                renderer.setSize(width, height);
                camera.left = width / -2;
                camera.right = width / 2;
                camera.top = height / 2;
                camera.bottom = height / -2;
                camera.updateProjectionMatrix();
                shaderMaterial.uniforms.uResolution.value.set(width, height);
            };

            setupRenderer();
            slideTextures = await loadTextures();
            texturesLoaded = true;
            sliderEnabled = true;
            shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
            shaderMaterial.uniforms.uTexture2.value = slideTextures[1] || slideTextures[0];
            shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0]?.userData?.size || { x: 1, y: 1 };
            shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1]?.userData?.size || { x: 1, y: 1 };
            document.querySelector('.slider-wrapper')?.classList.add('loaded');

            updateContent(0);
            updateCounter(0);
            createSlidesNavigation();
            startAutoSlideTimer();
            startProgressAnimation();
            animate();

            window.addEventListener('resize', onResize);
        };

        loadScripts();
    }, []);

    return (
        <section className="slider-wrapper" ref={containerRef}>
            <div className="slide-number" id="slideNumber">
                01
            </div>
            <div className="slide-total" id="slideTotal">
                05
            </div>
            <div className="slide-content">
                <h1 className="slide-title" id="mainTitle">
                    Leather Excellence
                </h1>
                <p className="slide-description">
                    L’excellence artisanale au service de l’élégance contemporaine.
                </p>
            </div>
            <div className="slides-navigation" id="slidesNav" />
        </section>
    );
}
