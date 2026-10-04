/**
 * Repo-authored question additions ("Authored for SkillGauge").
 *
 * Each bank assigns `AUTHORED[tech] = [...]` with tuples shaped:
 *   [topic, difficulty, prompt, [A, B, C, D], correctIndex, explanation]
 *
 * `scripts/build-question-banks.mjs authored` appends (deduping on prompt) and
 * rewrites the bank, recomputing counts/topics. Difficulty→level mapping lives
 * in that builder (`LEVEL_MAP`) so levels stay consistent with the bank.
 */
export const AUTHORED = {};

AUTHORED.css = [
  ["Selectors & Specificity", "EASY", "What specificity do these rules carry: `.btn.primary` vs `#submit`?",
    ["(0,2,0) beats (1,0,0)", "(1,0,0) beats (0,2,0) — an id outweighs any number of classes", "They tie, so the later rule wins", "Specificity only applies to inline styles"],
    1, "Specificity is counted as (ids, classes, elements): `.btn.primary` is (0,2,0) and `#submit` is (1,0,0). The id wins before source order is even considered."],

  ["Cascade & Inheritance", "EASY", "Which properties do NOT inherit from a parent element by default?",
    ["color and font-size", "border and background", "visibility and line-height", "cursor and direction"],
    1, "Colour and typography inherit; box-level paint properties (border, background) belong to each element and must be restated explicitly."],

  ["Box Model", "EASY", "Without `box-sizing`, what does `width: 200px` describe on a bordered element?",
    ["Content + padding + border", "Content only — padding and border are added on top", "The margin box", "Exactly 200px of the viewport"],
    1, "The default `content-box` sizes the content only; padding and border grow the element past its declared width."],

  ["Units & Sizing", "EASY", "What does `font-size: 2rem` resolve to on an element whose parent is 32px?",
    ["64px — 2 × the parent", "32px — rem is relative to the html root, not the parent", "2px", "Depends on the parent's font-weight"],
    1, "`rem` is always relative to the root (html) font size; `em` is the one that resolves against the parent."],

  ["Flexbox", "EASY", "Which declaration turns a div into a flex container?",
    ["display: flex", "flex: 1", "position: flex", "flex-direction: row"],
    0, "`display: flex` establishes the flex formatting context; `flex` and `flex-direction` are properties of its *children* / axis."],

  ["Selectors & Specificity", "EASY", "What does the selector `article > p` match?",
    ["Every p inside article, at any depth", "Only p elements that are direct children of article", "The first p after an article", "Sibling paragraphs of article"],
    1, "The child combinator `>` is depth-1 only; descendants at any depth would use a space."],

  ["Positioning", "EASY", "What does `position: absolute` do to an element with `top: 10px`?",
    ["Offsets it 10px from the nearest positioned ancestor (or the page)", "Always offsets from the viewport", "Moves it into the document flow", "Centres it horizontally"],
    0, "Absolutely positioned boxes are offset from their nearest positioned ancestor's padding box; with none present, the initial containing block."],

  ["Units & Sizing", "EASY", "Which unit is relative to the viewport width?",
    ["vw", "rem", "em", "ch"],
    0, "`vw`/`vh` are viewport-relative (1vw = 1% of viewport width), while rem/em resolve against fonts."],

  ["Cascade & Inheritance", "EASY", "Where does `font-family: Arial` on `<body>` apply?",
    ["Only to body itself", "To body and everything that inherits font-family", "Only to headings", "Nowhere — font-family never inherits"],
    1, "font-family is an inherited property, so descendants inherit it unless they set their own value."],

  ["Positioning", "EASY", "What is the default value of `position` for a normal div?",
    ["static", "relative", "absolute", "fixed"],
    0, "`static` is the default: the element sits in normal flow and is not a containing block for absolutely positioned descendants."],
];

AUTHORED.css.push(
  ["Flexbox", "MEDIUM", "A child has `flex: 1`, another `flex: 2`. What differs?",
    ["Their base sizes only", "Their share of free space — the second grows twice as fast once both are past their flex-basis", "Their minimum widths", "Their order in the container"],
    1, "After the flex-basis is satisfied, remaining free space is distributed in proportion to the flex-grow factor, so 2 grows faster than 1."],

  ["Grid", "MEDIUM", "What does `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` do?",
    ["Creates exactly three 200px columns", "Fills each row with as many columns as fit, each between 200px and equal-width", "Forces every column to 200px", "Merges cells that are empty"],
    1, "`auto-fill` packs as many tracks as the container allows; `minmax(200px, 1fr)` lets each track grow but never shrink below 200px — the classic responsive grid."],

  ["Transitions & Animations", "MEDIUM", "What does `transition: transform 0.3s ease` animate?",
    ["Every property", "Only transform, for 300ms, with an ease timing function", "Only duration", "The whole document's layout"],
    1, "The shorthand is `property duration timing-function`; only the listed property transitions, everything else changes instantly."],

  ["Responsive Design", "MEDIUM", "Why do media queries generally be written small→large (min-width) in a mobile-first design?",
    ["Because min-width queries are faster to parse", "So base styles are the mobile default and each query only *adds* rules as space grows, avoiding override fights", "It is a browser requirement", "It lets rem units work"],
    1, "Mobile-first means the baseline is the narrowest layout; each larger breakpoint then adds or overrides exactly what it needs."],

  ["Custom Properties", "MEDIUM", "What happens when a custom property falls back: `var(--brand, #333)` and `--brand` is not defined?",
    ["The declaration is invalid at computed-value time", "The fallback `#333` is used", "The browser picks a default colour", "An error is logged and the rule dropped"],
    1, "`var()`'s second argument is a fallback used when the custom property is missing or invalid — the rule survives."],

  ["Box Model", "MEDIUM", "Which pair collapses vertical margins in normal flow?",
    ["Adjacent vertical margins of in-flow blocks collapse", "Two floats' margins", "Flex children' margins", "Padding of a table cell"],
    0, "Block-level vertical margins in normal flow collapse into one; flex/grid items and absolutely positioned boxes never collapse margins."],

  ["Selectors & Specificity", "MEDIUM", "What does `:nth-child(odd)` select on a list of ten items?",
    ["Items 1, 3, 5…", "Items 2, 4, 6…", "Every second item starting at 1", "Only li elements"],
    0, "`odd` maps to positions 1, 3, 5… — the item's position among *all* siblings, not among elements of the same type."],

  ["Cascade & Inheritance", "MEDIUM", "Which statement about `!important` is true?",
    ["It wins all specificity comparisons of normal declarations", "It increases an element's specificity value", "It is scoped to a media query", "It only works on inherited properties"],
    0, "A declaration marked important outranks every normal declaration regardless of specificity — which is exactly why it's a last resort."],

  ["Units & Sizing", "MEDIUM", "Why do container queries change layout design compared to media queries?",
    ["They are faster", "They respond to the container's own size, so the same component adapts wherever it is placed", "They support more units", "They only work in print"],
    1, "Media queries ask 'how wide is the viewport?'; container queries ask 'how wide is my parent?' letting a component adapt independently of page layout."],

  ["Grid", "MEDIUM", "What do `gap` on a flex container and `gap` on a grid container have in common?",
    ["Grid does not support gap", "They both create spacing between tracks/items without the double-margin problem", "They only work with justify-content", "They require grid-gap instead"],
    1, "`gap` works on both layout modes and places space only *between* items, avoiding the adjacent-margin collapse/space-adding issues of margins."],
);

