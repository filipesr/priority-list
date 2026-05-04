Você é um engenheiro sênior Android/Kotlin com foco em migração de apps React Native para Android nativo.

Quero que você use o projeto atual em React Native como base visual, funcional e estrutural para recriar uma versão Android nativa do app, dentro de uma nova pasta chamada:

../mobile-java

IMPORTANTE:
- Preserve ao máximo a experiência visual e o fluxo já existente no projeto atual.
- Aproveite as telas, componentes, textos, ícones, hierarquia visual, regras de negócio e navegação já implementadas no projeto React Native como referência.
- O objetivo não é reinterpretar o produto do zero, mas sim fazer uma migração fiel para Android nativo.
- Sempre que houver dúvida de implementação, priorize manter o comportamento equivalente ao do app atual.
- Quero que você trabalhe diretamente sobre a base existente, analisando os arquivos do projeto para mapear telas, estados, ações e dados usados no app e no widget.

## Objetivo do app
Recriar nativamente em Android um app de orçamento familiar com widget na home screen.

### Função principal do widget
O widget Android deve listar despesas pendentes, considerando:
- despesas vencidas
- despesas com vencimento nos próximos 3 dias

E permitir diretamente pela home screen:
- marcar despesa como concluída
- adicionar lançamento
- navegar para o app principal

## Stack desejada
Quero a nova implementação em Android nativo, preferencialmente com:

- Kotlin
- Jetpack Compose para o app
- Jetpack Glance para o widget
- Navigation Compose
- Room ou DataStore se precisar persistência local
- arquitetura organizada e sustentável

Se houver algum ponto em que Java puro seja mais compatível com o nome da pasta `mobile-java`, mantenha a pasta com esse nome, mas implemente com Kotlin, pois a prioridade é qualidade e manutenção. Só use Java se houver motivo técnico real.

## Nome da pasta
Crie toda a nova estrutura dentro de:
mobile-java

## O que você deve fazer
1. Analisar o projeto React Native atual
2. Identificar:
   - telas existentes
   - fluxos de navegação
   - regras de negócio
   - estrutura visual
   - interações do widget
   - ações disponíveis ao usuário
3. Recriar o app em Android nativo mantendo equivalência funcional
4. Recriar o widget nativamente, evitando a abordagem baseada em renderização indireta do React Native
5. Organizar o projeto para build e evolução futura

## Regras de fidelidade
Quero que você preserve ao máximo:

- estrutura das telas
- nomes das seções
- intenção dos componentes
- lógica de exibição das despesas
- estados visuais importantes
- atalhos e ações principais
- navegação principal do app
- experiência do usuário

Se precisar adaptar algo para o Android nativo:
- mantenha a essência do layout
- documente o motivo da adaptação
- prefira pequenas adaptações, não redesign completo

## Requisitos funcionais mínimos

### App principal
O app deve permitir:
- visualizar despesas
- identificar despesas pendentes
- registrar novos lançamentos
- marcar lançamentos/despesas como concluídos
- navegar entre as telas principais com estrutura limpa
- abrir corretamente a partir do widget

### Widget Android
O widget deve:
- exibir apenas despesas pendentes
- incluir vencidas e as com vencimento nos próximos 3 dias
- destacar visualmente vencidas
- permitir marcar item como concluído direto no widget
- ter botão para adicionar lançamento
- ter botão para abrir o app principal
- atualizar os dados corretamente após ações
- funcionar com confiabilidade em diferentes tamanhos de widget
- evitar clipping, corte lateral e problemas de altura

## Requisitos técnicos do widget
Implemente o widget de forma nativa, sem bitmap de UI React Native.

Preferência:
- Jetpack Glance

Se houver limitação forte no cenário real:
- usar AppWidgetProvider / RemoteViews quando necessário

Quero um widget robusto e estável.

## Arquitetura desejada
Organize o projeto com boa separação, por exemplo:

mobile-java/
  app/
    src/main/java/... ou kotlin...
      data/
      domain/
      ui/
      widget/
      navigation/
      repository/
      model/
      util/

Pode adaptar a estrutura, mas mantenha clareza.

## Dados e regra de negócio
As despesas pendentes do widget devem ser filtradas por:
- status não concluído
- vencimento menor ou igual a hoje + 3 dias

Comportamento esperado:
- vencidas devem aparecer primeiro
- depois as que vencem nos próximos 3 dias
- se não houver pendências, mostrar estado vazio amigável
- o widget deve limitar a quantidade exibida se necessário, mas de forma elegante

## Integração app <-> widget
Quero uma estratégia sólida para atualização de dados:
- ao concluir uma despesa pelo widget, refletir no app
- ao adicionar lançamento no app, refletir no widget
- ao abrir o app pelo widget, navegar corretamente para a área relevante

Você pode usar:
- Room
- DataStore
- repository compartilhado
- workers / update receivers se necessário

## O que quero na resposta
Quero que você faça a entrega em formato de implementação técnica real.

### Entrega esperada
1. Diagnóstico do projeto atual
2. Plano de migração
3. Estrutura de pastas proposta
4. Código inicial da nova base Android nativa
5. Código do widget
6. Código das telas principais
7. Navegação
8. Modelos e camada de dados
9. Estratégia de atualização do widget
10. Observações sobre diferenças inevitáveis entre React Native e Android nativo

## Muito importante
- Não responda só conceitualmente
- Gere código
- Crie arquivos reais
- Se não puder editar diretamente todos os arquivos, entregue diffs ou blocos por arquivo
- Nomeie claramente cada arquivo criado
- Sempre indique caminho do arquivo
- Priorize resultado executável

## Forma de trabalho
Quero que você aja como se estivesse fazendo a migração de verdade.

Então:
- leia a base atual
- reutilize ao máximo a referência visual e funcional
- proponha os arquivos nativos
- recrie as telas com Compose
- recrie o widget com Glance
- conecte as ações principais
- organize o projeto dentro de `mobile-java`

## Se houver lacunas
Se algum detalhe da base React Native estiver incompleto:
- infira a solução mais coerente com o restante do projeto
- mantenha consistência visual e funcional
- documente rapidamente a inferência aplicada

## Prioridades
Prioridade 1:
- widget estável e funcional

Prioridade 2:
- fidelidade ao app atual

Prioridade 3:
- arquitetura limpa para continuidade

## Resultado final esperado
Quero sair com uma base nativa Android dentro de `mobile-java`, pronta para evoluir, inspirada nas telas e fluxos do projeto React Native atual, com widget funcional para despesas pendentes do orçamento familiar.

Comece analisando a estrutura atual do projeto e então proponha a migração com implementação.