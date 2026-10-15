#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
双向一致性核验：交付 Excel《前后端联调测试结果.xlsx》 vs 前端源码 src/api/*.js 的真实请求声明

目的：防止 Excel 漏登记或多登记请求。
  - 正向：src/api 里声明的每条请求，Excel 里必须有对应行
  - 反向：Excel 里每一行，都必须在 src/api 里真实存在

用法：python scripts/verify-xlsx-vs-source.py
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "前后端联调测试结果.xlsx"
NODE = r"C:/Users/19869/.workbuddy/binaries/node/versions/22.22.2-2/node.exe"


def norm_path(p: str) -> str:
    """把路径占位符归一化：${id} / {id} / :id  ->  {x}"""
    p = p.strip()
    p = re.sub(r"\$\{[^}]+\}", "{x}", p)
    p = re.sub(r"\{[^}]+\}", "{x}", p)
    p = re.sub(r":[A-Za-z_][A-Za-z0-9_]*", "{x}", p)
    p = re.sub(r"/+$", "", p)
    return p


def from_source() -> set:
    """跑 api-inventory.mjs，解析出 (METHOD, /path) 集合"""
    out = subprocess.run(
        [NODE, "scripts/api-inventory.mjs"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8"
    )
    if out.returncode != 0:
        print("api-inventory.mjs 执行失败：", out.stderr[:500])
        sys.exit(1)
    items = set()
    for line in out.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) >= 4 and parts[0].isdigit():
            method, path = parts[2].strip().upper(), parts[3].strip()
            items.add((method, norm_path(path)))
    return items


def from_xlsx() -> set:
    """读 Excel 的「前端请求」列，解析出 (METHOD, /path) 集合"""
    try:
        import openpyxl
    except ImportError:
        print("需要 openpyxl：pip install openpyxl")
        sys.exit(1)
    wb = openpyxl.load_workbook(XLSX)
    ws = wb.active
    items = set()
    for row in ws.iter_rows(min_row=2, values_only=True):
        cell = (row[0] or "").strip()
        if not cell:
            continue
        m = re.match(r"^([A-Z]+)\s+(/\S*)$", cell)
        if not m:
            print(f"  ⚠ 无法解析的单元格：{cell!r}")
            continue
        method, path = m.group(1).upper(), m.group(2)
        if path.startswith("/api"):
            path = path[len("/api"):]
        items.add((method, norm_path(path)))
    return items


def main():
    src = from_source()
    xls = from_xlsx()

    print("=" * 64)
    print(f"src/api/*.js 声明的请求      : {len(src)} 条")
    print(f"Excel 登记的前端请求          : {len(xls)} 条")
    print("=" * 64)

    only_src = sorted(src - xls)
    only_xls = sorted(xls - src)

    if only_src:
        print(f"\n✗ src 里有、Excel 漏登记的 {len(only_src)} 条：")
        for m, p in only_src:
            print(f"    {m:6s} {p}")
    if only_xls:
        print(f"\n✗ Excel 里有、src 里不存在的 {len(only_xls)} 条：")
        for m, p in only_xls:
            print(f"    {m:6s} {p}")

    if not only_src and not only_xls:
        print(f"\n✓ 双向完全一致：{len(src)} 条请求一一对应，无漏登记、无凭空多写")
        return 0

    print(f"\n✗ 存在差异：漏 {len(only_src)} 条 / 多 {len(only_xls)} 条")
    return 1


if __name__ == "__main__":
    sys.exit(main())
