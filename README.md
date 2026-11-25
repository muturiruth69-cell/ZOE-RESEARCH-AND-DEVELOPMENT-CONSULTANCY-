# ZOE Research & Development Consultancy: website front end

*Turning Problems into Opportunities*

## View it
Double-click `index.html`. You need an internet connection for the fonts (Google Fonts) and the office map.

## Pages (menu tabs)
| File | Tab |
|---|---|
| index.html | Home: photo slider, what ZOE does, how a project works |
| services.html | Services: the five service lines in detail |
| about.html | About: story, inside ZOE, leadership |
| purpose.html | Our Purpose: vision, mission, burden, values, commitments |
| industries.html | Industry & Market: sectors and market forces |
| portfolio.html | Portfolio: clients, deliverables, engagement types |
| testimonials.html | Testimonials: feedback form (no quotes are published until clients give them) |
| contact.html | Contact: phone, WhatsApp, emails, map, hours, enquiry form, FAQ |

Secondary pages linked from Services and the footer: ai-lab.html, academy.html, approach.html, ethics.html, insights.html.

Photos are free Pexels images stored in `assets/img/photos/`. The logo is `assets/img/zoe-logo.png`.

## Editing
Edit the source files, not the root `.html` files, then rebuild:

- Page content: `_src/pages/*.html`
- Shared header, menu and icons: `_src/partials/header.html`
- Footer: `_src/partials/footer.html`
- Styles and colour modes: `assets/css/style.css`
- Hero slider photos: `assets/img/photos/`
- Slider, menu, theme switcher and forms: `assets/js/main.js`

```
py _src/build.py
```

## Colour modes
The site has three modes: Light (the default, white and ivory), Dark (charcoal grey) and Emerald (deep research green). Visitors switch between them in the green menu bar, and the site remembers their choice. To open a link in a particular mode, add `?theme=dark` or `?theme=emerald` to it.

## To do before launch
- Save the YET Kenya logo as `assets/img/clients/yet-kenya.png`. Until then, a styled text version is shown.
- Connect the research-brief form to a backend or form service. For now it opens the visitor's email app with the brief pre-filled.
- Add a real photo of the CEO on `about.html` to replace the "RM" placeholder.