AUTHORED.css.push(
  ["Cascade & Inheritance", "HARD", "Why can `all: unset` on a button still leave it looking like a link later?",
    ["It does not work on form controls", "unset resolves each property to its inherited or initial value — but any later rule that targets the element outranks it", "It requires !important", "It is only valid inside @layer"],
    1, "unset maps inherited properties to inherit and non-inherited ones to initial; the cascade order afterwards decides everything else, so specificity still rules."],

  ["Flexbox", "HARD", "What is the effect of `min-width: 0` on a flex child that refuses to shrink?",
    ["It disables flex-grow", "It removes the automatic content-based minimum, letting the item shrink below its intrinsic size", "It makes the child a grid item", "It centres the child"],
    1, "Flex items default to `min-width: auto`, so long content can block shrinking. Setting `min-width: 0` (or overflow: hidden) makes the item actually shrinkable."],

  ["Grid", "HARD", "What does `grid-column: 1 / -1` do?",
    ["Spans from column 1 to the last explicit column line", "Spans all implicit columns too", "Deletes the second column", "Centres the item"],
    0, "Negative line numbers index the explicit grid's end lines: `-1` is the last explicit line, so the item spans the full explicit width."],

  ["Positioning", "HARD", "How does `position: sticky` differ from `fixed`?",
    ["Nothing", "sticky stays in normal flow until it crosses its sticky threshold, then offsets — it never leaves its container; fixed always positions against the viewport", "fixed also uses top/left thresholds", "sticky requires a transform ancestor"],
    1, "Sticky is 'relative until it sticks': it scrolls with the page and is bounded by its ancestor. Fixed is always viewport-anchored."],

  ["Cascade & Inheritance", "HARD", "What does wrapping rules in `@layer base { ... }` change?",
    ["Nothing visually", "Layer order is compared before specificity, so an unlayered or later-layered rule can beat a higher-specificity layered one", "It converts rules to !important", "It scopes selectors to the layer"],
    1, "Cascade layers rank *before* specificity within the normal origin: an unlayered rule always beats a layered one, letting teams order frameworks deliberately."],

  ["Custom Properties", "HARD", "Why is `--brand: red !important;` unusual for custom properties?",
    ["!important is forbidden on custom properties", "!important is not allowed — custom property precedence is resolved purely by cascade order and scope", "It makes the variable global", "It has no effect on inherited values"],
    1, "Custom properties follow normal cascade rules only; the !important keyword is invalid in their declaration grammar."],

  ["Transitions & Animations", "HARD", "Which property animates cheapest — and why does it matter?",
    ["top", "transform and opacity — the compositor can animate them without relayout/paint", "width", "margin"],
    1, "Top/left/width trigger layout (and paint) on every frame; transform/opacity are handled by the GPU compositor, keeping the main thread free."],

  ["Box Model", "HARD", "A 1600px-wide layout uses margins on a 1600px screen — the common cause?",
    ["border-box sizing", "Horizontal percentage margins summing to 100% plus content width overflowing the viewport", "font-size scaling", "A missing clearfix"],
    1, "Percentage margins are relative to the *containing block*, so left:5% + right:5% + width:100% = 110%. Classic cause of horizontal overflow."],

  ["Selectors & Specificity", "HARD", "What specificity does an inline `style` attribute beat?",
    ["Nothing — same as an id", "All normal selectors; only an inline !important beats it", "Only classes", "It depends on source order"],
    1, "Inline styles sit above id selectors in the cascade (like specificity (1,0,0,0)); an inline !important declaration is one of the last resorts above it."],

  ["Responsive Design", "HARD", "In a mobile-first design, why avoid `max-width` media queries as the primary structure?",
    ["They parse slower", "They layer overrides over the desktop styles, so base rules can leak; min-width queries grow the layout additively instead", "They do not support rem", "They break print styles"],
    1, "max-width queries force every later rule to undo the earlier one, which compounds as breakpoints multiply; min-width keeps each addition local."],
);

AUTHORED.html = [
  ["Document Structure", "EASY", "Which element must be the direct child of `<html>`?",
    ["`<body>` and `<head>`", "Only `<body>`", "The doctype", "`<header>`"],
    0, "The document element `<html>` contains exactly two children: `<head>` (metadata) and `<body>` (visible content)."],

  ["Semantic HTML", "EASY", "What is the main benefit of using `<main>` over a `<div>`?",
    ["It is styled larger", "It gives screen readers and browser tools a landmark for the page's primary content", "It makes HTML valid only when required", "It loads faster"],
    1, "Landmarks such as `<main>`, `<nav>` and `<aside>` let assistive technology jump between page regions; a div gives no such meaning."],

  ["Accessibility", "EASY", "What does the `alt` attribute provide for an image?",
    ["A tooltip", "A text alternative read aloud when the image cannot be displayed", "A lazy-loading hint", "The image's dimensions"],
    1, "alt text is both the fallback when the image fails to load and what screen readers announce."],

  ["Forms & Validation", "EASY", "Which input type gives mobile users a numeric keypad?",
    ["type=\"text\"", "type=\"number\"", "type=\"button\"", "type=\"hidden\""],
    1, "type=\"number\" (and type=\"tel\"/type=\"numeric\" variants) signals a numeric entry, prompting the on-screen numeric keypad."],

  ["Media Elements", "EASY", "What does the `controls` attribute on `<video>` do?",
    ["Autoplays the video", "Displays the browser's default play/pause/seek controls", "Mutes the video", "Pauses the video"],
    1, "Without `controls` the player has no UI; the attribute is the standard way to expose the native control bar."],

  ["Links & Assets", "EASY", "Which attribute opens a link in a new tab?",
    ["target=\"_blank\"", "href=\"_blank\"", "rel=\"blank\"", "window=\"new\""],
    0, "`target=\"_blank\"` requests a new browsing context; pair it with `rel=\"noopener\"` for safety."],

  ["Tables", "EASY", "Which element contains the actual data cells of a table?",
    ["`<thead>`", "`<tbody>`", "`<caption>`", "`<colgroup>`"],
    1, "`<thead>`/`<tfoot>` hold header/footer rows; `<tbody>` groups the body rows (and is often added automatically by the parser)."],

  ["Semantic HTML", "EASY", "What is the correct heading hierarchy for a page?",
    ["Any order, as long as they are large", "One h1 for the page title, then headings without skipping levels as sections nest", "Five h1 elements are fine", "Headings must go in reverse order"],
    1, "A single h1 per page (its main topic) with sequential h2/h3… levels lets screen readers reconstruct the outline."],

  ["Document Structure", "EASY", "Where does `<title>` belong?",
    ["Inside `<body>`", "Inside `<head>`", "Before the doctype", "It can go anywhere"],
    1, "`<title>` is document metadata, so it lives in `<head>`; the browser shows it in the tab and it is required for valid HTML5."],

  ["Accessibility", "EASY", "What does a `label` element's `for` attribute do?",
    ["Styles the input", "Associates the label with an input so clicking the text focuses the control and screen readers announce it", "Hides the label", "Sets the input's value"],
    1, "The `for`/`id` pairing makes the whole label clickable and binds the accessible name to the control."],
];

