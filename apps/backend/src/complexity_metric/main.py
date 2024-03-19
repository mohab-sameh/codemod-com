import os, pickle
from sklearn.linear_model import LogisticRegression
import numpy as np

from ast_edits import ASTEdits
from source_edits import SourceEdits
from halstead_metrics import HalsteadMetrics

class ComplexityModel:
    def __init__(self, cache=True, language='typescript'):
        self.model = LogisticRegression(multi_class='auto', solver='liblinear', class_weight='balanced')
        self.language = language
        if cache and os.path.exists('complexity_model.pkl'):
            self.load_model()
        else:
            features, labels = self.get_training_data("samples", ["easy", "medium", "hard"])
            self.train(features, labels, save=True)

    def compute_features(self, before, after):
        ast_complexity = ASTEdits(self.language).compute_complexity(before, after)[0]
        source_complexity = SourceEdits(self.language).compute_complexity(before, after)[0]
        halstead_metrics_before = HalsteadMetrics(self.language).compute_metrics(before)
        halstead_metrics_after = HalsteadMetrics(self.language).compute_metrics(after)
        print(halstead_metrics_after)
        return ast_complexity, source_complexity, *halstead_metrics_before, *halstead_metrics_after

    @staticmethod
    def read_before_after(before_file, after_file):
        with open(before_file, "r") as f:
            before_script = f.read()
        with open(after_file, "r") as f:
            after_script = f.read()
        return before_script, after_script

    def get_training_data(self, directory, subdirectories):
        data = []
        for label in subdirectories:
            d = os.path.join(directory, label)
            for file in os.listdir(d):
                if file.endswith("_before.txt"):
                    before_file = os.path.join(d, file)
                    after_file = os.path.join(d, file.replace("_before.txt", "_after.txt"))
                    before_script, after_script = self.read_before_after(before_file, after_file)
                    features = ComplexityModel.compute_features(before_script, after_script, self.language)
                    data.append(list(features)+[label])
        features = np.array([d[:-1] for d in data])
        labels = np.array([d[-1] for d in data])
        return features, labels

    def train(self, features, labels, save):
        print("train...")
        self.model.fit(features, labels)
        if save:
            with open('complexity_model.pkl', 'wb') as f:
                pickle.dump(self.model, f)

    def predict(self, before_script, after_script):
        features = self.compute_features(before_script, after_script)
        return self.model.predict([features])[0]
    
    def load_model(self):
        print("load...")
        with open('complexity_model.pkl', 'rb') as f:
            self.model = pickle.load(f)

def run_on_pair(before_file, after_file, language='typescript'):
    before_script, after_script = ComplexityModel.read_before_after(before_file, after_file)
    model = ComplexityModel(language=language)
    complexity = model.predict(before_script, after_script)
    return complexity

complexity = run_on_pair('before.ts', 'after.ts')
print(complexity)
