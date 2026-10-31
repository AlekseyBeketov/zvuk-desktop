# Сторонние скиллы в этом каталоге

| Скилл | Источник | Upstream revision | Статус SkillSpector |
|---|---|---|---|
| rust-best-practices | apollographql/skills | 7e2fb559cf4b824b27f1fec49fe88f7511066d26 | SAFE (v2.13.1, --no-llm) |

Потенциальные (требуют решения владельца):
- rust-async-patterns (wshobson/agents, 35e7f7de...) — CAUTION
- rust-patterns, rust-testing (affaan-m/ecc, b38be6a7...) — CAUTION (reference_missing в доке, findings пусты)
- tauri-v2 (nodnarbnitram/claude-code-extensions, 9dda1397...) — DO_NOT_INSTALL (static_parse_limit, 62.5% coverage)
Staging-копии: /Users/alexbeketov/zvuk-desktop/tools/staging/selected/

Решение владельца (2026-10-31): CAUTION-скиллы rust-async-patterns, rust-patterns, rust-testing установлены по явному решению Лехи (findings пусты, отказы сканера — артефакты парсера/доки). tauri-v2 НЕ установлен (DO_NOT_INSTALL); Tauri-доки — через context7/официальные источники.
