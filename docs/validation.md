# Evidências, validação e divergências

## Confirmado nos arquivos locais

VPK: `E:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\pak01_dir.vpk`. CLI instalado: `.tools/vrf/cli/Source2Viewer-CLI.exe`; ajuda consultada antes de exportar. `docs/vpk-inventory.txt` contém o índice real.

Os cinco arquivos `scripts/events/crownfall/fighting_game_hero_*.vdata_c` confirmam Tusk, Bristleback, Shendelzare, Marci e Dawnbreaker. Os JSONs preservam todos os campos explícitos: estados, animações, caixas, danos, startup/active, cancelamentos, invulnerabilidade, efeitos e sons. Campos ausentes permanecem lacunas. A tabela completa está em `movesets.md`.

Shendelzare exige a arcana The Resurrection of Shen: itens 22718–22721 e estilos 1/0 explicitados no moveset; `items_game.txt` identifica as peças. O modelo Vengeful padrão não tem os clips de luta e não é usado na partida. Tusk usa as peças padrão listadas como `model_player`; `tusk_fish` isolado não é peça de equipamento e foi retirado da montagem.

O XML `dota_fighting_game_panel.xml` confirma arena `maps/scenes/crownfall/arena.vpk`, câmera `cam_main`, foreground separado, retratos, defesa, barras de vida, round pips e cronômetro. A nova UI segue essa estrutura com imagens locais exportadas. A cena e câmera de `#game` foram reutilizadas após correção solicitada pelo usuário.

## Referências visuais

- Liquipedia solicitada: https://liquipedia.net/dota2/Crownfall/Minigames — retornou 403.
- https://eloking.com/blog/dota-2-street-fighter-like-mode-explained — texto acessível; confirma elenco e melhor de três. As imagens diretas exigiram verificação no navegador.
- Captura original alternativa: https://cdn.mos.cms.futurecdn.net/YpiPd8MHudhcSZJfHDnDoR.jpg — inspecionada visualmente; HUD dourado, retratos nas extremidades, defesa azul, cronômetro central, lutadores grandes no tablado.

## Testado

- TypeScript e build Vite passam.
- 10 testes passam: dados originais do jab, espelhamento de comandos, replay determinístico/rollback, startup/dano/defesa, especial de uso único, golpes simultâneos, integração de três conexões com resultado autoritativo e chave, enquadramento nas bordas e separação física nos cantos.
- Auditoria final dos 52 GLBs exportados: zero texturas ausentes. A cópia otimizada da arena usa o resolvedor de texturas já existente em `#game`.
- Inspeção visual de Tusk e acessórios no tablado; correção da câmera e da orientação visual do segundo lutador. Marci/Dawnbreaker carregaram durante desenvolvimento. Todos os personagens ainda exigem revisão quadro a quadro dos golpes/acessórios.
- Cópia da arena reduzida de 280.847.572 para 9.561.320 bytes, preservando geometria/material e removendo dados de animação não utilizados pelo palco. Original em `src/assets/maps/scenes/crownfall/arena.glb` preservado.
- Duas abas de navegador entraram na mesma sala pela interface, foram inscritas na fila, convocadas e confirmaram presença; ambas exibiram Teste A / Teste B e ROUND 1 com contador sincronizado ao iniciar. Espectador, resultado e desconexão foram testados por conexões WebSocket no teste automatizado.
- UI revisada: combate ocupa toda a janela, como `#game`, sem barras laterais ou painel lateral permanente; retratos exportados, barra de guarda azul, seleção sobreposta, nomes abaixo das barras e F9 para comandos. Painéis locais pausam a simulação; online não pausa.
- Câmera dos lutadores fixa durante a partida: distância calculada apenas pela proporção da janela e pelos limites totais da arena. Avançar e recuar não alteram escala, lente ou enquadramento. Testes de projeção cobrem 4:3, 16:9 e 21:9, extremos opostos e altura visual constante; testes físicos cobrem pressão contra ambas as paredes.
- A câmera do cenário mantém o enquadramento fixo de `#game`. Os dois planos permanecem estáveis durante a movimentação, sem zoom automático ou deslocamento do fundo.

## Provisório / incompleto

Vida 2000, guarda 100, duração 99s, velocidade 12 unidades/tick, limites ±1800 e janela genérica de comando 18 frames não foram confirmados no motor original. Melhor de três tem apoio na referência externa. Conversão espacial, interpretação de hitstun por vantagem de frames, semântica de cancel on hit/block, troca de posição de Shendelzare e escopo de single-use são aproximações explícitas. Knockdown, guard regeneration e todos os detalhes de transição do motor precisam comparação com o original.

Animações seguem tempo da simulação; corpo dirige acessórios por correspondência de ossos e delta de bind pose em espaço mundial. Ossos auxiliares sem correspondência conservam a hierarquia. Não há prova de identidade visual para cada animação. Estilo/material de Shendelzare exportado pelo CLI ainda precisa confronto com o estilo 1 do minigame.

Partículas Source 2 não são executadas na web. Projéteis e impactos têm geometria provisória; fumaça/luzes da arena reaproveitam a reconstrução existente. Sons, announcer e conversão fiel dos efeitos específicos permanecem incompletos. Não há alegação de equivalência visual/sonora integral.

Rede usa previsão/rollback básico, mas ainda precisa avaliação de responsividade em dois computadores, latência sustentada, jitter e perda. Campeonato sem persistência e sem byes; não há implantação pública. Não usar como competição definitiva antes dessas validações.

- Limites laterais ampliados para ±2400 unidades de simulação, com enquadramento fixo independente do limite físico. A pose de referência chega junto às extremidades visíveis do tablado; golpes podem projetar acessórios além do corpo de colisão.
