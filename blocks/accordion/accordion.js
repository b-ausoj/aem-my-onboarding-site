/**
 * Accordion block: each authored row becomes a native <details>/<summary>
 * disclosure — accessible, keyboard-friendly, and (crucially for FAQ SEO)
 * fully present in the DOM even when collapsed.
 *
 * Authored structure (one row per item: question cell, answer cell):
 *   <div class="accordion">
 *     <div><div>Question?</div><div><p>Answer…</p></div></div>
 *   </div>
 *
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [questionCell, answerCell] = row.children;

    const details = document.createElement('details');
    details.className = 'accordion-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-question';
    summary.innerHTML = questionCell ? questionCell.innerHTML : '';

    const answer = document.createElement('div');
    answer.className = 'accordion-answer';
    if (answerCell) answer.innerHTML = answerCell.innerHTML;

    details.append(summary, answer);
    row.replaceWith(details);
  });
}