AUTHORED.html.push(
  ["Script Loading", "MEDIUM", "What is the difference between `defer` and `async` on a `<script>` tag?",
    ["defer blocks parsing, async does not", "Both are fetched in parallel — defer runs after parsing in order, async runs as soon as it's ready (possibly mid-parse, out of order)", "async blocks parsing, defer does not", "They are synonyms"],
    1, "defer preserves order and waits for the DOM; async scripts execute the moment they load, so order and DOM readiness are both lost."],

  ["Forms & Validation", "MEDIUM", "Which attribute makes a form field required before submit?",
    ["required", "validate", "mandatory", "novalidate"],
    0, "The `required` attribute triggers the browser's native validation; `novalidate` on the form is what *disables* validation."],

  ["Semantic HTML", "MEDIUM", "When should `<article>` be preferred over `<section>`?",
    ["Never — they are interchangeable", "When the content makes sense as a standalone, distributable unit (a post, a card) without needing the surrounding context", "Only inside a `<nav>`", "For every div"],
    1, "`<article>` marks self-contained content; `<section>` groups thematically related content that normally needs a heading."],

  ["Tables", "MEDIUM", "How do you make a cell span two columns?",
    ["colspan=\"2\"", "span=\"2\"", "cols=\"2\"", "width=\"2\""],
    0, "`colspan` spans columns (and `rowspan` spans rows) on `<th>`/`<td>`."],

  ["Links & Assets", "MEDIUM", "What does `rel=\"noopener\"` protect against on external links?",
    ["Popup blocking", "The opened page using `window.opener` to navigate your tab (reverse tabnabbing)", "DNS prefetching", "Screen readers"],
    1, "Without noopener, the new tab receives `window.opener` and can replace your page with a phishing lookalike. Modern browsers default to noopener, but the attribute documents intent."],

  ["SEO & Metadata", "MEDIUM", "Which meta tag controls how a page appears in search results?",
    ["meta charset", "meta name=\"description\"", "meta http-equiv", "meta viewport"],
    1, "The description meta is the usual source of the snippet text under a result; the others affect encoding, policy and mobile layout."],

  ["Accessibility", "MEDIUM", "A linked image repeats the link's visible text in its alt attribute. Why is that a problem?",
    ["Images cannot be linked", "The alt text becomes part of the link's accessible name — if it repeats the link text, the announcement becomes verbose", "It invalidates HTML", "It breaks lazy loading"],
    1, "Screen readers announce link names as a whole; alt text that duplicates surrounding words creates noisy 'click here' style links."],

  ["Document Structure", "MEDIUM", "What does `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">` achieve?",
    ["Sets the page's pixel width only", "Makes the layout viewport match the device width at 1× zoom — the foundation of mobile-friendly pages", "Disables zooming", "Applies device-independent pixel ratios"],
    1, "Without this tag mobile browsers lay out at a ~980px viewport and shrink it; adding it enables responsive CSS to work as designed."],

  ["Forms & Validation", "MEDIUM", "Why is `<input type=\"email\">` better than `type=\"text\"` for an email field?",
    ["It validates the format server-side", "It performs built-in client-side format validation and, on mobile, presents an appropriate keyboard", "It prevents form submission", "It encrypts the value"],
    1, "The email type gives free browser validation and tailored keyboards; real submission checks still belong on the server."],

  ["Media Elements", "MEDIUM", "What is the purpose of `<track kind=\"subtitles\">` inside `<video>`?",
    ["Adds controls", "Provides timed text tracks for captions/subtitles/cues that the player renders", "Compresses the video", "Cues the audio"],
    1, "The `<track>` element supplies WebVTT cues; kind selects captions, subtitles, descriptions, chapters or metadata."],
);

AUTHORED.html.push(
  ["Script Loading", "HARD", "Why can `defer` still delay the first paint on a page?",
    ["It never delays painting", "The browser must finish fetching all defer scripts before DOMContentLoaded — a slow third-party defer script stalls interactive time", "It re-renders the DOM", "It disables CSS animation"],
    1, "defer scripts run in order right after parsing; a large or slow file keeps the main thread waiting, which shows up as a long TTI."],

  ["Script Loading", "HARD", "Where does an inline `<script>` without async/defer execute?",
    ["After the document is parsed", "Immediately where it appears, pausing HTML parsing at that point", "At DOMContentLoaded", "On the next frame"],
    1, "Classic inline scripts block parsing — inline code can only reach elements parsed *before* it, which is why scripts usually sit at the end or defer."],

  ["Accessibility", "HARD", "What is the practical difference between `aria-label` and `aria-labelledby`?",
    ["None", "aria-label supplies the accessible name inline; aria-labelledby points at another element's id whose text becomes the name", "aria-label only works on buttons", "aria-labelledby overrides alt text"],
    1, "labelledby is used when the name already exists visibly elsewhere on the page, keeping the two in sync; aria-label writes it directly."],

  ["Forms & Validation", "HARD", "Why does `novalidate` on a form sometimes get added with JS validation?",
    ["It speeds up submit", "To suppress the browser's built-in popup so a custom, consistent error UI can be shown instead", "It is required by HTML5", "It disables required fields"],
    1, "novalidate takes over validation from the browser — the form's JS must then enforce (and communicate) the same rules itself."],

  ["Semantic HTML", "HARD", "Why is `<button>` preferable to a clickable `<div>`?",
    ["It is easier to style", "It is focusable, activatable by keyboard/screen readers, and carries button semantics natively", "It validates HTML", "It avoids event delegation"],
    1, "A div needs JavaScript, tabIndex, key handlers and ARIA just to reach parity — the native button already has all of it."],

  ["Links & Assets", "HARD", "What problem does `loading=\"lazy\"` on an `<img>` solve — and what does it change?",
    ["Compression; images get smaller", "It defers off-screen images until near the viewport, changing when (not whether) they load and their measured load events", "It retries failed loads", "It removes the image from the accessibility tree"],
    1, "Lazy loading cuts initial bandwidth but can push image downloads past first paint and after LCP, hurting the metric it was meant to help."],

  ["SEO & Metadata", "HARD", "Why is a `<meta name=\"robots\" content=\"noindex\">` on a staging page often missed?",
    ["Google ignores it", "Crawlers must be able to fetch the page to read the meta tag — blocked robots.txt prevents noindex from ever being seen", "It only affects Bing", "It must be in the head of the sitemap"],
    1, "Noindex is evaluated during a crawl. If robots.txt disallows fetching, the directive never arrives and the page can still be indexed from external links."],

  ["Document Structure", "HARD", "What happens when `<main>` appears twice on one page?",
    ["Nothing", "It is invalid — only one visible non-hidden `<main>` is allowed per document", "The second replaces the first", "Both become landmarks"],
    1, "Landmarks must be unique; two mains make 'jump to main' ambiguous for assistive technology."],

  ["Media Elements", "HARD", "Why does `<video autoplay>` often fail without `muted`?",
    ["Autoplay is not implemented", "Browser policies block unmuted autoplay; muted autoplay is the allowed escape hatch", "The video file must be muted", "It needs the controls attribute"],
    1, "To protect users from surprise audio, Chrome and friends reject autoplaying audio — keeping the media muted lets the video start."],

  ["Tables", "HARD", "What does `<table><caption>` provide that a heading above the table does not?",
    ["Nothing", "An accessible table title that screen readers announce with the table itself", "Column sorting", "Sticky headers"],
    1, "caption is programmatically associated with the table, so assistive tech reads it as the table's name when navigating."],
);

