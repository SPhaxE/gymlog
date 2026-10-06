/** 把一段文字存成文件交给用户（「我的」→ 数据 → 导出 CSV）：
 *  - 网页：Blob + 隐藏的 a[download]，浏览器直接下载；
 *  - Android 应用（Capacitor）：WebView 里 a[download] 不会保存，所以先写进缓存目录，再用系统分享面板交出去（存到文件、发给自己、传到云盘都行）；
 *  返回 saved = 已下载，shared = 分享面板已打开，cancelled = 用户关掉了分享面板（不算失败）；其余失败抛出，页面要给可见提示。 */
import { Capacitor } from '@capacitor/core';

export type ExportResult = 'saved' | 'shared' | 'cancelled';

export async function saveTextFile(filename: string, text: string, mime = 'text/csv;charset=utf-8'): Promise<ExportResult> {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const { uri } = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: filename, files: [uri] });
      return 'shared';
    } catch (e) {
      if (/cancel/i.test(e instanceof Error ? e.message : String(e))) return 'cancelled';
      throw e;
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url));
  return 'saved';
}
