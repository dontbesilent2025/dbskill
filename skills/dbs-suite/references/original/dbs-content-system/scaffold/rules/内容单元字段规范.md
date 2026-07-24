# 内容单元字段规范

## 通用字段

每个内容单元必须包含以下字段：

- `id`
- `type`
- `title`
- `source_documents`
- `source_authors`
- `themes`
- `keywords`
- `status`
- `canonical`
- `version`
- `created_at`
- `updated_at`
- `relationships`

## 类型字段

### 问题单元

- `question_text`
- `question_type`
- `user_stage`
- `applicable_topics`

### 概念单元

- `concept_definition`
- `concept_function`

### 观点单元

- `core_claim`
- `claim_scope`
- `why_it_matters`

### 案例单元

- `case_subject`
- `case_summary`
- `case_process`
- `case_result`

### 方案单元

- `target_problem`
- `solution_summary`
- `action_steps`
- `expected_result`

## relationships 写法

空关系统一写：

```yaml
relationships: []
```

存在关系时统一写：

```yaml
relationships:
  - type: 解释
    target: CON-20260602-001
    note: 用于定义判断边界
```
