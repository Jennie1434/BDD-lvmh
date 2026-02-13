import React, { useEffect, useRef, useState } from 'react';

const MAISONS = [
    {
        id: '1',
        title: 'Louis Vuitton',
        category: 'Mode, Maroquinerie, Bagagerie',
        prodImg: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '2',
        title: 'Christian Dior',
        category: 'Haute Couture, Prêt-à-porter',
        prodImg: 'https://images.unsplash.com/photo-1539109132381-31a1C97447a1?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '3',
        title: 'Celine',
        category: 'Mode et Accessoires',
        prodImg: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '4',
        title: 'Loewe',
        category: 'Mode Espagnole et Maroquinerie',
        prodImg: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '5',
        title: 'Fendi',
        category: 'Mode, Maroquinerie Italienne',
        prodImg: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '6',
        title: 'Givenchy',
        category: 'Mode et Accessoires',
        prodImg: 'https://images.unsplash.com/photo-1591360236480-4924ec982ca3?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1534030347209-cfa77d0e80a9?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '7',
        title: 'Kenzo',
        category: 'Mode',
        prodImg: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1534030347209-cfa77d0e80a9?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '8',
        title: 'Berluti',
        category: 'Menswear et Maroquinerie',
        prodImg: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '9',
        title: 'Loro Piana',
        category: 'Mode et Textiles haut de gamme',
        prodImg: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '10',
        title: 'Emilio Pucci',
        category: 'Mode',
        prodImg: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '11',
        title: 'Marc Jacobs',
        category: 'Mode',
        prodImg: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1518764876364-21f1d1994e46?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '12',
        title: 'RIMOWA',
        category: 'Bagagerie haut de gamme',
        prodImg: 'https://images.unsplash.com/photo-1565026073747-4938006a642a?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1553531384-411a247ccd73?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '13',
        title: 'Patou',
        category: 'Maison de mode historique',
        prodImg: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '14',
        title: 'Barton Perreira',
        category: 'Lunetterie de luxe',
        prodImg: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1508243529287-e21914733111?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: '15',
        title: 'Vuarnet',
        category: 'Lunettes haut de gamme',
        prodImg: 'https://images.unsplash.com/photo-1511499767390-903390e6fbc4?auto=format&fit=crop&q=80&w=800',
        modelImg: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800',
    },
];

const COL_1 = MAISONS.slice(0, 5);
const COL_2 = MAISONS.slice(5, 10);
const COL_3 = MAISONS.slice(10, 15);

const styles = `
  .maisons-carousel-container {
    background: #ffffff;
    color: #000;
    overflow: hidden;
    position: relative;
    padding: 15vh 0;
  }
  
  .carousel-title-section {
    padding: 0 10vw;
    margin-bottom: 10vh;
    border-left: 2px solid #000;
    margin-left: 5vw;
  }
  
  .carousel-subtitle {
     font-size: 0.8rem;
     text-transform: uppercase;
     letter-spacing: 0.4em;
     color: #888;
     margin-bottom: 1rem;
     display: block;
     font-weight: 700;
  }
  
  .carousel-main-title {
     font-family: 'Playfair Display', serif;
     font-size: clamp(3rem, 8vw, 5rem);
     line-height: 1;
     font-style: italic;
     font-weight: 400;
  }

  .triple-col-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3vw;
    padding: 0 5vw;
    width: 100%;
    align-items: start;
  }

  @media (max-width: 768px) {
    .triple-col-grid {
      display: flex;
      flex-direction: column;
      gap: 15vh;
    }
  }

  .col-wrap {
    display: flex;
    flex-direction: column;
    gap: 6vh;
    will-change: transform;
  }

  .maison-card-premium {
    width: 100%;
    position: relative;
    background: #fdfdfd;
    border: 1px solid rgba(0,0,0,0.05);
    padding: 1.25rem;
    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  }

  .maison-card-premium:hover {
    border-color: #000;
    transform: scale(1.02);
    box-shadow: 0 40px 80px rgba(0,0,0,0.08);
    z-index: 10;
  }

  .image-box-premium {
    position: relative;
    aspect-ratio: 0.75;
    overflow: hidden;
    background: #f0f0f0;
    margin-bottom: 1.5rem;
  }

  .image-box-premium img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease;
    display: block !important;
  }

  .img-primary {
    opacity: 1 !important;
    z-index: 1;
  }

  .img-secondary {
    opacity: 0 !important;
    z-index: 2;
    transform: scale(1.05);
  }

  .maison-card-premium:hover .img-primary {
    opacity: 0 !important;
  }

  .maison-card-premium:hover .img-secondary {
    opacity: 1 !important;
    transform: scale(1);
  }

  .card-label-section {
    text-align: center;
    padding: 0.5rem 0;
  }

  .card-m-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    margin-bottom: 0.2rem;
    letter-spacing: -0.01em;
    font-weight: 500;
  }

  .card-m-cat {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    color: #a0a0a0;
    font-weight: 600;
  }
`;