AUTHORED.python = [
  ["Data Types", "EASY", "What is the type of `3 / 2` in Python 3?",
    ["int", "float", "Depends on the operands", "decimal.Decimal"],
    1, "`/` always returns a float in Python 3; `//` is floor division and returns an int when both operands are ints."],

  ["Data Types", "EASY", "Which object is immutable?",
    ["A list", "A dictionary", "A tuple", "A bytearray"],
    2, "Tuples, strings, bytes and numbers are immutable; lists, dicts and sets can change after creation."],

  ["Lists & Slicing", "EASY", "What does `letters[1:4]` return?",
    ["Items at indexes 1, 2, 3", "Items at indexes 1, 2, 3, 4", "Items 1 through the end", "An error"],
    0, "Slices are half-open: the start is included and the stop excluded, so [1:4] takes indexes 1, 2 and 3."],

  ["Lists & Slicing", "EASY", "What is the last index of a list of five items?",
    ["5", "4", "-1", "Depends on the Python version"],
    1, "Python uses zero-based indexing, so a length-5 list runs 0..4; `list[-1]` also references the last item."],

  ["Strings & Formatting", "EASY", "What does `\"hi\".upper()` return?",
    ["\"hi\"", "\"HI\"", "None", "An error"],
    1, "String methods never mutate — they return a new string, so the return value must be used."],

  ["Scope & Closures", "EASY", "Where does a module-level variable live?",
    ["local scope", "the global namespace", "built-in scope", "an enclosing function"],
    1, "Module-level names live in the global namespace; functions read from it before falling back to builtins."],

  ["Dictionaries", "EASY", "How do you read a dictionary value without raising KeyError?",
    ["dict.get(key, default)", "dict[key]", "dict.at(key)", "dict.fetch(key)"],
    0, "`get` returns the optional default when the key is missing; `[]` raises KeyError instead."],

  ["Exceptions", "EASY", "Which keyword catches an exception?",
    ["except", "catch", "handle", "rescue"],
    0, "`try: … except E: …` (optionally `as e`) handles errors; Python has no catch or rescue keyword."],

  ["Comprehensions", "EASY", "What does `[n*n for n in range(4)]` produce?",
    ["[0, 1, 4, 9]", "[1, 4, 9, 16]", "[0, 1, 2, 3]", "range(4)"],
    0, "range(4) yields 0..3 and the comprehension squares each value — 0, 1, 4, 9."],

  ["Iterators & Generators", "EASY", "What does `iter([1,2,3])` return?",
    ["A list", "An iterator that yields each element once", "A tuple copy", "The number 3"],
    1, "iter() wraps the sequence in an iterator; next() then yields one item per call until StopIteration."],
];

AUTHORED.python.push(
  ["Lists & Slicing", "MEDIUM", "What does `a = b[:]` do versus `a = b`?",
    ["They are equivalent", "It makes a shallow copy — mutating a leaves b alone, but nested objects are shared", "It deep-copies everything", "It sorts b"],
    1, "Slicing copies the container only; elements inside are referenced, so nested mutable objects remain shared."],

  ["Mutability", "MEDIUM", "Why is a mutable default argument a classic bug?",
    ["It is forbidden syntax", "The default object is created once at definition time and shared by every call", "It doubles memory", "It raises TypeError"],
    1, "Append to a default list and the change persists for later calls. The fix is `arg=None`, creating the object inside the function."],

  ["Data Types", "MEDIUM", "What does `is` compare that `==` does not?",
    ["Value equality", "Object identity — whether both names point at the same object", "Only the type", "Hash values"],
    1, "`==` compares values; `is` compares identity. Two equal strings built separately can compare equal without being the same object."],

  ["Dictionaries", "MEDIUM", "How does `dict.keys()` differ from `list(d)`?",
    ["Nothing", "keys() is a live view supporting set operations; list(d) snapshots the keys", "keys() returns tuples", "list(d) returns values"],
    1, "Views stay in sync with the dict and support |, & and -; the list is a fixed snapshot taken at that moment."],

  ["Scope & Closures", "MEDIUM", "When is `nonlocal` required in a nested function?",
    ["To read a global", "To rebind a name in an enclosing function's scope instead of creating a local one", "To import a module", "For recursion only"],
    1, "`global` targets the module scope while `nonlocal` targets the nearest enclosing function — both must precede an assignment."],

  ["Exceptions", "MEDIUM", "In `try / except / else / finally`, when does `else` run?",
    ["Always", "Only when no exception was raised", "After finally", "Only when an exception was caught"],
    1, "else runs when the try body completed cleanly; finally runs unconditionally, last, before control leaves the construct."],

  ["Comprehensions", "MEDIUM", "What is the result of `{k: v for k, v in pairs if v}`?",
    ["A set", "A dict keeping only truthy values", "A list of tuples", "A SyntaxError"],
    1, "`key: value` makes it a dict comprehension and the trailing `if` filters out falsy values."],

  ["Strings & Formatting", "MEDIUM", "What does the f-string format spec `{value:>10.3f}` produce?",
    ["A plain float", "The value right-aligned in a 10-wide field with exactly 3 decimals", "Rounding to 10 decimals", "Zero padding"],
    1, "`>` aligns right, `10` is the width, `.3f` fixed-point with precision 3 — the usual table formatting."],

  ["Iterators & Generators", "MEDIUM", "What is the main benefit of a generator function?",
    ["It runs faster in all cases", "It yields values lazily, so only one item is held in memory at a time", "It makes code synchronous", "It caches all results"],
    1, "Generators keep only their frame state, so even a very large (or infinite) sequence can be consumed in constant memory."],

  ["Lists & Slicing", "MEDIUM", "What does `sorted(xs, key=len, reverse=True)` return?",
    ["xs sorted in place, longest last", "A new list sorted by length, longest first, with xs unchanged", "A tuple", "Only the longest item"],
    1, "sorted() never mutates its input; key supplies the comparison and reverse=True flips ascending to descending."],
);

AUTHORED.python.push(
  ["Mutability", "HARD", "What does `dict.fromkeys([\"a\",\"b\"], 0)` share between the two entries?",
    ["Nothing", "Only the integer 0 (immutable, so it is harmless)", "A list object", "The key objects"],
    1, "fromkeys assigns the *same* value object to every key — harmless for ints/strings, but `fromkeys(keys, [])` would share one list across all keys."],

  ["Scope & Closures", "HARD", "What is the LEGB rule for name resolution?",
    ["Local, Enclosing, Global, Built-in — in that order", "Global, Enclosing, Local, Built-in", "Built-in, Global, Local, Enclosing", "Enclosing, Local, Global, Built-in"],
    0, "Python looks up a bare name in Local → Enclosing → Global → Built-in scopes, stopping at the first match."],

  ["Iterators & Generators", "HARD", "What does `yield from sub_gen()` do?",
    ["Simply returns sub_gen", "Delegates to the sub-generator, yielding its values and passing send/throw through — flattening the chain", "Converts to a coroutine", "Runs it in a thread"],
    1, "yield from is delegation: it yields every value from the inner generator and forwards send()/throw() directly to it."],

  ["Data Types", "HARD", "Why are strings but not lists usable as dict keys?",
    ["Strings are faster", "Strings are immutable and hashable; mutable containers have no stable hash", "Lists are reserved by Python", "Only strings support =="],
    1, "Keys must be hashable and unchanging, otherwise the bucket they were placed in could silently go stale."],

  ["Exceptions", "HARD", "What does `except Exception:` fail to catch?",
    ["RuntimeError", "SystemExit, KeyboardInterrupt and GeneratorExit — those derive from BaseException, not Exception", "TypeError", "ValueError"],
    1, "Catching Exception is idiomatic for application errors, while process-level signals (BaseException) are deliberately allowed to escape."],

  ["Comprehensions", "HARD", "Why is a large list comprehension sometimes replaced with a generator expression?",
    ["Generators are always faster", "The generator avoids allocating the entire list, trading index access for constant memory", "List comprehensions are deprecated", "Generators support zip"],
    1, "Use a generator when you consume values once (sum, any, for-loop); use a list when you need to index, len() or iterate repeatedly."],

  ["Dictionaries", "HARD", "What does `d.setdefault(k, factory_fn())` do that `d.get(k)` does not?",
    ["Only reads", "It always calls factory_fn() eagerly, and inserts its result when the key is missing", "It is lazy", "It removes the key"],
    1, "setdefault evaluates its default eagerly — passing a value (not a lambda) computes work even when the key exists, a common trap."],

  ["Lists & Slicing", "HARD", "What is the output of `xs[::-1]`?",
    ["The same list reversed in place", "A new list that is the reverse of xs, leaving xs untouched", "An error", "xs sorted descending"],
    1, "A negative step copies and reverses; because it is a slice it returns a new list — xs itself is unchanged."],

  ["Scope & Closures", "HARD", "In a module, why does an assignment inside a function make a name local even if a global exists?",
    ["It does not", "Python decides scope at compile time — any assignment to a name in a function makes it local for the whole function, shadowing the global", "Globals are always shadowed", "Only with `from x import *`"],
    1, "The compiler classifies the name as local on first assignment, so reading before it raises UnboundLocalError — the classic local-variable trap."],

  ["Strings & Formatting", "HARD", "Why does `\"\".join(chunks)` beat `total += chunk` when concatenating many strings?",
    ["It does not", "Strings are immutable, so each += reallocates and copies; join pre-sizes once and copies in a single pass", "Because += is invalid for strings", "Only on Python 2"],
    1, "Repeated += is O(n²) due to reallocation; str.join performs one allocation — the standard performance idiom for building strings."],
);

