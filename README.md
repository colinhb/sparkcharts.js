# SparkCharts.js

Lightweight bar chart sparklines using inline SVG. All sizing and colors are automatic based on typography / styling.

See [index.html](https://colinhb.github.io/sparkcharts.js/) (live on GitHub Pages) for examples.

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
- **Inherited colors**: Inherits color from CSS `color` property
- **Fixed scale**: Optional fixed scale (chart value height), supplied as a second `;` separated field: `<span data-sparkchart="true">1, 2, 3; 10</span>`
- **Mean indicator**: Optional mean indicator, supplied as a third `;` separated field (see live examples)
- **Accessible**: Includes ARIA labels and tooltips
- **Fallback warnings**: Optional fallback warning for environments where the script doesn't load

## Fallback Warnings

You can provide fallback content for users whose browsers fail to load or execute the script. Add `data-sparkchart-warn="true"` to any element containing a warning message:

```html
<p data-sparkchart-warn="true">
	<mark>If you can read this, then the 
	visualizations in this document may not 
	be rendering. If you are having problems, 
	please enable javascript or try on another 
	device.</mark>
</p>
```

When the script loads successfully, all elements with `data-sparkchart-warn="true"` are automatically removed from the page. If the script fails to load, the warning remains visible.

Alternatively, you could use `<noscript>` elements, but that wouldn't handle the case where javascript is enabled, but for some other reason the script is not loading or running.

## History

This library was developed to support easy "distribution reporting" of public opinion data online. For example, see [this release](https://blog.athenainsights.org/nyc-mayoral-toplines-2025/).

## Copyright and Licensing

See the `COPYRIGHT` and `LICENSE` files, which cover the contents of this repository unless otherwise noted below.

- The stylesheet `normalize.css`, used for the examples webpage, is from [csstools/normalize.css](https://github.com/csstools/normalize.css), and has been committed to the public domain (CC0-1.0 license).
