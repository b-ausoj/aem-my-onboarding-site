/**
 * Answer box: a prominent callout that leads a page with the direct answer
 * before the nuance. Designed to be easy for readers to scan and for search
 * engines / AI assistants to lift as a clean answer.
 *
 * Authored structure: a single cell of running text (optionally a leading
 * heading used as the question/label).
 *
 * @param {Element} block The answer-box block element
 */
export default function decorate(block) {
  block.setAttribute('role', 'note');

  const inner = block.querySelector(':scope > div > div') || block;
  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');

  const label = document.createElement('p');
  label.className = 'answer-box-label';
  label.textContent = 'The short answer';

  if (heading) {
    heading.classList.add('answer-box-question');
    heading.before(label);
  } else {
    inner.prepend(label);
  }
}