AUTHORED.typescript = [
  ["Types vs Interfaces", "EASY", "Which can declare an array or function type?",
    ["Only interface", "Both type and interface can describe object shapes, arrays and function types", "Only a type alias", "Neither"],
    1, "Both work: `type Fn = () => void` as well as `interface Fn { (): void }`. They mainly differ in declaration merging and extends syntax."],

  ["Type Inference", "EASY", "What happens to `(v) => v` under strict mode when v has no annotation?",
    ["v is any", "A compile error — implicit any is disallowed", "v is unknown", "v is void"],
    1, "noImplicitAny (enabled by strict) flags untyped parameters instead of silently widening them to `any`."],

  ["Generics", "EASY", "What does `function echo<T>(v: T): T` guarantee?",
    ["T is always string", "The returned type matches the argument type for each call", "T is unknown", "Nothing"],
    1, "The type parameter links input to output: echo(5) infers T = number, so the result is typed number."],

  ["Strict Mode", "EASY", "What does strictNullChecks change for `string | null`?",
    ["Nothing", "null is a distinct type — accessing members without narrowing is an error", "null is banned", "null becomes undefined"],
    1, "You must guard (null checks, optional chaining) before treating the value as a string."],

  ["Utility Types", "EASY", "What does `Partial<T>` produce?",
    ["A readonly T", "T with every property optional", "T without nulls", "T with index signatures"],
    1, "Partial maps every key to optional — ideal for PATCH payloads where any subset of fields may be present."],

  ["Unions & Narrowing", "EASY", "How does `typeof x === \"string\"` narrow `x: string | number`?",
    ["It does not", "The true-branch treats x as string automatically", "It needs a cast first", "Only with decorators"],
    1, "typeof is a built-in type guard; no assertion is required inside the guarded branch."],

  ["Function Types", "EASY", "What does `() => void` mean as a parameter type?",
    ["The function must return void exactly", "Any function callable with no arguments whose result is ignored", "An async function", "A required return of null"],
    1, "A void-returning function type accepts functions that do return something — the caller simply ignores the value."],

  ["Assertions & Literals", "EASY", "What is a string literal type?",
    ["Any string", "A type restricted to one exact string such as \"on\" | \"off\"", "A const variable", "A template string"],
    1, "Literal types pin exact values, giving autocomplete and exhaustiveness checks for small unions."],

  ["Structural Typing", "EASY", "Does TypeScript use nominal or structural typing?",
    ["Nominal (by class name)", "Structural (by shape)", "Both", "Neither"],
    1, "Compatibility depends on members, not declared identity — two unrelated types with matching members are interchangeable."],

  ["Type Inference", "EASY", "What does `as const` do?",
    ["Casts to a reference", "Bakes in literal types and readonly-ness instead of widening", "Marks the value immutable at runtime", "Nothing on variables"],
    1, "Without it `[\"a\",\"b\"]` widens to string[]; with it the literal stays readonly [\"a\", \"b\"]."],
];

AUTHORED.typescript.push(
  ["Utility Types", "MEDIUM", "What is the difference between `Omit<T, K>` and `Pick<T, K>`?",
    ["None", "Pick keeps only the listed keys; Omit keeps everything except them", "Pick only works on interfaces", "Omit is generic-only"],
    1, "`Pick<T, \"a\">` selects \"a\", while `Omit<T, \"a\">` is `Pick<T, Exclude<keyof T, \"a\">>` — the same machinery, opposite direction."],

  ["Unions & Narrowing", "MEDIUM", "Why is `typeof x === \"object\"` an imperfect narrowing check?",
    ["It narrows perfectly", "typeof null is \"object\" and arrays are objects too, so both survive", "typeof arrays returns \"array\"", "It is not allowed in TS"],
    1, "Add `x !== null` and `Array.isArray(x)` to separate those cases — otherwise the union still contains them."],

  ["Generics", "MEDIUM", "What does `keyof T` produce?",
    ["A single string", "A union of T's property names", "A map of T's values", "The key count"],
    1, "`keyof T` is a union of keys, enabling `T[K]`, `Record<keyof T, ...>` and `<K extends keyof T>` constraints."],

  ["Conditional Types", "MEDIUM", "What does `T extends U ? X : Y` do inside a generic type?",
    ["A runtime ternary", "It resolves once T is instantiated, choosing X or Y based on the actual argument", "It casts X to Y", "Creates a union of T and U"],
    1, "Conditional types defer resolution until the type argument is known — the foundation of utility types like Exclude and NonNullable."],

  ["Strict Mode", "MEDIUM", "What does `noUncheckedIndexedAccess` change?",
    ["It bans index signatures", "Indexed access now includes | undefined, forcing a missing-key check", "It flags unused variables", "It forbids destructuring"],
    1, "Object/array indexes aren't guaranteed to exist at runtime; the flag surfaces that reality in the types."],

  ["Assertions & Literals", "MEDIUM", "When is `x as T` appropriate?",
    ["Whenever an error appears", "When you can guarantee the fact the compiler cannot — e.g. after your own validation of a union", "To convert between primitives", "In place of generics"],
    1, "Assertions that state something verifiable are fine; using them to bypass real type errors just hides bugs."],

  ["Types vs Interfaces", "MEDIUM", "When is `interface` the better choice?",
    ["Always", "When you want declaration merging or cleaner messages for object shapes", "Interfaces compile faster", "When you need unions"],
    1, "Interfaces merge across declarations (useful for extending library types); type is required for unions, tuples and mapped types."],

  ["Function Types", "MEDIUM", "Is a required parameter allowed after an optional one?",
    ["Yes, always", "No — TypeScript rejects a required parameter following an optional one", "Only with strict off", "Only in interfaces"],
    1, "The call signature would be ambiguous, so TS errors; reorder the parameters or make the later one optional."],

  ["keyof & Indexed Access", "MEDIUM", "What does `T[\"name\"]` mean?",
    ["The string \"name\"", "The type of T's `name` property", "An error unless declared twice", "A property key value"],
    1, "Indexed access types extract a member's type from a type — the building block for derived utility types."],

  ["Structural Typing", "MEDIUM", "Why do fresh object literals with extra keys error if typing is structural?",
    ["They do not error", "Excess property checking applies only to fresh literals, catching typos before they ship", "Interfaces disallow them", "Only under strict"],
    1, "Assigning a broader variable is allowed, but a literal with unknown properties is a classic typo risk, so TS flags it."],
);

