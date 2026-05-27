import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "O que é o Remake Pixel?", a: "Um estúdio de imagem com IA que junta geração, edição, estilos, pôsteres, vídeo e ferramentas utilitárias numa única conta por créditos." },
  { q: "Como funcionam os créditos?", a: "Cada ferramenta mostra o custo antes de gerar. Imagem por texto desde 18 créditos; vídeo, retoque Pro e opções HD/melhorar prompt acrescentam créditos conforme o uso." },
  { q: "Recebo créditos grátis?", a: "Sim. Cada nova conta começa com 50 créditos grátis, suficientes para testar o estúdio antes de comprar." },
  { q: "Que modelos de IA usam?", a: "Usamos um stack curado de motores internos: rápido, pro, premium e utilitários especializados para edição, vídeo e tarefas técnicas." },
  { q: "Posso usar as minhas fotos?", a: "Sim. Podes enviar fotos para retoque, estilos, pôsteres, remoção de fundo, upscale, colorização e outros fluxos." },
  { q: "Que formatos são suportados?", a: "Os principais formatos de imagem e rácios de publicação: 1:1, 4:5, 3:4, 9:16, 16:9 e 21:9." },
  { q: "Posso vender o que crio?", a: "Sim. As imagens geradas com saldo pago podem ser usadas em projetos comerciais, respeitando os direitos das imagens que carregas." },
  { q: "Qual é a política de reembolso?", a: "Se uma geração falhar por erro técnico, os créditos podem ser devolvidos. Créditos usados em resultados gerados não são reembolsáveis." },
  { q: "Existe subscrição obrigatória?", a: "Não. O modelo principal é compra única de créditos, sem renovação automática escondida." },
  { q: "Em que idiomas funciona?", a: "A interface está a ser preparada para português, inglês, espanhol e francês. A versão principal agora está focada em português." },
];

const EASE = [0.16, 1, 0.3, 1];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="relative bg-[#F4F1EA] py-16 md:py-28 border-t border-[#E4E4E7]" ref={ref} data-testid="faq-section">
      <div className="max-w-[700px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-[#0B0B0C] text-3xl md:text-4xl font-light tracking-[-0.02em] mb-3 md:mb-4">Perguntas frequentes</h2>
          <p className="text-[#8A8A8E] text-lg">Respostas claras antes de começares.</p>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.02, ease: EASE }}
              className="bg-white rounded-sm border border-[#E4E4E7] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-3.5 md:p-4 text-left hover:bg-[#FAFAF7] transition-colors"
                data-testid={`faq-q-${i}`}
              >
                <span className="text-[#0B0B0C] text-[13px] font-medium pr-4">{f.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0">
                  <ChevronDown className="w-4 h-4 text-[#8A8A8E]" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-[#52525B] text-[13px] leading-[1.7]">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
