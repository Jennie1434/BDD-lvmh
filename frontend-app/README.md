# 🎨 BDD LVMH - Frontend Application

Interface visuelle premium pour le système de nettoyage et analyse de transcriptions clients LVMH.

## ✨ Features

- 🌟 **Slider WebGL** avec effets de verre et transitions fluides
- 🎭 **Animations GSAP** pour un rendu premium
- ⚡ **Next.js 14** avec TypeScript
- 🎨 **TailwindCSS** avec thème LVMH personnalisé
- 📱 **Responsive Design** adapté à tous les écrans

## 🚀 Installation

```bash
cd frontend-app
npm install
```

## 🏃 Lancement

### Mode Développement
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Mode Production
```bash
npm run build
npm start
```

## 📁 Structure du Projet

```
frontend-app/
├── components/
│   └── LVMHSlider.tsx      # Composant slider principal
├── pages/
│   ├── _app.tsx            # App wrapper
│   ├── _document.tsx       # Document HTML
│   └── index.tsx           # Page d'accueil
├── styles/
│   └── globals.css         # Styles globaux
├── package.json
├── tailwind.config.js      # Config TailwindCSS
├── tsconfig.json           # Config TypeScript
└── next.config.js          # Config Next.js
```

## 🎨 Thème LVMH

Couleurs personnalisées :
- **Gold**: `#C9A664` - Accent premium LVMH
- **Black**: `#000000` - Fond principal
- **Cream**: `#F5F1E8` - Accents clairs

## 🔌 Prochaines Étapes

1. ✅ Interface visuelle créée
2. ⏳ Créer le dashboard de transcriptions
3. ⏳ Connecter à l'API Python backend
4. ⏳ Ajouter les filtres et statistiques
5. ⏳ Mode upload de fichiers

## 📝 Notes

- Les effets WebGL utilisent Three.js (chargé dynamiquement via CDN)
- Les animations utilisent GSAP 3.12.2 (chargé dynamiquement via CDN)
- Les images proviennent d'Unsplash pour la démo