AUTHORED.typescript.push(
  ["Generics", "HARD", "What is the difference between `<T extends object>` and `<T>` with no constraint?",
    ["They are identical", "The constraint lets you safely index T and warns callers before instantiation rather than erroring inside the body", "The unconstrained version is stricter", "Only the first supports default parameters"],
    1, "Deferring the check to the call site gives callers a precise error and keeps generic bodies usable — the constraint moves from body to boundary."],

  ["Conditional Types", "HARD", "Why do you need `infer` in a conditional type?",
    ["To infer at runtime", "To capture a matched sub-type as a new type parameter inside the true branch", "To widen a union", "To assert non-null"],
    1, "`T extends Promise<infer V> ? V : never` captures the inner type — the basis of ReturnType, Awaited and similar helpers."],

  ["Utility Types", "HARD", "How does `Record<Union, T>` differ from indexing a mapped type with optional keys?",
    ["Nothing", "Record guarantees every union member is a required key — making it ideal for exhaustive maps with lookup by literal", "Record allows missing keys", "Record only works with string unions"],
    1, "Combined with a switch or a lookup table it prevents silently missing cases: the type demands an entry for each member."],

  ["Strict Mode", "HARD", "What does `exactOptionalPropertyTypes` change?",
    ["It forbids optional properties", "It separates 'absent' from 'present but undefined' — `{ a: undefined }` no longer satisfies `a?: string`", "It removes undefined from unions", "It affects only interfaces"],
    1, "By default undefined is assignable to optional keys; the flag makes absence explicit, which matters for APIs distinguishing null vs missing."],

  ["Unions & Narrowing", "HARD", "What does a discriminated union rely on?",
    ["A common literal field (like `type: \"loading\"`) shared across members", "A base class", "Decorators", "Index signatures"],
    1, "Switching on the discriminant narrows the whole union — the standard pattern for state machines and event reducers."],

  ["Types vs Interfaces", "HARD", "What does `interface User extends Required<Partial<User>>`-style self-extension risk?",
    ["Nothing", "Circular or infinitely recursive type expansion can error during declaration merging", "A runtime error", "It erases nullability"],
    1, "Interfaces are resolved eagerly when merged/extended; self-referential constructions can exceed the compiler's depth limits."],

  ["Assertions & Literals", "HARD", "What is `satisfies` useful for that `as` is not?",
    ["It is purely stylistic", "It checks the expression against a type without widening its inferred literal/shape, preserving precise types", "It bypasses errors", "It converts types"],
    1, "`const routes = {...} satisfies RouteConfig` validates the object yet keeps its exact literal keys for later narrowing — `as` would erase that precision."],

  ["keyof & Indexed Access", "HARD", "What does `T extends Record<keyof T, unknown>` achieve as a constraint?",
    ["It forces T to be a map", "It requires T to declare all of its own keys — a self-referential shape check without needing an interface", "It erases types", "It has no effect"],
    1, "The constraint pins T to its own key set (a 'no extra keys' check) while still letting callers pass any compatible literal."],

  ["Function Types", "HARD", "Why can a callback with fewer parameters be passed where more are expected?",
    ["It cannot", "Parameter bivariance lets a function ignore extra arguments — providing fewer is safe", "Due to any inference", "Only with strictFunctionTypes off"],
    1, "A function of arity 1 can legally stand in for an arity-3 callback because JS ignores extra arguments; TS mirrors that."],

  ["Structural Typing", "HARD", "Why are `type User = { name: string }` and a class with the same members interchangeable, and how do you opt out?",
    ["They are not", "Structural typing allows it; nominal intent requires a private brand field or unique symbol", "By enabling strict", "Using interfaces"],
    1, "TS is structural, so to prevent accidental compatibility you add a private property (only the declaring class can make one) or a unique symbol brand."],
);

AUTHORED.react = [
  ["React Hooks", "EASY", "What happens if you read state immediately after calling setState?",
    ["It returns the new value synchronously", "You may still see the old value — state updates are scheduled, not applied instantly", "It throws an error", "The component re-renders twice every time"],
    1, "setState schedules a re-render; the current render's state variable keeps its old value until React commits the update."],

  ["React Fundamentals", "EASY", "What does JSX compile down to?",
    ["HTML strings", "React.createElement calls (or the automatic runtime equivalent)", "CSS classes", "Template literals"],
    1, "JSX is syntax sugar for nested element-creation calls; both runtimes produce element objects, never HTML strings."],

  ["Context API", "EASY", "What problem does React Context solve?",
    ["It renders portals", "It passes values through the tree without threading props through every intermediate component", "It replaces Redux entirely", "It lazy-loads routes"],
    1, "Context broadcasts one value to all descendants; providers set it and useContext consumes it, skipping prop drilling."],

  ["Forms & Controlled Components", "EASY", "What makes a form input 'controlled'?",
    ["It has a ref", "Its value comes from state and every keystroke flows through an onChange handler back into state", "It is disabled", "It uses defaultValue"],
    1, "Controlled means React owns the value: `value={state}` plus `onChange` keeps the DOM and state in lockstep."],

  ["React Fundamentals", "EASY", "Why does React need the `key` prop in a list?",
    ["For CSS styling", "So the reconciler can match items across renders and preserve state/order correctly", "It is required by TypeScript", "Keys enable animations"],
    1, "Keys give React stable identities; without them, reorders or inserts can shuffle state onto the wrong DOM nodes."],

  ["React Hooks", "MEDIUM", "What does an empty `useEffect(() => {...}, [])` dependency array mean?",
    ["The effect runs on every render", "The effect runs once after mount (and cleans up on unmount) because its inputs never change", "The effect never runs", "The component is memoized"],
    1, "No dependencies means nothing can change, so React runs setup once; the returned cleanup runs on unmount."],

  ["React Hooks", "MEDIUM", "When should you prefer `useRef` over `useState`?",
    ["When the value must trigger a render", "When you need a mutable value that survives renders without scheduling one — timers, DOM nodes, previous values", "For API data", "For form values"],
    1, "Refs mutate silently; state schedules a render. Choose refs for anything that should not paint again."],

  ["Component Lifecycle", "MEDIUM", "What replaces `componentDidMount`'s data-fetching role in function components?",
    ["useMemo", "useEffect with the fetch trigger in its dependency array", "useRef", "React.Fragment"],
    1, "Effects are the lifecycle surface: mount fetch on `[]`, refetch when dependencies change, cancel in the cleanup."],

  ["React Hooks", "MEDIUM", "What does `useCallback` actually memoize?",
    ["The return value of a function", "The function identity itself, so it stays referentially stable between renders (when deps are unchanged)", "Component output", "Event payloads"],
    1, "useCallback keeps the same function reference; useMemo keeps a computed value. The first stabilises props passed to memoized children."],

  ["Performance Optimization", "MEDIUM", "What does `React.memo` do?",
    ["Memoizes state", "Skips re-rendering a component when its props are shallowly unchanged", "Caches API responses", "Freezes the DOM"],
    1, "memo is a props gate, not magic — new object/array literals each render still invalidate it, which is why callbacks need stabilising too."],
];

