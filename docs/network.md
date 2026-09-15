# Rede e autoridade

WebSocket confiável/ordenado (`ws`), conectado diretamente ao endpoint externo definido por `NUXT_PUBLIC_WS_URL` (padrão `ws://127.0.0.1:3001`).

O backend oficial é o NestJS em `../sleet-fighter-server` (mesmo protocolo do mock antigo `server/index.mjs`). O servidor autoritativo executa a mesma regra de `app/game/shared/combat.ts` a 60 Hz, baseado em relógio monotônico, no máximo 8 passos por atualização. Snapshots são enviados a aproximadamente 20 Hz.

Cada input tem sequência crescente por jogador e frame inteiro da simulação. O servidor aceita somente seis booleanos; identidade/slot são vinculados à conexão. Frames passados são aceitos até 120 passos, futuros até 12. Sequências antigas, sobrescritas e payloads inválidos são descartados. Clientes não enviam vida, posições, dano ou vencedor.

O cliente prevê o próprio comando imediatamente e assume input remoto neutro. Ao receber snapshot válido, substitui o estado e reexecuta os próprios comandos pendentes até seu frame previsto, limitado a 120 frames. O servidor também restaura snapshots e reexecuta frames afetados por input atrasado. Inputs ausentes são neutros (uma escolha provisória, que pode produzir correções visíveis em ping alto). Um KO só é confirmado após 120 frames de margem. Não há rollback visual de poses entre snapshots, nem interpolação de correções implementada.

Checksum FNV-1a sobre estado serializado verifica integridade e fornece comparabilidade para testes; não é autenticação criptográfica nem prova independente da lógica do cliente. O servidor é a única autoridade sobre resultado. Reexecuções geram identificadores estáveis de impacto por round/frame/slot; o renderizador evita repetir efeitos vistos. Sons de impacto ainda não foram integrados.

Espectadores aplicam snapshots com atraso de 150ms. Desconexão/abandono resulta em vitória do outro participante. Não há reconexão autenticada: recarregar gera nova identidade. Timeout de presença é 30s. Dupla ausência atualmente avança administrativamente o primeiro inscrito e é reportada com esse motivo; essa política deve ser definida pelo organizador antes de uso real.

Teste automatizado usa três conexões, input atrasado e resultado por desconexão; verifica hash compartilhado, rejeição de vencedor/dano enviados pelo cliente e atualização da chave. Não equivale a teste prolongado em internet, perda de pacotes ou redes assimétricas.
