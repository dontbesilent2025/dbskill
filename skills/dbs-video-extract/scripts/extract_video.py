#!/usr/bin/env python3
"""一次执行 TikHub 数据查询和轻抖短视频文稿提取。"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import extract_video_transcript as transcript
import tikhub_api as tikhub


class CombinedError(RuntimeError):
    """可向调用方展示的整合流程错误。"""


LEGAL_NOTICE = (
    "dbskill 是免费项目，与 TikHub、轻抖无隶属、合作或利益关系。"
    "充值由用户自主决定，相关交易、服务、争议及风险由用户自行承担；"
    "法律另有规定的除外，dbskill 不承担责任。"
)
PURCHASE_URLS = {
    "TikHub": "https://user.tikhub.io/dashboard/add-credit",
    "轻抖": "https://www.qingdou.vip/voice-text-api",
}
API_KEY_EXPLANATION = (
    "想让这个 Skill 工作，需要先开通外部数据服务。API Key 是服务商在开通后"
    "提供的一串使用凭证，可以理解为这个 Skill 调用服务的专用通行证。"
    "你不需要理解技术原理，也不要把它发到聊天中。"
)
PURCHASE_CHOICES = {
    "完整功能": {
        "providers": ["TikHub", "轻抖"],
        "result": "同时获得作品／账号数据和语音文字稿",
    },
    "只看数据": {
        "providers": ["TikHub"],
        "result": "获得作者、标题、点赞、评论等作品／账号数据",
    },
    "只要文字稿": {
        "providers": ["轻抖"],
        "result": "把短视频口播提取成文字稿",
    },
}
PURCHASE_STEPS = [
    "按需要的结果选择完整功能、只看数据或只要文字稿。",
    "打开对应充值地址，在服务商页面注册或登录。",
    "查看页面当前显示的套餐、额度、有效期和计费规则，自主决定是否充值。",
    "充值后进入个人中心，寻找 API Key、密钥管理或开发者设置；需要时创建并复制凭证。",
    "不要把凭证发送到聊天中；只需回复 TikHub 已充值、轻抖已充值或两个都已充值。",
    "随后在本地终端运行安全配置脚本，并重新检查服务状态。",
]
SETUP_COMMANDS = {
    "TikHub": "python3 scripts/configure_api_key.py tikhub",
    "轻抖": "python3 scripts/configure_api_key.py qingdou",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="同时查询短视频数据并提取 Markdown 文字稿。"
    )
    parser.add_argument("input", nargs="?", help="短视频链接或完整分享文案")
    parser.add_argument("--stdin", action="store_true", help="从标准输入读取分享文案")
    parser.add_argument(
        "--check-keys",
        action="store_true",
        help="只检查两个 API Key 的发现状态，不读取输入或发起网络请求",
    )
    parser.add_argument(
        "--mode",
        choices=("both", "data", "transcript"),
        default="both",
        help="默认同时查询数据和提取文字稿",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path.cwd() / "短视频文字稿",
        help="Markdown 输出根目录",
    )
    parser.add_argument("--overwrite", action="store_true", help="覆盖同源文稿")
    parser.add_argument(
        "--source",
        choices=("auto", "app", "web"),
        default="auto",
        help="TikHub 抖音作品数据源；小红书与视频号忽略此参数",
    )
    parser.add_argument("--raw-data", action="store_true", help="保留 TikHub 完整响应")
    parser.add_argument(
        "--data-timeout", type=float, default=15.0, help="TikHub 请求超时秒数"
    )
    parser.add_argument(
        "--poll-interval", type=float, default=2.0, help="轻抖轮询间隔秒数"
    )
    parser.add_argument(
        "--transcript-timeout", type=float, default=900.0, help="轻抖最长等待秒数"
    )
    return parser.parse_args()


def collect_input(args: argparse.Namespace) -> str:
    values: list[str] = []
    if args.input and args.input.strip():
        values.append(args.input.strip())
    if args.stdin:
        value = sys.stdin.read().strip()
        if value:
            values.append(value)
    if not values:
        raise CombinedError("没有收到短视频链接或分享文案。")
    if len(values) > 1:
        raise CombinedError("请只提供 1 条短视频链接或分享文案。")
    return values[0]


def credential_summary() -> dict[str, Any]:
    has_tikhub = bool(tikhub.find_api_key())
    has_qingdou = bool(transcript.find_api_key())
    if has_tikhub and has_qingdou:
        state = "complete"
        message = "TikHub 与轻抖 API Key 均已配置，可以查询数据并提取文字稿。"
    elif has_tikhub:
        state = "data_only"
        message = (
            "TikHub 已经可以使用：能查询作品或账号数据。轻抖尚未开通，"
            "所以暂时不能生成语音文字稿。"
        )
    elif has_qingdou:
        state = "transcript_only"
        message = (
            "轻抖已经可以使用：能生成语音文字稿。TikHub 尚未开通，"
            "所以暂时不能查询作品或账号数据。"
        )
    else:
        state = "unavailable"
        message = (
            "当前两个外部服务都没有开通。如果不购买并配置至少一个，"
            "这个 Skill 无法使用。"
        )
    summary: dict[str, Any] = {
        "credential_state": state,
        "tikhub_configured": has_tikhub,
        "qingdou_configured": has_qingdou,
        "message": message,
    }
    missing_providers: list[str] = []
    if not has_tikhub:
        missing_providers.append("TikHub")
    if not has_qingdou:
        missing_providers.append("轻抖")
    if missing_providers:
        summary["purchase_required_to_use"] = not has_tikhub and not has_qingdou
        summary["purchase_required_for_full_functionality"] = True
        summary["api_key_explanation"] = API_KEY_EXPLANATION
        summary["purchase_choices"] = PURCHASE_CHOICES
        summary["legal_notice"] = LEGAL_NOTICE
        summary["purchase_urls"] = {
            provider: PURCHASE_URLS[provider] for provider in missing_providers
        }
        summary["purchase_steps"] = PURCHASE_STEPS
        summary["setup_commands"] = {
            provider: SETUP_COMMANDS[provider] for provider in missing_providers
        }
    return summary


def missing_credential_part(provider: str, capability: str) -> dict[str, Any]:
    return {
        "ok": False,
        "missing_api_key": True,
        "provider": provider,
        "error": f"缺少 {provider} API Key，当前无法{capability}。",
    }


def run_data(user_input: str, args: argparse.Namespace) -> dict[str, Any]:
    try:
        share_url = tikhub.extract_share_url(user_input)
    except tikhub.TikHubError as error:
        return {"ok": False, "error": str(error)}
    if not tikhub.detect_platform(share_url):
        return {
            "ok": None,
            "skipped": True,
            "reason": "当前 TikHub 数据解析只支持抖音、小红书和微信视频号链接。",
        }
    try:
        return tikhub.fetch_supported_link_mcp(
            tikhub.get_api_key(),
            share_url,
            args.source,
            max(1.0, args.data_timeout),
            args.raw_data,
        )
    except (tikhub.TikHubError, OSError) as error:
        return {"ok": False, "error": str(error)}


def apply_data_fallbacks(
    item: dict[str, Any], data_result: dict[str, Any] | None
) -> dict[str, Any]:
    enriched = dict(item)
    if not data_result or data_result.get("link_type") != "video":
        return enriched
    summary = data_result.get("response")
    if not isinstance(summary, dict) or "response" in summary:
        return enriched
    if not transcript.find_author(enriched) and summary.get("author"):
        enriched["authorName"] = summary["author"]
    if not str(enriched.get("videoTitle") or "").strip() and summary.get("description"):
        enriched["videoTitle"] = summary["description"]
    if not (enriched.get("awemeId") or enriched.get("videoId")):
        video_id = summary.get("aweme_id") or summary.get("video_id")
        if video_id:
            enriched["videoId"] = video_id
    return enriched


def run_transcript(
    user_input: str,
    args: argparse.Namespace,
    data_result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    try:
        api_key = transcript.get_api_key()
        base_url = os.environ.get(
            "QINGDOU_BASE_URL", transcript.DEFAULT_BASE_URL
        ).strip()
        batch_id = transcript.commit_task(base_url, api_key, user_input)
        result = transcript.poll_task(
            base_url,
            api_key,
            batch_id,
            max(0.2, args.poll_interval),
            max(1.0, args.transcript_timeout),
        )
        items = result.get("list")
        if not isinstance(items, list) or not items:
            raise transcript.ExtractError("批任务没有返回文稿条目。")
        item_results = [
            transcript.save_item(
                apply_data_fallbacks(item, data_result),
                args.output_dir,
                args.overwrite,
            )
            for item in items
            if isinstance(item, dict)
        ]
        if not item_results:
            raise transcript.ExtractError("批任务没有返回可处理的文稿条目。")
        success_count = sum(1 for item in item_results if item.get("ok"))
        return {
            "ok": success_count == len(item_results),
            "success_count": success_count,
            "failure_count": len(item_results) - success_count,
            "items": item_results,
        }
    except (transcript.ExtractError, OSError) as error:
        return {"ok": False, "error": str(error)}


def overall_status(parts: list[dict[str, Any]]) -> tuple[bool, bool]:
    attempted = [part for part in parts if not part.get("skipped")]
    successes = [part for part in attempted if part.get("ok") is True]
    failures = [part for part in attempted if part.get("ok") is False]
    return bool(successes) and not failures, bool(successes) and bool(failures)


def main() -> int:
    args = parse_args()
    credentials = credential_summary()
    if args.check_keys:
        print(json.dumps(credentials, ensure_ascii=False, indent=2))
        return 0 if credentials["credential_state"] != "unavailable" else 2

    needs_data = args.mode in ("both", "data")
    needs_transcript = args.mode in ("both", "transcript")
    has_required_key = (
        (needs_data and credentials["tikhub_configured"])
        or (needs_transcript and credentials["qingdou_configured"])
    )
    if not has_required_key:
        print(
            json.dumps(
                {
                    "ok": False,
                    "mode": args.mode,
                    **credentials,
                    "next_step": (
                        "先按需要的结果选择服务并完成充值。充值后不要发送凭证，"
                        "只需回复已充值，再按 setup_commands 在本地安全保存并复查状态。"
                    ),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 2

    try:
        user_input = collect_input(args)
    except CombinedError as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 2

    result: dict[str, Any] = {"mode": args.mode, **credentials}
    parts: list[dict[str, Any]] = []
    data_result: dict[str, Any] | None = None
    if args.mode in ("both", "data"):
        if credentials["tikhub_configured"]:
            data_result = run_data(user_input, args)
        else:
            data_result = missing_credential_part(
                "TikHub", "查询作品或账号数据"
            )
        result["data"] = data_result
        parts.append(data_result)
    if args.mode in ("both", "transcript"):
        if not credentials["qingdou_configured"]:
            result["transcript"] = missing_credential_part(
                "轻抖", "提取语音文字稿"
            )
        elif args.mode == "both" and data_result and data_result.get("link_type") == "user":
            result["transcript"] = {
                "ok": None,
                "skipped": True,
                "reason": "链接指向用户主页，没有可提取的单条视频文稿。",
            }
        else:
            result["transcript"] = run_transcript(user_input, args, data_result)
        parts.append(result["transcript"])

    ok, partial_success = overall_status(parts)
    result["ok"] = ok
    result["partial_success"] = partial_success
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
