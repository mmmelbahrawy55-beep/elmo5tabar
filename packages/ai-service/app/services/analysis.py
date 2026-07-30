from fastapi import FastifyApp, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import numpy as np

# AI Service for Lab Report Insights
# This service provides AI-powered analysis of lab results

class LabResultInput(BaseModel):
    test_code: str
    test_name: str
    value: float
    unit: str
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    patient_age: int
    patient_gender: str


class InsightResult(BaseModel):
    test_code: str
    status: str  # normal, borderline, abnormal_high, abnormal_low
    severity: str  # normal, mild, moderate, severe
    insight_ar: str
    insight_en: str
    recommendation_ar: str
    recommendation_en: str
    related_tests: List[str]


# Reference ranges for common tests (adult males/females)
REFERENCE_RANGES = {
    "HGB": {"male": (13.5, 17.5), "female": (12.0, 16.0), "unit": "g/dL"},
    "WBC": {"range": (4000, 11000), "unit": "/μL"},
    "PLT": {"range": (150000, 400000), "unit": "/μL"},
    "GLU": {"range": (70, 100), "unit": "mg/dL"},
    "HBA1C": {"range": (4.0, 5.7), "unit": "%"},
    "CRE": {"male": (0.7, 1.3), "female": (0.6, 1.1), "unit": "mg/dL"},
    "BUN": {"range": (7, 20), "unit": "mg/dL"},
    "CHOL": {"range": (0, 200), "unit": "mg/dL"},
    "HDL": {"range": (40, 60), "unit": "mg/dL"},
    "LDL": {"range": (0, 100), "unit": "mg/dL"},
    "TG": {"range": (0, 150), "unit": "mg/dL"},
    "TSH": {"range": (0.4, 4.0), "unit": "mIU/L"},
    "VITD": {"range": (30, 100), "unit": "ng/mL"},
    "FERR": {"male": (30, 400), "female": (15, 150), "unit": "ng/mL"},
    "AST": {"range": (10, 40), "unit": "U/L"},
    "ALT": {"range": (7, 56), "unit": "U/L"},
}


def get_reference_range(test_code: str, patient_gender: str):
    ref = REFERENCE_RANGES.get(test_code.upper(), {})
    if "male" in ref and "female" in ref:
        gender_key = "male" if patient_gender.upper() == "MALE" else "female"
        return ref[gender_key]
    return ref.get("range", (None, None))


def analyze_result(result: LabResultInput) -> InsightResult:
    low, high = get_reference_range(result.test_code, result.patient_gender)
    
    if low is None or high is None:
        status = "normal"
        severity = "normal"
    elif result.value < low:
        diff_pct = ((low - result.value) / low) * 100
        status = "abnormal_low"
        severity = "mild" if diff_pct < 20 else "moderate" if diff_pct < 50 else "severe"
    elif result.value > high:
        diff_pct = ((result.value - high) / high) * 100
        status = "abnormal_high"
        severity = "mild" if diff_pct < 20 else "moderate" if diff_pct < 50 else "severe"
    else:
        status = "normal"
        severity = "normal"
    
    insight = generate_insight(result.test_code, result.value, status, severity)
    recommendation = generate_recommendation(result.test_code, status, severity)
    related = get_related_tests(result.test_code, status)
    
    return InsightResult(
        test_code=result.test_code,
        status=status,
        severity=severity,
        insight_ar=insight["ar"],
        insight_en=insight["en"],
        recommendation_ar=recommendation["ar"],
        recommendation_en=recommendation["en"],
        related_tests=related,
    )


def generate_insight(test_code: str, value: float, status: str, severity: str) -> dict:
    insights = {
        "HGB": {
            "abnormal_high": {
                "ar": f"مستوى الهيموجلوبين مرتفع ({value}). قد يشير إلى جفاف أو أمراض الدم.",
                "en": f"Hemoglobin level is elevated ({value}). May indicate dehydration or blood disorders.",
            },
            "abnormal_low": {
                "ar": f"مستوى الهيموجلوبين منخفض ({value}). قد يشير إلى فقر الدم.",
                "en": f"Hemoglobin level is low ({value}). May indicate anemia.",
            },
        },
        "HBA1C": {
            "abnormal_high": {
                "ar": f"مستوى السكر التراكمي مرتفع ({value}%). يشير إلى خطر الإصابة بالسكري أو عدم التحكم بالسكري.",
                "en": f"HbA1c is elevated ({value}%). Indicates risk of diabetes or poor diabetes control.",
            },
        },
        "TSH": {
            "abnormal_high": {
                "ar": f"مستوى TSH مرتفع ({value}). قد يشير إلى قصور الدرقية.",
                "en": f"TSH is elevated ({value}). May indicate hypothyroidism.",
            },
            "abnormal_low": {
                "ar": f"مستوى TSH منخفض ({value}). قد يشير إلى فرط الدرقية.",
                "en": f"TSH is low ({value}). May indicate hyperthyroidism.",
            },
        },
        "VITD": {
            "abnormal_low": {
                "ar": f"مستوى فيتامين د منخفض ({value} ng/mL). قد يسبب ضعف العظام والمناعة.",
                "en": f"Vitamin D is low ({value} ng/mL). May cause weakened bones and immunity.",
            },
        },
    }
    
    test_insights = insights.get(test_code.upper(), {})
    if status in test_insights:
        return test_insights[status]
    if status == "normal":
        return {
            "ar": f"النتيجة ضمن المعدل الطبيعي ({value}).",
            "en": f"Result is within normal range ({value}).",
        }
    return {
        "ar": f"النتيجة خارج المعدل الطبيعي ({value}).",
        "en": f"Result is outside normal range ({value}).",
    }


def generate_recommendation(test_code: str, status: str, severity: str) -> dict:
    if status == "normal":
        return {"ar": "استمر في نمط الحياة الصحي.", "en": "Continue your healthy lifestyle."}
    
    severity_recs = {
        "mild": {
            "ar": "يُنصح بمراجعة الطبيب لمتابعة الحالة.",
            "en": "It is recommended to consult a doctor for follow-up.",
        },
        "moderate": {
            "ar": "يُنصح بشدة بمراجعة الطبيب المختص.",
            "en": "Strongly recommend consulting a specialist.",
        },
        "severe": {
            "ar": "يُنصح بمراجعة الطبيب فوراً.",
            "en": "Urgent medical consultation recommended.",
        },
    }
    
    return severity_recs.get(severity, severity_recs["mild"])


def get_related_tests(test_code: str, status: str) -> list:
    related_map = {
        "HGB": ["CBC", "FERR", "IRON"],
        "GLU": ["HBA1C", "INSULIN"],
        "HBA1C": ["GLU", "FRUCTOSAMINE"],
        "CHOL": ["HDL", "LDL", "TG"],
        "TSH": ["FT3", "FT4"],
        "CRE": ["BUN", "EGFR"],
        "VITD": ["CA", "PTH"],
        "AST": ["ALT", "ALP", "BILIRUBIN"],
        "ALT": ["AST", "ALP"],
    }
    return related_map.get(test_code.upper(), [])