export default function ExecutiveImpactCarousel() {
    const containerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const loadScripts = async () => {
            const load = (src, name) =>
                new Promise((res, rej) => {
                    if (window[name]) return res();
                    const s = document.createElement('script');
                    s.src = src;
                    s.async = true;
                    s.onload = () => setTimeout(res, 200);
                    s.onerror = rej;
                    document.head.appendChild(s);
                });
            try {
                await load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', 'gsap');
                await load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js', 'ScrollTrigger');
                setIsReady(true);
            } catch (e) {
                console.error('GSAP Loading Error:', e);
                setIsReady(true);
            }
        };
        loadScripts();
    }, []);

    useEffect(() => {
        if (!isReady || !containerRef.current) return;
        const G = window.gsap;
        if (!G) return;
        G.registerPlugin(window.ScrollTrigger);

        const mm = G.matchMedia();
        mm.add('(min-width: 769px)', () => {
            const cols = G.utils.toArray('.col-wrap');
            G.to(cols[0], {
                y: -150,
                scrollTrigger: {
                    trigger: '.triple-col-grid',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            });
            G.to(cols[1], {
                y: 150,
                scrollTrigger: {
                    trigger: '.triple-col-grid',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            });
            G.to(cols[2], {
                y: -150,
                scrollTrigger: {
                    trigger: '.triple-col-grid',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            });
        });

        return () => mm.revert();
    }, [isReady]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <section className="maisons-carousel-container" ref={containerRef}>
                <div className="carousel-title-section">
                    <span className="carousel-subtitle">Exceptional Heritage</span>
                    <h2 className="carousel-main-title">Les Maisons du Groupe</h2>
                </div>

                <div className="triple-col-grid">
                    <div className="col-wrap">{COL_1.map((m) => <MaisonCard key={m.id} maison={m} />)}</div>
                    <div className="col-wrap pt-32">{COL_2.map((m) => <MaisonCard key={m.id} maison={m} />)}</div>
                    <div className="col-wrap">{COL_3.map((m) => <MaisonCard key={m.id} maison={m} />)}</div>
                </div>
            </section>
        </>
    );
}

function MaisonCard({ maison }) {
    const [hasError, setHasError] = useState(false);

    return (
        <div className="maison-card-premium">
            <div className="image-box-premium">
                <img
                    src={
                        hasError
                            ? 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800'
                            : maison.prodImg
                    }
                    className="img-primary"
                    alt={maison.title}
                    loading="eager"
                    onError={() => setHasError(true)}
                />
                <img
                    src={maison.modelImg}
                    className="img-secondary"
                    alt={`${maison.title} lifestyle`}
                    loading="lazy"
                />
            </div>
            <div className="card-label-section">
                <h3 className="card-m-title">{maison.title}</h3>
                <p className="card-m-cat">{maison.category}</p>
            </div>
        </div>
    );
}
