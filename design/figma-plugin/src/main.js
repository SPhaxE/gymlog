// ---------------------------------------------------------------- 入口
// 每个命令都先按仓库同步变量与样式（幂等），保证组件和标杆页引用的都是最新值。
(async function main() {
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    const cmd = figma.command || 'foundations';
    const V = await importVariables();
    const S = await importStyles(V);
    let done = 'Foundations';
    if (cmd === 'foundations') await buildDocs(V, S);
    if (cmd === 'components' || cmd === 'benchmark') { const K = await importComponents(V, S); done = '组件';
      if (cmd === 'benchmark') { await buildBenchmark(V, S, K); done = '标杆页 P06'; } }
    figma.closePlugin('慢牛 Milo ' + done + ' 已导入：新建 ' + report.created + '、更新 ' + report.updated + '、移除 ' + report.removed + (report.warnings.length ? '；' + report.warnings.length + ' 条提醒（见控制台）' : ''));
  } catch (e) {
    console.error(e);
    figma.closePlugin('导入失败：' + (e && e.message ? e.message : e));
  }
})();
