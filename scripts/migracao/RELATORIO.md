# Relatório da migração Quarto → content/

Gerado por `npm run migrar` em 2026-10-23. Fonte: `_legado/` (cópia de interas-inct/interaswebsite).

## Contagens

| Tipo | Antes (site Quarto) | Depois (content/) |
|---|---|---|
| Pessoas | 93 arquivos .qmd | 93 em pessoas.json |
| Publicações | 356 .qmd / 356 entradas no .bib | 356 em publicacoes.json |
| Patentes | 11 .qmd | 11 em patentes.json |
| Grupos | 5 .qmd | 5 em grupos.json |
| Notícias | 13 pastas | 13 arquivos em content/noticias/ |
| Vídeos | 9 .qmd | 9 em videos.json |
| Páginas | 3 institucionais + 5 listagens | 8 em paginas.json |
| Arquivos copiados para public/ | — | 42 |
| Redirecionamentos | — | 496 em scripts/migracao/redirecionamentos.json |

## Diferença 368 × 356 artigos

A pasta `publicacoes/artigos/` tem exatamente 356 `.qmd`, com as mesmas chaves das 356 entradas do `.bib` (nenhuma sobrando de um lado ou de outro).
No site no ar, a listagem de `/publicacoes/` tem 367 itens = 356 artigos + 11 patentes. O número 368 corresponde a essa listagem (mais a página-índice), não a artigos faltando.

## Campos vazios

- Pessoas sem foto: 91 de 93 (só a coordenação tinha foto no site antigo)
- Pessoas sem Lattes: 15 — ariel-escobar, maria-de-la-salud-guillhem-sanchez, gustavo-ramos, ilija-uzelac, jesica-ayelen-dimmer, benedicte-manoury, ifor-david-william-samuel, juan-jose-nogueira, larry-dewerd, nicholas-stone, peter-bode, terence-kenneth-smith, tiago-buckup, sajid-farooq, wilmmer-alexander-arcos-rosero
- Pessoas sem Google Scholar: 43
- Pessoas sem instituição: 0 — nenhuma
- Pessoas com "Áreas de Atuação" vazia ("-"): 19
- Pessoas com "Atuação no Projeto" vazia: 1 — yasmin-reis-fontes-de-oliveira
- Pessoas sem grupo: 87 (o vínculo pessoa→grupo só existe quando a página do grupo tinha link para o perfil)

## Arquivos não copiados (sem referência)

- pessoas/coordenacao/fotos/denise-maria-zezell.png
- pessoas/coordenacao/fotos/emiliano-horacio-medei.png
- pessoas/coordenacao/fotos/emilianohoraciomedei_corte.png
- noticias/posts/202509-academia-ciencias-denise/logo-1.png.webp
- noticias/posts/202509-premio-dissertacao-martha-juliana/image1.jpg
- noticias/posts/202510-pesquisadores-influentes/imagem_ciencia_laboratorio.png
- noticias/posts/202510-pesquisadores-influentes/tabela_final_career.RDS
- noticias/posts/202510-pesquisadores-influentes/tabela_final_yr2024.RDS
- noticias/posts/202604-videos-interas/Gemini_Generated_Image_rgyu46rgyu46rgyu.png
- images/2026-INTERAS-ProgramaPreliminar.pdf
- images/3125_pt_texto2.png
- images/favicon.png
- images/favicon32x32.png
- images/feixe_incidindo_celulas_cancerosas_v2.png
- images/feixe_incidindo_molecula_dna.png
- images/grupos/lab_biofotonica_Dez_2023.jpeg
- images/image_conhecimento_transforma.png
- images/imagem_microscopia_rede_neural_v2.png
- images/imagem_pet_estilizada_v2.png
- images/logoINTERASFundoBranco.png
- images/logoINTERASSemfundo.jpeg
- images/logoINTERASSemfundo.png
- images/logoINTERASSemfundo_redim.png
- images/logoINTERASSemfundo_redim2.png
- images/logo_pt_transparente_corclara_rad.png
- images/logointeras.png
- images/publicacoes-placeholder.jpg
- images/publicacoes-placeholder2.jpg
- images/publicacoes-placeholder3.jpg
- images/publicacoes-placeholder4.jpg
- images/quote-purple.png
- images/topo_desvanecendo.jpeg
- images/topo_desvanecendo.png
- images/topo_desvanecendo_sem_texto.jpeg
- images/topo_desvanecendo_sem_texto.png
- images/topo_desvanecendo_sem_texto_logo_interas.png
- Obs.: images/2026-INTERAS-ProgramaPreliminar.pdf não é linkado em nenhuma página, por isso não foi para public/arquivos/

## Publicações: sem autores no .bib

- noauthor_reducing_2023

