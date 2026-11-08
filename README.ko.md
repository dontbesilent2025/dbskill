# dbskill

[简体中文](README.md) | [English](README.en.md) | [日本語](README.ja.md) | 한국어 | [繁體中文](README.zh-TW.md)

[![Version](https://img.shields.io/badge/version-3.3.0-111111.svg)](VERSION)
[![skills.sh](https://skills.sh/b/dontbesilent2025/dbskill)](https://skills.sh/b/dontbesilent2025/dbskill)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-111111.svg)](LICENSE)

**이번 업데이트:** 저장소를 모든 권리 보유로 변경했습니다. Skill은 계속 무료로 설치하고 사용할 수 있으며 자신의 사업과 고객 서비스에도 쓸 수 있습니다. 허가 없이 전재, 포함, 판매, AI 학습에 사용할 수 없습니다. 전체 조항은 [LICENSE](LICENSE)를 참고하세요

## dbskill 이란

dbskill 은 dontbesilent 가 만든 중국어 AI Skills 도구 상자이며, Skill 35 개로 구성됩니다. 豆包, WorkBuddy, Claude Code, Codex 등 Skills 를 지원하는 Agent 에 설치하면 대화에서 바로 사용할 수 있습니다.

Skill 은 Agent 에게 주는 작업 방법입니다. dbskill 을 설치하면 Agent 에게 다음을 맡길 수 있습니다.

- 비즈니스의 문제가 어디에 있는지 판단합니다. 예: 재등록률이 낮음, 고객이 비싸다고 함
- 배울 만한 동종 업체를 찾고, 그들이 구체적으로 어떻게 하는지 살펴봅니다
- 주제를 콘텐츠 기획안으로 만들고, 원고의 어느 부분이 사람을 움직이지 못하는지 점검합니다
- 영상의 제목, 표지 문구, 도입부를 쓰고, 게시 전에 규정 위반 위험을 점검합니다
- 해야 할 일을 알면서도 계속 하지 못하는 이유를 분석합니다
- 로컬 폴더를 언제든 조회할 수 있는 지식 베이스로 정리합니다

방법 자료는 dontbesilent 의 공개 게시물 16,152 개를 지식 원자 4,176 개로 정리한 것입니다. 작성자: [@dontbesilent](https://x.com/dontbesilent)

## 빠른 시작

**1 단계: 설치**

터미널에서 실행합니다.

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

Claude Code 플러그인 마켓플레이스를 쓰거나 Skill 하나만 설치하려면 아래 [설치 세부 정보](#설치-세부-정보)를 확인하세요.

Grok Bot에서는 준비된 [dbs 创业教练(창업 코치)](https://x.ai/bot/kpZtlm5CADHoXaaAqTV5Z)나 [dbs 内容教练(콘텐츠 코치)](https://x.ai/bot/qonh7lyBBYsbUXsR9LtO2)를 추가하기만 하면 됩니다. 사용법은 [Grok Bot에서 쓰기](#grok-bot에서-쓰기)를 확인하세요.

**2 단계: 문제를 `/dbs` 에 전달**

Agent 대화창에 `/dbs` 를 입력하고 뒤에 상황과 질문을 적습니다. 정보가 완전하지 않아도 됩니다.

```text
/dbs 저는 어린이 코딩 수업을 운영합니다. 유료 학생은 40 명이지만 재등록률이 낮습니다. 상품, 가격, 고객층 중 무엇부터 점검해야 할지 모르겠습니다
```

처음 사용한다면 먼저 `/dbs 新手入门` 을 입력해 어떤 작업을 처리할 수 있는지 확인하세요.

**3 단계: 같은 대화에서 계속**

결과를 받은 뒤에는 사실, 자료, 수정 의견을 바로 덧붙이면 됩니다. 명령을 다시 입력할 필요가 없습니다. 새로운 목표로 바꿀 때 `/dbs` 를 다시 입력하세요.

## Grok Bot에서 쓰기

Grok Bot에서는 명령을 입력할 필요가 없습니다. 준비된 코치를 추가하면 첫 대화에서 dbskill을 스스로 설치합니다. 코치는 중국어로 대화합니다.

| 코치 | 도와주는 일 | 추가 링크 |
| --- | --- | --- |
| dbs 创业教练(창업 코치) | 사업이 어디서 막혔는지, 이번 주에 먼저 할 한 가지를 정리합니다. 원하면 매주 월요일에 먼저 회고를 요청합니다 | https://x.ai/bot/kpZtlm5CADHoXaaAqTV5Z |
| dbs 内容教练(콘텐츠 코치) | 주제 선정, 제목·표지 문구·도입부 작성, 원고 점검, 게시물별 회고를 돕습니다. 원하면 매주 금요일에 먼저 회고를 요청합니다 | https://x.ai/bot/qonh7lyBBYsbUXsR9LtO2 |

**사용법**

1. 위 링크를 열고 "Add to Grok Bot"을 눌러 Grok Bot 앱에서 추가를 확인합니다
2. 새 코치에게 "안녕"이라고 보냅니다. 몇 분 동안 dbskill을 설치한 뒤 사업이나 계정에 대해 몇 가지를 묻습니다
3. 그다음 질문을 그대로 보내면 됩니다. 예: "강의 재등록률이 낮아요. 먼저 무엇을 봐야 하나요?"

**코치가 설치할 수 없다고 할 때**

아래 블록을 그대로 보내세요. 콘텐츠 코치라면 마지막 `startup`을 `content`로 바꿉니다.

```text
아래 두 명령을 실행해 dbskill을 설치하고, 출력을 그대로 보여 주세요:
git clone --depth 1 https://github.com/dontbesilent2025/dbskill /tmp/dbskill 2>/dev/null || git -C /tmp/dbskill pull --ff-only
python3 /tmp/dbskill/tools/grok/install.py --coach startup
```

코치 없이 내 Grok Bot에 dbskill만 설치하려면 같은 블록에서 `startup`을 `all`로 바꿔 보내세요. 공개 Skill 29개가 모두 설치됩니다.

## /dbs 가 Skill 을 배치하는 방식

`/dbs` 는 dbskill 의 스킬 조정 데스크(技能调度台)입니다. 먼저 원하는 최종 결과를 보고, 어떤 Skill 을 어떤 순서로 쓸지 정합니다. 가능한 한 적게 씁니다. 간단한 질문에는 바로 답하고, Skill 하나로 충분하면 하나만 씁니다.

자주 쓰는 배치는 6 가지입니다.

1. **하나만 사용**: 비즈니스 모델 진단에는 `dbs-diagnosis` 만 씁니다
2. **순서대로 이어서 진행**: 다음 단계가 앞 단계의 결과를 사용합니다. `dbs-content` 가 창작 기획안을 내고, 원고를 다 쓴 뒤 `dbs-content-risk-check` 로 게시 위험을 점검합니다
3. **각자 따로 진행**: 서로 관련 없는 작업입니다. `dbs-ai-check` 는 AI 느낌을 점검하고 `dbs-wechat-html` 은 편집하며, 두 결과를 각각 전달합니다
4. **먼저 판단하고 진행 여부 결정**: `dbs-content-value` 가 주제가 할 만한지 먼저 판단하고, 할 만하면 `dbs-content` 로 기획안을 만듭니다
5. **각각 분석한 뒤 비교**: 같은 문제에 원인이 여러 가지일 수 있습니다. 원고 조회수가 낮을 때 `dbs-content-value` 와 `dbs-resonate` 가 각자 원인을 내고, `/dbs` 가 이를 비교합니다
6. **작성 후 점검하고 수정**: 기준이 높은 글은 `dbs-plain-writing` 으로 쓴 뒤 `dbs-ai-check` 로 점검하고, 발견된 문제에 따라 수정합니다

방향을 정해야 할 때 `/dbs` 는 선택지를 제시하며 대신 고르지 않습니다. 시작하기 전에 어떻게 배치할지, 왜 그렇게 배치하는지 설명합니다.

## 전체 Skill

사용할 Skill 을 이미 알고 있다면 해당 명령을 바로 입력할 수 있습니다. 각 Skill 의 사용 시점, 입력 예시와 경계는 [입문 가이드와 Skill 전체 목록](docs/新手入门.md#skill-全目录)을 확인하세요.

### 진입점

| 명령 | 용도 |
| --- | --- |
| [`/dbs`](skills/dbs/SKILL.md) | 질문에 맞는 Skill 을 고르고 배치해 현재 대화에서 진행합니다 |

### 비즈니스 판단과 문제 명확화

| 명령 | 용도 |
| --- | --- |
| [`/dbs-diagnosis`](skills/dbs-diagnosis/SKILL.md) | 비즈니스 문제가 성립하는지 판단하거나 사업 전체를 점검하고, 내일 할 첫 번째 일을 제시합니다 |
| [`/dbs-benchmark`](skills/dbs-benchmark/SKILL.md) | 모방할 만한 동종 업체를 골라 고객 확보, 전환, 제공의 구체적인 방법을 분석합니다 |
| [`/dbs-jtbd`](skills/dbs-jtbd/SKILL.md) | 고객이 어떤 상품을 선택하거나 포기하는 이유를 분석합니다 |
| [`/dbs-goal`](skills/dbs-goal/SKILL.md) | 막연한 바람을 점검 가능한 목표와 완료 기준으로 정리합니다 |
| [`/dbs-good-question`](skills/dbs-good-question/SKILL.md) | 모호한 질문을 명확하게 다시 쓰고, 어떤 부분을 Agent 에게 맡길 수 있는지 판단합니다 |
| [`/dbs-deconstruct`](skills/dbs-deconstruct/SKILL.md) | 설명하기 어려운 개념을 분해해 상황마다 어떤 뜻인지 정리합니다 |
| [`/dbs-theory-grounding`](skills/dbs-theory-grounding/SKILL.md) | 강의, PPT, 방법론 속 판단을 점검하고 신뢰할 수 있는 이론적 근거를 찾습니다 |
| [`/dbs-standard-answer`](skills/dbs-standard-answer/SKILL.md) | 문제와 관련된 이론과 역사적 사례를 조사해 조건이 붙은 표준 답변을 제시합니다 |

### 콘텐츠 제작과 게시

| 명령 | 용도 |
| --- | --- |
| [`/dbs-content`](skills/dbs-content/SKILL.md) | 정해진 주제를 콘텐츠 기획안으로 만듭니다: 형식, 플랫폼, 구조, 표현 |
| [`/dbs-title-cover-intro`](skills/dbs-title-cover-intro/SKILL.md) | 먼저 주제를 정한 뒤 샤오홍슈, 빌리빌리, 더우인, 위챗 채널용 제목, 표지 문구, 도입부를 씁니다 |
| [`/dbs-resonate`](skills/dbs-resonate/SKILL.md) | 완성된 원고의 어느 부분이 목표 독자를 움직이지 못하는지 찾아 수정 제안을 합니다 |
| [`/dbs-script-flow`](skills/dbs-script-flow/SKILL.md) | 숏폼 영상 대본의 연결과 낭독 흐름을 점검하고, 시청자가 이탈할 수 있는 위치를 표시합니다 |
| [`/dbs-content-value`](skills/dbs-content-value/SKILL.md) | 콘텐츠가 누구를 끌어들일지, 도입부가 사람을 붙잡을 수 있는지, 예상 유입과 상업적 가치를 판단합니다 |
| [`/dbs-spread`](skills/dbs-spread/SKILL.md) | 이미 반응을 얻은 콘텐츠가 왜 공감이나 공유를 일으켰는지 설명합니다 |
| [`/dbs-ai-check`](skills/dbs-ai-check/SKILL.md) | 글에 남은 AI 작성 흔적을 표시합니다 |
| [`/dbs-content-risk-check`](skills/dbs-content-risk-check/SKILL.md) | 게시 전에 플랫폼 심사 위험을 문장 단위로 점검하고 최소한의 수정 방법을 제시합니다 |
| [`/dbs-plain-writing`](skills/dbs-plain-writing/SKILL.md) | 사실 순서대로 상품, 기능, 업데이트 설명을 쓰며 마케팅 포장을 더하지 않습니다 |
| [`/dbs-wechat-html`](skills/dbs-wechat-html/SKILL.md) | Markdown 을 위챗 공식 계정 관리 화면에 붙여 넣을 수 있는 HTML 로 편집합니다 |

### 영상 처리

| 명령 | 용도 |
| --- | --- |
| [`/dbs-video-extract`](skills/dbs-video-extract/SKILL.md) | 플랫폼 링크로 작품 데이터와 음성 원고를 가져옵니다. 외부 서비스 자격 증명이 필요합니다 |
| [`/dbs-video-navigation`](skills/dbs-video-navigation/SKILL.md) | 로컬 영상을 장으로 나누고, 편집 소프트웨어에 가져올 수 있는 내비게이션 바를 만듭니다 |

### 실행, 학습, 의사결정

| 명령 | 용도 |
| --- | --- |
| [`/dbs-action`](skills/dbs-action/SKILL.md) | 해야 할 일을 알면서도 계속 하지 못하는 이유를 분석하고, 오늘 할 수 있는 한 걸음을 제시합니다 |
| [`/dbs-learning`](skills/dbs-learning/SKILL.md) | 하나의 과제를 이어지는 학습 글로 나누고, 피드백에 따라 다음 글을 조정합니다 |
| [`/dbs-decision`](skills/dbs-decision/SKILL.md) | 장기적으로 추적할 결정을 로컬에 기록하고, 이후 결과를 채우고 회고합니다 |

### 저장과 보고서

| 명령 | 용도 |
| --- | --- |
| [`/dbs-save`](skills/dbs-save/SKILL.md) | 현재 대화의 결론과 다음 단계를 로컬에 저장합니다 |
| [`/dbs-restore`](skills/dbs-restore/SKILL.md) | 지난 저장본을 읽어 이어서 처리합니다 |
| [`/dbs-report`](skills/dbs-report/SKILL.md) | 여러 저장본을 하나의 보고서로 합칩니다 |

### 다중 관점 토론

| 명령 | 용도 |
| --- | --- |
| [`/dbs-chatroom`](skills/dbs-chatroom/SKILL.md) | 여러 전문가 역할이 한 주제에 대해 각자 발언하고 마지막에 정리합니다 |
| [`/dbs-chatroom-austrian`](skills/dbs-chatroom-austrian/SKILL.md) | 하이에크와 미제스 두 오스트리아학파 경제학자의 관점으로 문제를 토론합니다 |

### 자료와 도구

| 명령 | 용도 |
| --- | --- |
| [`/dbs-knowledge`](skills/dbs-knowledge/SKILL.md) | 로컬 폴더를 Agent 가 찾고, 수록하고, 유지할 수 있는 지식 베이스로 만듭니다 |
| [`/dbs-content-system`](skills/dbs-content-system/SKILL.md) | 기존 원고 묶음을 나누고 재사용할 수 있는 콘텐츠 자료 저장소로 정리합니다 |
| [`/dbs-human-dispatch`](skills/dbs-human-dispatch/SKILL.md) | 직원이나 협업자에게 업무를 맡기고, 진행 상황을 확인하고 결과를 검수합니다 |
| [`/dbs-skill-maker`](skills/dbs-skill-maker/SKILL.md) | 새 Skill 을 만들거나 기존 Skill 을 개선합니다 |
| [`/dbs-install-skill`](skills/dbs-install-skill/SKILL.md) | Skill 을 여러 Agent 에 설치하고 중복된 진입점을 정리합니다 |
| [`/dbs-sync-to-dondon`](skills/dbs-sync-to-dondon/SKILL.md) | 로컬 Agent 들에서 최근 한 일을 근황으로 정리하고, 확인 후 dondon bot 에 동기화합니다 (bot 쪽에서 기능을 켜야 합니다) |

## 설치 세부 정보

아래 명령은 모두 터미널에서 실행합니다. Agent 에게 채팅 내용으로 보내지 마세요.

### Skills CLI

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

`-g` 는 전역 설치, `--all` 은 Skills CLI 가 인식하는 모든 Agent 에 설치한다는 뜻입니다. Agent 하나에만 설치하려면 `--all` 을 빼고 안내에 따라 선택하세요.

### Claude Code 플러그인 마켓플레이스

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

플러그인 방식에서는 명령 앞에 `dbs:` 를 붙입니다. 예: `/dbs:dbs`, `/dbs:dbs-diagnosis`

Skill 하나만 설치하려면 해당 플러그인을 설치합니다. 예:

```bash
claude plugin install dbs-diagnosis@dontbesilent-skills
```

![Claude Code 설치 데모](demo.gif)

### 설치 후 명령이 보이지 않을 때

먼저 설치 명령이 성공했는지, 지금 쓰는 Agent 에 설치되었는지 확인하세요. Skills CLI 로 설치하면 `/dbs` 같은 짧은 명령을, Claude Code 플러그인은 `dbs:` 가 붙은 명령을 씁니다. 정확한 이름은 Agent 에 표시되는 것을 기준으로 합니다.

## 더 많은 사용법

### 특정 Skill 직접 호출

명령 뒤에 질문, 자료, 원하는 결과를 적습니다.

```text
/dbs-diagnosis 정리 컨설팅을 하고 있고 객단가는 3,000 위안입니다. 최근 상담 10 건 중 6 건은 비싸다고 했고 3 건은 답이 없었습니다. 다음에 무엇부터 확인해야 할지 판단해 주세요
```

```text
/dbs-title-cover-intro 촬영 예정인 숏폼 영상 원고입니다. 샤오홍슈에 게시할 기준으로 제목, 표지 문구, 도입부를 주세요: 원고 붙여 넣기
```

질문할 때 다음 정보를 함께 주면 결과가 더 정확해집니다.

- 이미 가지고 있는 사실과 숫자. 예: 가격, 인원, 거래 현황
- 요약이 아닌 완전한 원고나 자료
- 원하는 결과. 예: 판단, 기획안, 바로 쓸 수 있는 문장

로컬 파일을 읽거나, 인터넷에 접속하거나, 영상을 처리하는 Skill 은 Agent 에 그에 맞는 권한이나 도구가 필요합니다. 자세한 내용은 각 Skill 의 설명을 확인하세요.

### 영상 속 세 자리 번호 사용

dontbesilent 의 영상에서 세 자리 번호를 받았다면 다음을 입력합니다.

```text
/dbs 123
```

`123` 을 영상에서 받은 번호로 바꾸세요. 현재 모든 번호를 보려면 `/dbs 숨겨진 스킬을 모두 보여줘` 를 입력합니다. 번호의 내용은 사용할 때 GitHub 에서 읽으므로 Agent 가 GitHub 에 접속할 수 있어야 합니다.

### 대화를 넘어 결론 유지

`/dbs-save` 로 현재 결론을 저장하고, 다음에 `/dbs-restore` 로 이어서 처리합니다. 저장본은 로컬 `~/.dbs/` 에 저장됩니다.

## 저장소 자료

Skill 을 설치해도 이 자료는 다운로드되지 않습니다. 필요할 때 저장소에서 확인하세요.

| 자료 | 용도 |
| --- | --- |
| [공개 게시물 모음(Markdown)](books/dontbesilent-开源推文集.md) | 검색, 읽기, 또는 AI 분석용 |
| [공개 게시물 모음(PDF)](books/dontbesilent-开源推文集.pdf) | 읽기와 보관 |
| [원자 라이브러리 안내](知识库/原子库/README.md) | 데이터 범위, 필드, 사용 방법 |
| [지식 원자 데이터](知识库/原子库/atoms.jsonl) | 자체 검색, 분석 또는 RAG 구축 |
| [Skill 지식 팩](知识库/Skill知识包) | Skill 별로 정리한 방법 자료 |

## 업데이트와 도움말

Agent 대화에서 다음처럼 말하세요.

```text
更新 dbskill
```

업데이트는 공식 dbskill 을 동기화하고, `~/.dbs/` 의 저장본과 기록은 유지하며, 종료된 이전 Skill 을 자동으로 정리합니다. 직접 정리하는 방법은 [입문 가이드](docs/新手入门.md)를 확인하세요. 변경 이력은 [커밋 기록](https://github.com/dontbesilent2025/dbskill/commits/main)에서 볼 수 있습니다.

- [입문 가이드와 Skill 전체 목록](docs/新手入门.md)
- [문제 또는 제안 제출](https://github.com/dontbesilent2025/dbskill/issues)
- [유료 Q&A 그룹 안내](https://mp.weixin.qq.com/s/RpwNjMo4M_er4GOrfCYt1g)
- 작성자: [@dontbesilent](https://x.com/dontbesilent) · [샤오홍슈](https://xhslink.com/m/637xuspR4iI) · [더우인](https://v.douyin.com/pRUDhpBqOrc/)

## 기여자

`dbs-content-risk-check` 의 민감어 점검 기능은 다음 공동 제작자들이 함께 다듬었습니다.

- [@Ronnie2025](https://github.com/Ronnie2025)
- [@非著名投放小沈](https://xhslink.cn/m/4NSBjmZTC1j)

## 라이선스

이 프로젝트의 저작권은 dontbesilent에게 있으며 모든 권리를 보유합니다. 전체 조항은 [LICENSE](LICENSE)를 참고하세요(중국어판이 우선합니다).

- Skill은 무료로 설치하고 사용할 수 있습니다. 자신의 사업과 자신의 고객에게 서비스를 제공할 때 사용하는 것, 자신의 기기에서 본인용으로 수정하는 것도 포함됩니다.
- 서면 허가 없이 전재, 재배포, 다른 제품에 포함, 판매, 수정본 공개, AI 모델 학습에 사용할 수 없습니다. 이 저장소 링크 공유는 자유입니다.
- `books/` 디렉터리는 무료 열람만 가능합니다. [books/LICENSE](books/LICENSE)를 참고하세요.
- 2026-11-02 이전에 공개된 버전은 당시의 CC BY-NC 4.0이 그대로 적용됩니다.

허가 신청은 openmarshall@gmail.com으로 이메일을 보내 주세요.
