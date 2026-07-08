import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  /* pillar variant: turn each card into one large clickable target
     using an accessible "stretched link" — the card's first link covers
     the whole card while remaining a real, focusable anchor. */
  if (block.classList.contains('pillars')) {
    ul.querySelectorAll('li').forEach((li) => {
      const link = li.querySelector('a[href]');
      if (link) {
        li.classList.add('cards-card-linked');
        link.classList.add('cards-card-link');
      }
    });
  }

  block.replaceChildren(ul);
}
