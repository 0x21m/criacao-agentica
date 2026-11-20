# Créditos

- **Base de componentes, tema e peças brasileiras:** MIFT UI, do dono do projeto — `0x21m/mift-ui`, commit `4387a95`.
  Vieram de lá: `src/components/ui/*` (shadcn estilo aria-nova sobre `react-aria-components`), o tema e os eixos de
  `src/styles/global.css` (skins, raio, borda, destaque, densidade, alvo de toque, vidro), as libs `src/lib/formato.ts`,
  `cep.ts`, `dados-br.ts`, `boleto.ts`, `documentos.ts`, `mascara.ts`, `copiar.ts`, `mensagens.ts`, `movimento.ts`,
  `preferencias.ts`, os hooks `use-mobile` e `use-linhas-equilibradas`, `src/components/mift/*` (estados, envio, valor,
  campos-br, comprovante Pix, frete por CEP, teclado numérico) e `src/colecao/*` (comprovante impresso, deslizar para
  confirmar, número deslizante, vidro líquido, botão de vidro). Os detectores do `scripts/navegar.mjs` (rótulo quebrado,
  card órfão, rolagem dupla, alvo de toque) seguem `ferramentas/auditor/detectores.js` do MIFT.
- **Componentes do 21st.dev** (`src/components/ui/` com nome do autor, demos em `src/arsenal/demos/`): cada um com seu
  autor e licença, listados em `assets/arsenal/componentes/LICENCAS.md` e `CREDITS.md` da skill ca-interface.
- **SplitText:** React Bits (MIT + Commons Clause), instalado pelo registro `@react-bits`.
- **`src/styles/shadcn-tailwind.css`:** cópia de `shadcn/dist/tailwind.css` (shadcn 4.23, MIT).
- **Fontes:** Inter, Geist, Figtree, Fraunces, DM Sans e Bricolage Grotesque pelo Fontsource (OFL).
- **Fase 1:** `src/colecao/vidro-segmentado` e `src/colecao/vidro-folha` copiados do MIFT UI (`0x21m/mift-ui`,
  `src/colecao/vidro-*`), adaptados aos tokens do starter. A folha do sistema (`/sistema`) e o quadro de fluxos
  (`/fluxos`, `scripts/quadro.mjs`) são portes da folha e do quadro da barbearia Vila Real (iteração 3 da ca-interface).
  Os presets Sóbrio e Sinal partem das direções Oficina e Sinal do Conecta Celulares (iteração 3); o Noite, da direção
  Noite da barbearia. Fontes novas pelo Fontsource (OFL): Onest, Space Grotesk, Manrope e Archivo (eixo de largura).

- **Fase 2 (base do ERP e transplantes):**
  - **@dnd-kit/core** 6.3.1 (MIT, Claudéric Demers): o motor de ponteiro (mouse, toque com espera de 250 ms e teclado)
    do `QuadroInterativo` e da `AgendaInterativa` (`src/components/interativos/`).
  - **React Aria** e **react-aria-components** (Adobe, Apache-2.0): a base aria-nova inteira; no quadro, o modelo de
    interação do exemplo Kanban do React Aria (alvo como posição de lista, anúncio de cada passo ao leitor de tela).
  - **ReUI** (Event Calendar) e **Dice UI** (Kanban), usados **como modelo**, sem código copiado: a geometria e o funil de
    validação da agenda (encaixe em minutos, `canDrop`, 5 px no mouse e 250 ms no toque) e a API composta do quadro.
  - **Site público** (`/site/`): estrutura, movimento e gate da skill **design-taste-frontend** (o kit em
    `src/components/site/kit/`, servido em `/site/assets/`). Fotos do Wikimedia Commons, redimensionadas em WebP
    (`src/components/site/fotos/`, lista completa em `fotos.json` e na página `/site/creditos/`):
    - `f160025964`: U.S. Air Force AFCENT by Airman 1st Class Derrick Bole, Public domain (https://commons.wikimedia.org/wiki/File:379th_ECES_HVAC_technicians_combat_rising_temperatures_(8502255).jpg)
    - `f67847550`: Gavintsai, CC BY-SA 4.0 (https://commons.wikimedia.org/wiki/File:Mitsubishi_Electric_MSY-GJ10VA_easy_clean.jpg)
    - `f188894092`: Shixart1985, CC BY 2.0 (https://commons.wikimedia.org/wiki/File:Air_conditioning_unit_mounted_on_a_wall_with_cooling_pipe_visible_in_a_residential_setting.jpg)
    - `f47876386`: National Institute of Standards and Technology, Public domain (https://commons.wikimedia.org/wiki/File:HVAC.jpg)
    - `f181404380`: U.S. Air Force photo by Tech. Sgt. Justin Norton, Public domain (https://commons.wikimedia.org/wiki/File:379_ELRS_vehicle_maintenance_introduces_innovative_nitrogen_gas_testing_method_for_air_conditioning_systems_(9469862).jpg)
    - `f81573118`: Dmitry G, CC BY-SA 3.0 (https://commons.wikimedia.org/wiki/File:Fuse_box_on_hager_components.JPG)
    - `f191849475`: Shixart1985, CC BY 2.0 (https://commons.wikimedia.org/wiki/File:Hand_working_with_screw_and_screwdriver_on_wooden_project_in_bright_outdoor_workspace.jpg)
    - `f190519567`: Shixart1985, CC BY 2.0 (https://commons.wikimedia.org/wiki/File:Outdoor_air_conditioner_unit_installed_in_residential_garden_space.jpg)
    - `f43676063`: Frayedattheedges, CC BY-SA 4.0 (https://commons.wikimedia.org/wiki/File:Use_air_filters_(reusable).JPG)
    - `f11759360`: Dmitry G, CC BY-SA 3.0 (https://commons.wikimedia.org/wiki/File:Fuse_box_preparing_to_installation.JPG)
    - `f41117679`: Rieul Techer, CC BY-SA 4.0 (https://commons.wikimedia.org/wiki/File:Caisse_%C3%A0_outils_avec_petit_outillage.JPG)
