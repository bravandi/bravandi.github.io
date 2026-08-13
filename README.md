# ravandi.ai

Personal site for Cyrus B. Ravandi. Plain HTML + CSS, no build step.
Served by GitHub Pages from the `master` branch root.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole page. Edit the text here. |
| `styles.css` | All styling. Colors live in the `:root` block at the top. |
| `CNAME` | Tells GitHub Pages the custom domain is `ravandi.ai`. Do not delete. |

The `figures/`, `linked_in_*.png`, and `publons_icon_*.png` files are leftovers
from the 2019 version of this site, kept in case anything still links to them.

## Editing

```sh
git pull
# edit index.html
open index.html          # preview locally — just open the file, no server needed
git commit -am "update bio"
git push
```

Live within a minute or so of pushing.

## DNS

The apex domain `ravandi.ai` points at GitHub's Pages IPs via four `A` records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www.ravandi.ai` is a `CNAME` to `bravandi.github.io`.
