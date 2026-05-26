from transformers import pipeline

class SentimentClassifier:
    def __init__(self):
      self.model_name = "lucas-leme/FinBERT-PT-BR"
      print(f"Initializing model: {self.model_name}...")

      self.nlp = pipeline("sentiment-analysis", model=self.model_name)
      
    def predict(self, text: str):
      result = self.nlp(text)
      return result[0]