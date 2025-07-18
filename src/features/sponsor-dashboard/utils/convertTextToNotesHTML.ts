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

    if (!trimmedLine) {
      continue;
    }

    const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
    if (numberedMatch) {
      if (inSubList) {
        html += '</ul>';
        inSubList = false;
      }

      if (pendingListClose && inOrderedList) {
        html += '</li>';
      }

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

    const bulletMatch = trimmedLine.match(/^[•·*-]\s*(.+)$/);
    if (bulletMatch) {
      const isIndented = line?.startsWith('  ') || line?.startsWith('\t');

      if (isIndented && inOrderedList) {
        if (!inSubList) {
          html += '</ul>';
          inSubList = true;
        }
        html += `<li>${bulletMatch[1]}</li>`;
      } else {
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

  if (typeof window === 'undefined') {
    return htmlContent.replace(/<[^>]*>/g, '').length;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  return tempDiv.textContent?.length || 0;
}
