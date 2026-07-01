export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const startIndex = text.search(/[{[]/);
  if (startIndex === -1) {
    throw new Error('No JSON object found in model response.');
  }

  const opening = text[startIndex];
  const closing = opening === '{' ? '}' : ']';
  const endIndex = text.lastIndexOf(closing);

  if (endIndex === -1 || endIndex < startIndex) {
    throw new Error('Malformed JSON in model response.');
  }

  return text.slice(startIndex, endIndex + 1);
}
