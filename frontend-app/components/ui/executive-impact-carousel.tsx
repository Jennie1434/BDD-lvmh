"use client";

import React, { useEffect, useRef, useState } from "react";

// Types for global GSAP
declare const gsap: any;

interface Maison {
  id: string;
  title: string;
  category: string;
  prodImg: string;
  modelImg: string;
}

const MAISONS: Maison[] = [
  {
    id: "1",
    title: "Louis Vuitton",
    category: "Mode, Maroquinerie, Bagagerie",
    prodImg: "https://source.unsplash.com/800x800/?luxury,bag",
    modelImg: "https://source.unsplash.com/800x800/?fashion,model"
  },
  {
    id: "2",
    title: "Christian Dior",
    category: "Haute Couture, Prêt-à-porter",
    prodImg: "https://source.unsplash.com/800x800/?haute-couture",
    modelImg: "https://source.unsplash.com/800x800/?runway"
  },
  {
    id: "3",
    title: "Celine",
    category: "Mode et Accessoires",
    prodImg: "https://source.unsplash.com/800x800/?handbag",
    modelImg: "https://source.unsplash.com/800x800/?street-style"
  },
  {
    id: "4",
    title: "Loewe",
    category: "Mode Espagnole et Maroquinerie",
    prodImg: "https://source.unsplash.com/800x800/?leather,craft",
    modelImg: "https://source.unsplash.com/800x800/?editorial,fashion"
  },
  {
    id: "5",
    title: "Fendi",
    category: "Mode, Maroquinerie Italienne",
    prodImg: "https://source.unsplash.com/800x800/?luxury,accessories",
    modelImg: "https://source.unsplash.com/800x800/?fashion,portrait"
  },
  {
    id: "6",
    title: "Givenchy",
    category: "Mode et Accessoires",
    prodImg: "https://source.unsplash.com/800x800/?designer,clothing",
    modelImg: "https://source.unsplash.com/800x800/?atelier"
  },
  {
    id: "7",
    title: "Kenzo",
    category: "Mode",
    prodImg: "https://source.unsplash.com/800x800/?pattern,fashion",
    modelImg: "https://source.unsplash.com/800x800/?colorful,style"
  },
  {
    id: "8",
    title: "Berluti",
    category: "Menswear et Maroquinerie",
    prodImg: "https://source.unsplash.com/800x800/?leather,shoes",
    modelImg: "https://source.unsplash.com/800x800/?menswear"
  },
  {
    id: "9",
    title: "Loro Piana",
    category: "Mode et Textiles haut de gamme",
    prodImg: "https://source.unsplash.com/800x800/?cashmere,fabric",
    modelImg: "https://source.unsplash.com/800x800/?minimal,fashion"
  },
  {
    id: "10",
    title: "Emilio Pucci",
    category: "Mode",
    prodImg: "https://source.unsplash.com/800x800/?print,fashion",
    modelImg: "https://source.unsplash.com/800x800/?resort,style"
  },
  {
    id: "11",
    title: "Marc Jacobs",
    category: "Mode",
    prodImg: "https://source.unsplash.com/800x800/?runway,backstage",
    modelImg: "https://source.unsplash.com/800x800/?editorial,model"
  },
  {
    id: "12",
    title: "RIMOWA",
    category: "Bagagerie haut de gamme",
    prodImg: "https://source.unsplash.com/800x800/?luggage,travel",
    modelImg: "https://source.unsplash.com/800x800/?travel,airport"
  },
  {
    id: "13",
    title: "Patou",
    category: "Maison de mode historique",
    prodImg: "https://source.unsplash.com/800x800/?vintage,fashion",
    modelImg: "https://source.unsplash.com/800x800/?atelier,designer"
  },
  {
    id: "14",
    title: "Barton Perreira",
    category: "Lunetterie de luxe",
    prodImg: "https://source.unsplash.com/800x800/?eyewear,sunglasses",
    modelImg: "https://source.unsplash.com/800x800/?sunglasses,model"
  },
  {
    id: "15",
    title: "Vuarnet",
    category: "Lunettes haut de gamme",
    prodImg: "https://source.unsplash.com/800x800/?glasses,luxury",
    modelImg: "https://source.unsplash.com/800x800/?sport,eyewear"
  }
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
    background: #f0f0f0; /* Visible placeholder */
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

  .dark .maisons-carousel-container {
    background: #0d0d0d;
    color: #fff;
  }
  .dark .carousel-title-section {
    border-color: #fff;
  }
  .dark .maison-card-premium {
    background: #151515;
    border-color: rgba(255,255,255,0.05);
  }
  .dark .maison-card-premium:hover {
    border-color: #fff;
  }
  .dark .image-box-premium {
    background: #1a1a1a;
  }
`;

export default function ExecutiveImpactCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadScripts = async () => {
      const load = (src: string, name: string) => new Promise<void>((res, rej) => {
        if ((window as any)[name]) return res();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
          // Small extra delay to ensure global is accessible
          setTimeout(res, 200);
        };
        s.onerror = rej;
        document.head.appendChild(s);
      });
      try {
        await load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', 'gsap');
        await load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js', 'ScrollTrigger');
        setIsReady(true);
      } catch (e) {
        console.error("GSAP Loading Error:", e);
        // Fallback for simple visibility if GSAP fails
        setIsReady(true);
      }
    };
    loadScripts();
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const G = (window as any).gsap;
    if (!G) return;
    G.registerPlugin((window as any).ScrollTrigger);

    const mm = G.matchMedia();
    mm.add("(min-width: 769px)", () => {
      const cols = G.utils.toArray(".col-wrap");

      // Reduced parallax distance to prevent clipping and ensure visibility
      G.to(cols[0], {
        y: -150,
        scrollTrigger: {
          trigger: ".triple-col-grid",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });

      G.to(cols[1], {
        y: 150,
        scrollTrigger: {
          trigger: ".triple-col-grid",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });

      G.to(cols[2], {
        y: -150,
        scrollTrigger: {
          trigger: ".triple-col-grid",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
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
          <div className="col-wrap">
            {COL_1.map(m => <MaisonCard key={m.id} maison={m} />)}
          </div>
          <div className="col-wrap pt-32">
            {COL_2.map(m => <MaisonCard key={m.id} maison={m} />)}
          </div>
          <div className="col-wrap">
            {COL_3.map(m => <MaisonCard key={m.id} maison={m} />)}
          </div>
        </div>
      </section>
    </>
  );
}

function MaisonCard({ maison }: { maison: Maison }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="maison-card-premium">
      <div className="image-box-premium">
        <img
          src={hasError ? "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800" : maison.prodImg}
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
