# Branching Strategy — Ctrl Alt News Portal

## Overview

Este projeto segue **Trunk-Based Development**, uma estratégia moderna de versionamento que enfatiza integração contínua e deploys frequentes.

## Princípios

- ✅ **Uma branch principal**: `main` é sempre deployável
- ✅ **Feature branches curtas**: < 3 dias de desenvolvimento
- ✅ **Pull Requests obrigatórias**: Code review + CI/CD antes de merge
- ✅ **Integração contínua**: Merge → Deploy automático
- ✅ **Histórico limpo**: Commits bem-estruturados (Conventional Commits)

## Estrutura de Branches

### Main Branch
```
main
  ├─ Sempre pronta para produção
  ├─ Protegida contra push direto
  ├─ Exige PR + aprovação + CI/CD passing
  └─ Deploy automático após merge
```

### Feature Branches
```
feature/story-{EPIC}.{STORY}-{description}
  ├─ Criada a partir de: main
  ├─ Padrão: story-12.7-complete-lifecycle
  ├─ Lifespan: < 3 dias
  └─ Deletada após merge
```

Exemplos:
- `feature/story-12.7-complete-lifecycle`
- `feature/story-2.1-implement-routing`
- `feature/story-5.3-add-dark-mode`

### Bug Fix Branches
```
bugfix/issue-{NUMBER}-{description}
  ├─ Para bugs em desenvolvimento
  ├─ Padrão: bugfix/issue-142-fix-broken-link
  └─ Segue mesmo fluxo de feature
```

### Hotfix Branches (Emergências)
```
hotfix/critical-{description}
  ├─ Para bugs críticos em produção
  ├─ Merge direto em main (bypass normal)
  ├─ Requer aprovação de 2 revisores
  └─ Deploy imediato após merge
```

Exemplo: `hotfix/critical-db-connection-leak`

### Documentation Branches
```
docs/update-{area}
  ├─ Para atualizações de documentação
  ├─ Exemplo: docs/update-api-guide
  └─ Mesmo fluxo de feature
```

## Workflow Padrão

### 1. **Criar Feature Branch**
```bash
git checkout -b feature/story-{ID}-{description}
```

### 2. **Desenvolver com Commits Bem-Estruturados**
```bash
# Use Conventional Commits
git commit -m "feat: implement new component [Story 2.1]"
git commit -m "fix: resolve type error in hook"
git commit -m "test: add unit tests for button component"
```

### 3. **Push para Remote**
```bash
git push origin feature/story-{ID}-{description}
```

### 4. **Criar Pull Request**
```bash
# Via GitHub CLI (recomendado)
gh pr create --title "feat: implement new feature" \
  --body "## Summary\n\n- Closes issue #123\n- Implements story 2.1"
```

### 5. **Code Review & Approval**
- ✅ Pelo menos 1 aprovação de reviewer
- ✅ Todos os CI/CD checks devem passar:
  - `npm run lint` ✓
  - `npm run typecheck` ✓
  - `npm run test` ✓
  - `npm run build` ✓
  - CodeRabbit review (CRITICAL issues = block)

### 6. **Merge & Deploy**
```bash
# Merge quando aprovado (automático via GitHub)
# Deploy ocorre automaticamente após merge
```

### 7. **Cleanup**
```bash
# Delete local branch
git branch -d feature/story-{ID}-{description}

# Delete remote branch (automático via GitHub)
```

## Branch Protection Rules

A branch `main` possui as seguintes proteções obrigatórias:

✅ **Require pull request reviews before merging**
- Número mínimo: 1 aprovação
- Dismiss stale pull request approvals: Sim
- Require review from code owners: Não (opcional)

✅ **Require status checks to pass before merging**
- Exigido: `lint` ✓
- Exigido: `typecheck` ✓
- Exigido: `test` ✓
- Exigido: `build` ✓
- Exigido: `story-validation` ✓ (se aplicável)

✅ **Require branches to be up to date before merging**
- Sim — evita merge com código desatualizado

✅ **Require conversation resolution before merging**
- Sim — todos os comentários devem ser resolvidos

✅ **Require signed commits** (opcional)
- Recomendado para produção

## Convenção de Commits

Todos os commits devem seguir **Conventional Commits v1.0.0**:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types Permitidos
- `feat:` — Nova feature
- `fix:` — Bug fix
- `docs:` — Mudanças em documentação
- `style:` — Formatação, missing semicolons, etc
- `refactor:` — Refatoração sem mudança de features
- `perf:` — Improvements de performance
- `test:` — Adição ou atualização de testes
- `chore:` — Build, CI/CD, dependency updates

### Exemplos
```bash
git commit -m "feat: add dark mode toggle [Story 12.1]"
git commit -m "fix: resolve memory leak in useEffect hook"
git commit -m "docs: update API documentation"
git commit -m "test: add tests for authentication flow"
git commit -m "chore: upgrade dependencies to latest"
```

## Situações Especiais

### Merge Conflicts
Se houver conflitos durante merge:
1. Atualizar a branch com main: `git pull origin main`
2. Resolver conflitos localmente
3. Testar localmente (`npm run test`)
4. Push da resolução
5. Re-submit para review

### Emergency Hotfix
Para bugs críticos em produção:
1. Criar `hotfix/critical-{description}` a partir de `main`
2. Aplicar fix + testes
3. Requer aprovação de 2 revisores (bypass normal)
4. Merge direto em `main`
5. Deploy imediato
6. Backport para branches ativas se necessário

### Long-Running Features
Se uma feature vai levar > 3 dias:
- Considere quebra-la em features menores
- Ou sincronize regularmente com main para evitar drift
- Máximo 1 semana antes de exigência de merge ou restart

## Tools Utilizadas

- **Git** — Version control
- **GitHub** — Hosting + PR management
- **GitHub Actions** — CI/CD automation
- **CodeRabbit** — Automated code review
- **GitHub CLI** — Command-line interface

## Troubleshooting

### Branch não aparece no remote
```bash
git push -u origin feature/story-{ID}-{description}
```

### Preciso atualizar com main
```bash
git fetch origin
git rebase origin/main
# ou
git merge origin/main
```

### Deletar branch local
```bash
git branch -d feature/story-{ID}-{description}
```

### Deletar branch remota
```bash
git push origin --delete feature/story-{ID}-{description}
```

## Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Book](https://git-scm.com/book/en/v2)

---

**Última atualização:** 2026-06-08  
**Responsável:** Gage (DevOps)  
**Status:** Ativo
