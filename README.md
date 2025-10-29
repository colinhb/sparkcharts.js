# SparkCharts.js

Lightweight bar chart sparklines using inline SVG. All sizing and colors are automatic based on typography / styling.

## Usage

1. Include the script:
```html
<script src="sparkcharts.js"></script>
```

2. Add the attribute `data-sparkchart="true"` to any element with data:
```html
<span data-sparkchart="true">10, 20, 30</span>
```

**Note:** You may also use [jsDelivr]() for sourcing the library from GitHub, like so: <https://cdn.jsdelivr.net/gh/colinhb/sparkcharts.js@81df262/sparkcharts.js>.[^version]

[^version]: Note I'm using a specific commit here. You should probably do the same.

## Features

- **Typography-responsive**: Charts automatically scale with font-size
- **CSS colors**: Inherits color from CSS `color` property
- **Fixed scale**: Optional max value, supplied after a `;`: `<span data-sparkchart="true">1, 2, 3; 10</span>`
- **Accessible**: Includes ARIA labels and tooltips

## Demo

See [index.html](https://colinhb.github.io/sparkcharts.js/) for examples.

## History

This was developed to support "distribution reporting" of survery responses online. For example, see [this release](https://blog.athenainsights.org/nyc-mayoral-toplines-2025/).
