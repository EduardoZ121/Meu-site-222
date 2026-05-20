/** Explicações PT para cada efeito (tooltip no Estúdio Artístico). */
export const ARTISTIC_EFFECT_HELP = {
  "lighting:natural": "Luz do sol ou janela, suave e realista — ideal para retratos e lifestyle sem aspecto de estúdio.",
  "lighting:studio": "Iluminação controlada com softboxes — pele uniforme, sombras suaves, look comercial ou beauty.",
  "lighting:golden": "Hora dourada: tons quentes, sombras longas e ambiente romântico ao fim do dia.",
  "lighting:blue": "Hora azul: céu frio, contraste suave, mood noturno ou crepuscular elegante.",
  "lighting:backlit": "Luz por trás do sujeito — halo, silhueta parcial ou drama com rim forte.",
  "lighting:rembrandt": "Triângulo de luz na face (estilo Rembrandt) — retrato clássico com sombra marcada num lado.",
  "lighting:split": "Metade do rosto na luz, metade na sombra — contraste dramático e editorial.",
  "lighting:butterfly": "Luz de cima, sombra em forma de borboleta sob o nariz — glamour e beleza.",
  "lighting:rim": "Contorno luminoso à volta do sujeito — separa do fundo, look cinematográfico.",
  "lighting:silhouette": "Sujeito escuro contra fundo claro — forma gráfica, mistério, pôster forte.",

  "lens:35mm": "Ângulo mais aberto — inclui ambiente, storytelling e sensação documental.",
  "lens:50mm": "Perspetiva natural, próxima do olho humano — versátil para retratos e cenas.",
  "lens:85mm": "Tele retrato — fundo desfocado, rosto favorecido, look profissional.",
  "lens:135mm": "Tele longo — compressão do plano, fundo muito suave, isolamento do sujeito.",
  "lens:macro": "Grande proximidade — detalhe extremo (olhos, texturas, objetos pequenos).",
  "lens:fisheye": "Distorção curva 180° — efeito dinâmico, urbano ou experimental.",
  "lens:tilt": "Foco seletivo tipo maqueta — cena parece miniatura ou diorama.",
  "lens:lensbaby": "Zona nítida pequena com desfoque criativo em volta — look artístico suave.",
  "lens:polaroid": "Estética instantânea vintage — cores desbotadas, bordas e nostalgia analógica.",
  "lens:anamorphic": "Rácio cinematográfico com flares horizontais e bokeh oval — filme épico.",

  "atmosphere:mist_light": "Névoa leve — profundidade atmosférica sem esconder o sujeito.",
  "atmosphere:fog_dense": "Neblina densa — mood misterioso, silhueta ou cena etérea.",
  "atmosphere:rain": "Chuva visível, superfícies molhadas e reflexos — drama urbano ou romântico.",
  "atmosphere:snow": "Neve a cair — ambiente inverno, luz fria e calma.",
  "atmosphere:dust": "Partículas no ar iluminadas — feixes de luz, concertos, desertos.",
  "atmosphere:godrays": "Raios volumétricos (god rays) — luz a atravessar fumo ou folhas.",
  "atmosphere:bokeh_circle": "Orbes de desfoque redondos no fundo — look portrait premium.",
  "atmosphere:bokeh_hex": "Bokeh hexagonal (como lâminas da lente) — detalhe ótico artístico.",
  "atmosphere:vignette_soft": "Escurecimento suave nos cantos — foco no centro sem pesar.",
  "atmosphere:vignette_strong": "Vinheta forte — mood íntimo, vintage ou sombrio.",
  "atmosphere:grain": "Grão de filme analógico — textura nostálgica e orgânica.",
  "atmosphere:leaks": "Fugas de luz coloridas — imperfeição analógica estilizada.",
  "atmosphere:ca": "Aberração cromática nas bordas — franjas cor, look lens vintage/digital.",
  "atmosphere:flare": "Reflexos de lente — sol ou lâmpadas a entrar na ótica, cinema.",

  "color:warm": "Tons quentes (âmbar, dourado) — conforto, pôr do sol, pele saudável.",
  "color:cool": "Tons frios (azul, ciano) — noite, tecnologia, serenidade.",
  "color:desat": "Cores pouco saturadas — elegância discreta, editorial ou melancolia.",
  "color:vibrant": "Saturação alta — energia, pop, campanha chamativa.",
  "color:mono": "Uma família de cor dominante — coerência gráfica forte.",
  "color:duotone": "Duas cores principais (ex.: sombra azul + luz laranja) — poster moderno.",
  "color:pastel_mood": "Pastéis suaves — sonho, infância, branding leve.",
  "color:neon_mood": "Neons saturados — cyberpunk, festa, futuro.",
  "color:sepia": "Tom sépia vintage — memória, antigo, calor envelhecido.",
  "color:teal_orange": "Grading cinema teal & orange — blockbuster, contraste complementar.",
};

export function effectHelpKey(sectionId, optionId) {
  return `${sectionId}:${optionId}`;
}
