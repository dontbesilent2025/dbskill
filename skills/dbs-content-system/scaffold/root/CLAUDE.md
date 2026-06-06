# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This repository is a structured content system for local content assets.

The project stores raw content copies and converts them into reusable content units that can later be recombined into new topics, scripts, and articles.

## Read First

Before locating files, resolving conflicts, or deciding whether a source has already been processed, read `SOURCE_OF_TRUTH.md`.

## Core Rules

- Treat `01-原始素材区/` as immutable source copies
- Create structured outputs only under `02-内容单元库/`
- Update process tracking files under `03-处理状态/` when new sources are processed
- Follow the rules in `00-规则与索引/`

## Content Unit Types

Phase 1 supports only:

- 问题单元
- 概念单元
- 观点单元
- 案例单元
- 方案单元

Evidence is embedded inside viewpoint units or case units rather than stored as an independent type.

## Naming Rules

- Content unit file name: `ID_标题.md`
- Source IDs use the `SRC-*` pattern
- Content unit IDs use type prefixes such as `QST`、`CON`、`OPI`、`CAS`、`SOL`
