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
        const height = CONFIG.HEIGHT_EM * fontSize;

        el.textContent = '';

        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `Bar chart with ${points.length} data points`);

        return {
            svg,
            width,
            height,
            barWidth,
            gap,
            color,
            points,
            scaleMax,
        };
    }

    function draw(el, opts) {
        const { svg, points, scaleMax, height, barWidth, gap, color } = opts;

        svg.replaceChildren();

        const negativePoints = points.filter(n => n < 0);
        if (negativePoints.length > 0) {
            warn(`SparkCharts: Found ${negativePoints.length} negative value(s): [${negativePoints.join(', ')}]. Negative values will be rendered as zero.`);
        }

        points.forEach((point, i) => {
            const clampedPoint = Math.max(0, point);
            const h = scaleMax > 0 ? (clampedPoint / scaleMax) * height : 0;
            const barHeight = h === 0 ? 1 : h;
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

        el.replaceChildren(svg);
    }

    sparkcharts.forEach(el => {
        const opts = prepare(el);
        if (!opts) return;
        draw(el, opts);
    });
})();