## Publicações: títulos todos em maiúsculas (mantidos como no .bib)

- chaves_da_silva_aspectos_2024: ASPECTOS A SEREM CONSIDERADOS EM AUDIODESCRIÇÃO DE IMAGENS EM FÍSICA COM VISTAS AO SEU ENTENDIMENTO POR PESSOAS COM DEFICIÊNCIA VISUAL
- t_evaluation_2024: EVALUATION OF ADHESIVE STRENGTH IN DENTIN IRADIATED WITH ULTRA SHORT PULSE LASER (FS) AT VARIOUS ENERGY DENSITIES USING TWO ADHESIVE STRATEGIES
- do_carmo_carvalho_vaping_2023: VAPING IS THE NEW SMOKING: CHANGES IN THE MUCOSA AND SALIVA RELATED TO VAPE
- amaral_radionuclideos_2023: RADIONUCLÍDEOS NATURAIS EM SOLOS DA REGIÃO METROPOLITANA DO RECIFE, PERNAMBUCO, E RISCOS ASSOCIADOS
- junior_contribuicoes_2024: CONTRIBUIÇÕES DO PET/CT FDG-18F NA DETECÇÃO DE DOENÇA AVANÇADA NO CÂNCER DE MAMA
- pedreira_panorama_2024: PANORAMA DOS EXAMES DE PET-CT – FDG- 18F NO CÂNCER DO COLO DO ÚTERO EM UMA INSTITUIÇÃO PRIVADA DO BRASIL
- abreu_frenectomia_2024: FRENECTOMIA LINGUAL COM LASER DE ALTA POTÊNCIA EM PACIENTE COM TRANSTORNO DO ESPECTRO AUTISTA - RELATO DE CASO
- brasil_correlacao_2024: CORRELAÇÃO ENTRE BRUXISMO E ANSIEDADE NA PANDEMIA DO COVID-19
- da_rocha_laserterapia_2024: LASERTERAPIA DIANTE DO CONTROLE DA DOR E DOS PROCESSOS INFLAMATÓRIOS
- fernandes_responsabilidade_2024: RESPONSABILIDADE DO CIRURGIÃO-DENTISTA FRENTE AO DIAGNÓSTICO DO ABUSO SEXUAL INFANTOJUVENIL
- caldas_abordagem_2024: A ABORDAGEM CIRÚRGICA NO TRATAMENTO DA OSTEORRADIONECROSE
- alves_importancia_2024: A IMPORTÂNCIA DO TRATAMENTO ODONTOLÓGICOS EM PACIENTES SOB CUIDADOS PALIATIVOS
- defante_uso_2024: USO DO LASER DE ALTA POTÊNCIA NA CORREÇÃO DO AUMENTO GENGIVAL: RELATO DE CASO
- ramos_apneia_2024: APNEIA COMO FATOR DE RISCO PARA O BRUXISMO DO SONO
- el_achkar_treatment_2023: TREATMENT OF ORAL VASCULAR MALFORMATIONS WITH ETHAMOLIN: A REPORT OF TWO CASES

## Publicações: entradas @misc (tipo "outro")

- souza-ferreira_first_2024: First record of microplastic contamination in endemic Amazonian anurans: Can the size and behavior of species influence contamination?
- parize_evaluation_2024: Evaluation of Peri-Implantitis through Fourier-Transform Infrared Spectroscopy on Saliva

## Publicações: sem DOI

- carlesse_evaluation_2023: Evaluation of intraoperative subcutaneous anesthetic infiltration for pain management in patients undergoing total thyroidectomy
- noauthor_reducing_2023: Reducing the environmental impact of surgery on a global scale: systematic review and co-prioritization with healthcare workers in 132 countries
- de_castro_endoscopic_2023: Endoscopic and videofluoroscopic evaluations of swallowing for dysphagia: a systematic review
- de_paula_thyroid_2023: Thyroid hemiagenesis: description of two clinical cases, anatomical review, and critical synthesis of the literature
- matos_training_2023: Training of head and neck surgeons in Brazil: biannual evaluation by the Brazilian Society of Head and Neck Surgery
- amaral_radionuclideos_2023: RADIONUCLÍDEOS NATURAIS EM SOLOS DA REGIÃO METROPOLITANA DO RECIFE, PERNAMBUCO, E RISCOS ASSOCIADOS
- da_rocha_laserterapia_2024: LASERTERAPIA DIANTE DO CONTROLE DA DOR E DOS PROCESSOS INFLAMATÓRIOS
- el_achkar_treatment_2023: TREATMENT OF ORAL VASCULAR MALFORMATIONS WITH ETHAMOLIN: A REPORT OF TWO CASES

## Publicações: barra invertida (\) restante no texto

- dos_santos_characterization_2024

## Publicações: campos vazios

