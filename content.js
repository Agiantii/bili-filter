// ==UserScript==
// @name         bili-filter
// @namespace    http://tampermonkey.net/
// @version      2025-05-10
// @description  在B站视频列表中添加搜索框，支持关键词筛选视频
// @author       Agiantii
// @match        https://www.bilibili.com/video/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  const delay_time = 2500
  let allCount = 0;
  // 动态为元素添加样式
  function addStyles(element, styles) {
    for (const [key, value] of Object.entries(styles)) {
      element.style[key] = value;
    }
  }

  // 创建搜索框容器
  function createSearchBox() {
    // 检查是否已存在搜索框，避免重复创建
    if (document.getElementById('billi-filter-search')) {
      return;
    }
    console.log("finding box...");
    // 创建搜索框容器
    const searchContainer = document.createElement('div');
    searchContainer.id = 'billi-filter-container';
    addStyles(searchContainer, {
      display: 'flex',
      alignItems: 'center',
      margin: '10px 0',
      padding: '5px 10px',
      backgroundColor: '#f4f4f4',
      borderRadius: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      width: '300px',
      maxWidth: '100%',
    });

    // 创建搜索框
    const searchInput = document.createElement('input');
    searchInput.id = 'billi-filter-search';
    searchInput.placeholder = "输入关键词筛选视频...";
    addStyles(searchInput, {
      flex: '1',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      padding: '8px',
      fontSize: '14px',
      color: '#333',
      width: '100%',
    });

    // 创建搜索图标
    const searchIcon = document.createElement('span');
    addStyles(searchIcon, {
      marginRight: '5px',
      color: '#666',
      fontSize: '16px',
    });
    searchIcon.innerHTML = '🔍';

    // 创建清除按钮
    const clearButton = document.createElement('span');
    addStyles(clearButton, {
      cursor: 'pointer',
      color: '#999',
      fontSize: '14px',
      padding: '0 5px',
      display: 'none',
    });
    clearButton.innerHTML = '✕';

    // 添加清除按钮点击事件
    clearButton.addEventListener('click', function () {
      searchInput.value = '';
      clearButton.style.display = 'none';
      filterVideos('');
    });

    // 将元素添加到容器中
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(clearButton);

    // 找到视频列表的头部区域并插入搜索框
    const videoHeader = document.querySelector('.video-pod__header');
    if (videoHeader) {
      videoHeader.appendChild(searchContainer);
    } else {
      // 如果找不到特定的头部，则尝试插入到视频列表的父元素前
      const videoList = document.querySelector('.video-pod__list');
      if (videoList && videoList.parentNode) {
        videoList.parentNode.insertBefore(searchContainer, videoList);
      }
    }

    // 添加搜索框输入事件
    searchInput.addEventListener('input', function (event) {
      const keyword = this.value.trim();
      clearButton.style.display = keyword ? 'block' : 'none';
      filterVideos(keyword);
    });
    
    // searchInput.addEventListener('keydown', function (event) {
    //   if (event.key === 'Enter') {
    //     const keyword = this.value.trim();
    //     clearButton.style.display = keyword ? 'block' : 'none';
    //     filterVideos(keyword);
    //   }
    // });

    return searchContainer;
  }

  // 筛选视频列表
  function filterVideos(keyword) {
    // 获取所有视频项
    const videoItems = document.querySelectorAll('.video-pod__item');
    // 如果关键词为空，显示所有视频

    allCount = 0;
    videoItems.forEach(item => {
      item.style.display = '';
      allCount += 1;
      let sub_items = item.querySelectorAll('.sub');
      if (sub_items && sub_items.length > 0) {
        sub_items.forEach(sub_item => {
          sub_item.style.display = '';
          allCount += 1;
        });
      }
    });
    if (keyword == "" || keyword == null || keyword.length ==0) {
      console.log("keyword is empty");
      updateFilterStatus(allCount, allCount);
      return
    }

    // 转换关键词为小写，用于不区分大小写的搜索
    const lowerKeyword = keyword.toLowerCase();
    let visibleCount = 0;

    // 遍历所有视频项
    videoItems.forEach(item => {
      // 获取视频标题
      const titleElement = item.querySelector('.title-txt');
      if (!titleElement) {
        item.style.display = 'none';
        return;
      }

      const title = titleElement.textContent.toLowerCase();

      // 如果标题包含关键词，显示该视频，否则隐藏
      if (title.includes(lowerKeyword)) {
        item.style.display = '';
        visibleCount+=1;
      } else if (item.querySelector('.sub')) {
        // 如果标题不包含关键词，检查子元素
        let sub_items = item.querySelectorAll('.sub');
        let sub_visible = false;
        sub_items.forEach(sub_item => {
          const sub_title = sub_item.textContent.toLowerCase();
          if (sub_title.includes(lowerKeyword)) {
            sub_item.style.display = '';
            visibleCount+=1;
            sub_visible = true;
          } else {
            sub_item.style.display = 'none';
          }
        });
        // 如果子元素没有匹配，隐藏视频
        if (!sub_visible) {
          item.style.display = 'none';
        }
      }
      else {
        item.style.display = 'none';
      }
    });
    console.log("visibleCount: ", visibleCount);
    console.log("allCount: ", allCount);
    // 更新筛选状态
    updateFilterStatus(visibleCount, allCount);
    // updateFilterStatus(visibleCount, videoItems.length);
  }

  // 更新筛选状态信息
  function updateFilterStatus(visibleCount, totalCount) {
    // 查找或创建状态显示元素
    let statusElement = document.getElementById('billi-filter-status');

    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'billi-filter-status';
      statusElement.className = 'billi-filter-status';

      const searchContainer = document.getElementById('billi-filter-container');
      if (searchContainer) {
        searchContainer.appendChild(statusElement);
      }
    }
    // 更新状态文本
      statusElement.textContent = `显示 ${visibleCount}/${totalCount} 个视频`;
      statusElement.style.display = 'block';
    // // 更新状态文本
    // if (visibleCount < totalCount) {
    //   statusElement.textContent = `显示 ${visibleCount}/${totalCount} 个视频`;
    //   statusElement.style.display = 'block';
    // } else {
    //   statusElement.style.display = 'none';
    // }

    addStyles(statusElement, {
      fontSize: '12px',
      color: '#666',
      marginTop: '5px',
      padding: '3px 8px',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      display: 'inline-block',
      position: 'absolute',
      right: '10px',
      top: '100%',
    });
  }

  // 监听DOM变化，处理动态加载的内容
  function observePageChanges() {
    const observer = new MutationObserver(function (mutations, observer) {
      // mutations.forEach(function (mutation) {
      //     if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      //         // 检查是否有视频列表被添加
      //         const videoListAdded = Array.from(mutation.addedNodes).some(node => {
      //             return node.nodeType === 1 && (
      //                 node.classList.contains('video-pod__list') ||
      //                 node.querySelector('.video-pod__list')
      //             );
      //         });

      //         if (videoListAdded) {
      //             // 如果视频列表被添加，创建搜索框
      //             setTimeout(createSearchBox, 500);
      //         }
      //     }
      // });
      if (document.getElementsByClassName("video-pod__list")) {
        observer.disconnect()
      }
    });

    // 开始观察整个文档
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // 初始化函数
  function initialize() {
    // 尝试创建搜索框
    const searchBox = createSearchBox();

    // 如果没有成功创建搜索框（可能页面还未完全加载），设置定时器再次尝试
    if (!searchBox) {
      setTimeout(createSearchBox(), delay_time);
    }
    else {
      // 开始观察页面变化
      observePageChanges();
    }
  }
  // setTimeout(addCss,1000)
  setTimeout(initialize, delay_time);
  // 对于某些页面可能DOMContentLoaded已经触发，直接执行初始化
  // if (document.readyState === 'interactive' || document.readyState === 'complete') {
  //   // const event = new Event('DOMContentLoaded');
  //   // document.dispatchEvent(event);
  //   setTimeout(initialize, 3000);
  //   // initialize();
  // }
})();