AUTHORED.react.push(
  ["Error Boundaries", "MEDIUM", "What errors can an error boundary catch?",
    ["Event handler errors", "Render, lifecycle and constructor errors in its subtree — but not in event handlers, async code or itself", "Server 500s", "Network timeouts"],
    1, "Boundaries catch declarative-tree failures; imperative code (handlers, timers, async callbacks) must use try/catch instead."],

  ["React Hooks", "MEDIUM", "What is the `useEffect` cleanup function for?",
    ["Rendering fallback UI", "Cancelling subscriptions, timers and in-flight work from the previous effect run", "Logging analytics once", "Fetching faster"],
    1, "Cleanup unsubscribes / aborts / clears before the next effect or unmount; StrictMode deliberately double-invokes it to surface leaks."],

  ["Code Splitting & Lazy Loading", "MEDIUM", "How does `React.lazy` + `Suspense` reduce initial load?",
    ["By compressing the bundle", "By splitting a route/component into a separate chunk loaded on demand, showing a fallback meanwhile", "By caching props", "By deferring CSS"],
    1, "lazy turns the import into a code-split boundary; Suspense handles the loading state while the chunk streams in."],

  ["React Hooks", "MEDIUM", "What is the difference between `useMemo` and `useRef` as caches?",
    ["None", "useMemo caches a computed value tied to dependencies; useRef holds arbitrary mutable state that never triggers renders", "useRef caches functions", "useMemo replaces context"],
    1, "Memoized values recompute when deps change and may be discarded under memory pressure; refs are explicit, long-lived storage."],

  ["Component Lifecycle", "MEDIUM", "Why does StrictMode double-invoke effects in development?",
    ["To slow tests", "To surface effects that are not idempotent — mount, cleanup, remount in dev exposes missing cleanups", "To warm the cache", "A bug in React 18"],
    1, "The double mount is a dev-only stress test; production never double-mounts, but cleanup-missing effects break under the probe."],

  ["React 19 Features", "HARD", "What does the `use` hook allow that earlier hooks did not?",
    ["Conditional calls in loops", "Reading a promise or context conditionally during render (it can be called in conditionals and loops)", "Accessing the DOM directly", "Skipping renders"],
    1, "`use` may be called conditionally because React resolves the resource by identity rather than call order — but it still suspends on pending promises."],

  ["React 19 Features", "HARD", "What does `useOptimistic` add on top of normal state?",
    ["Persistence", "A temporary optimistic value shown while an async action completes, rolling back automatically on failure", "Server caching", "Form validation"],
    1, "useOptimistic overlays a provisional UI during a transition and reconciles to the real result when it lands, including the rollback path."],

  ["React 19 Features", "HARD", "What is a React Server Component's key constraint?",
    ["It cannot use props", "No state, effects, browser APIs or event handlers — it renders on the server to static output", "It must be async", "It cannot import modules"],
    1, "Server Components serialise to the client; interactivity lives in Client Components, which is why hooks and listeners are forbidden there."],
);

AUTHORED.react.push(
  ["Redux & State Management", "HARD", "Why must Redux reducers be pure functions?",
    ["For TypeScript", "Purity makes state transitions predictable, time-travel debugging possible, and change detection reliable", "It is a style preference", "Purity speeds up JSON"],
    1, "Mutating state breaks reference comparison (same object) and replays; pure reducers keep every transition a deterministic old → new mapping."],

  ["Redux Toolkit", "HARD", "What does `createAsyncThunk` manage automatically?",
    ["HTTP retries", "The pending/fulfilled/rejected action lifecycle around a promise payload", "Cache invalidation", "Optimistic UI"],
    1, "createAsyncThunk dispatches three standard actions around your async function, giving reducers a uniform place to track loading and errors."],

  ["Performance Optimization", "HARD", "What does `useDeferredValue` solve?",
    ["Memory leaks", "Expensive re-renders blocking typing — the deferred value lags one render behind so input stays responsive while the list catches up", "Bundle size", "Server latency"],
    1, "Deferred values let urgent updates (keystrokes) commit first while the heavy list re-renders against a slightly stale value."],

  ["React 19 Features", "HARD", "How do Server Actions differ from a classic API route call?",
    ["They run in the browser", "They are async functions executed on the server, callable directly from components/forms with progressive enhancement", "They skip validation", "They only return JSON"],
    1, "Server Actions collapse the fetch/route layer: the function address is bound server-side and invoked from the client, even without JS."],

  ["Redux Toolkit", "HARD", "What does RTK Query's `providesTags` / `invalidatesTags` pair do?",
    ["Authentication", "Declares which cached data a query serves and which mutations expire it, driving automatic refetches", "Rate limiting", "Code splitting"],
    1, "Tags are the cache graph: reads tag their data, writes invalidate tags, and RTK Query refetches exactly the affected queries."],

  ["React Hooks", "HARD", "What is `useSyncExternalStore` for?",
    ["Syncing props", "Subscribing components to external (non-React) stores with tearing-free concurrent reads", "Server rendering only", "Replacing context"],
    1, "It gives concurrent React a getSnapshot/subscribe contract so store reads stay consistent across interrupted renders."],

  ["Performance Optimization", "HARD", "When does `useTransition` actually help?",
    ["For faster mounts", "When a state update triggers a heavy re-render you want to mark non-urgent, keeping the UI (and a pending indicator) responsive", "For code splitting", "For prefetching"],
    1, "Transitions deprioritise the update so urgent events win; `isPending` flags the in-flight state so skeletons can cover the stale UI."],

  ["Redux & State Management", "HARD", "Why is normalising Redux state (entities by id) recommended at scale?",
    ["It encrypts the state", "Flat, id-keyed entities make updates O(1), avoid deep-nesting change-detection bugs, and simplify selectors", "It reduces action types", "It removes reducers"],
    1, "Denormalised trees force deep copies on every edit; normalised slices update one leaf and selectors re-join what views need."],

  ["Context API", "HARD", "Why does a single Context holding a big object re-render the whole tree often?",
    ["Context never updates", "Every provider value change (a new object identity each render) notifies all consumers — Context has no selector mechanism", "Consumers are memoized", "Only the provider re-renders"],
    1, "Any value change wakes every consumer. Split contexts, memoize the value, or lift state into a store to scope updates."],

  ["Jest - Unit Testing", "HARD", "Why prefer user-event over fireEvent in component tests?",
    ["It runs faster", "user-event replays the full browser event sequence (keydown, keypress, input…) so tests match real interaction", "fireEvent is deprecated", "user-event needs no setup"],
    1, "fireEvent dispatches one synthetic event; user-event replays what the browser does, catching handlers wired to the wrong phase."],
);