- 211 sem resumo; 2 sem periódico; 17 sem volume

## Publicações: correspondências duvidosas (não marcadas)

- santos_formation_2026: "Rodrigues, O." → orlando-rodrigues-junior (Orlando Rodrigues Junior)
- maciel_angelika_2025: "Souza, D. N." → divanizia-do-nascimento-souza (Divanizia do Nascimento Souza)
- nascimento_performance_2025: "Rodrigues, O." → orlando-rodrigues-junior (Orlando Rodrigues Junior)
- pieretti_triboelectrochemical_2025: "Ribeiro, M. S." → martha-simoes-ribeiro (Martha Simões Ribeiro)
- rodrigues_investigation_2024: "Rodrigues, O." → orlando-rodrigues-junior (Orlando Rodrigues Junior)
- tavares_attenuation_2024: "Rodrigues, O." → orlando-rodrigues-junior (Orlando Rodrigues Junior)
- villani_computed_2024: "Rodrigues, O." → orlando-rodrigues-junior (Orlando Rodrigues Junior)
- bravo_prognostic_2024: "Machado, N" → neila-cristina-fonseca-machado (Neila Cristina Fonseca Machado)
- bravo_prognostic_2024: "Santos, R" → raquel-silva-neres-dos-santos (Raquel Silva Neres dos Santos)
- bravo_prognostic_2024: "Costa, M" → matheus-andrade-rocha-costa (Matheus Andrade Rocha Costa)
- bravo_prognostic_2024: "Oliveira, A" → arthur-melo-de-oliveira (Arthur Melo de Oliveira)
- bravo_prognostic_2024: "Rodrigues, M" → monique-rodrigues (Monique Rodrigues)
- bravo_prognostic_2024: "Cunha, R" → regiane-stafim-da-cunha (Regiane Stafim da Cunha)
- bravo_prognostic_2024: "Freitas, A" → anderson-zanardi-de-freitas (Anderson Zanardi de Freitas)
- bravo_prognostic_2024: "De Carvalho, L" → luis-felipe-das-chagas-e-silva-de-carvalho (Luis Felipe das Chagas e Silva de Carvalho)
- mendes_non-ablative_2024: "Mendes, V." → valeria-mendes (Valeria Mendes)
- mendes_non-ablative_2024: "Azevedo, L." → luciane-hiramatsu-azevedo (Luciane Hiramatsu Azevedo)
- santos_building_2023: "Rodrigues, O" → orlando-rodrigues-junior (Orlando Rodrigues Junior)

## Publicações: marcadas pelas iniciais (sobrenome pouco comum) — conferir

- wetter_modern_2026: "Wetter, N U" → niklaus-ursus-wetter
- costa_development_2025: "Raele, M. P." → marcus-paulo-raele
- machado_green_2025: "Raele, M. P." → marcus-paulo-raele
- machado_green_2025: "De Rossi, W." → wagner-de-rossi
- pieretti_triboelectrochemical_2025: "De Rossi, W." → wagner-de-rossi
- mendes_innovative_2024: "Monte, A. F. G." → adamo-ferreira-gomes-do-monte
- mendes_non-ablative_2024: "Zezell, D." → denise-maria-zezell
- rabelo_neto_structural_2024: "Da Ana, P A" → patricia-aparecida-da-ana
- rabelo_neto_structural_2024: "Zezell, D M" → denise-maria-zezell

## Publicações: cruzamento de autores

- 497 vínculos autor→pessoa em 331 de 356 publicações; 63 pessoas com ao menos uma publicação

## Publicações: pesquisadores sem nenhuma publicação vinculada

- ariel-escobar (pesquisador)
- maria-de-la-salud-guillhem-sanchez (pesquisador)

## Notícias: ajustes manuais

- 2025-10-29-pesquisadores-influentes: bloco R de configuração removido
- 2025-10-29-pesquisadores-influentes: tabela R (toda a carreira) convertida em tabela Markdown, copiada do site no ar
- 2025-10-29-pesquisadores-influentes: tabela R (ano 2024) convertida em tabela Markdown, copiada do site no ar
- 2025-10-29-pesquisadores-influentes: link escrito como imagem (![...]) corrigido para link

## Páginas

- areas-de-pesquisa.qmd não tem texto (só o título) — migrada com conteúdo vazio
- contato.qmd: cartões HTML transcritos para Markdown no campo `cartoes` (ver scripts/migracao/paginas.ts)

## Configurações do site

- Rodapé: links do GitHub (ipencnensp/interaswebsite) e do Twitter (twitter.com) removidos, a pedido do usuário
- temas_grupos: rótulos mantidos como no site antigo (ex.: "diagnostico", "inteligência artificial")

## Validação (`npm run validar`)

Sem erros.
