// Helper function to truncate text and show context around target
export const getContextualDisplay = (
  fullText: string,
  srcString: string,
  currentTranslationSrc: string,
  contextSize: number = 100
) => {
  const srcIndex = fullText.indexOf(srcString);
  if (srcIndex === -1) {
    return {
      beforeText: "...",
      srcText: srcString,
      afterText: "...",
      hasGap: true,
      gapText: "src_string not found in file",
    };
  }

  const beforeSrc = fullText.slice(0, srcIndex);
  const afterSrc = fullText.slice(srcIndex + srcString.length);

  // Check if translation is coherent (current translation matches the beginning)
  const isCoherent = beforeSrc.startsWith(currentTranslationSrc);

  let displayBefore = "";
  let hasGap = false;
  let gapText = "";

  if (isCoherent) {
    if (beforeSrc.length > contextSize) {
      displayBefore = "..." + beforeSrc.slice(-contextSize);
    } else {
      displayBefore = beforeSrc;
    }
  } else {
    // There's a gap - show it in red
    hasGap = true;
    if (beforeSrc.length <= currentTranslationSrc.length) {
      gapText = beforeSrc;
      displayBefore = "";
    } else {
      gapText = beforeSrc.slice(currentTranslationSrc.length);
      const availableSpace = Math.min(
        currentTranslationSrc.length,
        contextSize
      );
      displayBefore = currentTranslationSrc.slice(-availableSpace);
    }
  }

  // Show first 50 chars after src_string
  const displayAfter =
    afterSrc.length > contextSize
      ? afterSrc.slice(0, contextSize) + "..."
      : afterSrc;

  return {
    beforeText: displayBefore,
    srcText: srcString,
    afterText: displayAfter,
    hasGap,
    gapText,
  };
};

export function countOccurrences(str: string, sub: string) {
  if (sub === "") return 0;
  return str.split(sub).length - 1;
}
