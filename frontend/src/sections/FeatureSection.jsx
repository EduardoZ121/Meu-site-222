import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const features = [
  {
    eyebrow: "Gerar",
    title: "De uma frase para uma imagem pronta a publicar.",
    body: "Escreve o que imaginas, escolhe o estilo e recebe uma imagem com estética cinematográfica, editorial, artística ou hiper-realista em segundos.",
    tags: ["Motor Rápido", "Motor Pro", "Motor Premium"],
    image: "/images/generate.jpg",
    imageRight: true,
  },
  {
    eyebrow: "Editar",
    title: "A tua foto com acabamento de estúdio.",
    body: "Envia qualquer retrato e aplica realismo cinematográfico, mood editorial, melhorias de luz, pele, roupa, olhos e detalhe sem perder identidade.",
    tags: ["Realismo", "Mood editorial", "Retoque pro"],
    image: "/images/edit.jpg",
    imageRight: false,
  },
  {
    eyebrow: "Estilos",
    title: "96 estilos. Uma só foto.",
    body: "Pacotes visuais curados entre arte, cinema contemporâneo e fotografia editorial. Experimenta rápido, escolhe o melhor e publica.",
    tags: ["96 estilos", "1 crédito/estilo", "Curadoria visual"],
    image: "/images/styles-grid.jpg",
    imageRight: true,
  },
  {
    eyebrow: "Vídeo",
    title: "Imagens paradas que ganham movimento.",
    body: "Cria clipes cinematográficos de 6 segundos a partir de texto ou imagem. Ideal para Reels, teasers, anúncios e ideias visuais.",
    tags: ["Clipes de 6s", "Texto → vídeo", "Imagem → vídeo"],
    image: "/images/motion.jpg",
    imageRight: false,
  },
  {
    eyebrow: "Design",
    title: "Pôsteres com aparência de equipa contratada.",
    body: "44 templates reais para música, comida, fitness, motivação e flyers. Envia a foto, troca os textos e gera um visual pronto para publicar.",
    tags: ["44 templates", "5 categorias", "Textos editáveis"],
    image: "/images/posters.jpg",
    imageRight: true,
  },
  {
    eyebrow: "Guiado",
    title: "Não sabes por onde começar?",
    body: "O assistente faz cinco perguntas e escreve um prompt forte por ti. O motor de sugestões transforma qualquer tema em ideias visuais.",
    tags: ["Assistente 5 passos", "Sugestões IA", "20 ideias"],
    image: "/images/wizard.jpg",
    imageRight: false,
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="relative bg-[#0B0B0C]" data-testid="features-section">
      {features.map((f) => <FeatureBlock key={f.eyebrow} feature={f} />)}
    </section>
  );
}

function FeatureBlock({ feature }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const imgFirst = !feature.imageRight;

  return (
    <div ref={ref} className="py-12 md:py-24 border-t border-[#2E2E30]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-16 items-center ${imgFirst ? "" : "lg:[direction:rtl]"}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className={imgFirst ? "" : "lg:[direction:ltr]"}
          >
            <div className="rounded-sm overflow-hidden">
              <img src={feature.image} alt={feature.eyebrow} className="w-full h-full object-cover" loading="lazy" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className={imgFirst ? "" : "lg:[direction:ltr]"}
          >
            <p className="eyebrow mb-3 md:mb-4">{feature.eyebrow}</p>
            <h2 className="heading-lg mb-4 md:mb-5">{feature.title}</h2>
            <p className="body-text mb-5 md:mb-6">{feature.body}</p>
            <div className="flex flex-wrap gap-2">
              {feature.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
