from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from app.services.analysis import analyze_result, LabResultInput, InsightResult

app = FastAPI(
    title="Al Mokhtabar AI Service",
    description="AI-powered lab result analysis and insights",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BatchAnalysisRequest(BaseModel):
    results: List[LabResultInput]
    patient_age: int
    patient_gender: str


class BatchAnalysisResponse(BaseModel):
    insights: List[InsightResult]
    overall_status: str
    summary_ar: str
    summary_en: str
    recommended_follow_up: List[str]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-analysis"}


@app.post("/api/v1/analyze", response_model=InsightResult)
async def analyze_single(result: LabResultInput):
    try:
        insight = analyze_result(result)
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/analyze/batch", response_model=BatchAnalysisResponse)
async def analyze_batch(request: BatchAnalysisRequest):
    try:
        insights = []
        abnormal_count = 0
        
        for result in request.results:
            result.patient_age = request.patient_age
            result.patient_gender = request.patient_gender
            insight = analyze_result(result)
            insights.append(insight)
            if insight.status != "normal":
                abnormal_count += 1
        
        if abnormal_count == 0:
            overall_status = "normal"
            summary_ar = "جميع النتائج ضمن المعدلات الطبيعية. أحسنت!"
            summary_en = "All results are within normal ranges. Great job!"
        elif abnormal_count <= 2:
            overall_status = "mild"
            summary_ar = f"تم اكتشاف {abnormal_count} نتيجة خارج المعدل الطبيعي. يُنصح بمتابعة الطبيب."
            summary_en = f"{abnormal_count} result(s) outside normal range. Doctor follow-up recommended."
        else:
            overall_status = "attention"
            summary_ar = f"تم اكتشاف {abnormal_count} نتيجة تحتاج متابعة. يُنصح بمراجعة الطبيب المختص."
            summary_en = f"{abnormal_count} results need attention. Specialist consultation recommended."
        
        follow_up = []
        for insight in insights:
            if insight.status != "normal":
                follow_up.extend(insight.related_tests)
        follow_up = list(set(follow_up))
        
        return BatchAnalysisResponse(
            insights=insights,
            overall_status=overall_status,
            summary_ar=summary_ar,
            summary_en=summary_en,
            recommended_follow_up=follow_up[:5],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/insights/generate")
async def generate_report_insights(report_data: dict):
    try:
        items = report_data.get("items", [])
        insights = []
        
        for item in items:
            result = LabResultInput(
                test_code=item.get("code", ""),
                test_name=item.get("name", ""),
                value=item.get("value", 0),
                unit=item.get("unit", ""),
                reference_low=item.get("reference_low"),
                reference_high=item.get("reference_high"),
                patient_age=report_data.get("patient_age", 30),
                patient_gender=report_data.get("patient_gender", "MALE"),
            )
            insight = analyze_result(result)
            insights.append(insight.model_dump())
        
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
