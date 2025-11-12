(() => {
	const CONFIG = {
		BAR_WIDTH_EM: 1,
		HEIGHT_EM: 2,
		GAP_EM: 0.2,
		MEAN_MARKER_HEIGHT_EM: 0.6,
		QUIET: false,
		FALLBACK_FONT_SIZE: 16,
		FALLBACK_COLOR: 'currentColor',
	};

	document.querySelectorAll('[data-sparkchart-warn="true"]').forEach(el => el.remove());

	const sparkcharts = document.querySelectorAll('[data-sparkchart="true"]');
	if (!sparkcharts || !sparkcharts.length) return;

	const NS = 'http://www.w3.org/2000/svg';

	function warn(message) {
		if (!CONFIG.QUIET) {
			console.warn(message);
		}
	}

	function prepare(el) {
		const computed = window.getComputedStyle(el);
		const fontSize = parseFloat(computed.fontSize) || CONFIG.FALLBACK_FONT_SIZE;
		const color = computed.color || CONFIG.FALLBACK_COLOR;

		const content = (el.textContent || '').trim();
		const parts = content.split(';').map(s => s.trim());
		const pointsData = parts[0] || '';
		const maxData = parts[1];
		const meanData = parts[2];

		const rawTokens = pointsData
			.replace(/\n+/g, ' ')
			.split(',')
			.map(s => s.trim());

		const isValid = (token) => {
			if (token === '') return false;
			const num = Number(token);
			return Number.isFinite(num);
		};

		const points = rawTokens.filter(isValid).map(s => Number(s));

		if (!points.length) return null;

		const invalidTokens = rawTokens.filter(token => !isValid(token));
		if (invalidTokens.length > 0) {
			warn(`SparkCharts: Found ${invalidTokens.length} non-numeric value(s): [${invalidTokens.join(', ')}]. Non-numeric values will be ignored.`);
		}

		const negativePoints = points.filter(n => n < 0);
		if (negativePoints.length > 0) {
			warn(`SparkCharts: Found ${negativePoints.length} negative value(s): [${negativePoints.join(', ')}]. Negative values will be rendered as zero.`);
		}

		const userMax = maxData ? Number(maxData) : null;
		const dataMax = Math.max(...points, 0);
		let scaleMax = dataMax;

		if (userMax !== null) {
			if (!Number.isFinite(userMax) || userMax < 0) {
				warn(`SparkCharts: Invalid max value "${userMax}". Using auto-scale (${dataMax}).`);
				scaleMax = dataMax;
			} else if (userMax < dataMax) {
				warn(`SparkCharts: Max value (${userMax}) < data max (${dataMax}). Using ${dataMax}.`);
				scaleMax = dataMax;
			} else {
				scaleMax = userMax;
			}
		}

		// Parse mean data
		let meanValue = null;
		let meanMinValue = null;
		let meanMaxValue = null;

		if (meanData) {
			const meanTokens = meanData
				.replace(/\n+/g, ' ')
				.split(',')
				.map(s => s.trim())
				.filter(s => s !== '');

			if (meanTokens.length === 1) {
				// Implicit mode: single number is the mean, assume range 0-100
				const parsedMean = Number(meanTokens[0]);
				if (!Number.isFinite(parsedMean)) {
					warn(`SparkCharts: Invalid mean value "${meanTokens[0]}". Ignoring.`);
				} else if (parsedMean < 0) {
					warn(`SparkCharts: Negative mean value (${parsedMean}). Ignoring.`);
				} else {
					meanValue = parsedMean;
					meanMinValue = 0;
					meanMaxValue = 100;
				}
			} else if (meanTokens.length === 3) {
				// Explicit mode: min, max, mean
				const parsedMin = Number(meanTokens[0]);
				const parsedMax = Number(meanTokens[1]);
				const parsedMean = Number(meanTokens[2]);

				if (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax) || !Number.isFinite(parsedMean)) {
					warn(`SparkCharts: Invalid mean specification "${meanData}". Expected format: "min, max, mean". Ignoring.`);
				} else if (parsedMin >= parsedMax) {
					warn(`SparkCharts: Mean min (${parsedMin}) >= max (${parsedMax}). Ignoring.`);
				} else if (parsedMean < 0) {
					warn(`SparkCharts: Negative mean value (${parsedMean}). Ignoring.`);
				} else {
					meanValue = parsedMean;
					meanMinValue = parsedMin;
					meanMaxValue = parsedMax;

					if (meanValue < meanMinValue || meanValue > meanMaxValue) {
						warn(`SparkCharts: Mean (${meanValue}) outside specified range [${meanMinValue}, ${meanMaxValue}].`);
					}
				}
			} else {
				warn(`SparkCharts: Invalid mean specification "${meanData}". Expected 1 value (implicit: mean) or 3 values (explicit: min, max, mean). Ignoring.`);
			}
		}

		const barWidth = CONFIG.BAR_WIDTH_EM * fontSize;
		const gap = CONFIG.GAP_EM * fontSize;
		const totalGap = Math.max(0, (points.length - 1) * gap);
		const width = (points.length * barWidth) + totalGap;

		el.textContent = '';

		const svg = document.createElementNS(NS, 'svg');
		svg.setAttribute('role', 'img');
		svg.setAttribute('aria-label', `Bar chart with ${points.length} data points` +
			(meanValue !== null ? `, mean at ${meanValue}` : ''));

		return {
			svg,
			width,
			barWidth,
			gap,
			color,
			points,
			scaleMax,
			fontSize,
			meanValue,
			meanMinValue,
			meanMaxValue
		};
	}

	function createTriangleMarker(x, y, width, height, pointDown, color) {
		const path = document.createElementNS(NS, 'path');

		// For equilateral triangle: width = (2 * height) / √3
		const equilateralWidth = (2 * height) / Math.sqrt(3);
		
		const centerX = x + width / 2;
		const triangleLeft = centerX - equilateralWidth / 2;
		const triangleRight = centerX + equilateralWidth / 2;
		
		let d;

		if (pointDown) {
			// Triangle pointing down: apex at bottom-center
			d = `M ${triangleLeft} ${y} L ${triangleRight} ${y} L ${centerX} ${y + height} Z`;
		} else {
			// Triangle pointing up: apex at top-center
			d = `M ${triangleLeft} ${y + height} L ${triangleRight} ${y + height} L ${centerX} ${y} Z`;
		}

		path.setAttribute('d', d);
		path.setAttribute('fill', color);
		// path.setAttribute('fill-opacity', 0.8);

		return path;
	}

	function drawMeanLine(svg, meanValue, meanMinValue, meanMaxValue, chartHeight, markerHeight, width, barWidth, gap, color, isToneMode = false) {
		if (meanValue === null || meanMinValue === null || meanMaxValue === null) return;

		const valueRange = meanMaxValue - meanMinValue;

		if (valueRange <= 0) {
			warn(`SparkCharts: Invalid mean range [${meanMinValue}, ${meanMaxValue}]. Cannot draw mean line.`);
			return;
		}

		const markerWidth = barWidth;

		// Calculate x position based on mean value within specified range
		const firstBarCenter = barWidth / 2;
		const lastBarCenter = width - (barWidth / 2);
		const fraction = (meanValue - meanMinValue) / valueRange;
		const meanX = firstBarCenter + fraction * (lastBarCenter - firstBarCenter);

		const markerX = meanX - (markerWidth / 2);

		if (isToneMode) {
			// In tone mode: markers at top and bottom, line spans full height

			// Top marker (pointing down)
			const topMarker = createTriangleMarker(markerX, 0, markerWidth, markerHeight, true, color);
			const topTitle = document.createElementNS(NS, 'title');
			topTitle.textContent = `Mean: ${meanValue}`;
			topMarker.appendChild(topTitle);
			svg.appendChild(topMarker);

			// Bottom marker (pointing up)
			const bottomMarker = createTriangleMarker(markerX, chartHeight - markerHeight, markerWidth, markerHeight, false, color);
			svg.appendChild(bottomMarker);

			// Vertical line connecting markers
			const line = document.createElementNS(NS, 'line');
			line.setAttribute('x1', meanX);
			line.setAttribute('x2', meanX);
			line.setAttribute('y1', markerHeight);
			line.setAttribute('y2', chartHeight - markerHeight);
			line.setAttribute('stroke', color);
			line.setAttribute('stroke-width', 1);
			// line.setAttribute('stroke-opacity', 0.6);
			line.setAttribute('stroke-dasharray', '2,2');
			svg.appendChild(line);

		} else {
			// In bar mode: marker at top, line extends to bottom
			// Triangle marker at top
			const topMarker = createTriangleMarker(markerX, 0, markerWidth, markerHeight, true, color);
			const title = document.createElementNS(NS, 'title');
			title.textContent = `Mean: ${meanValue}`;
			topMarker.appendChild(title);
			svg.appendChild(topMarker);

			// Vertical line from bottom of marker to bottom of chart
			const line = document.createElementNS(NS, 'line');
			line.setAttribute('x1', meanX);
			line.setAttribute('x2', meanX);
			line.setAttribute('y1', markerHeight);
			line.setAttribute('y2', chartHeight);
			line.setAttribute('stroke', color);
			line.setAttribute('stroke-width', 1);
			// line.setAttribute('stroke-opacity', 0.6);
			line.setAttribute('stroke-dasharray', '2,2');
			svg.appendChild(line);
		}
	}

	function draw(el, opts) {
		const mode = el.getAttribute('data-sparkchart-mode') || 'bars';
		const markerHeight = opts.meanValue !== null ? CONFIG.MEAN_MARKER_HEIGHT_EM * opts.fontSize : 0;

		let svg;
		if (mode === 'tone') {
			opts.height = (CONFIG.HEIGHT_EM * opts.fontSize * 2) + (markerHeight * 2);
			opts.markerHeight = markerHeight;
			svg = drawTone(opts);
		} else {
			opts.height = (CONFIG.HEIGHT_EM * opts.fontSize) + markerHeight;
			opts.markerHeight = markerHeight;
			svg = drawBars(opts);
		}

		el.replaceChildren(svg);
	}

	function drawTone(opts) {
		const { svg, points, scaleMax, height, width, barWidth, gap, color, meanValue, meanMinValue, meanMaxValue, markerHeight } = opts;

		const padding = gap;
		const paddedWidth = width + (2 * padding);
		const centerY = height / 2;

		svg.setAttribute('width', paddedWidth);
		svg.setAttribute('height', height);
		svg.replaceChildren();

		// Draw 1px baseline
		const baseline = document.createElementNS(NS, 'line');
		baseline.setAttribute('x1', 0);
		baseline.setAttribute('x2', paddedWidth);
		baseline.setAttribute('y1', centerY);
		baseline.setAttribute('y2', centerY);
		baseline.setAttribute('stroke', color);
		baseline.setAttribute('stroke-width', 1);
		svg.appendChild(baseline);

		// Available height for bars (excluding marker space)
		const barAreaHeight = (height - (markerHeight * 2)) / 2;

		points.forEach((point, i) => {
			const clampedPoint = Math.max(0, point);
			const h = scaleMax > 0 ? (clampedPoint / scaleMax) * barAreaHeight : 0;
			const barHeight = h === 0 ? 1 : Math.max(1, h);
			const x = padding + (i * (barWidth + gap));

			// Bar extends ABOVE baseline
			const rectAbove = document.createElementNS(NS, 'rect');
			rectAbove.setAttribute('x', x);
			rectAbove.setAttribute('y', centerY - barHeight);
			rectAbove.setAttribute('width', barWidth);
			rectAbove.setAttribute('height', barHeight);
			rectAbove.setAttribute('fill', color);

			// Bar extends BELOW baseline (reflection)
			const rectBelow = document.createElementNS(NS, 'rect');
			rectBelow.setAttribute('x', x);
			rectBelow.setAttribute('y', centerY); // Start at baseline
			rectBelow.setAttribute('width', barWidth);
			rectBelow.setAttribute('height', barHeight);
			rectBelow.setAttribute('fill', color);

			// Add title to both parts (or just one?)
			const title = document.createElementNS(NS, 'title');
			title.textContent = String(point);
			rectAbove.appendChild(title);

			svg.appendChild(rectAbove);
			svg.appendChild(rectBelow);
		});

		// Draw mean line AFTER bars (on top)
		drawMeanLine(svg, meanValue, meanMinValue, meanMaxValue, height, markerHeight, paddedWidth, barWidth, gap, color, true);

		return svg;
	}

	function drawBars(opts) {
		const { svg, points, scaleMax, height, width, barWidth, gap, color, meanValue, meanMinValue, meanMaxValue, markerHeight } = opts;

		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.replaceChildren();

		// Available height for bars (excluding marker space at top)
		const barAreaHeight = height - markerHeight;

		points.forEach((point, i) => {
			const clampedPoint = Math.max(0, point);
			const h = scaleMax > 0 ? (clampedPoint / scaleMax) * barAreaHeight : 0;
			const barHeight = h === 0 ? 1 : Math.max(1, h); // 0 -> 1px (zero case), 0<h<=1 -> 1px (legibility case), h>1 -> h (normal case)
			const x = i * (barWidth + gap);
			const y = height - barHeight;

			const rect = document.createElementNS(NS, 'rect');
			rect.setAttribute('x', x);
			rect.setAttribute('y', y);
			rect.setAttribute('width', barWidth);
			rect.setAttribute('height', barHeight);
			rect.setAttribute('fill', color);

			const title = document.createElementNS(NS, 'title');
			title.textContent = String(point);
			rect.appendChild(title);

			svg.appendChild(rect);
		});

		// Draw mean line AFTER bars (on top)
		drawMeanLine(svg, meanValue, meanMinValue, meanMaxValue, height, markerHeight, width, barWidth, gap, color, false);

		return svg;
	}

	sparkcharts.forEach(el => {
		const opts = prepare(el);
		if (!opts) return;
		draw(el, opts);
	});
})();
