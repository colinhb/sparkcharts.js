# SparkCharts.js

Lightweight bar chart sparklines using inline SVG. All sizing and colors are automatic based on typography / styling.

See [index.html](https://colinhb.github.io/sparkcharts.js/) (on GitHub Pages) for examples.

## Usage

1. Include the script:
```html
<script src="sparkcharts.js"></script>
```

2. Add the attribute `data-sparkchart="true"` to any element with data:
```html
<span data-sparkchart="true">10, 20, 30</span>
```

**Note:** You may also use [jsDelivr](https://www.jsdelivr.com) to source the library from GitHub[^version]: 
```html
<script src="https://cdn.jsdelivr.net/gh/colinhb/sparkcharts.js@81df262/sparkcharts.js"></script>
```

[^version]: I'm using a specific commit here. You should probably do the same.

## Features

- **Typography-responsive**: Charts automatically scale with font-size
- **CSS colors**: Inherits color from CSS `color` property
- **Fixed scale**: Optional max value, supplied after a `;`: `<span data-sparkchart="true">1, 2, 3; 10</span>`
- **Accessible**: Includes ARIA labels and tooltips
- **Fallback warnings**: Optional fallback warning for environments where the script doesn't load

## Fallback Warnings

You can provide fallback content for users whose browsers fail to load or execute the script. Add `data-sparkchart-warn="true"` to any element containing a warning message:

```html
<div data-sparkchart-warn="true">
	<p><mark>If you can read this, then the visualizations in this document may not be rendering. If you are having problems, please enable javascript or try on another device.</mark></p>
</div>
```

When the script loads successfully, all elements with `data-sparkchart-warn="true"` are automatically removed from the page. If the script fails to load, the warning remains visible.

Alternatively, you could use `<noscript>` elements, but that wouldn't handle the case where javascript is enabled, but for some other reason the script is not loading or running.

## History

This library was developed to support easy "distribution reporting" of public opinion data online. For example, see [this release](https://blog.athenainsights.org/nyc-mayoral-toplines-2025/).
