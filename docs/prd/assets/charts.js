// assets/charts.js — AI 各功能触发分布（示例数据）
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  var el = document.getElementById('chart-ai-usage');
  if (!el || typeof echarts === 'undefined') return;

  var chart = echarts.init(el, null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true },
    grid: { left: 116, right: 48, top: 20, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 11 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: ['个性化推荐', 'AI 搜索', 'AI 摘要', 'AI 帮我答', 'AI 内容生成'],
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: ink, fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: [42, 58, 73, 96, 128],
      barWidth: 16,
      itemStyle: {
        color: accent,
        borderRadius: [0, 4, 4, 0]
      },
      label: { show: true, position: 'right', color: muted, fontSize: 11 }
    }]
  });
  window.addEventListener('resize', function () { chart.resize(); });
})();
