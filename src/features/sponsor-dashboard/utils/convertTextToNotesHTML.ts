export function convertTextToNotesHTML(text: string): string {
  if (!text.trim()) return '';

  const lines = text.split('\n');
  let html = '';
  let inOrderedList = false;
  let inUnorderedList = false;
  let inSubList = false;
  let pendingListClose = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line?.trim();

    // Skip empty lines but preserve spacing between sections
    if (!trimmedLine) {
      continue;
    }

    // Check for numbered items (1., 2., 3., etc.)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
    if (numberedMatch) {
      // Close any existing sub-list
      if (inSubList) {
        html += '</ul>';
        inSubList = false;
      }

      // Close previous list item if we were in an ordered list
      if (pendingListClose && inOrderedList) {
        html += '</li>';
      }

      // Start ordered list if not already in one
      if (!inOrderedList) {
        if (inUnorderedList) {
          html += '</ul>';
          inUnorderedList = false;
        }
        html += '<ol>';
        inOrderedList = true;
      }

      html += `<li>${numberedMatch[2]}`;
      pendingListClose = true;
      continue;
    }

    // Check for bullet points (•, *, -, ·)
    const bulletMatch = trimmedLine.match(/^[•·*-]\s*(.+)$/);
    if (bulletMatch) {
      // Check if this is indented (sub-item under a numbered list)
      const isIndented = line?.startsWith('  ') || line?.startsWith('\t');

      if (isIndented && inOrderedList) {
        // Sub-bullet under a numbered item
        if (!inSubList) {
          html += '<ul>';
          inSubList = true;
        }
        html += `<li>${bulletMatch[1]}</li>`;
      } else {
        // Regular bullet item - start a new unordered list
        if (inOrderedList) {
          if (inSubList) {
            html += '</ul>';
            inSubList = false;
          }
          if (pendingListClose) {
            html += '</li>';
            pendingListClose = false;
          }
          html += '</ol>';
          inOrderedList = false;
        }

        if (!inUnorderedList) {
          html += '<ul>';
          inUnorderedList = true;
        }
        html += `<li>${bulletMatch[1]}</li>`;
      }
      continue;
    }

    // Regular text (not a list item)
    if (inSubList) {
      html += '</ul>';
      inSubList = false;
    }
    if (pendingListClose && inOrderedList) {
      html += '</li>';
      pendingListClose = false;
    }
    if (inOrderedList) {
      html += '</ol>';
      inOrderedList = false;
    }
    if (inUnorderedList) {
      html += '</ul>';
      inUnorderedList = false;
    }

    html += `<p>${trimmedLine}</p>`;
  }

  // Close any remaining open tags
  if (inSubList) {
    html += '</ul>';
  }
  if (pendingListClose && inOrderedList) {
    html += '</li>';
  }
  if (inOrderedList) {
    html += '</ol>';
  }
  if (inUnorderedList) {
    html += '</ul>';
  }

  return html;
}

export function getTextCharacterCount(htmlContent: string): number {
  if (!htmlContent) return 0;

  // Create a temporary DOM element to extract text content
  // This mimics how TipTap's getText() works
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Use textContent which gives us the same result as TipTap's getText()
  return tempDiv.textContent?.length || 0;
}
