from difflib import SequenceMatcher

class SourceEdits:
  def __init__(self, language):
    self.language = language

  def compute_complexity(self, before_snippet, after_snippet):
    matcher = SequenceMatcher(a=before_snippet, b=after_snippet)
    operations = matcher.get_opcodes()
    edits = sum(1 for operation in operations if operation[0] != "equal")
    return 1 - matcher.ratio(), len(operations), operations
