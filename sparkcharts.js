(() => {
    const CONFIG = {
        BAR_WIDTH_EM: 1,
        HEIGHT_EM: 2,
        GAP_EM: 0.2,
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

        const barWidth = CONFIG.BAR_WIDTH_EM * fontSize;
        const gap = CONFIG.GAP_EM * fontSize;
        const totalGap = Math.max(0, (points.length - 1) * gap);
        const width = (points.length * barWidth) + totalGap;
        // const height = CONFIG.HEIGHT_EM * fontSize;

        el.textContent = '';

        const svg = document.createElementNS(NS, 'svg');
        // svg.setAttribute('width', width);
        // svg.setAttribute('height', height);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `Bar chart with ${points.length} data points`);

        return {
            svg,
            width,
            // height,
            barWidth,
            gap,
            color,
            points,
            scaleMax,
						fontSize
        };
    }

		function draw(el, opts) {
			const mode = el.getAttribute('data-sparkchart-mode') || 'bars';

			let svg;
			if (mode === 'tone') {
				opts.height = CONFIG.HEIGHT_EM * opts.fontSize * 2;
				svg = drawTone(opts);
			} else {
				opts.height = CONFIG.HEIGHT_EM * opts.fontSize;
				svg = drawBars(opts);
			}

			el.replaceChildren(svg);
		}

		function drawTone(opts) {
			const { svg, points, scaleMax, height, width, barWidth, gap, color } = opts;

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

			points.forEach((point, i) => {
        const clampedPoint = Math.max(0, point);
        const h = scaleMax > 0 ? (clampedPoint / scaleMax) * (height / 2) : 0;
        const barHeight = h === 0 ? 1 : Math.max(1, h);
        const x = padding + (i * (barWidth + gap));
        
        // Bar extends ABOVE baseline
        const rectAbove = document.createElementNS(NS, 'rect');
        rectAbove.setAttribute('x', x);
        rectAbove.setAttribute('y', centerY - barHeight); // Extend upward
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

			return svg;
		}

    function drawBars(opts) {
        const { svg, points, scaleMax, height, width, barWidth, gap, color } = opts;

				svg.setAttribute('width', width);
				svg.setAttribute('height', height);
        svg.replaceChildren();

        points.forEach((point, i) => {
            const clampedPoint = Math.max(0, point);
            const h = scaleMax > 0 ? (clampedPoint / scaleMax) * height : 0;
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

				return svg;
    }

    sparkcharts.forEach(el => {
        const opts = prepare(el);
        if (!opts) return;
        draw(el, opts);
    });
})();
