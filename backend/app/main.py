from fastapi import FastAPI
from pydantic import BaseModel
from app.services.classifier import SentimentClassifier

app = FastAPI()
classifier = SentimentClassifier()

class NewInput(BaseModel):
    text: str

@app.post("/analyze")
def analyze_news(input: NewInput):
  prediction = classifier.predict(input.text)
  return {
      "text": input.text,
      "sentiment": prediction['label'],
      "confidence": prediction['score']
  }

@app.get("/health")
def health_check():
    return {"status": "alive"}