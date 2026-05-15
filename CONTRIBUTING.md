# Contributing

This is an academic project. Contributions follow these principles.

---

## Code Style

- TypeScript strict mode
- ESLint configuration must pass
- No `any` types in business logic
- Functions under 50 lines preferred

---

## Commit Messages

Follow conventional commits:

```
feat: добавить новую функциональность
fix: исправить баг
docs: обновить документацию
test: добавить или изменить тесты
refactor: рефакторинг без изменения функциональности
perf: оптимизация производительности
chore: служебные задачи
```

---

## Testing

All changes must pass:

```bash
node tests/api/full-api-test.js
node tests/security/security-test.js
```

---

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests
5. Submit PR with clear description
