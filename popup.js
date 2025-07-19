document.getElementById('exportBtn').addEventListener('click', async () => {
    const format = document.getElementById('formatSelect').value;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 检查是否在B站页面
    if (!tab.url.includes('bilibili.com')) {
      alert('请在B站页面使用此插件！');
      return;
    }
  
    // 执行导出脚本，传递格式参数
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: exportCourseList,
      args: [format]
    });
  });
  
  function exportCourseList(format = 'md') {
    // 检查是否存在课程列表
    const items = document.querySelectorAll('.video-pod__item');
    if (items.length === 0) {
      alert('未找到视频列表！请确保你正在浏览B站课程页面。');
      return;
    }
  
    let rows = [];
    let totalSeconds = 0;
  
    // 时间字符串转秒数
    function timeStrToSec(timeStr) {
      const arr = timeStr.split(':').map(Number);
      if (arr.length === 2) return arr[0] * 60 + arr[1];
      if (arr.length === 3) return arr[0] * 3600 + arr[1] * 60 + arr[2];
      return 0;
    }
  
    // 主循环，生成表格内容并累计总时长
    items.forEach((item, idx) => {
      const titleDiv = item.querySelector('.title-txt');
      const title = titleDiv ? titleDiv.textContent.trim() : '无标题';
      const durationDiv = item.querySelector('.stat-item.duration');
      const duration = durationDiv ? durationDiv.textContent.trim() : '无时长';
  
      rows.push({idx: idx + 1, title, duration});
      totalSeconds += timeStrToSec(duration);
    });
  
    // 计算总时长（hh:mm:ss格式）
    function secToTime(sec) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return [h, m, s].map(x=>x.toString().padStart(2, '0')).join(':');
    }
    const totalTime = secToTime(totalSeconds);
  
    // 构造md内容
    const pageTitle = document.title.replace(/[_\-\| ]*哔哩哔哩(_bilibili)?$/i, '').trim();
    let content = '';
    let fileExt = '';
    if (format === 'md') {
      content = `# ${pageTitle} - 课程视频列表\n\n| 序号 | 标题 | 时长 |\n|---|---|---|\n${rows.map(r=>`| ${r.idx} | ${r.title} | ${r.duration} |`).join('\n')}\n\n**课程总时长：${totalTime}**\n`;
      fileExt = 'md';
    } else {
      content = `${pageTitle} - 课程视频列表\n\n${rows.map(r=>`${r.idx}. ${r.title}  时长: ${r.duration}`).join('\n')}\n\n课程总时长：${totalTime}\n`;
      fileExt = 'txt';
    }
    const blob = new Blob([content], {type: format === 'md' ? 'text/markdown' : 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${pageTitle}- 课程列表.${fileExt}`;
    a.click();
  }