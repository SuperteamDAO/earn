export function openExternalLinkInNewTab(tweetLink: string) {
  if (typeof document === 'undefined') return;
  window.open(tweetLink, '_blank');
  // const link = document.createElement('a');
  // link.href = tweetLink;
  // link.target = '_blank';
  // link.style.visibility = 'hidden';
  // document.body.appendChild(link);
  // link.click();
  // document.body.removeChild(link);
}