AUTHORED.nextjs = [
  ["App Router Fundamentals", "EASY", "Which file makes a route segment publicly accessible in the App Router?",
    ["layout.tsx", "page.tsx", "route.ts", "template.tsx"],
    1, "Only page.tsx renders UI at its URL; layouts wrap children but never create a route on their own."],

  ["App Router Fundamentals", "EASY", "Where does `loading.tsx` render?",
    ["Only in the root", "As the Suspense fallback for its segment while nested content streams in", "In the browser console", "On the error page"],
    1, "loading.tsx wraps the segment in Suspense automatically, giving instant skeletons during streaming."],

  ["App Router Fundamentals", "EASY", "What does a `layout.tsx` file do?",
    ["Renders one page only", "Wraps its segment and all children with shared UI that preserves state across navigations", "Fetches data only", "Handles errors"],
    1, "Layouts mount once and persist while child segments swap — ideal for navbars, sidebars and providers."],

  ["Data Fetching & Server Actions", "EASY", "Where should data fetching happen in a Server Component?",
    ["In useEffect", "Directly in the component body with await — Server Components can be async", "In getStaticProps", "In the browser only"],
    1, "Server Components run on the server, so awaiting fetch inline is idiomatic; useEffect does not exist there."],

  ["Data Fetching & Server Actions", "EASY", "How do you opt a Server Component into dynamic rendering?",
    ["Add \"use client\"", "Read request-time data (headers, cookies, searchParams) or set dynamic = 'force-dynamic'", "Rename it to page.client.tsx", "Use useState"],
    1, "Request-time APIs and the force-dynamic segment option pull the route out of static prerendering."],

  ["App Router Fundamentals", "MEDIUM", "What does a `route.ts` file export to handle HTTP?",
    ["Components", "Named HTTP-method functions (GET, POST, …) returning Response objects", "CSS", "Middleware config"],
    1, "Route Handlers are Web-standard endpoints: export async function GET(request) { return Response.json(...) }."],

  ["Data Fetching & Server Actions", "MEDIUM", "What does `cache: 'no-store'` do on a fetch call?",
    ["Caches forever", "Bypasses the Data Cache so every request hits the origin", "Disables the component cache", "Enables ISR"],
    1, "no-store marks the fetch dynamic, opting the route out of static rendering for that data."],

  ["Data Fetching & Server Actions", "MEDIUM", "How do you revalidate cached data after a mutation?",
    ["Reload the page", "Call revalidatePath or revalidateTag inside the Server Action", "Delete the cache folder", "Change the URL"],
    1, "On-demand revalidation purges specific paths/tags so the next request rebuilds fresh HTML."],

  ["Advanced Server Rendering", "MEDIUM", "What does `generateMetadata` return?",
    ["JSX", "A Metadata object (title, description, openGraph…) rendered into <head>", "A JSON API response", "CSS variables"],
    1, "generateMetadata runs on the server per route and feeds the document head — the App Router replacement for next/head."],

  ["Advanced Server Rendering", "MEDIUM", "Where does `error.tsx` catch failures?",
    ["The whole app", "Its own segment boundary and below — sibling/parent segments keep rendering", "Only API routes", "Only the root layout"],
    1, "error.tsx is a nested boundary: it resets its segment independently, which is why layouts above it survive."],
];

AUTHORED.nextjs.push(
  ["Advanced Server Rendering", "MEDIUM", "What is Partial Prerendering (PPR)?",
    ["Prerendering half the routes", "Serving a static shell instantly while dynamic holes stream in, within the same route", "A build optimisation only", "Client-side rendering renamed"],
    1, "PPR blends static and dynamic in one response: the shell ships from the edge cache and Suspense boundaries fill in."],

  ["Data Fetching & Server Actions", "MEDIUM", "Why must Server Action arguments be serializable?",
    ["They must fit in a cookie", "Actions cross the client/server boundary, so args travel as JSON", "For TypeScript only", "To enable caching"],
    1, "The client sends arguments over the wire; functions, class instances and symbols cannot cross that boundary."],

  ["Architecture & Runtime", "MEDIUM", "When should you choose the Edge runtime over Node.js?",
    ["Always — it is faster everywhere", "For latency-sensitive, dependency-light middleware and personalisation at the edge", "For heavy image processing", "For database drivers"],
    1, "Edge runs V8 isolates near users with limited Node APIs; heavy compute and native modules still belong on Node runtimes."],

  ["App Router Fundamentals", "MEDIUM", "What does a `template.tsx` file do differently from `layout.tsx`?",
    ["Nothing", "Templates remount on every navigation (fresh state) while layouts preserve state", "Templates are for APIs", "Layouts cannot nest"],
    1, "Template remounts its children per segment — useful for enter animations or per-page state resets."],

  ["Advanced Server Rendering", "HARD", "What is the purpose of `unstable_cache`?",
    ["Caching static assets", "Memoizing expensive work outside the request lifecycle with tag-based invalidation", "Caching client state", "Disabling ISR"],
    1, "unstable_cache wraps arbitrary async work (DB calls, SDKs) in the Data Cache, keyed and revalidatable by tags."],

  ["Architecture & Runtime", "HARD", "How does `revalidateTag` differ from `revalidatePath`?",
    ["They are identical", "revalidateTag purges every cached entry labelled with a tag across paths; revalidatePath targets one URL", "Tags are slower", "Paths cannot be revalidated"],
    1, "Tags decouple invalidation from URLs: one tag (e.g. 'products') can clear listings, search and detail caches together."],

  ["Advanced Server Rendering", "HARD", "Where does Middleware execute and what can it do?",
    ["On the client after hydration", "At the edge before routing — rewrites, redirects, auth checks and header injection", "Only in dev mode", "Inside Server Components"],
    1, "Middleware intercepts requests pre-route with a Web-standard API, ideal for auth gates, A/B splits and locale routing."],

  ["Architecture & Runtime", "HARD", "What is a multi-zone Next.js deployment?",
    ["Multiple databases", "Several Next.js apps served under one domain via rewrites, each owning its routes", "Multi-region only", "A monorepo"],
    1, "Zones split a large site into independently deployable apps (docs., blog., app.) unified behind one hostname."],

  ["Advanced Server Rendering", "HARD", "Why can `fetch` in a Server Component be deduped automatically?",
    ["It cannot", "Next.js memoizes identical fetch calls per request (request memoization), so repeated component fetches hit once", "Because of the browser cache", "Only with SWR"],
    1, "Request memoization dedupes GET fetches within one render pass — the tree can fetch the same resource freely."],

  ["Data Fetching & Server Actions", "HARD", "What makes a Server Action idempotent-safe to retry?",
    ["Nothing — retries are banned", "Designing the mutation around stable keys/versions so duplicate submissions converge instead of duplicating effects", "Using GET instead of POST", "Disabling cookies"],
    1, "Network retries and double-clicks happen; idempotency keys or conditional writes make the second execution a no-op."],
);

AUTHORED.nextjs.push(
  ["App Router Fundamentals", "HARD", "What do `parallel routes` (`@slot`) solve?",
    ["Parallel builds", "Rendering multiple independent views in one layout (modal + page) with independent loading/error states", "Faster hydration", "Multi-tenancy"],
    1, "Named slots let a layout compose several subtrees that navigate, stream and fail independently."],

  ["Architecture & Runtime", "HARD", "When do you reach for `generateStaticParams`?",
    ["For client components", "To pre-render known dynamic segments (blog slugs, product ids) at build time, optionally with dynamicParams fallback", "To skip builds", "For API routes"],
    1, "generateStaticParams enumerates params for static generation; unknown params then 404 or render on demand per dynamicParams."],

  ["Advanced Server Rendering", "HARD", "What does the `connection()` API do?",
    ["Opens a DB pool", "Explicitly marks rendering as dynamic by touching request-time data, replacing ad-hoc headers()/cookies() reads", "Connects to Redis", "Enables websockets"],
    1, "connection() is the deliberate dynamic opt-in: calling it tells Next.js the route needs per-request data."],

  ["Data Fetching & Server Actions", "HARD", "Why must secrets never be read in a Client Component bundle?",
    ["They cannot be read at all", "Client code ships to the browser — any secret referenced there is exposed; keep them in Server Components/Actions", "TypeScript forbids it", "It breaks hydration"],
    1, "Anything imported by client code is downloadable. Secrets belong server-side, passed to clients only as derived, safe values."],

  ["Architecture & Runtime", "HARD", "What does `output: 'export'` change about a Next.js app?",
    ["Nothing", "It disables all server features and emits a fully static site servable from any CDN", "It enables SSR", "It adds API routes"],
    1, "Static export removes Route Handlers, Server Actions, ISR and middleware needs — pure HTML/CSS/JS output."],
);

