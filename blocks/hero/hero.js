/**
 * Hero block: a full-bleed background image with an overlaid heading,
 * promise paragraph and optional call-to-action button.
 *
 * Authored structure (single cell):
 *   picture (background) · h1 · p (promise) · p (CTA link)
 *
 * The picture becomes a full-bleed background layer; every other authored
 * element (headings, paragraphs, lists) is grouped into a positioned overlay.
 * We collect the overlay by element type rather than by DOM position so the
 * block is robust to however the backend wraps the picture.
 *
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');

  const content = document.createElement('div');
  content.className = 'hero-content';
  block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')
    .forEach((el) => content.append(el));

  block.textContent = '';
  if (picture) {
    picture.classList.add('hero-image');
    block.append(picture);
  }
  block.append(content);
}
