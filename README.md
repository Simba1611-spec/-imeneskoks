# Interaktīvs dzimtas koks — GitHub Pages

Šis ir vienkāršs, bezmaksas, statisks dzimtas koks, kas darbojas GitHub Pages.

## Ātrā uzstādīšana

1. Izveido GitHub kontu.
2. Izveido jaunu repository, piemēram, `family-tree`.
3. Augšupielādē visus šī projekta failus:
   - `index.html`
   - `style.css`
   - `data.js`
   - `app.js`
4. GitHub repository atver:
   **Settings → Pages**
5. Pie **Build and deployment** izvēlies:
   **Deploy from a branch**
6. Izvēlies `main` un `/ (root)`, pēc tam **Save**.
7. Pēc publicēšanas GitHub parādīs adresi, piemēram:
   `https://TAVS-LIETOTAJVARDS.github.io/family-tree/`

## Kā pievienot savus radiniekus

Atver `data.js` un rediģē masīvu `PEOPLE`.

Piemērs:

```js
{
  id: "p6",
  name: "Jānis Ozols",
  birth: "1942",
  death: "2020",
  parents: ["p1", "p2"],
  photo: "photos/janis.jpg",
  place: "Rīga",
  bio: "Īss apraksts."
}
```

`parents` satur vecāku personu `id`. Ja vecāki nav zināmi, lieto `parents: []`.

## Fotogrāfijas

Izveido mapi `photos`, pievieno tajā attēlu un `data.js` norādi, piemēram:

`photo: "photos/janis.jpg"`

## Iegulšana Mozello

Ja Mozello konkrētajā lapas blokā ļauj ievietot HTML/iframe, vari izmantot:

```html
<iframe
  src="https://TAVS-LIETOTAJVĀRDS.github.io/family-tree/"
  width="100%"
  height="900"
  style="border:0;"
  loading="lazy">
</iframe>
```

Ja iframe Mozello Free versijā netiek pieņemts, drošs rezerves variants ir Mozello izvēlnē izveidot pogu/saiti **“Dzimtas koks”**, kas atver GitHub Pages adresi jaunā logā.

## Svarīgi par privātumu

GitHub Pages vietne ir publiska. Neievieto tajā sensitīvus personas datus, piemēram, personas kodus, adreses, tālruņa numurus vai citus datus, kurus nevēlies publicēt internetā.
