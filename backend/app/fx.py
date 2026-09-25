import json
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone


def _get(url, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": "WasteFlow/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def _pack(usd_try, eur_try, source):
    return {
        "usdTry": round(float(usd_try), 4),
        "eurTry": round(float(eur_try), 4),
        "source": source,
        "live": True,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def from_tcmb():
    raw = _get("https://www.tcmb.gov.tr/kurlar/today.xml")
    root = ET.fromstring(raw)
    found = {}
    for node in root.findall("Currency"):
        code = node.get("Kod") or node.get("CurrencyCode")
        if code not in ("USD", "EUR"):
            continue
        sell = node.findtext("ForexSelling") or node.findtext("BanknoteSelling")
        if sell:
            found[code] = float(sell.replace(",", "."))
    if "USD" not in found or "EUR" not in found:
        raise ValueError("tcmb-empty")
    return _pack(found["USD"], found["EUR"], "TCMB")


def from_frankfurter():
    usd = json.loads(_get("https://api.frankfurter.dev/v1/latest?from=USD&to=TRY"))
    eur = json.loads(_get("https://api.frankfurter.dev/v1/latest?from=EUR&to=TRY"))
    usd_try = usd.get("rates", {}).get("TRY")
    eur_try = eur.get("rates", {}).get("TRY")
    if not usd_try or not eur_try:
        raise ValueError("frankfurter-empty")
    return _pack(usd_try, eur_try, "ECB / frankfurter")


def from_open_er():
    data = json.loads(_get("https://open.er-api.com/v6/latest/USD"))
    usd_try = data.get("rates", {}).get("TRY")
    eur_per_usd = data.get("rates", {}).get("EUR")
    if not usd_try or not eur_per_usd:
        raise ValueError("er-api-empty")
    return _pack(usd_try, usd_try / eur_per_usd, "open.er-api.com")


def fetch_live_fx():
    errors = []
    for fn in (from_tcmb, from_frankfurter, from_open_er):
        try:
            return fn()
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, ET.ParseError, json.JSONDecodeError, OSError) as exc:
            errors.append(f"{fn.__name__}: {exc}")
    raise RuntimeError("; ".join(errors) or "fx-failed")
