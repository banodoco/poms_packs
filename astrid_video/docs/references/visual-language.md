# Visual language

[Visual grammar — one page](visual-grammar.png) · [Motion language](motion-language.md) · [Character sheet](mink-character-guide.jpg)

**Sophisticated editorial design. Playful pixelated physics.** The Home and Vision pages are the reference for the world around the mink. It is not a retro game interface. The primary content is crisp, polished, contemporary and legible; the pixel world introduces character and moments of change.

## Foundation

The day palette is taken from the public page CSS: paper `#F7F4ED`, panel `#FFFEFA`, ink `#25241F`, muted `#615E55`, line `#D5D0C5`. Use orange `#ED6B23` for action and pixel effects, and deeper rust `#A94714` for small type on paper. The site also uses quiet apricot, ochre, sage and blue tints for grouping; use these when a distinction needs colour, not to decorate each card differently. Default to day. A proposed complementary night preset is included for cinematic or intentionally darker sequences; retain readable contrast, not a neon dashboard. Footage may have its own palette. The shared pack tokens are in `shared/style.ts`.

Typography follows the site: Georgia-style editorial serif for big statements and titles, Inter-style sans for explanations and labels, Departure Mono for occasional system identifiers. Use existing installed local fonts if available; this pack provides fallback stacks, not font files. Use regular serif weight, short headings, comfortable body copy, quiet small metadata. Do not pixelate main text. Use visual emphasis selectively: a single rust word, a thin rule, or a restrained highlight.

## Composition rules

- Use generous whitespace and a clear reading order. Show one primary idea per composition. Keep actual video or software large enough to read. Frame media with a quiet neutral surround or no extra frame when the content demands full-screen.
- Large objects move and resize smoothly. Small pixel accents indicate the action or relationship. Pixels can occupy the entire frame only when an intentional dramatic transformation calls for it; keep the underlying main content pristine at ordinary times.
- Use genuine media and real interfaces. Explanatory diagrams should be recognisable as such rather than impersonating an actual execution trace. Avoid putting everything into equally weighted rounded boxes.
- Use the mink as a small living presence with a reason to appear. See the supplied [character sheet](mink-character-guide.jpg). Do not change the mascot palette to match the frame.

## Source of direction

The inspected site source at `e0da794ac9d26a808ab4082b29f60408b66b3a4c` is the basis for the day tokens, typography and two-layer motion idea: [Home](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/pages/Home/PublicAstridShell.css), [Vision](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/pages/Home/PublicAstridVision.css), [North Star mink motion](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/pages/Home/PublicAstridNorthStarArt.css), [room transitions](https://github.com/banodoco/astrid-app/blob/e0da794ac9d26a808ab4082b29f60408b66b3a4c/src/pages/Home/PublicAstridSite.css). The visual grammar is a proposed video adaptation, not a reproduction of a website screenshot or an immutable brand standard.
