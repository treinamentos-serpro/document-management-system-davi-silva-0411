# DESIGN - Document Management System

## Tese visual

Um espaço de arquivo calmo: fundo "papel", texto em tinta escura, um único
acento verde-petróleo e os documentos apresentados como um livro-registro limpo.

## Implementação

- CSS puro em `src/styles.css`, importado em `src/main.jsx`.
- Sem frameworks ou bibliotecas de UI. Classes no padrão BEM simples
  (`panel__title`, `button--primary`).

## Tokens

| Token                   | Valor     | Uso                                  |
| ----------------------- | --------- | ------------------------------------ |
| `--color-bg`            | `#f6f4ef` | Fundo da página                      |
| `--color-surface`       | `#ffffff` | Painéis, cabeçalho, inputs           |
| `--color-border`        | `#dcd8ce` | Divisórias decorativas               |
| `--color-border-strong` | `#8a8578` | Bordas de controles (3.68:1)         |
| `--color-text`          | `#1c2430` | Texto principal (14.2:1)             |
| `--color-text-muted`    | `#545c69` | Texto secundário (6.1:1 no fundo)    |
| `--color-accent`        | `#0f6b5c` | Ação primária, links de ação (6.4:1) |
| `--color-accent-soft`   | `#e3f1ee` | Hover de ações secundárias           |
| `--color-focus`         | `#1d4ed8` | Anel de foco (6.1:1)                 |
| `--color-error`         | `#b42318` | Mensagens de erro (5.75:1)           |

Espaçamento em escala de 4px (`--space-1` a `--space-8`), raio único de 6px,
sombra mínima. Tipografia: fonte do sistema; metadados (tamanho, data) em
monoespaçada para alinhamento.

## Hierarquia

1. Cabeçalho: título do produto + campo "Usuário" (contexto da sessão).
2. Painel "Enviar documento": seletor de arquivo + botão primário.
3. Painel "Meus documentos": contador + tabela (nome, tamanho, data, ação).

## Componentes e estados

| Componente           | Estados especificados                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| `.button--primary`   | default, hover, active, focus-visible, disabled, loading (texto "Enviando") |
| `.button--secondary` | default, hover, active, focus-visible, disabled, loading (texto "Baixando") |
| `.input`             | default, hover, focus-visible                                               |
| `.file-input`        | default, hover, focus-visible, disabled                                     |
| Lista de documentos  | loading, vazio, erro (`role="alert"`), com dados, hover de linha            |
| Erro de download     | `.inline-error` abaixo do botão                                             |

## Responsividade

- Desktop (> 640px): conteúdo centralizado com largura máxima de 960px; tabela
  tradicional.
- Mobile (<= 640px): cada linha da tabela vira um bloco em grade (nome em
  largura total, tamanho e data lado a lado, botão de download em largura
  total). O `thead` fica visualmente oculto, mas acessível. Botões ocupam a
  largura total para alvos de toque maiores.

## Acessibilidade

- WCAG 2.2 AA: todos os pares de cor acima atendem 4.5:1 (texto) ou 3:1
  (não-texto).
- Foco visível em todos os controles (`outline` de 2px com offset).
- Erros com `role="alert"`; lista com `aria-busy` durante o carregamento;
  seletor de arquivo com `aria-label`.
- `prefers-reduced-motion`: remove transições e o deslocamento no clique.
